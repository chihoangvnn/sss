import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Pause, Play, Trash2, Edit, RefreshCw, Zap, Clock, 
  Circle, AlertTriangle, CheckCircle, Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ScheduledPost, SocialAccount } from '../../../shared/schema';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ScheduledPostsMiniManagerProps {
  className?: string;
}

export function ScheduledPostsMiniManager({ className }: ScheduledPostsMiniManagerProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scheduled posts with real-time updates
  const { data: scheduledPosts = [], isLoading } = useQuery({
    queryKey: ['scheduled-posts-mini'],
    queryFn: async () => {
      const response = await fetch('/api/content/scheduled-posts');
      if (!response.ok) throw new Error('Failed to fetch scheduled posts');
      const data = await response.json();
      // Only show upcoming posts (next 24 hours)
      const upcoming = data.filter((post: ScheduledPost) => {
        const postTime = new Date(post.scheduledTime);
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return postTime >= now && postTime <= in24Hours && (post.status === 'scheduled' || post.status === 'cancelled');
      });
      return upcoming.slice(0, 5); // Max 5 posts
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Emergency pause mutation
  const pausePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/content/scheduled-posts/${postId}/pause`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to pause post');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts-mini'] });
      toast({ title: "⏸️ Tạm dừng thành công", description: "Bài đăng đã được tạm dừng" });
    },
  });

  // Post now mutation
  const postNowMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/content/scheduled-posts/${postId}/post-now`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to post immediately');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts-mini'] });
      toast({ title: "⚡ Đăng ngay thành công", description: "Bài đăng đã được đăng ngay lập tức" });
    },
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
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts-mini'] });
      toast({ title: "🗑️ Xóa thành công", description: "Bài đăng đã được xóa" });
    },
  });

  // Get status color and icon
  const getStatusDisplay = (status: string, scheduledTime: string) => {
    const timeLeft = new Date(scheduledTime).getTime() - new Date().getTime();
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeDisplay = '';
    let statusColor = '';
    let StatusIcon = Circle;

    if (days > 0) {
      timeDisplay = `${days}d`;
    } else if (hours > 0) {
      timeDisplay = `${hours}h`;
    } else if (minutes > 0) {
      timeDisplay = `${minutes}m`;
    } else {
      timeDisplay = 'Now';
    }

    switch (status) {
      case 'scheduled':
        statusColor = 'text-yellow-500';
        StatusIcon = Clock;
        break;
      case 'posting':
        statusColor = 'text-blue-500';
        StatusIcon = Loader2;
        break;
      case 'posted':
        statusColor = 'text-green-500';
        StatusIcon = CheckCircle;
        break;
      case 'failed':
        statusColor = 'text-red-500';
        StatusIcon = AlertTriangle;
        break;
      case 'cancelled':
        statusColor = 'text-gray-500';
        StatusIcon = Pause;
        break;
      default:
        statusColor = 'text-gray-400';
    }

    return { timeDisplay, statusColor, StatusIcon };
  };

  // Handle quick actions
  const handleQuickAction = async (action: string, postId: string, postTitle: string) => {
    switch (action) {
      case 'pause':
        if (confirm(`Tạm dừng bài đăng: "${postTitle.substring(0, 30)}..."?`)) {
          pausePostMutation.mutate(postId);
        }
        break;
      case 'delete':
        if (confirm(`Xóa bài đăng: "${postTitle.substring(0, 30)}..."?`)) {
          deletePostMutation.mutate(postId);
        }
        break;
      case 'post-now':
        if (confirm(`Đăng ngay bài: "${postTitle.substring(0, 30)}..."?`)) {
          postNowMutation.mutate(postId);
        }
        break;
      case 'edit':
        // Navigate to edit page
        window.open(`/post-scheduler?edit=${postId}`, '_blank');
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="p-3">
        <div className="text-sm font-medium mb-2">📅 Lịch đăng sắp tới</div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (scheduledPosts.length === 0) {
    return (
      <div className="p-3">
        <div className="text-sm font-medium mb-2">📅 Lịch đăng sắp tới</div>
        <div className="text-xs text-gray-500 text-center py-4">
          Không có bài đăng nào trong 24h tới
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">📅 Lịch đăng sắp tới</div>
        <Badge variant="secondary" className="text-xs">
          {scheduledPosts.length}
        </Badge>
      </div>
      
      <ScrollArea className="h-64">
        <div className="space-y-1">
          {scheduledPosts.map((post) => {
            const { timeDisplay, statusColor, StatusIcon } = getStatusDisplay(post.status, post.scheduledTime);
            const timeFormatted = format(new Date(post.scheduledTime), 'HH:mm', { locale: vi });
            const isToday = format(new Date(post.scheduledTime), 'dd/MM') === format(new Date(), 'dd/MM');
            
            return (
              <div 
                key={post.id}
                className="flex items-center gap-2 p-2 rounded-lg border bg-white hover:bg-gray-50 group text-xs"
              >
                {/* Status & Time */}
                <div className="flex flex-col items-center min-w-[40px]">
                  <StatusIcon className={`w-3 h-3 ${statusColor} ${post.status === 'posting' ? 'animate-spin' : ''}`} />
                  <div className="text-[10px] font-mono text-gray-600">
                    {isToday ? timeFormatted : format(new Date(post.scheduledTime), 'dd/MM')}
                  </div>
                </div>

                {/* Content Preview */}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-gray-900">
                    {post.caption.length > 20 ? `${post.caption.substring(0, 20)}...` : post.caption}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {post.platform === 'facebook' && <span className="text-blue-600">📘</span>}
                    <span className="text-[10px] text-gray-500 truncate">
                      @{post.socialAccountId.substring(0, 8)}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      ⏰ {timeDisplay}
                    </Badge>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(post.status === 'scheduled' || post.status === 'cancelled') && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleQuickAction('pause', post.id, post.caption)}
                        disabled={pausePostMutation.isPending}
                      >
                        <Pause className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => handleQuickAction('post-now', post.id, post.caption)}
                        disabled={postNowMutation.isPending}
                      >
                        <Zap className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleQuickAction('edit', post.id, post.caption)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-500"
                    onClick={() => handleQuickAction('delete', post.id, post.caption)}
                    disabled={deletePostMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* View All Link */}
      <div className="mt-2 pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-blue-600 hover:text-blue-800"
          onClick={() => window.open('/post-scheduler', '_blank')}
        >
          📋 Xem tất cả lịch đăng
        </Button>
      </div>
    </div>
  );
}