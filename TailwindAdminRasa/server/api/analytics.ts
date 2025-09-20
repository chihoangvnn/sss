import { Router } from 'express';
import { db } from '../db';
import { 
  accountGroups, 
  groupAccounts, 
  postingFormulas, 
  limitCounters, 
  scheduledPosts, 
  socialAccounts,
  restPeriods,
  scheduleAssignments,
  violationsLog
} from '../../shared/schema';
import { eq, and, gte, lte, desc, sql, count, sum, avg } from 'drizzle-orm';

const router = Router();

// 🔒 Authentication middleware  
const requireAuth = (req: any, res: any, next: any) => {
  // For development, allow all requests (production would check session)
  console.log('🔍 Analytics Auth Check - NODE_ENV:', process.env.NODE_ENV, 'Session:', !!req.session, 'UserId:', !!req.session?.userId);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Development mode - bypassing auth for analytics');
    return next();
  }
  
  if (!req.session || !req.session.userId) {
    console.log('❌ Analytics auth failed - no valid session');
    return res.status(401).json({ 
      error: "Unauthorized. Please log in to access analytics.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// ===========================================
// DASHBOARD OVERVIEW ANALYTICS
// ===========================================

// Get comprehensive dashboard overview
router.get('/dashboard/overview', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Parallel queries for efficiency - ONLY EXISTING TABLES
    const [
      totalGroups,
      totalAccounts,
      todayPosts,
      weeklyPosts,
      monthlyPosts,
      failedPosts
    ] = await Promise.all([
      // Total account groups (EXISTING TABLE)
      db.select({ count: count() }).from(accountGroups).where(eq(accountGroups.isActive, true)),
      
      // Total social accounts (EXISTING TABLE)
      db.select({ count: count() }).from(socialAccounts).where(eq(socialAccounts.isActive, true)),
      
      // Today's posts (EXISTING TABLE)
      db.select({ count: count() }).from(scheduledPosts)
        .where(and(
          sql`${scheduledPosts.scheduledTime} >= ${today.toISOString()}`,
          sql`${scheduledPosts.scheduledTime} <= ${new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()}`
        )),
      
      // Weekly posts (EXISTING TABLE)
      db.select({ count: count() }).from(scheduledPosts)
        .where(sql`${scheduledPosts.scheduledTime} >= ${thisWeek.toISOString()}`),
      
      // Monthly posts (EXISTING TABLE)
      db.select({ count: count() }).from(scheduledPosts)
        .where(sql`${scheduledPosts.scheduledTime} >= ${thisMonth.toISOString()}`),
      
      // Failed posts (last 7 days) (EXISTING TABLE)
      db.select({ count: count() }).from(scheduledPosts)
        .where(and(
          eq(scheduledPosts.status, 'failed'),
          sql`${scheduledPosts.scheduledTime} >= ${thisWeek.toISOString()}`
        ))
    ]);

    // Calculate success rate
    const totalRecentPosts = weeklyPosts[0]?.count || 0;
    const failedRecentPosts = failedPosts[0]?.count || 0;
    const successRate = totalRecentPosts > 0 ? 
      ((totalRecentPosts - failedRecentPosts) / totalRecentPosts * 100).toFixed(1) : '100.0';

    res.json({
      summary: {
        totalGroups: totalGroups[0]?.count || 0,
        totalAccounts: totalAccounts[0]?.count || 0,
        activeFormulas: 0, // TODO: Add when posting_formulas table exists
        todayPosts: todayPosts[0]?.count || 0,
        weeklyPosts: weeklyPosts[0]?.count || 0,
        monthlyPosts: monthlyPosts[0]?.count || 0,
        successRate: parseFloat(successRate),
        activeRestPeriods: 0, // TODO: Add when rest_periods table exists
        recentViolations: 0 // TODO: Add when violations_log table exists
      },
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// ===========================================
// ACCOUNT GROUP ANALYTICS  
// ===========================================

// Get detailed account group analytics
router.get('/groups', requireAuth, async (req, res) => {
  try {
    const groups = await db
      .select({
        id: accountGroups.id,
        name: accountGroups.name,
        description: accountGroups.description,
        priority: accountGroups.priority,
        weight: accountGroups.weight,
        isActive: accountGroups.isActive,
        totalPosts: accountGroups.totalPosts,
        lastPostAt: accountGroups.lastPostAt,
        formulaName: postingFormulas.name,
        accountCount: sql<number>`COUNT(DISTINCT ${groupAccounts.socialAccountId})::int`,
        createdAt: accountGroups.createdAt
      })
      .from(accountGroups)
      .leftJoin(postingFormulas, eq(accountGroups.formulaId, postingFormulas.id))
      .leftJoin(groupAccounts, eq(accountGroups.id, groupAccounts.groupId))
      .groupBy(
        accountGroups.id, 
        accountGroups.name, 
        accountGroups.description,
        accountGroups.priority,
        accountGroups.weight,
        accountGroups.isActive,
        accountGroups.totalPosts,
        accountGroups.lastPostAt,
        postingFormulas.name,
        accountGroups.createdAt
      )
      .orderBy(desc(accountGroups.priority), desc(accountGroups.totalPosts));

    res.json(groups);
  } catch (error) {
    console.error('Error fetching group analytics:', error);
    res.status(500).json({ error: 'Failed to fetch group analytics' });
  }
});

// Get specific group performance details
router.get('/groups/:groupId/performance', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { days = 7 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    // Get group basic info
    const [groupInfo] = await db
      .select({
        id: accountGroups.id,
        name: accountGroups.name,
        totalPosts: accountGroups.totalPosts,
        lastPostAt: accountGroups.lastPostAt,
        formulaName: postingFormulas.name,
        formulaConfig: postingFormulas.config
      })
      .from(accountGroups)
      .leftJoin(postingFormulas, eq(accountGroups.formulaId, postingFormulas.id))
      .where(eq(accountGroups.id, groupId));

    if (!groupInfo) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Get accounts in this group
    const accounts = await db
      .select({
        id: socialAccounts.id,
        name: socialAccounts.name,
        platform: socialAccounts.platform,
        followers: socialAccounts.followers,
        engagement: socialAccounts.engagement,
        lastPost: socialAccounts.lastPost,
        isActive: socialAccounts.isActive,
        weight: groupAccounts.weight,
        dailyCapOverride: groupAccounts.dailyCapOverride,
        cooldownMinutes: groupAccounts.cooldownMinutes
      })
      .from(groupAccounts)
      .innerJoin(socialAccounts, eq(groupAccounts.socialAccountId, socialAccounts.id))
      .where(eq(groupAccounts.groupId, groupId));

    // Get recent limit counters for this group
    const limitUsage = await db
      .select({
        window: limitCounters.window,
        used: limitCounters.used,
        limit: limitCounters.limit,
        windowStart: limitCounters.windowStart,
        windowEnd: limitCounters.windowEnd
      })
      .from(limitCounters)
      .where(and(
        eq(limitCounters.scope, 'group'),
        eq(limitCounters.scopeId, groupId),
        sql`${limitCounters.windowStart} >= ${daysAgo.toISOString()}`
      ))
      .orderBy(desc(limitCounters.windowStart));

    // Get recent violations for this group
    const violations = await db
      .select({
        code: violationsLog.code,
        message: violationsLog.message,
        eventTime: violationsLog.eventTime,
        metadata: violationsLog.metadata
      })
      .from(violationsLog)
      .where(and(
        eq(violationsLog.scope, 'group'),
        eq(violationsLog.scopeId, groupId),
        sql`${violationsLog.eventTime} >= ${daysAgo.toISOString()}`
      ))
      .orderBy(desc(violationsLog.eventTime))
      .limit(10);

    res.json({
      group: groupInfo,
      accounts,
      limitUsage,
      violations,
      period: {
        days: Number(days),
        from: daysAgo.toISOString(),
        to: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching group performance:', error);
    res.status(500).json({ error: 'Failed to fetch group performance' });
  }
});

// ===========================================
// POSTING PERFORMANCE ANALYTICS
// ===========================================

// Get posting timeline analytics
router.get('/posts/timeline', requireAuth, async (req, res) => {
  try {
    const { days = 7, groupId } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    // Build the query based on group filter
    let timeline;
    
    if (groupId) {
      timeline = await db
        .select({
          date: sql<string>`DATE(${scheduledPosts.scheduledTime}) as date`,
          scheduled: sql<number>`COUNT(CASE WHEN ${scheduledPosts.status} = 'scheduled' THEN 1 END)::int`,
          posted: sql<number>`COUNT(CASE WHEN ${scheduledPosts.status} = 'posted' THEN 1 END)::int`,
          failed: sql<number>`COUNT(CASE WHEN ${scheduledPosts.status} = 'failed' THEN 1 END)::int`,
          total: sql<number>`COUNT(*)::int`
        })
        .from(scheduledPosts)
        .innerJoin(scheduleAssignments, eq(scheduledPosts.id, scheduleAssignments.scheduledPostId))
        .where(and(
          sql`${scheduledPosts.scheduledTime} >= ${daysAgo.toISOString()}`,
          eq(scheduleAssignments.groupId, groupId as string)
        ))
        .groupBy(sql`DATE(${scheduledPosts.scheduledTime})`)
        .orderBy(sql`DATE(${scheduledPosts.scheduledTime})`);
    } else {
      timeline = await db
        .select({
          date: sql<string>`DATE(${scheduledPosts.scheduledTime}) as date`,
          scheduled: sql<number>`COUNT(CASE WHEN ${scheduledPosts.status} = 'scheduled' THEN 1 END)::int`,
          posted: sql<number>`COUNT(CASE WHEN ${scheduledPosts.status} = 'posted' THEN 1 END)::int`,
          failed: sql<number>`COUNT(CASE WHEN ${scheduledPosts.status} = 'failed' THEN 1 END)::int`,
          total: sql<number>`COUNT(*)::int`
        })
        .from(scheduledPosts)
        .where(sql`${scheduledPosts.scheduledTime} >= ${daysAgo.toISOString()}`)
        .groupBy(sql`DATE(${scheduledPosts.scheduledTime})`)
        .orderBy(sql`DATE(${scheduledPosts.scheduledTime})`);
    }

    res.json({
      timeline,
      period: {
        days: Number(days),
        from: daysAgo.toISOString(),
        to: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching posting timeline:', error);
    res.status(500).json({ error: 'Failed to fetch posting timeline' });
  }
});

// Get platform distribution analytics
router.get('/posts/platforms', requireAuth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const platforms = await db
      .select({
        platform: scheduledPosts.platform,
        total: sql<number>`COUNT(*)::int`,
        posted: sql<number>`COUNT(CASE WHEN ${scheduledPosts.status} = 'posted' THEN 1 END)::int`,
        failed: sql<number>`COUNT(CASE WHEN ${scheduledPosts.status} = 'failed' THEN 1 END)::int`,
        avgEngagement: sql<number>`AVG(COALESCE((${scheduledPosts.analytics}->>'likes')::int + (${scheduledPosts.analytics}->>'comments')::int + (${scheduledPosts.analytics}->>'shares')::int, 0))::int`
      })
      .from(scheduledPosts)
      .where(sql`${scheduledPosts.scheduledTime} >= ${daysAgo.toISOString()}`)
      .groupBy(scheduledPosts.platform)
      .orderBy(desc(sql`COUNT(*)`));

    res.json(platforms);
  } catch (error) {
    console.error('Error fetching platform analytics:', error);
    res.status(500).json({ error: 'Failed to fetch platform analytics' });
  }
});

// ===========================================
// LIMIT MONITORING ANALYTICS
// ===========================================

// Get current limit usage across all scopes
router.get('/limits/current', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    
    // Get current limits for all active windows
    const limits = await db
      .select({
        scope: limitCounters.scope,
        scopeId: limitCounters.scopeId,
        window: limitCounters.window,
        used: limitCounters.used,
        limit: limitCounters.limit,
        usagePercent: sql<number>`ROUND((${limitCounters.used}::decimal / ${limitCounters.limit}::decimal) * 100, 1)`,
        windowStart: limitCounters.windowStart,
        windowEnd: limitCounters.windowEnd,
        timeRemaining: sql<number>`EXTRACT(EPOCH FROM ${limitCounters.windowEnd}::timestamp - NOW())::int`
      })
      .from(limitCounters)
      .where(and(
        sql`${limitCounters.windowStart} <= ${now.toISOString()}`,
        sql`${limitCounters.windowEnd} >= ${now.toISOString()}`
      ))
      .orderBy(desc(sql`(${limitCounters.used}::decimal / ${limitCounters.limit}::decimal)`));

    // Group by scope for better organization
    const groupedLimits = limits.reduce((acc, limit) => {
      if (!acc[limit.scope]) {
        acc[limit.scope] = [];
      }
      acc[limit.scope].push(limit);
      return acc;
    }, {} as Record<string, typeof limits>);

    res.json({
      byScope: groupedLimits,
      all: limits,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error fetching current limits:', error);
    res.status(500).json({ error: 'Failed to fetch current limits' });
  }
});

// Get limit violations summary
router.get('/violations/summary', requireAuth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const violations = await db
      .select({
        scope: violationsLog.scope,
        code: violationsLog.code,
        count: sql<number>`COUNT(*)::int`,
        latestEvent: sql<string>`MAX(${violationsLog.eventTime})`,
        affectedScopes: sql<number>`COUNT(DISTINCT ${violationsLog.scopeId})::int`
      })
      .from(violationsLog)
      .where(sql`${violationsLog.eventTime} >= ${daysAgo.toISOString()}`)
      .groupBy(violationsLog.scope, violationsLog.code)
      .orderBy(desc(sql`COUNT(*)`));

    // Get violation timeline
    const timeline = await db
      .select({
        date: sql<string>`DATE(${violationsLog.eventTime}) as date`,
        count: sql<number>`COUNT(*)::int`
      })
      .from(violationsLog)
      .where(sql`${violationsLog.eventTime} >= ${daysAgo.toISOString()}`)
      .groupBy(sql`DATE(${violationsLog.eventTime})`)
      .orderBy(sql`DATE(${violationsLog.eventTime})`);

    res.json({
      summary: violations,
      timeline,
      period: {
        days: Number(days),
        from: daysAgo.toISOString(),
        to: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching violations summary:', error);
    res.status(500).json({ error: 'Failed to fetch violations summary' });
  }
});

// ===========================================
// FORMULA PERFORMANCE ANALYTICS
// ===========================================

// Get posting formula analytics
router.get('/formulas/performance', requireAuth, async (req, res) => {
  try {
    const formulas = await db
      .select({
        id: postingFormulas.id,
        name: postingFormulas.name,
        description: postingFormulas.description,
        config: postingFormulas.config,
        isActive: postingFormulas.isActive,
        groupCount: sql<number>`COUNT(DISTINCT ${accountGroups.id})::int`,
        totalPosts: sql<number>`SUM(${accountGroups.totalPosts})::int`,
        lastUsed: sql<string>`MAX(${accountGroups.lastPostAt})`
      })
      .from(postingFormulas)
      .leftJoin(accountGroups, eq(postingFormulas.id, accountGroups.formulaId))
      .groupBy(
        postingFormulas.id,
        postingFormulas.name,
        postingFormulas.description,
        postingFormulas.config,
        postingFormulas.isActive
      )
      .orderBy(desc(sql`SUM(${accountGroups.totalPosts})`));

    res.json(formulas);
  } catch (error) {
    console.error('Error fetching formula performance:', error);
    res.status(500).json({ error: 'Failed to fetch formula performance' });
  }
});

export default router;