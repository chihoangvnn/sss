/**
 * 🚀 TEMPORARY WORKER STORAGE SERVICE
 * 
 * In-memory storage for worker management until database schema is properly deployed.
 * This provides all the worker management functionality needed for the APIs.
 * 
 * TODO: Replace with proper database storage once schema migration is complete.
 */

import type { 
  Worker, 
  InsertWorker, 
  WorkerJob, 
  InsertWorkerJob,
  WorkerHealthCheck,
  InsertWorkerHealthCheck,
  WorkerPlatform,
  WorkerCapability
} from '@shared/schema';
import { storage } from '../storage';

// Database-backed worker storage
class WorkerStorage {
  // Keep worker jobs and health checks in memory for now (can be moved to database later)
  private workerJobs: Map<string, WorkerJob> = new Map();
  private healthChecks: Map<string, WorkerHealthCheck[]> = new Map();
  private idCounter = 1;

  // Generate ID for new records
  private generateId(): string {
    return `temp_${this.idCounter++}_${Date.now()}`;
  }

  // Generate UUID-like string
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Worker methods
  async createWorker(data: InsertWorker): Promise<Worker> {
    return await storage.createWorker(data);
  }

  async getWorkerByWorkerId(workerId: string): Promise<Worker | null> {
    const worker = await storage.getWorkerByWorkerId(workerId);
    return worker || null;
  }

  async getWorkers(filters?: {
    platform?: WorkerPlatform;
    region?: string;
    status?: string;
    isOnline?: boolean;
  }): Promise<Worker[]> {
    const workers = await storage.getWorkers();

    if (!filters) {
      return workers;
    }

    return workers.filter(worker => {
      if (filters.platform && !worker.platforms.includes(filters.platform)) {
        return false;
      }
      if (filters.region && worker.region !== filters.region) {
        return false;
      }
      if (filters.status && worker.status !== filters.status) {
        return false;
      }
      if (filters.isOnline !== undefined && worker.isOnline !== filters.isOnline) {
        return false;
      }
      return true;
    });
  }

  async updateWorker(id: string, updates: Partial<Worker>): Promise<Worker | null> {
    const updatedWorker = await storage.updateWorker(id, updates);
    return updatedWorker || null;
  }

  async deleteWorker(id: string): Promise<boolean> {
    return await storage.deleteWorker(id);
  }

  // Worker job methods
  async createWorkerJob(data: InsertWorkerJob): Promise<WorkerJob> {
    const id = this.generateUUID();
    const workerJob: WorkerJob = {
      id,
      workerId: data.workerId,
      jobId: data.jobId,
      scheduledPostId: data.scheduledPostId || null,
      platform: data.platform as WorkerPlatform,
      jobType: data.jobType,
      priority: data.priority || 1,
      assignedAt: data.assignedAt || new Date(),
      startedAt: data.startedAt || null,
      completedAt: data.completedAt || null,
      status: data.status || 'assigned',
      result: data.result as any || null,
      executionTime: data.executionTime || null,
      retryCount: data.retryCount || 0,
      maxRetries: data.maxRetries || 3,
      metadata: data.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workerJobs.set(id, workerJob);
    return workerJob;
  }

  async getWorkerJobs(workerId: string): Promise<WorkerJob[]> {
    return Array.from(this.workerJobs.values()).filter(job => job.workerId === workerId);
  }

  async getWorkerCurrentLoad(workerId: string): Promise<number> {
    const activeJobs = Array.from(this.workerJobs.values()).filter(
      job => job.workerId === workerId && 
      ['assigned', 'started'].includes(job.status)
    );
    return activeJobs.length;
  }

  async updateWorkerJob(id: string, updates: Partial<WorkerJob>): Promise<WorkerJob | null> {
    const job = this.workerJobs.get(id);
    if (!job) return null;

    const updatedJob = { 
      ...job, 
      ...updates, 
      updatedAt: new Date() 
    };
    
    this.workerJobs.set(id, updatedJob);
    return updatedJob;
  }

  // Health check methods
  async createWorkerHealthCheck(data: InsertWorkerHealthCheck): Promise<WorkerHealthCheck> {
    const id = this.generateUUID();
    const healthCheck: WorkerHealthCheck = {
      id,
      workerId: data.workerId,
      status: data.status,
      responseTime: data.responseTime || null,
      cpuUsage: data.cpuUsage || null,
      memoryUsage: data.memoryUsage || null,
      networkLatency: data.networkLatency || null,
      platformStatus: data.platformStatus as any || null,
      errorMessage: data.errorMessage || null,
      errorCode: data.errorCode || null,
      errorCount: data.errorCount || 0,
      checkedAt: data.checkedAt || new Date(),
      metadata: data.metadata || null
    };

    // Store health checks in array per worker
    if (!this.healthChecks.has(data.workerId)) {
      this.healthChecks.set(data.workerId, []);
    }
    
    const workerHealthChecks = this.healthChecks.get(data.workerId)!;
    workerHealthChecks.push(healthCheck);
    
    // Keep only last 100 health checks per worker
    if (workerHealthChecks.length > 100) {
      workerHealthChecks.splice(0, workerHealthChecks.length - 100);
    }

    return healthCheck;
  }

  async getWorkerHealthChecks(workerId: string, limit = 10): Promise<WorkerHealthCheck[]> {
    const checks = this.healthChecks.get(workerId) || [];
    return checks.slice(-limit).reverse(); // Get last N checks, newest first
  }

  async getLatestWorkerHealthCheck(workerId: string): Promise<WorkerHealthCheck | null> {
    const checks = this.healthChecks.get(workerId) || [];
    return checks.length > 0 ? checks[checks.length - 1] : null;
  }

  // Statistics and analytics
  async getWorkerStats(): Promise<{
    totalWorkers: number;
    onlineWorkers: number;
    activeWorkers: number;
    totalJobsInProgress: number;
  }> {
    const workers = await storage.getWorkers();
    
    // For jobs, we'll use a simple count since we don't have a dedicated jobs table yet
    // TODO: Implement proper worker jobs table when needed
    
    return {
      totalWorkers: workers.length,
      onlineWorkers: workers.filter(w => w.isOnline).length,
      activeWorkers: workers.filter(w => w.status === 'active').length,
      totalJobsInProgress: 0 // Will be implemented when worker jobs table is added
    };
  }

  // Cleanup and reset (for testing)
  async reset(): Promise<void> {
    // Note: This only resets in-memory data (jobs and health checks)
    // Workers are now stored in database and would need to be deleted there
    this.workerJobs.clear();
    this.healthChecks.clear();
    this.idCounter = 1;
  }

  // Get all data (for debugging)
  async getAllData(): Promise<{
    workers: Worker[];
    jobs: WorkerJob[];
    healthChecks: Map<string, WorkerHealthCheck[]>;
  }> {
    const workers = await storage.getWorkers();
    return {
      workers,
      jobs: Array.from(this.workerJobs.values()),
      healthChecks: this.healthChecks
    };
  }
}

// Export singleton instance
export const workerStorage = new WorkerStorage();
export default workerStorage;