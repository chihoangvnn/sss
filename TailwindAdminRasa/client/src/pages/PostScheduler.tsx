import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, Clock, Plus, Edit, Trash2, Send, Pause, Play, 
  Facebook, Instagram, Image, Video, Tag, Eye, AlertCircle,
  CheckCircle, XCircle, Loader2, Filter, Search, LayoutList, Upload,
  Users, Target, Settings, TrendingUp, Shield, Zap
} from 'lucide-react';
import { ScheduledPost, SocialAccount, ContentAsset, AccountGroup } from '../../../shared/schema';
import { PostCalendarView } from '../components/PostCalendarView';
import { BulkUpload } from '../components/BulkUpload';
import { SmartScheduler } from '../components/SmartScheduler';

interface PostSchedulerProps {}

export function PostScheduler({}: PostSchedulerProps) {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showSmartScheduler, setShowSmartScheduler] = useState(false);

  // Fetch scheduled posts
  const { data: scheduledPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['scheduled-posts', selectedAccount],
    queryFn: async () => {
      const url = selectedAccount 
        ? `/api/content/scheduled-posts?account=${selectedAccount}`
        : '/api/content/scheduled-posts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch scheduled posts');
      const data = await response.json();
      return data as ScheduledPost[];
    },
  });

  // Fetch social accounts
  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/social-accounts');
      if (!response.ok) throw new Error('Failed to fetch social accounts');
      const data = await response.json();
      return data as SocialAccount[];
    },
  });

  // Fetch account groups
  const { data: accountGroups = [] } = useQuery({
    queryKey: ['account-groups'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/groups');
      if (!response.ok) throw new Error('Failed to fetch account groups');
      const data = await response.json();
      return data as AccountGroup[];
    },
  });

  // Fetch group limits and usage using new limit management API
  const { data: groupLimits } = useQuery({
    queryKey: ['group-limits', selectedGroup],
    queryFn: async () => {
      const url = selectedGroup !== 'all' 
        ? `/api/limits/status?scope=group&scopeId=${selectedGroup}`
        : '/api/limits/status';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch group limits');
      return response.json();
    },
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Fetch scheduler status
  const { data: schedulerStatus } = useQuery({
    queryKey: ['scheduler-status'],
    queryFn: async () => {
      const response = await fetch('/api/content/scheduler/status');
      if (!response.ok) throw new Error('Failed to fetch scheduler status');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/content/scheduled-posts/${postId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete post');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    },
  });

  // Trigger post mutation with limit violation prevention
  const triggerPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      // Get post details first
      const post = scheduledPosts.find(p => p.id === postId);
      if (!post) throw new Error('Post not found');

      // Check posting capacity before triggering
      const capacityResponse = await fetch('/api/limits/check-capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socialAccountId: post.socialAccountId,
          groupId: selectedGroup !== 'all' ? selectedGroup : undefined
        })
      });

      if (capacityResponse.ok) {
        const capacity = await capacityResponse.json();
        
        // Check if posting is allowed
        if (!capacity.canPost) {
          const violation = capacity.violations[0];
          const suggestedTime = capacity.suggestedScheduleTimes[0];
          
          throw new Error(
            `🚫 Limit violation detected! ${violation?.violatedRule.scope} limit exceeded (${violation?.currentUsage}/${violation?.maxAllowed}). ` +
            `Suggested retry time: ${suggestedTime ? new Date(suggestedTime).toLocaleString('vi-VN') : 'later'}`
          );
        }
      }

      // Proceed with posting if capacity check passes
      const response = await fetch(`/api/content/scheduled-posts/${postId}/trigger`, {
        method: 'POST'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to trigger post');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      queryClient.invalidateQueries({ queryKey: ['group-limits'] }); // Refresh limits after posting
    },
  });

  // Helper function to determine account priority level (moved before usage)
  const getAccountPriorityLevel = (account: SocialAccount): number => {
    // This is a temporary implementation for group filtering
    // In production, this would come from the group_accounts junction table
    
    // Example logic: determine priority based on account characteristics
    const followers = Number(account.followers) || 0;
    const engagement = Number(account.engagement) || 0;
    
    if (followers > 100000 && engagement > 5) return 1; // VIP
    if (followers > 50000 && engagement > 3) return 2;  // High priority  
    if (followers > 10000 && engagement > 1) return 3;  // Standard
    if (followers > 1000) return 4;                     // Low priority
    return 5; // Basic
  };

  // Filter posts by status and group  
  const filteredPosts = scheduledPosts.filter(post => {
    if (filterStatus !== 'all' && post.status !== filterStatus) return false;
    
    // Group filtering implementation
    if (selectedGroup !== 'all') {
      // Check if post's social account belongs to the selected group
      const postAccount = socialAccounts.find(acc => acc.id === post.socialAccountId);
      if (!postAccount) return false;
      
      // TODO: When group-account relationship is fully implemented in backend,
      // this will use actual group assignments from group_accounts table.
      // For now, we simulate group assignment based on account name patterns
      // or other criteria that can be implemented immediately.
      
      // Simple group matching for demonstration (can be enhanced)
      const selectedGroupData = accountGroups.find(g => g.id === selectedGroup);
      if (!selectedGroupData) return false;
      
      // Match by group priority level for now (as temporary filtering)
      // Priority 1-2 = VIP accounts, 3-4 = Standard accounts, 5 = Basic accounts
      const accountPriority = getAccountPriorityLevel(postAccount);
      const groupPriority = selectedGroupData.priority || 3;
      
      return accountPriority === groupPriority;
    }
    
    return true;
  });

  // Group posts by status
  const postsByStatus = {
    draft: filteredPosts.filter(p => p.status === 'draft'),
    scheduled: filteredPosts.filter(p => p.status === 'scheduled'),
    posting: filteredPosts.filter(p => p.status === 'posting'),
    posted: filteredPosts.filter(p => p.status === 'posted'),
    failed: filteredPosts.filter(p => p.status === 'failed'),
    cancelled: filteredPosts.filter(p => p.status === 'cancelled'),
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (post: ScheduledPost) => {
    const { status, errorMessage, retryCount, scheduledTime } = post;
    const now = new Date();
    const scheduledDate = new Date(scheduledTime);
    
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4 text-gray-500" />;
      case 'scheduled':
        // Icon cho retry
        if (errorMessage && retryCount && retryCount > 0) {
          return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />;
        }
        // Icon cho quá hạn
        if (scheduledDate < now && !errorMessage) {
          return <AlertCircle className="w-4 h-4 text-red-500" />;
        }
        // Icon bình thường cho scheduled
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'posting': return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />;
      case 'posted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusText = (post: ScheduledPost) => {
    const { status, errorMessage, retryCount, scheduledTime } = post;
    const now = new Date();
    const scheduledDate = new Date(scheduledTime);
    
    switch (status) {
      case 'draft': return 'Nháp';
      case 'scheduled':
        // Hiển thị trạng thái retry nếu có lỗi và đang retry
        if (errorMessage && retryCount && retryCount > 0) {
          return `Đang thử lại (${retryCount}/3)`;
        }
        // Hiển thị "Quá hạn" nếu đã qua thời gian lên lịch và không có lỗi
        if (scheduledDate < now && !errorMessage) {
          return 'Quá hạn';
        }
        // Trạng thái bình thường - chỉ mới lưu trong database, chưa gửi đến cánh tay
        return 'Đang đợi';
      case 'posting': return 'Đang đăng';
      case 'posted': return 'Đã lên';
      case 'failed': 
        // Hiển thị lỗi chi tiết nếu có
        if (errorMessage) {
          const shortError = errorMessage.length > 30 
            ? errorMessage.substring(0, 30) + '...' 
            : errorMessage;
          return `Thất bại: ${shortError}`;
        }
        return 'Thất bại';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      default: return null;
    }
  };

  // Bulk upload handler
  const handleBulkUpload = async (posts: Partial<ScheduledPost>[]) => {
    try {
      const response = await fetch('/api/content/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bulk upload posts');
      }

      const result = await response.json();
      
      // Refresh the posts list
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      
      // Close the modal
      setShowBulkUpload(false);
      
      // Show detailed success message
      if (result.errorCount > 0) {
        alert(`Hoàn thành! Thành công: ${result.successCount}, Lỗi: ${result.errorCount}. Xem chi tiết trong console.`);
        console.log('Bulk upload results:', result.results);
      } else {
        alert(`Thành công! Đã tạo ${result.successCount} bài đăng.`);
      }
      
    } catch (error) {
      console.error('Bulk upload error:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể tải lên hàng loạt'}`);
    }
  };

  // Smart scheduler handler with bulk limit checking
  const handleSmartSchedule = async (config: any) => {
    try {
      // First, validate the configuration and generate planned posts
      const planResponse = await fetch('/api/content/smart-scheduler/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!planResponse.ok) {
        const error = await planResponse.json();
        throw new Error(error.message || 'Failed to create schedule plan');
      }

      const plan = await planResponse.json();
      
      // Perform bulk capacity check before scheduling
      const bulkCheckResponse = await fetch('/api/limits/bulk-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          posts: plan.posts?.map((post: any) => ({
            socialAccountId: post.socialAccountId,
            groupId: selectedGroup !== 'all' ? selectedGroup : undefined,
            scheduledTime: post.scheduledTime
          })) || []
        })
      });

      if (bulkCheckResponse.ok) {
        const bulkResult = await bulkCheckResponse.json();
        
        // Show capacity analysis to user
        if (!bulkResult.canScheduleAll) {
          const message = 
            `⚠️ Limit Capacity Analysis:\n` +
            `✅ Allowed: ${bulkResult.summary.allowedCount}/${bulkResult.summary.totalPosts} posts\n` +
            `🚫 Blocked: ${bulkResult.summary.blockedCount} posts\n` +
            `🔄 Alternatives: ${bulkResult.summary.alternativeCount} suggestions\n` +
            `📊 Success Rate: ${bulkResult.summary.successRate}%\n\n` +
            `Continue with allowed posts only?`;
          
          if (!confirm(message)) {
            return;
          }
        }
      }

      // Proceed with actual scheduling
      const response = await fetch('/api/content/smart-scheduler/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create smart schedule');
      }

      const result = await response.json();
      
      // Refresh the posts list and limits
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      queryClient.invalidateQueries({ queryKey: ['group-limits'] });
      
      // Close the modal
      setShowSmartScheduler(false);
      
      // Show success message
      alert(`🎉 Smart Scheduler hoàn thành! Đã tạo ${result.totalPosts} bài đăng cho ${result.fanpageCount} fanpages.`);
      
    } catch (error) {
      console.error('Smart schedule error:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể tạo lịch đăng thông minh'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lịch Đăng Bài</h1>
            <p className="text-gray-600 mt-1">
              Quản lý và lên lịch bài đăng trên các mạng xã hội
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Danh Sách
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-2 ${
                  viewMode === 'calendar'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Lịch
              </button>
            </div>
            
            {/* Scheduler Status */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
              <div className={`w-2 h-2 rounded-full ${
                schedulerStatus?.running ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {schedulerStatus?.running ? 'Hoạt động' : 'Tạm dừng'}
              </span>
            </div>
            
            <button
              onClick={() => {
                if (selectedDate) {
                  // If a date is selected from calendar, use it
                  setShowScheduleModal(true);
                } else {
                  setShowScheduleModal(true);
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Lên Lịch Bài Đăng
            </button>
            
            <button
              onClick={() => setShowBulkUpload(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Tải Hàng Loạt
            </button>

            <button
              onClick={() => setShowSmartScheduler(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Smart Scheduler
            </button>

          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả tài khoản</option>
                {socialAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.platform})
                  </option>
                ))}
              </select>

              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả groups</option>
                {accountGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} (P{group.priority})
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Nháp</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="posting">Đang đăng</option>
                <option value="posted">Đã đăng</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>

            {/* Group Limits Info */}
            {selectedGroup !== 'all' && groupLimits && (
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-600">Limits:</span>
                  <div className="flex items-center gap-2 mt-1">
                    {groupLimits.byScope?.group?.map((limit: any, index: number) => (
                      <div key={index} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          limit.usagePercent > 90 ? 'bg-red-500' : 
                          limit.usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="text-xs font-medium">
                          {limit.currentUsage}/{limit.rule.maxCount} ({limit.rule.limitType})
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Health Score */}
                  {groupLimits.summary && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        groupLimits.summary.healthScore >= 80 ? 'bg-green-100 text-green-700' :
                        groupLimits.summary.healthScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        Health: {groupLimits.summary.healthScore}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          {Object.entries(postsByStatus).map(([status, posts]) => (
            <div key={status} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{getStatusText(status as any)}</p>
                  <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">
                  {getStatusIcon(status as any)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Area - Calendar or List View */}
        {viewMode === 'calendar' ? (
          <PostCalendarView
            posts={filteredPosts}
            accounts={socialAccounts}
            onEditPost={(post) => setEditingPost(post)}
            onTriggerPost={(postId) => triggerPostMutation.mutate(postId)}
            onDeletePost={(postId) => {
              if (confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
                deletePostMutation.mutate(postId);
              }
            }}
            onCreatePost={(date) => {
              setSelectedDate(date);
              setShowScheduleModal(true);
            }}
            onReschedulePost={async (postId, newDate) => {
              try {
                const response = await fetch(`/api/content/scheduled-posts/${postId}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    scheduledTime: newDate.toISOString(),
                  }),
                });
                if (!response.ok) throw new Error('Failed to reschedule post');
                queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
              } catch (error) {
                console.error('Error rescheduling post:', error);
              }
            }}
          />
        ) : (
          /* Posts List View */
          postsLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có bài đăng nào được lên lịch
            </h3>
            <p className="text-gray-600 mb-4">
              Bắt đầu bằng cách lên lịch bài đăng đầu tiên của bạn
            </p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Lên Lịch Ngay
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPosts.map((post) => {
              const account = socialAccounts.find(acc => acc.id === post.socialAccountId);
              const isScheduled = post.status === 'scheduled';
              const isPast = new Date(post.scheduledTime) < new Date();

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-all group"
                >
                  {/* 🎯 COMPACT 1-LINE LAYOUT */}
                  <div className="flex items-center gap-3">
                    {/* Status & Platform Icon */}
                    <div className="flex items-center gap-2 min-w-[60px]">
                      {getStatusIcon(post)}
                      <div className="w-6 h-6 flex items-center justify-center">
                        {getPlatformIcon(post.platform)}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="min-w-[100px] text-xs font-mono text-gray-600">
                      {formatDate(String(post.scheduledTime)).split(' ')[1]} {/* Only time */}
                      <div className="text-[10px] text-gray-500">
                        {formatDate(String(post.scheduledTime)).split(' ')[0]} {/* Only date */}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {post.caption.length > 50 ? `${post.caption.substring(0, 50)}...` : post.caption}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        @{account?.name || 'Unknown'} • {post.platform}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <span> • {post.hashtags.slice(0, 2).join(' ')}</span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="min-w-[80px] text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        post.status === 'scheduled' 
                          ? 'bg-blue-100 text-blue-800' 
                          : post.status === 'posted' 
                          ? 'bg-green-100 text-green-800'
                          : post.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusText(post)}
                      </span>
                      {isPast && isScheduled && (
                        <div className="text-[10px] text-orange-600 font-medium mt-1">Quá hạn</div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {post.platformUrl && (
                        <button
                          onClick={() => window.open(post.platformUrl!, '_blank')}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Xem bài đăng"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      )}
                      
                      {(post.status === 'scheduled' || post.status === 'failed') && (
                        <button
                          onClick={() => triggerPostMutation.mutate(post.id)}
                          disabled={triggerPostMutation.isPending}
                          className="p-1.5 hover:bg-green-100 rounded transition-colors text-green-600"
                          title="Đăng ngay"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {post.status === 'draft' && (
                        <button
                          onClick={() => setEditingPost(post)}
                          className="p-1.5 hover:bg-blue-100 rounded transition-colors text-blue-600"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          if (confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
                            deletePostMutation.mutate(post.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors text-red-600"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <PostScheduleModal 
            onClose={() => setShowScheduleModal(false)}
            onScheduleComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
              setShowScheduleModal(false);
            }}
          />
        )}

        {/* Edit Modal */}
        {editingPost && (
          <PostScheduleModal 
            post={editingPost}
            onClose={() => setEditingPost(null)}
            onScheduleComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
              setEditingPost(null);
            }}
          />
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <BulkUpload
            accounts={socialAccounts}
            onClose={() => setShowBulkUpload(false)}
            onBulkUpload={handleBulkUpload}
          />
        )}

        {/* Smart Scheduler Modal */}
        {showSmartScheduler && (
          <SmartScheduler
            isOpen={showSmartScheduler}
            onClose={() => setShowSmartScheduler(false)}
          />
        )}

      </div>
    </div>
  );
}

// Placeholder schedule modal component - will be implemented separately
function PostScheduleModal({ post, onClose, onScheduleComplete }: {
  post?: ScheduledPost;
  onClose: () => void;
  onScheduleComplete: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-semibold mb-4">
          {post ? 'Chỉnh Sửa Bài Đăng' : 'Lên Lịch Bài Đăng Mới'}
        </h3>
        <p className="text-gray-600 mb-4">
          Modal lên lịch bài đăng sẽ được triển khai trong component riêng biệt
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}