/**
 * 🏥 SYSTEM HEALTH MONITORING API
 * 
 * API endpoints for monitoring "Bộ Não - Cánh Tay - Vệ Tinh" system health
 * 
 * Features:
 * - Real-time health reports
 * - Component status monitoring  
 * - Performance metrics
 * - Alert management
 */

import express from 'express';
import SystemHealthService from '../services/system-health-service';

const router = express.Router();
const healthService = SystemHealthService.getInstance();

/**
 * 🏥 Get comprehensive system health report
 * GET /api/health/status
 */
router.get('/status', async (req, res) => {
  try {
    const healthReport = await healthService.generateHealthReport();
    
    res.json({
      success: true,
      health: healthReport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate health report'
    });
  }
});

/**
 * 🎯 Get simplified health check (for monitoring tools)
 * GET /api/health/check
 */
router.get('/check', async (req, res) => {
  try {
    const healthReport = await healthService.generateHealthReport();
    
    // Simple health check response
    const status = healthReport.overall === 'healthy' ? 200 : 
                   healthReport.overall === 'degraded' ? 202 : 503;
    
    res.status(status).json({
      status: healthReport.overall,
      timestamp: healthReport.reportGeneratedAt,
      alerts: healthReport.alerts.length,
      components: {
        total: healthReport.components.length,
        healthy: healthReport.components.filter(c => c.status === 'healthy').length,
        degraded: healthReport.components.filter(c => c.status === 'degraded').length,
        unhealthy: healthReport.components.filter(c => c.status === 'unhealthy').length
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

/**
 * 📊 Get system metrics only
 * GET /api/health/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const healthReport = await healthService.generateHealthReport();
    
    res.json({
      success: true,
      metrics: healthReport.metrics,
      timestamp: healthReport.reportGeneratedAt
    });
  } catch (error) {
    console.error('Health metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health metrics'
    });
  }
});

/**
 * ⚠️ Get current system alerts
 * GET /api/health/alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    const healthReport = await healthService.generateHealthReport();
    
    res.json({
      success: true,
      alerts: healthReport.alerts,
      severity: {
        critical: healthReport.alerts.filter(a => a.includes('🔴')).length,
        warning: healthReport.alerts.filter(a => a.includes('🟡')).length
      },
      timestamp: healthReport.reportGeneratedAt
    });
  } catch (error) {
    console.error('Health alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health alerts'
    });
  }
});

/**
 * 🔍 Get specific component health
 * GET /api/health/component/:componentName
 */
router.get('/component/:componentName', async (req, res) => {
  try {
    const { componentName } = req.params;
    const healthReport = await healthService.generateHealthReport();
    
    const component = healthReport.components.find(c => c.component === componentName);
    
    if (!component) {
      return res.status(404).json({
        success: false,
        error: `Component '${componentName}' not found`
      });
    }
    
    res.json({
      success: true,
      component,
      timestamp: healthReport.reportGeneratedAt
    });
  } catch (error) {
    console.error('Component health error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve component health'
    });
  }
});

export default router;