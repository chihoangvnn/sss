import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { 
  conversationSessions, 
  conversationMessages, 
  intentAnalytics, 
  userSatisfactionScores,
  botSettings 
} from '../../shared/schema';
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
import { eq, desc, count, avg, sum, gte, lte, and, or, sql } from 'drizzle-orm';

const router = Router();

// =====================================================================
// 🤖 RASA MANAGEMENT API - Dashboard Control & Analytics
// =====================================================================

/**
 * RASA Server Control Schemas
 */
const ServerActionSchema = z.object({
  action: z.enum(['start', 'stop', 'restart', 'status']),
  force: z.boolean().optional().default(false)
});

const AnalyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  channel: z.enum(['web', 'facebook', 'instagram', 'whatsapp', 'api']).optional(),
  limit: z.coerce.number().min(1).max(1000).default(100)
});

// =====================================================================
// 🔧 RASA SERVER CONTROL
// =====================================================================

/**
 * POST /api/rasa-management/server
 * Control RASA server (start/stop/restart)
 */
router.post('/server', requireAuth, async (req, res) => {
  try {
    const validation = ServerActionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid server action parameters',
        details: validation.error.errors
      });
    }

    const { action, force } = validation.data;
    
    console.log(`🤖 RASA Server ${action} requested${force ? ' (forced)' : ''}`);
    
    // In production, this would actually control RASA server
    // For now, simulate server control
    const mockServerResponse = {
      status: 'success',
      action,
      timestamp: new Date().toISOString(),
      serverStatus: {
        isRunning: action !== 'stop',
        uptime: action === 'stop' ? 0 : Math.floor(Math.random() * 86400), // Random uptime in seconds
        version: '3.6.0',
        modelLoaded: action !== 'stop',
        lastRestart: action === 'restart' ? new Date().toISOString() : '2025-09-22T10:30:00.000Z'
      }
    };

    res.json(mockServerResponse);
  } catch (error) {
    console.error('Error controlling RASA server:', error);
    res.status(500).json({
      error: 'Failed to control RASA server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rasa-management/server/status
 * Get current RASA server status
 */
router.get('/server/status', requireAuth, async (req, res) => {
  try {
    console.log('📊 Getting RASA server status');
    
    // Mock server status - in production this would query actual RASA server
    const serverStatus = {
      isRunning: true,
      uptime: 7234, // seconds
      version: '3.6.0',
      modelLoaded: true,
      modelVersion: 'model_20250922_143052',
      lastRestart: '2025-09-22T10:30:00.000Z',
      memoryUsage: {
        used: 512, // MB
        total: 1024, // MB
        percentage: 50
      },
      performance: {
        averageResponseTime: 245, // ms
        totalRequests: 1847,
        successRate: 94.2
      },
      health: 'healthy' // healthy | warning | critical
    };

    res.json(serverStatus);
  } catch (error) {
    console.error('Error getting server status:', error);
    res.status(500).json({
      error: 'Failed to get server status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================================
// 📊 ANALYTICS ENDPOINTS
// =====================================================================

/**
 * GET /api/rasa-management/analytics/overview
 * Get dashboard overview analytics
 */
router.get('/analytics/overview', requireAuth, async (req, res) => {
  try {
    const validation = AnalyticsQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid analytics query parameters',
        details: validation.error.errors
      });
    }

    const { startDate, endDate, channel } = validation.data;
    
    console.log('📊 Getting RASA analytics overview');
    
    // Build conditions array
    const conditions = [];
    if (startDate && endDate) {
      conditions.push(gte(conversationSessions.startedAt, new Date(startDate)));
      conditions.push(lte(conversationSessions.startedAt, new Date(endDate)));
    }
    if (channel) {
      conditions.push(eq(conversationSessions.channel, channel));
    }
    
    const filters = conditions.length > 0 ? and(...conditions) : undefined;

    // Get basic conversation metrics
    let conversationsQuery = db
      .select({ count: count() })
      .from(conversationSessions);
    if (conditions.length > 0) {
      conversationsQuery = conversationsQuery.where(and(...conditions));
    }
    const totalConversations = await conversationsQuery;

    let messagesQuery = db
      .select({ count: count() })
      .from(conversationMessages)
      .innerJoin(conversationSessions, eq(conversationMessages.sessionId, conversationSessions.id));
    if (conditions.length > 0) {
      messagesQuery = messagesQuery.where(and(...conditions));
    }
    const totalMessages = await messagesQuery;

    // Get average satisfaction score
    let satisfactionQuery = db
      .select({ avg: avg(userSatisfactionScores.rating) })
      .from(userSatisfactionScores)
      .innerJoin(conversationSessions, eq(userSatisfactionScores.sessionId, conversationSessions.id));
    if (conditions.length > 0) {
      satisfactionQuery = satisfactionQuery.where(and(...conditions));
    }
    const avgSatisfaction = await satisfactionQuery;

    // Get resolved conversations percentage
    const resolvedConditions = [...conditions];
    resolvedConditions.push(eq(conversationSessions.status, 'resolved'));
    
    const resolvedConversations = await db
      .select({ count: count() })
      .from(conversationSessions)
      .where(resolvedConditions.length > 0 ? and(...resolvedConditions) : eq(conversationSessions.status, 'resolved'));

    const overview = {
      totalConversations: totalConversations[0]?.count || 0,
      totalMessages: totalMessages[0]?.count || 0,
      averageSatisfaction: parseFloat(avgSatisfaction[0]?.avg?.toString() || '0'),
      resolutionRate: totalConversations[0]?.count 
        ? Math.round((resolvedConversations[0]?.count || 0) / totalConversations[0].count * 100)
        : 0,
      period: {
        startDate,
        endDate,
        channel: channel || 'all'
      },
      generatedAt: new Date().toISOString()
    };

    res.json(overview);
  } catch (error) {
    console.error('Error getting analytics overview:', error);
    res.status(500).json({
      error: 'Failed to get analytics overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rasa-management/analytics/intents
 * Get intent analytics data
 */
router.get('/analytics/intents', requireAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    console.log('📊 Getting intent analytics');
    
    const intents = await db
      .select({
        intentName: intentAnalytics.intentName,
        displayName: intentAnalytics.displayName,
        category: intentAnalytics.category,
        totalCount: intentAnalytics.totalCount,
        successCount: intentAnalytics.successCount,
        failureCount: intentAnalytics.failureCount,
        successRate: intentAnalytics.successRate,
        avgConfidence: intentAnalytics.avgConfidence,
        avgResponseTime: intentAnalytics.avgResponseTime,
        lastTriggered: intentAnalytics.lastTriggered
      })
      .from(intentAnalytics)
      .orderBy(desc(intentAnalytics.totalCount))
      .limit(parseInt(limit as string));

    res.json({
      intents,
      totalIntents: intents.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting intent analytics:', error);
    res.status(500).json({
      error: 'Failed to get intent analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================================
// 💬 CONVERSATION MONITORING
// =====================================================================

/**
 * GET /api/rasa-management/conversations
 * Get live conversation feed with filtering
 */
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const { 
      status, 
      channel, 
      limit = 50, 
      offset = 0, 
      search 
    } = req.query;
    
    console.log(`💬 Getting conversations - status: ${status}, channel: ${channel}`);
    
    // Build filters
    const conditions = [];
    
    if (status) {
      conditions.push(eq(conversationSessions.status, status as string));
    }
    if (channel) {
      conditions.push(eq(conversationSessions.channel, channel as string));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let conversationQuery = db
      .select({
        id: conversationSessions.id,
        userId: conversationSessions.userId,
        channel: conversationSessions.channel,
        status: conversationSessions.status,
        startedAt: conversationSessions.startedAt,
        endedAt: conversationSessions.endedAt,
        messageCount: conversationSessions.messageCount,
        escalatedToHuman: conversationSessions.escalatedToHuman
      })
      .from(conversationSessions);
    if (conditions.length > 0) {
      conversationQuery = conversationQuery.where(and(...conditions));
    }
    const conversations = await conversationQuery
      .orderBy(desc(conversationSessions.startedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Get total count for pagination
    let countQuery = db
      .select({ count: count() })
      .from(conversationSessions);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const totalCount = await countQuery;

    res.json({
      conversations,
      pagination: {
        total: totalCount[0]?.count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + conversations.length) < (totalCount[0]?.count || 0)
      },
      filters: { status, channel },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      error: 'Failed to get conversations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rasa-management/conversations/:sessionId/messages
 * Get messages for a specific conversation
 */
router.get('/conversations/:sessionId/messages', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 100 } = req.query;
    
    console.log(`💬 Getting messages for session: ${sessionId}`);
    
    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.sessionId, sessionId))
      .orderBy(conversationMessages.timestamp)
      .limit(parseInt(limit as string));

    res.json({
      sessionId,
      messages,
      messageCount: messages.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    res.status(500).json({
      error: 'Failed to get conversation messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================================
// ⚙️ SETTINGS MANAGEMENT
// =====================================================================

/**
 * GET /api/rasa-management/settings
 * Get current bot settings
 */
router.get('/settings', requireAuth, async (req, res) => {
  try {
    console.log('⚙️ Getting bot settings');
    
    const settings = await db
      .select()
      .from(botSettings)
      .where(eq(botSettings.id, 'global'))
      .limit(1);

    // Return default settings if none exist
    const currentSettings = settings[0] || {
      confidenceThreshold: 0.7,
      fallbackMessage: 'Xin lỗi, tôi không hiểu ý của bạn. Bạn có thể nói rõ hơn được không?',
      humanHandoffThreshold: 0.3,
      enableLogging: true,
      enableAnalytics: true,
      maxSessionDuration: 1800, // 30 minutes
      sessionTimeoutWarning: 300, // 5 minutes
      supportedLanguages: ['vi', 'en'],
      defaultLanguage: 'vi'
    };

    res.json({
      settings: currentSettings,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting bot settings:', error);
    res.status(500).json({
      error: 'Failed to get bot settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/rasa-management/settings
 * Update bot settings
 */
router.put('/settings', requireAuth, async (req, res) => {
  try {
    console.log('⚙️ Updating bot settings');
    
    // In production, validate settings schema here
    const updatedSettings = req.body;
    
    // Upsert settings with singleton ID
    const settingsId = 'global';
    const upsertedSettings = await db
      .insert(botSettings)
      .values({
        id: settingsId,
        ...updatedSettings,
        updatedAt: sql`now()`
      })
      .onConflictDoUpdate({
        target: [botSettings.id],
        set: {
          ...updatedSettings,
          updatedAt: sql`now()`
        }
      })
      .returning();

    res.json({
      success: true,
      settings: upsertedSettings[0] || updatedSettings,
      updatedAt: new Date().toISOString(),
      message: 'Bot settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating bot settings:', error);
    res.status(500).json({
      error: 'Failed to update bot settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================================
// 🔄 REAL-TIME DATA ENDPOINTS
// =====================================================================

/**
 * GET /api/rasa-management/live-stats
 * Get real-time statistics for dashboard
 */
router.get('/live-stats', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Getting live statistics');
    
    // Get active conversations (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeConversations = await db
      .select({ count: count() })
      .from(conversationSessions)
      .where(
        and(
          gte(conversationSessions.startedAt, fiveMinutesAgo),
          eq(conversationSessions.status, 'active')
        )
      );

    // Get messages in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMessages = await db
      .select({ count: count() })
      .from(conversationMessages)
      .where(gte(conversationMessages.timestamp, oneHourAgo));

    const liveStats = {
      activeConversations: activeConversations[0]?.count || 0,
      messagesLastHour: recentMessages[0]?.count || 0,
      serverStatus: 'online',
      responseTime: Math.floor(Math.random() * 500) + 100, // Mock response time
      timestamp: new Date().toISOString()
    };

    res.json(liveStats);
  } catch (error) {
    console.error('Error getting live stats:', error);
    res.status(500).json({
      error: 'Failed to get live statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;