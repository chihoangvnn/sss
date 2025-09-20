import express from 'express';
import { storage } from '../storage';
import { insertApiConfigurationSchema, updateApiConfigurationSchema } from '@shared/schema';
import { z } from 'zod';
import { apiCache } from '../middleware/api-management';

const router = express.Router();

// Authentication middleware for admin operations
const requireAuth = (req: any, res: any, next: any) => {
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  // In production, check for valid session
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: "Unauthorized. Please log in to manage API configurations.",
      code: "AUTH_REQUIRED"
    });
  }
  next();
};

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * GET /api/api-configurations
 * Get all API configurations with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { category, enabled, search } = req.query;
    
    let configs = await storage.getApiConfigurations();
    
    // Apply filters
    if (category && typeof category === 'string') {
      configs = configs.filter(config => config.category === category);
    }
    
    if (enabled !== undefined) {
      const isEnabled = enabled === 'true';
      configs = configs.filter(config => config.isEnabled === isEnabled);
    }
    
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      configs = configs.filter(config => 
        config.endpoint.toLowerCase().includes(searchTerm) ||
        config.description.toLowerCase().includes(searchTerm) ||
        config.category.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      configs,
      total: configs.length,
      categories: Array.from(new Set(configs.map(c => c.category))).sort()
    });
  } catch (error) {
    console.error('Error fetching API configurations:', error);
    res.status(500).json({ error: 'Failed to fetch API configurations' });
  }
});

/**
 * GET /api/api-configurations/:id
 * Get a specific API configuration by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await storage.getApiConfiguration(id);
    
    if (!config) {
      return res.status(404).json({ error: 'API configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching API configuration:', error);
    res.status(500).json({ error: 'Failed to fetch API configuration' });
  }
});

/**
 * POST /api/api-configurations
 * Create a new API configuration
 */
router.post('/', async (req, res) => {
  try {
    const validatedData = insertApiConfigurationSchema.parse(req.body);
    const config = await storage.createApiConfiguration(validatedData);
    
    // Clear cache to ensure new config is picked up
    apiCache.clear();
    
    res.status(201).json({
      message: 'API configuration created successfully',
      config
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Error creating API configuration:', error);
    res.status(500).json({ error: 'Failed to create API configuration' });
  }
});

/**
 * PUT /api/api-configurations/:id
 * Update an existing API configuration
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateApiConfigurationSchema.parse(req.body);
    
    const config = await storage.updateApiConfiguration(id, validatedData);
    
    if (!config) {
      return res.status(404).json({ error: 'API configuration not found' });
    }
    
    // Invalidate cache for this specific endpoint
    apiCache.invalidate(config.endpoint, config.method);
    
    res.json({
      message: 'API configuration updated successfully',
      config
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    console.error('Error updating API configuration:', error);
    res.status(500).json({ error: 'Failed to update API configuration' });
  }
});

/**
 * DELETE /api/api-configurations/:id
 * Delete an API configuration
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get config first to clear cache
    const config = await storage.getApiConfiguration(id);
    
    const deleted = await storage.deleteApiConfiguration(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'API configuration not found' });
    }
    
    // Invalidate cache if config existed
    if (config) {
      apiCache.invalidate(config.endpoint, config.method);
    }
    
    res.json({ message: 'API configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting API configuration:', error);
    res.status(500).json({ error: 'Failed to delete API configuration' });
  }
});

/**
 * POST /api/api-configurations/:id/toggle
 * Toggle API enabled/disabled state
 */
router.post('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled field must be a boolean' });
    }
    
    const config = await storage.toggleApiEnabled(id, enabled);
    
    if (!config) {
      return res.status(404).json({ error: 'API configuration not found' });
    }
    
    // Invalidate cache for this endpoint
    apiCache.invalidate(config.endpoint, config.method);
    
    res.json({
      message: `API ${enabled ? 'enabled' : 'disabled'} successfully`,
      config
    });
  } catch (error) {
    console.error('Error toggling API configuration:', error);
    res.status(500).json({ error: 'Failed to toggle API configuration' });
  }
});

/**
 * GET /api/api-configurations/stats/summary
 * Get summary statistics for all API configurations
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const configs = await storage.getApiConfigurations();
    
    const summary = {
      total: configs.length,
      enabled: configs.filter(c => c.isEnabled).length,
      disabled: configs.filter(c => !c.isEnabled).length,
      maintenance: configs.filter(c => c.maintenanceMode).length,
      categories: configs.reduce((acc, config) => {
        acc[config.category] = (acc[config.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalAccess: configs.reduce((sum, c) => sum + (c.accessCount || 0), 0),
      totalErrors: configs.reduce((sum, c) => sum + (c.errorCount || 0), 0),
      avgResponseTime: configs.length > 0 
        ? configs.reduce((sum, c) => sum + Number(c.avgResponseTime || 0), 0) / configs.length
        : 0
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching API statistics:', error);
    res.status(500).json({ error: 'Failed to fetch API statistics' });
  }
});

/**
 * POST /api/api-configurations/cache/clear
 * Clear the API configuration cache
 */
router.post('/cache/clear', async (req, res) => {
  try {
    apiCache.clear();
    res.json({ message: 'API configuration cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing API cache:', error);
    res.status(500).json({ error: 'Failed to clear API cache' });
  }
});

/**
 * GET /api/api-configurations/categories
 * Get all unique categories
 */
router.get('/categories', async (req, res) => {
  try {
    const configs = await storage.getApiConfigurations();
    const categories = Array.from(new Set(configs.map(c => c.category))).sort();
    
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;