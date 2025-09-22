import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { faqLibrary, contentFAQAssignments, unifiedTags } from '@shared/schema';
import { eq, desc, and, count, sql, ilike, or, gte, lte, isNull, inArray } from 'drizzle-orm';

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

// 🏷️ FAQ Library API - Tag-based FAQ management system
// Integrates with unified_tags for "Sản phẩm" category filtering

// Zod schemas for validation
const CreateFAQSchema = z.object({
  question: z.string().min(1, "Question is required").max(1000, "Question too long"),
  answer: z.string().min(1, "Answer is required").max(5000, "Answer too long"),
  tagIds: z.array(z.string().uuid()).max(10, "Maximum 10 tags allowed").default([]),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  category: z.enum(["general", "product", "tutorial", "policy", "technical"]).default("product"),
  keywords: z.array(z.string()).max(20, "Maximum 20 keywords allowed").default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
});

const UpdateFAQSchema = CreateFAQSchema.partial().extend({
  id: z.string().uuid()
});

const FAQQuerySchema = z.object({
  // Filtering
  category: z.enum(["all", "general", "product", "tutorial", "policy", "technical"]).default("all"),
  priority: z.enum(["all", "high", "medium", "low"]).default("all"),
  tagIds: z.union([z.string().uuid(), z.array(z.string().uuid())]).transform(v => Array.isArray(v) ? v : [v]).default([]), // Filter by specific tags
  isActive: z.enum(["all", "true", "false"]).default("all"),
  
  // Search
  search: z.string().default(""), // Full-text search in question/answer
  
  // Pagination & Sorting
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["created_at", "usage_count", "priority", "sort_order"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});

// GET /api/faq-library - List FAQs with filtering and search
export async function listFAQs(req: Request, res: Response) {
  try {
    console.log('📚 API: Listing FAQ Library with filters');
    
    const query = FAQQuerySchema.parse(req.query);
    console.log('📊 Query filters:', query);

    // Build where conditions
    const conditions: any[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Category filter
    if (query.category !== 'all') {
      conditions.push(`category = $${paramIndex}`);
      params.push(query.category);
      paramIndex++;
    }

    // Priority filter  
    if (query.priority !== 'all') {
      conditions.push(`priority = $${paramIndex}`);
      params.push(query.priority);
      paramIndex++;
    }

    // Active status filter
    if (query.isActive !== 'all') {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(query.isActive === 'true');
      paramIndex++;
    }

    // Tag filtering - check if any of the specified tagIds are in the FAQ's tag_ids array
    if (query.tagIds.length > 0) {
      const tagConditions = query.tagIds.map((tagId) => {
        const condition = `tag_ids ? $${paramIndex}`;
        params.push(tagId);
        paramIndex++;
        return condition;
      });
      conditions.push(`(${tagConditions.join(' OR ')})`);
    }

    // Full-text search
    if (query.search.trim()) {
      conditions.push(`(
        to_tsvector('english', question) @@ plainto_tsquery('english', $${paramIndex}) OR
        to_tsvector('english', answer) @@ plainto_tsquery('english', $${paramIndex}) OR
        question ILIKE $${paramIndex + 1} OR
        answer ILIKE $${paramIndex + 1}
      )`);
      params.push(query.search.trim());
      params.push(`%${query.search.trim()}%`);
      paramIndex += 2;
    }

    // Legacy code line - no longer needed with Drizzle ORM

    // Build Drizzle query conditions  
    const queryConditions = [];
    
    if (query.category !== 'all') {
      queryConditions.push(eq(faqLibrary.category, query.category));
    }
    if (query.priority !== 'all') {
      queryConditions.push(eq(faqLibrary.priority, query.priority));
    }
    if (query.isActive !== 'all') {
      queryConditions.push(eq(faqLibrary.isActive, query.isActive === 'true'));
    }
    
    // Search in question and answer
    if (query.search.trim()) {
      const searchTerm = `%${query.search.trim()}%`;
      queryConditions.push(
        or(
          ilike(faqLibrary.question, searchTerm),
          ilike(faqLibrary.answer, searchTerm)
        )
      );
    }
    
    // Tag filtering - check if FAQ has any of the specified tags
    if (query.tagIds && query.tagIds.length > 0) {
      // PostgreSQL JSONB array overlap operator: tag_ids ?| array['tag1', 'tag2']
      queryConditions.push(
        sql`${faqLibrary.tagIds} ?| ${sql`ARRAY[${sql.join(query.tagIds.map(id => sql`${id}`), sql`, `)}]`}`
      );
    }
    
    const whereCondition = queryConditions.length > 0 ? and(...queryConditions) : undefined;
    
    // Count total for pagination
    const [countResult] = await db
      .select({ total: count() })
      .from(faqLibrary)
      .where(whereCondition);
    
    const total = countResult.total;

    // Calculate pagination
    const offset = (query.page - 1) * query.limit;
    const totalPages = Math.ceil(total / query.limit);

    // Sort configuration
    const sortField = {
      'created_at': faqLibrary.createdAt,
      'usage_count': faqLibrary.usageCount,
      'priority': faqLibrary.priority,
      'sort_order': faqLibrary.sortOrder
    }[query.sortBy] || faqLibrary.createdAt;
    
    const orderByClause = query.sortOrder === 'asc' ? sortField : desc(sortField);
    
    // Main query with sorting and pagination
    const result = await db
      .select()
      .from(faqLibrary)
      .where(whereCondition)
      .orderBy(orderByClause, desc(faqLibrary.createdAt))
      .limit(query.limit)
      .offset(offset);

    console.log(`📊 Found ${result.length} FAQs (${total} total)`);

    res.json({
      faqs: result,
      totalCount: total,
      currentPage: query.page,
      totalPages,
      limit: query.limit
    });

  } catch (error) {
    console.error('❌ Error listing FAQs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list FAQs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// GET /api/faq-library/:id - Get single FAQ by ID
export async function getFAQById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log(`📚 API: Getting FAQ by ID: ${id}`);

    if (!id || !z.string().uuid().safeParse(id).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FAQ ID format'
      });
    }

    const result = await db
      .select()
      .from(faqLibrary)
      .where(eq(faqLibrary.id, id));

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
    }

    console.log(`✅ Found FAQ: "${result[0].question.substring(0, 50)}..."`); 

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('❌ Error getting FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get FAQ',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// POST /api/faq-library - Create new FAQ
export async function createFAQ(req: Request, res: Response) {
  try {
    console.log('📚 API: Creating new FAQ');
    
    const data = CreateFAQSchema.parse(req.body);
    console.log(`📝 Creating FAQ: "${data.question.substring(0, 50)}..."`); 

    // Validate tag IDs exist in unified_tags
    if (data.tagIds.length > 0) {
      const tagCheckResult = await db
        .select({ id: unifiedTags.id })
        .from(unifiedTags)
        .where(inArray(unifiedTags.id, data.tagIds));
      
      if (tagCheckResult.length !== data.tagIds.length) {
        const foundTagIds = tagCheckResult.map((row: any) => row.id);
        const missingTagIds = data.tagIds.filter((id: string) => !foundTagIds.includes(id));
        
        return res.status(400).json({
          success: false,
          error: 'Invalid tag IDs',
          details: `Tags not found: ${missingTagIds.join(', ')}`
        });
      }
    }

    const [newFAQ] = await db
      .insert(faqLibrary)
      .values({
        question: data.question,
        answer: data.answer,
        tagIds: data.tagIds,
        priority: data.priority,
        category: data.category,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        keywords: data.keywords,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    console.log(`✅ Created FAQ with ID: ${newFAQ.id}`);

    res.status(201).json({
      success: true,
      data: newFAQ,
      message: 'FAQ created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating FAQ:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create FAQ',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// PUT /api/faq-library/:id - Update FAQ
export async function updateFAQ(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log(`📚 API: Updating FAQ: ${id}`);

    if (!id || !z.string().uuid().safeParse(id).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FAQ ID format'
      });
    }

    const data = UpdateFAQSchema.parse({ ...req.body, id });

    // Check if FAQ exists
    const existsResult = await db
      .select({ id: faqLibrary.id })
      .from(faqLibrary)
      .where(eq(faqLibrary.id, id));
    if (existsResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
    }

    // Validate tag IDs if provided
    if (data.tagIds && data.tagIds.length > 0) {
      const tagCheckResult = await db
        .select({ id: unifiedTags.id })
        .from(unifiedTags)
        .where(inArray(unifiedTags.id, data.tagIds));
      
      if (tagCheckResult.length !== data.tagIds.length) {
        const foundTagIds = tagCheckResult.map((row: any) => row.id);
        const missingTagIds = data.tagIds.filter((id: string) => !foundTagIds.includes(id));
        
        return res.status(400).json({
          success: false,
          error: 'Invalid tag IDs',
          details: `Tags not found: ${missingTagIds.join(', ')}`
        });
      }
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() };
    
    if (data.question !== undefined) updateData.question = data.question;
    if (data.answer !== undefined) updateData.answer = data.answer;
    if (data.tagIds !== undefined) updateData.tagIds = data.tagIds;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.keywords !== undefined) updateData.keywords = data.keywords;

    if (Object.keys(updateData).length === 1) { // Only updatedAt
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    const [updatedFAQ] = await db
      .update(faqLibrary)
      .set(updateData)
      .where(eq(faqLibrary.id, id))
      .returning();

    console.log(`✅ Updated FAQ: "${updatedFAQ.question.substring(0, 50)}..."`);

    res.json({
      success: true,
      data: updatedFAQ,
      message: 'FAQ updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating FAQ:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update FAQ',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// DELETE /api/faq-library/:id - Delete FAQ
export async function deleteFAQ(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log(`📚 API: Deleting FAQ: ${id}`);

    if (!id || !z.string().uuid().safeParse(id).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FAQ ID format'
      });
    }

    // Check if FAQ exists and get its info
    const existsResult = await db
      .select({ id: faqLibrary.id, question: faqLibrary.question })
      .from(faqLibrary)
      .where(eq(faqLibrary.id, id));
    
    if (existsResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
    }

    const faqToDelete = existsResult[0];

    // Check for assignments (will be deleted by cascade, but warn user)
    const [assignmentsResult] = await db
      .select({ count: count() })
      .from(contentFAQAssignments)
      .where(eq(contentFAQAssignments.faqId, id));
    
    const assignmentCount = assignmentsResult.count;

    // Delete FAQ (cascades to assignments)
    await db.delete(faqLibrary).where(eq(faqLibrary.id, id));

    console.log(`✅ Deleted FAQ: "${faqToDelete.question.substring(0, 50)}..." (${assignmentCount} assignments removed)`);

    res.json({
      success: true,
      message: 'FAQ deleted successfully',
      details: assignmentCount > 0 ? `${assignmentCount} content assignments were also removed` : undefined
    });

  } catch (error) {
    console.error('❌ Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete FAQ',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// PATCH /api/faq-library/:id/usage - Increment usage count (when FAQ is assigned)
export async function incrementUsage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log(`📚 API: Incrementing usage for FAQ: ${id}`);

    if (!id || !z.string().uuid().safeParse(id).success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FAQ ID format'
      });
    }

    const [result] = await db
      .update(faqLibrary)
      .set({
        usageCount: sql`${faqLibrary.usageCount} + 1`,
        lastUsed: new Date(),
        updatedAt: new Date()
      })
      .where(eq(faqLibrary.id, id))
      .returning({ usageCount: faqLibrary.usageCount, lastUsed: faqLibrary.lastUsed });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'FAQ not found'
      });
    }

    console.log(`✅ Updated usage count: ${result.usageCount}`);

    res.json({
      success: true,
      data: {
        usage_count: result.usageCount,
        last_used: result.lastUsed
      },
      message: 'Usage count updated'
    });

  } catch (error) {
    console.error('❌ Error updating usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update usage count',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

import { Router } from 'express';

const router = Router();

// FAQ Library Routes
router.get('/faqs', requireAuth, listFAQs);
router.get('/faqs/:id', requireAuth, getFAQById);
router.post('/faqs', requireAuth, createFAQ);
router.put('/faqs/:id', requireAuth, updateFAQ);
router.delete('/faqs/:id', requireAuth, deleteFAQ);
router.patch('/faqs/:id/usage', requireAuth, incrementUsage);

export default router;