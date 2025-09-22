import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { contentFAQAssignments, faqLibrary, contentLibrary } from '@shared/schema';
import { eq, desc, and, count, sql, inArray } from 'drizzle-orm';

// 🔒 Simple auth middleware for development
const requireAuth = (req: any, res: any, next: any) => {
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    next();
    return;
  }
  
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// 📝 Schema Validation
const CreateAssignmentSchema = z.object({
  contentId: z.string().uuid('Invalid content ID format'),
  faqId: z.string().uuid('Invalid FAQ ID format'),
  contentType: z.enum(['product', 'article', 'landing_page']).default('product'),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  isVisible: z.boolean().default(true),
  assignedBy: z.string().optional(),
  assignmentNote: z.string().optional()
});

const UpdateAssignmentSchema = z.object({
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isVisible: z.boolean().optional(),
  assignedBy: z.string().optional(),
  assignmentNote: z.string().optional()
});

const BulkAssignSchema = z.object({
  contentId: z.string().uuid('Invalid content ID format'),
  contentType: z.enum(['product', 'article', 'landing_page']).default('product'),
  faqIds: z.array(z.string().uuid()).min(1, 'At least one FAQ ID required').max(20, 'Maximum 20 FAQs per assignment'),
  assignedBy: z.string().optional()
});

const ReorderSchema = z.object({
  assignments: z.array(z.object({
    id: z.string().uuid('Invalid assignment ID format'),
    sortOrder: z.number().int().min(0).max(9999)
  })).min(1, 'At least one assignment required').max(50, 'Maximum 50 assignments per reorder')
});

// 🔗 **GET /api/faq-assignments** - List all assignments with pagination and filtering
export const getFAQAssignments = async (req: Request, res: Response) => {
  try {
    const query = z.object({
      page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1).max(1000)),
      limit: z.string().transform(val => parseInt(val) || 20).pipe(z.number().min(1).max(100)),
      contentId: z.string().uuid().optional(),
      faqId: z.string().uuid().optional(),
      isActive: z.enum(['all', 'true', 'false']).default('all'), // Note: maps to isVisible in schema
      sortBy: z.enum(['created_at', 'sort_order', 'updated_at']).default('sort_order'),
      sortOrder: z.enum(['asc', 'desc']).default('asc')
    }).parse(req.query);

    console.log(`🔍 Listing FAQ assignments - Page ${query.page}, Limit ${query.limit}`);

    // Build query conditions
    const whereConditions = [];
    
    if (query.contentId) {
      whereConditions.push(eq(contentFAQAssignments.contentId, query.contentId));
    }
    if (query.faqId) {
      whereConditions.push(eq(contentFAQAssignments.faqId, query.faqId));
    }
    if (query.isActive !== 'all') {
      whereConditions.push(eq(contentFAQAssignments.isVisible, query.isActive === 'true'));
    }
    
    const whereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Count total for pagination
    const [countResult] = await db
      .select({ total: count() })
      .from(contentFAQAssignments)
      .where(whereCondition);
    
    const total = countResult.total;
    const offset = (query.page - 1) * query.limit;
    const totalPages = Math.ceil(total / query.limit);

    // Sort configuration
    const sortField = {
      'created_at': contentFAQAssignments.createdAt,
      'sort_order': contentFAQAssignments.sortOrder,
      'updated_at': contentFAQAssignments.updatedAt
    }[query.sortBy] || contentFAQAssignments.sortOrder;
    
    const orderByClause = query.sortOrder === 'asc' ? sortField : desc(sortField);
    
    // Main query with sorting and pagination, including related data
    const result = await db
      .select({
        id: contentFAQAssignments.id,
        contentId: contentFAQAssignments.contentId,
        faqId: contentFAQAssignments.faqId,
        sortOrder: contentFAQAssignments.sortOrder,
        isVisible: contentFAQAssignments.isVisible,
        createdAt: contentFAQAssignments.createdAt,
        updatedAt: contentFAQAssignments.updatedAt,
        contentTitle: contentLibrary.title,
        faqQuestion: faqLibrary.question
      })
      .from(contentFAQAssignments)
      .leftJoin(contentLibrary, eq(contentFAQAssignments.contentId, contentLibrary.id))
      .leftJoin(faqLibrary, eq(contentFAQAssignments.faqId, faqLibrary.id))
      .where(whereCondition)
      .orderBy(orderByClause, desc(contentFAQAssignments.createdAt))
      .limit(query.limit)
      .offset(offset);

    console.log(`📊 Found ${result.length} FAQ assignments (${total} total)`);

    res.json({
      assignments: result,
      totalCount: total,
      currentPage: query.page,
      totalPages,
      limit: query.limit
    });

  } catch (error: any) {
    console.error('❌ Error listing FAQ assignments:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to list FAQ assignments',
      code: 'ASSIGNMENT_LIST_ERROR'
    });
  }
};

// 📄 **GET /api/faq-assignments/:id** - Get single assignment by ID
export const getFAQAssignmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Getting FAQ assignment: ${id}`);

    const result = await db
      .select({
        id: contentFAQAssignments.id,
        contentId: contentFAQAssignments.contentId,
        faqId: contentFAQAssignments.faqId,
        sortOrder: contentFAQAssignments.sortOrder,
        isVisible: contentFAQAssignments.isVisible,
        createdAt: contentFAQAssignments.createdAt,
        updatedAt: contentFAQAssignments.updatedAt,
        contentTitle: contentLibrary.title,
        faqQuestion: faqLibrary.question,
        faqAnswer: faqLibrary.answer
      })
      .from(contentFAQAssignments)
      .leftJoin(contentLibrary, eq(contentFAQAssignments.contentId, contentLibrary.id))
      .leftJoin(faqLibrary, eq(contentFAQAssignments.faqId, faqLibrary.id))
      .where(eq(contentFAQAssignments.id, id));

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'FAQ assignment not found'
      });
    }

    console.log(`✅ Found FAQ assignment: Content "${result[0].contentTitle}" ↔ FAQ "${result[0].faqQuestion?.substring(0, 50)}..."`);

    res.json({
      success: true,
      data: result[0],
      message: 'FAQ assignment retrieved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error getting FAQ assignment:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get FAQ assignment',
      code: 'ASSIGNMENT_GET_ERROR'
    });
  }
};

// ➕ **POST /api/faq-assignments** - Create new assignment
export const createFAQAssignment = async (req: Request, res: Response) => {
  try {
    const data = CreateAssignmentSchema.parse(req.body);
    console.log(`📝 Creating FAQ assignment: Content ${data.contentId} ↔ FAQ ${data.faqId}`);

    // Check if content exists
    const contentExists = await db
      .select({ id: contentLibrary.id })
      .from(contentLibrary)
      .where(eq(contentLibrary.id, data.contentId));
    
    if (contentExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content not found',
        details: `Content ID ${data.contentId} does not exist`
      });
    }

    // Check if FAQ exists
    const faqExists = await db
      .select({ id: faqLibrary.id })
      .from(faqLibrary)
      .where(eq(faqLibrary.id, data.faqId));
    
    if (faqExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'FAQ not found',
        details: `FAQ ID ${data.faqId} does not exist`
      });
    }

    // Check for duplicate assignment
    const duplicateCheck = await db
      .select({ id: contentFAQAssignments.id })
      .from(contentFAQAssignments)
      .where(and(
        eq(contentFAQAssignments.contentId, data.contentId),
        eq(contentFAQAssignments.faqId, data.faqId)
      ));
    
    if (duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Assignment already exists',
        details: 'This content-FAQ combination is already assigned'
      });
    }

    const [newAssignment] = await db
      .insert(contentFAQAssignments)
      .values({
        contentId: data.contentId,
        faqId: data.faqId,
        contentType: data.contentType,
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
        assignedBy: data.assignedBy,
        assignmentNote: data.assignmentNote,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log(`✅ Created FAQ assignment: ${newAssignment.id}`);

    res.status(201).json({
      success: true,
      data: newAssignment,
      message: 'FAQ assignment created successfully'
    });

  } catch (error: any) {
    console.error('❌ Error creating FAQ assignment:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create FAQ assignment',
      code: 'ASSIGNMENT_CREATE_ERROR'
    });
  }
};

// ✏️ **PUT /api/faq-assignments/:id** - Update assignment
export const updateFAQAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = UpdateAssignmentSchema.parse(req.body);
    console.log(`✏️ Updating FAQ assignment: ${id}`);

    // Check if assignment exists
    const existsResult = await db
      .select({ id: contentFAQAssignments.id })
      .from(contentFAQAssignments)
      .where(eq(contentFAQAssignments.id, id));
    if (existsResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'FAQ assignment not found'
      });
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() };
    
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

    if (Object.keys(updateData).length === 1) { // Only updatedAt
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    const [updatedAssignment] = await db
      .update(contentFAQAssignments)
      .set(updateData)
      .where(eq(contentFAQAssignments.id, id))
      .returning();

    console.log(`✅ Updated FAQ assignment: ${updatedAssignment.id}`);

    res.json({
      success: true,
      data: updatedAssignment,
      message: 'FAQ assignment updated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error updating FAQ assignment:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update FAQ assignment',
      code: 'ASSIGNMENT_UPDATE_ERROR'
    });
  }
};

// 🗑️ **DELETE /api/faq-assignments/:id** - Delete assignment
export const deleteFAQAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting FAQ assignment: ${id}`);

    // Check if assignment exists
    const existsResult = await db
      .select({ 
        id: contentFAQAssignments.id,
        contentId: contentFAQAssignments.contentId,
        faqId: contentFAQAssignments.faqId
      })
      .from(contentFAQAssignments)
      .where(eq(contentFAQAssignments.id, id));
    
    if (existsResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'FAQ assignment not found'
      });
    }

    const assignmentToDelete = existsResult[0];

    // Delete assignment
    await db.delete(contentFAQAssignments).where(eq(contentFAQAssignments.id, id));

    console.log(`✅ Deleted FAQ assignment: ${assignmentToDelete.id}`);

    res.json({
      success: true,
      message: 'FAQ assignment deleted successfully',
      data: { deletedId: id }
    });

  } catch (error: any) {
    console.error('❌ Error deleting FAQ assignment:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete FAQ assignment',
      code: 'ASSIGNMENT_DELETE_ERROR'
    });
  }
};

// 📦 **POST /api/faq-assignments/bulk** - Bulk assign FAQs to content
export const bulkAssignFAQs = async (req: Request, res: Response) => {
  try {
    const data = BulkAssignSchema.parse(req.body);
    console.log(`📦 Bulk assigning ${data.faqIds.length} FAQs to content: ${data.contentId}`);

    // Check if content exists
    const contentExists = await db
      .select({ id: contentLibrary.id })
      .from(contentLibrary)
      .where(eq(contentLibrary.id, data.contentId));
    
    if (contentExists.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content not found',
        details: `Content ID ${data.contentId} does not exist`
      });
    }

    // Check if all FAQs exist
    const faqsExist = await db
      .select({ id: faqLibrary.id })
      .from(faqLibrary)
      .where(inArray(faqLibrary.id, data.faqIds));
    
    if (faqsExist.length !== data.faqIds.length) {
      const foundFaqIds = faqsExist.map(faq => faq.id);
      const missingFaqIds = data.faqIds.filter(id => !foundFaqIds.includes(id));
      
      return res.status(400).json({
        success: false,
        error: 'Some FAQs not found',
        details: `FAQ IDs not found: ${missingFaqIds.join(', ')}`
      });
    }

    // Check for existing assignments
    const existingAssignments = await db
      .select({ faqId: contentFAQAssignments.faqId })
      .from(contentFAQAssignments)
      .where(and(
        eq(contentFAQAssignments.contentId, data.contentId),
        inArray(contentFAQAssignments.faqId, data.faqIds)
      ));
    
    const existingFaqIds = existingAssignments.map(a => a.faqId);
    const newFaqIds = data.faqIds.filter(id => !existingFaqIds.includes(id));

    if (newFaqIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'All FAQs are already assigned to this content',
        details: `Existing assignments: ${existingFaqIds.length}`
      });
    }

    // Create new assignments
    const assignmentsToCreate = newFaqIds.map((faqId, index) => ({
      contentId: data.contentId,
      faqId,
      sortOrder: index,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const newAssignments = await db
      .insert(contentFAQAssignments)
      .values(assignmentsToCreate)
      .returning();

    console.log(`✅ Created ${newAssignments.length} new FAQ assignments (${existingFaqIds.length} already existed)`);

    res.status(201).json({
      success: true,
      data: {
        newAssignments,
        createdCount: newAssignments.length,
        skippedCount: existingFaqIds.length,
        totalRequested: data.faqIds.length
      },
      message: `Bulk assignment completed: ${newAssignments.length} created, ${existingFaqIds.length} already existed`
    });

  } catch (error: any) {
    console.error('❌ Error in bulk FAQ assignment:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to bulk assign FAQs',
      code: 'BULK_ASSIGNMENT_ERROR'
    });
  }
};

// 🔄 **PUT /api/faq-assignments/reorder** - Reorder assignments
export const reorderFAQAssignments = async (req: Request, res: Response) => {
  try {
    const data = ReorderSchema.parse(req.body);
    console.log(`🔄 Reordering ${data.assignments.length} FAQ assignments`);

    // Check if all assignments exist
    const assignmentIds = data.assignments.map(a => a.id);
    const existingAssignments = await db
      .select({ id: contentFAQAssignments.id })
      .from(contentFAQAssignments)
      .where(inArray(contentFAQAssignments.id, assignmentIds));
    
    if (existingAssignments.length !== assignmentIds.length) {
      const foundIds = existingAssignments.map(a => a.id);
      const missingIds = assignmentIds.filter(id => !foundIds.includes(id));
      
      return res.status(400).json({
        success: false,
        error: 'Some assignments not found',
        details: `Assignment IDs not found: ${missingIds.join(', ')}`
      });
    }

    // Update all assignments
    const updatePromises = data.assignments.map(assignment => 
      db.update(contentFAQAssignments)
        .set({ 
          sortOrder: assignment.sortOrder,
          updatedAt: new Date()
        })
        .where(eq(contentFAQAssignments.id, assignment.id))
    );

    await Promise.all(updatePromises);

    console.log(`✅ Reordered ${data.assignments.length} FAQ assignments`);

    res.json({
      success: true,
      data: { updatedCount: data.assignments.length },
      message: `Successfully reordered ${data.assignments.length} FAQ assignments`
    });

  } catch (error: any) {
    console.error('❌ Error reordering FAQ assignments:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to reorder FAQ assignments',
      code: 'ASSIGNMENT_REORDER_ERROR'
    });
  }
};

// 📊 **GET /api/faq-assignments/by-content/:contentId** - Get all FAQ assignments for a content item
export const getFAQAssignmentsByContent = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    console.log(`📊 Getting FAQ assignments for content: ${contentId}`);

    const result = await db
      .select({
        id: contentFAQAssignments.id,
        faqId: contentFAQAssignments.faqId,
        sortOrder: contentFAQAssignments.sortOrder,
        isVisible: contentFAQAssignments.isVisible,
        createdAt: contentFAQAssignments.createdAt,
        updatedAt: contentFAQAssignments.updatedAt,
        faqQuestion: faqLibrary.question,
        faqAnswer: faqLibrary.answer,
        faqPriority: faqLibrary.priority,
        faqUsageCount: faqLibrary.usageCount
      })
      .from(contentFAQAssignments)
      .leftJoin(faqLibrary, eq(contentFAQAssignments.faqId, faqLibrary.id))
      .where(eq(contentFAQAssignments.contentId, contentId))
      .orderBy(contentFAQAssignments.sortOrder, contentFAQAssignments.createdAt);

    console.log(`📊 Found ${result.length} FAQ assignments for content ${contentId}`);

    res.json({
      success: true,
      data: result,
      count: result.length,
      message: `Found ${result.length} FAQ assignments`
    });

  } catch (error: any) {
    console.error('❌ Error getting FAQ assignments by content:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get FAQ assignments by content',
      code: 'ASSIGNMENT_BY_CONTENT_ERROR'
    });
  }
};

import { Router } from 'express';

const router = Router();

// FAQ Assignment Routes
router.get('/', requireAuth, getFAQAssignments);
router.get('/:id', requireAuth, getFAQAssignmentById);
router.post('/', requireAuth, createFAQAssignment);
router.put('/:id', requireAuth, updateFAQAssignment);
router.delete('/:id', requireAuth, deleteFAQAssignment);
router.post('/bulk', requireAuth, bulkAssignFAQs);
router.put('/reorder', requireAuth, reorderFAQAssignments);
router.get('/by-content/:contentId', requireAuth, getFAQAssignmentsByContent);

export default router;