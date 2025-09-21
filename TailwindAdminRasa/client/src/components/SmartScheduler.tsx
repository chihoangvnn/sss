import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Brain, Calendar, Tag, Users, Image, Video, FileText, 
  Settings, Clock, Zap, ChevronRight, ChevronDown, Eye,
  Play, Shuffle, Target, BarChart3, AlertCircle, CheckCircle,
  X, Plus, Minus, Sparkles, TrendingUp, Filter, Grid3X3, Loader2
} from 'lucide-react';
import { SocialAccount, UnifiedTag, ContentLibrary, FanpageContentPreferences, SmartSchedulingRules } from '../../../shared/schema';

interface SmartSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SmartSchedulingConfig {
  selectedTags: string[];
  selectedFanpages: string[];
  contentTypes: ('image' | 'video' | 'text')[];
  includingText: boolean;
  schedulingPeriod: {
    startDate: string;
    endDate: string;
    timeSlots: string[];
  };
  distributionMode: 'even' | 'weighted' | 'smart';
  postsPerDay: number;
  preview: boolean;
}

interface ContentMatch {
  contentId: string;
  fanpageId: string;
  score: number;
  reasons: string[];
  scheduledTime: string;
}

export function SmartScheduler({ isOpen, onClose }: SmartSchedulerProps) {
  const queryClient = useQueryClient();
  
  // State Management
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFanpages, setSelectedFanpages] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<('image' | 'video' | 'text')[]>(['image', 'video']);
  const [includingText, setIncludingText] = useState(true);
  // Helper function to format local date as YYYY-MM-DD
  const formatLocalYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Get default dates: today and +10 days (in local timezone)
  const getDefaultDates = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid DST issues
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 10);
    
    return {
      startDate: formatLocalYYYYMMDD(today),
      endDate: formatLocalYYYYMMDD(endDate)
    };
  };

  // Initialize with lazy evaluation to avoid recomputing on every render
  const [startDate, setStartDate] = useState(() => getDefaultDates().startDate);
  const [endDate, setEndDate] = useState(() => getDefaultDates().endDate);
  const [postsPerDay, setPostsPerDay] = useState(3);

  // Reset dates to "today" and "today+10" when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultDates = getDefaultDates();
      setStartDate(defaultDates.startDate);
      setEndDate(defaultDates.endDate);
    }
  }, [isOpen]);
  const [distributionMode, setDistributionMode] = useState<'even' | 'weighted' | 'smart'>('smart');
  const [currentStep, setCurrentStep] = useState(1);
  const [previewData, setPreviewData] = useState<ContentMatch[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [expandedFanpage, setExpandedFanpage] = useState<string | null>(null);
  
  // Simple Automation States
  const [automationMode, setAutomationMode] = useState<'smart' | 'simple'>('smart');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('facebook');
  const [numberOfPosts, setNumberOfPosts] = useState<number>(10);
  const [numberOfPages, setNumberOfPages] = useState<number>(3);
  
  // Initialize content types based on default platform (Facebook defaults to all types)
  const [simpleContentTypes, setSimpleContentTypes] = useState<('image' | 'video' | 'text')[]>(['image', 'video', 'text']);
  const [selectedSimpleTags, setSelectedSimpleTags] = useState<string[]>([]);
  const [simplePreviewData, setSimplePreviewData] = useState<any>(null);
  const [isGeneratingSimplePreview, setIsGeneratingSimplePreview] = useState(false);

  // API Queries
  const { data: socialAccounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/social-accounts');
      if (!response.ok) throw new Error('Failed to fetch social accounts');
      return response.json();
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['unified-tags'],
    queryFn: async () => {
      const response = await fetch('/api/content/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
  });

  const { data: contentLibrary = [] } = useQuery({
    queryKey: ['content-library'],
    queryFn: async () => {
      const response = await fetch('/api/content/library');
      if (!response.ok) throw new Error('Failed to fetch content library');
      return response.json();
    },
  });

  // Generate Preview Mutation
  const generatePreviewMutation = useMutation({
    mutationFn: async (config: Partial<SmartSchedulingConfig>) => {
      const response = await fetch('/api/content/smart-scheduler/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to generate preview');
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setIsGeneratingPreview(false);
    },
    onError: () => {
      setIsGeneratingPreview(false);
    },
  });

  // Schedule Posts Mutation
  const schedulePostsMutation = useMutation({
    mutationFn: async (config: SmartSchedulingConfig) => {
      const response = await fetch('/api/content/smart-scheduler/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to schedule posts');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      onClose();
    },
  });

  // Simple Automation Preview Mutation
  const simplePreviewMutation = useMutation({
    mutationFn: async (config: {
      platform: string;
      numberOfPosts: number;
      numberOfPages: number;
      startDate: string;
      endDate: string;
      contentTypes?: ('image' | 'video' | 'text')[];
      selectedTags?: string[];
    }) => {
      const response = await fetch('/api/automation/simple/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to generate preview');
      return response.json();
    },
    onSuccess: (data) => {
      setSimplePreviewData(data);
      setIsGeneratingSimplePreview(false);
    },
    onError: () => {
      setIsGeneratingSimplePreview(false);
    },
  });

  // Simple Automation Mutation
  const simpleAutomationMutation = useMutation({
    mutationFn: async (config: {
      platform: string;
      numberOfPosts: number;
      numberOfPages: number;
      startDate: string;
      endDate: string;
      contentTypes?: ('image' | 'video' | 'text')[];
      selectedTags?: string[];
    }) => {
      const response = await fetch('/api/automation/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to create automation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      onClose();
    },
  });

  // Helper Functions
  const getTagsByCategory = () => {
    const categories: Record<string, UnifiedTag[]> = {};
    (tags as UnifiedTag[]).forEach((tag: UnifiedTag) => {
      const category = tag.category || 'Other';
      if (!categories[category]) categories[category] = [];
      categories[category].push(tag);
    });
    return categories;
  };

  // Get platform-smart content type defaults
  const getPlatformContentTypeDefaults = (platform: string): ('image' | 'video' | 'text')[] => {
    switch (platform) {
      case 'facebook':
        return ['image', 'video', 'text']; // Facebook supports all types
      case 'instagram':
        return ['image', 'video']; // Instagram prefers visual content
      case 'tiktok-business':
      case 'tiktok-shop':
        return ['video']; // TikTok is video-first
      case 'all':
        return ['image', 'video', 'text']; // Default to all types
      default:
        return ['image', 'video'];
    }
  };

  // Auto-update content types when platform changes
  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    setSimpleContentTypes(getPlatformContentTypeDefaults(platform));
  };

  const getMatchingContent = () => {
    return (contentLibrary as ContentLibrary[]).filter((content: ContentLibrary) => {
      const hasMatchingTags = selectedTags.some(tagId => 
        content.tagIds?.includes(tagId)
      );
      const matchesContentType = contentTypes.includes(content.contentType as any);
      return hasMatchingTags && matchesContentType;
    });
  };

  const getFanpageStats = (fanpageId: string) => {
    const fanpage = (socialAccounts as SocialAccount[]).find((acc: SocialAccount) => acc.id === fanpageId);
    if (!fanpage) return { name: '', preferredTags: [], score: 0 };
    
    const preferences = fanpage.contentPreferences as FanpageContentPreferences | null;
    const matchingTags = selectedTags.filter(tagId => 
      preferences?.preferredTags.includes(tagId)
    );
    const score = matchingTags.length / Math.max(selectedTags.length, 1) * 100;
    
    return {
      name: fanpage.name,
      preferredTags: preferences?.preferredTags || [],
      excludedTags: preferences?.excludedTags || [],
      score: Math.round(score),
    };
  };

  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    const config = {
      selectedTags,
      selectedFanpages,
      contentTypes,
      includingText,
      schedulingPeriod: {
        startDate,
        endDate,
        timeSlots: ['09:00', '14:00', '21:00'], // Default time slots
      },
      distributionMode,
      postsPerDay,
    };
    generatePreviewMutation.mutate(config);
  };

  const handleSchedule = async () => {
    const config: SmartSchedulingConfig = {
      selectedTags,
      selectedFanpages,
      contentTypes,
      includingText,
      schedulingPeriod: {
        startDate,
        endDate,
        timeSlots: ['09:00', '14:00', '21:00'],
      },
      distributionMode,
      postsPerDay,
      preview: false,
    };
    
    // Use the mutation directly to avoid double-submit
    schedulePostsMutation.mutate(config);
  };

  if (!isOpen) return null;

  const matchingContent = getMatchingContent();
  const tagCategories = getTagsByCategory();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Smart Scheduler</h2>
              <p className="text-sm text-gray-600">AI-powered bulk content distribution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="flex items-center justify-center p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutomationMode('smart')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                automationMode === 'smart'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              Smart Mode (Advanced)
            </button>
            <button
              onClick={() => setAutomationMode('simple')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                automationMode === 'simple'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Simple Mode (Auto)
            </button>
          </div>
        </div>
        
        {/* Progress Steps for Smart Mode */}
        {automationMode === 'smart' && (
          <div className="flex items-center justify-center p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-4">
              {[
                { step: 1, label: 'Tags & Content', icon: Tag },
                { step: 2, label: 'Fanpage Selection', icon: Users },
                { step: 3, label: 'Schedule Setup', icon: Calendar },
                { step: 4, label: 'Preview & Confirm', icon: Eye },
              ].map(({ step, label, icon: Icon }) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  {step < 4 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Simple Mode Interface */}
          {automationMode === 'simple' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Tự Động Lên Lịch Đăng Bài
                </h3>
                <p className="text-green-700 text-sm">
                  Hệ thống sẽ tự động chọn content từ thư viện dựa trên tag matching và respect group limits
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Platform Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Chọn Nền Tảng
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => handlePlatformChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok-business">TikTok Business</option>
                    <option value="tiktok-shop">TikTok Shop</option>
                    <option value="all">Tất Cả Platforms</option>
                  </select>
                </div>

                {/* Number of Posts */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Số Bài Cần Đăng
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={numberOfPosts}
                    onChange={(e) => setNumberOfPosts(parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ví dụ: 10"
                  />
                </div>

                {/* Number of Pages */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Số Page Cần Đăng
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numberOfPages}
                    onChange={(e) => setNumberOfPages(parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Ví dụ: 3"
                  />
                </div>
              </div>

              {/* Content Type Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Loại Nội Dung
                  <span className="text-xs text-gray-500 ml-1">(Tự động chọn theo platform)</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { type: 'text' as const, label: 'Text', icon: FileText, color: 'orange' },
                    { type: 'image' as const, label: 'Hình Ảnh', icon: Image, color: 'green' },
                    { type: 'video' as const, label: 'Video', icon: Video, color: 'purple' },
                  ].map(({ type, label, icon: Icon, color }) => (
                    <label 
                      key={type} 
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={simpleContentTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSimpleContentTypes(prev => [...prev, type]);
                          } else {
                            setSimpleContentTypes(prev => prev.filter(t => t !== type));
                          }
                        }}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                      <span className="font-medium text-sm">{label}</span>
                    </label>
                  ))}
                </div>
                
                {/* Platform-specific hints */}
                <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                  {selectedPlatform === 'facebook' && (
                    <span>💡 Facebook: Tất cả loại content đều hiệu quả</span>
                  )}
                  {selectedPlatform === 'instagram' && (
                    <span>💡 Instagram: Hình ảnh và video sẽ có engagement cao hơn</span>
                  )}
                  {(selectedPlatform === 'tiktok-business' || selectedPlatform === 'tiktok-shop') && (
                    <span>💡 TikTok: Video content sẽ có hiệu quả tốt nhất</span>
                  )}
                  {selectedPlatform === 'all' && (
                    <span>💡 Tất cả platforms: Hệ thống sẽ tự động chọn content phù hợp cho từng platform</span>
                  )}
                </div>
              </div>

              {/* Tag Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Chọn Tags Nội Dung
                  <span className="text-xs text-gray-500">(Chọn tags để lọc content)</span>
                </label>
                <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {tags.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      Chưa có tags nào. Vui lòng tạo tags trong Tag Management.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {tags
                        .filter((tag: UnifiedTag) => tag.isActive)
                        .map((tag: UnifiedTag) => (
                          <label 
                            key={tag.id} 
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSimpleTags.includes(tag.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSimpleTags(prev => [...prev, tag.id]);
                                } else {
                                  setSelectedSimpleTags(prev => prev.filter(id => id !== tag.id));
                                }
                              }}
                              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {tag.name}
                            </span>
                            {tag.platforms && tag.platforms.length > 0 && (
                              <span className="text-xs text-gray-500 ml-auto">
                                {tag.platforms.join(', ')}
                              </span>
                            )}
                          </label>
                        ))}
                    </div>
                  )}
                </div>
                
                {selectedSimpleTags.length > 0 && (
                  <div className="text-xs text-green-600 bg-green-50 rounded-lg p-2">
                    💡 Đã chọn {selectedSimpleTags.length} tags. Content sẽ được lọc theo những tags này.
                  </div>
                )}
              </div>

              {/* Time Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Từ Ngày
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Đến Ngày
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    simpleAutomationMutation.mutate({
                      platform: selectedPlatform,
                      numberOfPosts: numberOfPosts,
                      numberOfPages: numberOfPages,
                      startDate,
                      endDate,
                      contentTypes: simpleContentTypes,
                      selectedTags: selectedSimpleTags
                    });
                  }}
                  disabled={simpleAutomationMutation.isPending}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {simpleAutomationMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  {simpleAutomationMutation.isPending ? 'Đang Tạo...' : 'Tạo Lịch Tự Động'}
                </button>
                <button
                  onClick={() => {
                    setIsGeneratingSimplePreview(true);
                    simplePreviewMutation.mutate({
                      platform: selectedPlatform,
                      numberOfPosts: numberOfPosts,
                      numberOfPages: numberOfPages,
                      startDate,
                      endDate,
                      contentTypes: simpleContentTypes,
                      selectedTags: selectedSimpleTags
                    });
                  }}
                  disabled={isGeneratingSimplePreview}
                  className="px-6 py-3 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingSimplePreview ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                  {isGeneratingSimplePreview ? 'Đang Tạo Preview...' : 'Preview'}
                </button>
              </div>

              {/* Preview Results */}
              {simplePreviewData && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview Kết Quả
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="font-medium text-gray-700 mb-1">Accounts</div>
                      <div className="text-lg font-bold text-blue-600">
                        {simplePreviewData.preview?.accounts?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        {simplePreviewData.preview?.accounts?.map((acc: any) => acc.name).join(', ')}
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg">
                      <div className="font-medium text-gray-700 mb-1">Content Available</div>
                      <div className="text-lg font-bold text-green-600">
                        {simplePreviewData.preview?.contentAvailable || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        Content phù hợp với {simpleContentTypes.join(', ')}
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg">
                      <div className="font-medium text-gray-700 mb-1">Distribution</div>
                      <div className="text-lg font-bold text-purple-600">
                        {simplePreviewData.preview?.distribution?.postsPerDay || 0} bài/ngày
                      </div>
                      <div className="text-xs text-gray-500">
                        {simplePreviewData.preview?.distribution?.postsPerAccount || 0} bài/account
                      </div>
                    </div>
                  </div>

                  {/* Content Type Indicators */}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="font-medium text-gray-700 mb-2">Content Types Selected:</div>
                    <div className="flex flex-wrap gap-2">
                      {simpleContentTypes.map(type => (
                        <span 
                          key={type}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            type === 'text' ? 'bg-orange-100 text-orange-700' :
                            type === 'image' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {type === 'text' ? '📝 Text' : 
                           type === 'image' ? '🖼️ Images' : '🎥 Videos'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Smart Mode - Step 1: Tags & Content Selection */}
          {automationMode === 'smart' && currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Chọn Tags & Chủ Đề
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tag Categories */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Tag Categories</h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {Object.entries(tagCategories).map(([category, categoryTags]) => (
                        <div key={category} className="border border-gray-200 rounded-lg p-3">
                          <h5 className="font-medium text-sm text-gray-800 mb-2">{category}</h5>
                          <div className="flex flex-wrap gap-2">
                            {categoryTags.map(tag => (
                              <button
                                key={tag.id}
                                onClick={() => {
                                  setSelectedTags(prev => 
                                    prev.includes(tag.id) 
                                      ? prev.filter(id => id !== tag.id)
                                      : [...prev, tag.id]
                                  );
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  selectedTags.includes(tag.id)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                style={{ backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined }}
                              >
                                #{tag.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content Type Selection */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Content Types</h4>
                    <div className="space-y-3">
                      {[
                        { type: 'image' as const, label: 'Images', icon: Image, color: 'green' },
                        { type: 'video' as const, label: 'Videos', icon: Video, color: 'purple' },
                        { type: 'text' as const, label: 'Text Only', icon: FileText, color: 'orange' },
                      ].map(({ type, label, icon: Icon, color }) => (
                        <label key={type} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contentTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setContentTypes(prev => [...prev, type]);
                              } else {
                                setContentTypes(prev => prev.filter((t: any) => t !== type));
                              }
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <Icon className={`w-5 h-5 text-${color}-600`} />
                          <span className="font-medium">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4">
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includingText}
                          onChange={(e) => setIncludingText(e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="font-medium">Include text descriptions</span>
                      </label>
                    </div>

                    {/* Content Preview Stats */}
                    <div className="bg-blue-50 rounded-lg p-4 mt-4">
                      <h5 className="font-medium text-blue-900 mb-2">Content Library Stats</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Matching Content:</span>
                          <span className="font-bold ml-2">{matchingContent.length}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Total Available:</span>
                          <span className="font-bold ml-2">{contentLibrary.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fanpage Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Phân Phối Fanpage
                </h3>

                {/* Auto-Selection Notice */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-green-800 font-medium mb-1">🎯 Tự Động Chọn Fanpage</h4>
                      <p className="text-green-700 text-sm">
                        <strong>Tùy chọn:</strong> Bạn có thể {selectedFanpages.length > 0 ? 'tiếp tục với fanpages đã chọn' : 'bỏ qua bước này'}. 
                        {selectedFanpages.length === 0 && ' Hệ thống sẽ tự động chọn fanpages phù hợp dựa trên Facebook Apps có cùng tags với content.'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {(socialAccounts as SocialAccount[]).map((account: SocialAccount) => {
                    const stats = getFanpageStats(account.id);
                    const isSelected = selectedFanpages.includes(account.id);
                    
                    return (
                      <div
                        key={account.id}
                        className={`border rounded-lg p-4 transition-all cursor-pointer ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedFanpages(prev =>
                            prev.includes(account.id)
                              ? prev.filter(id => id !== account.id)
                              : [...prev, account.id]
                          );
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-blue-600"
                            />
                            <div>
                              <h4 className="font-medium">{stats.name}</h4>
                              <p className="text-sm text-gray-600">{account.platform}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              stats.score >= 80 ? 'text-green-600' :
                              stats.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {stats.score}%
                            </div>
                            <p className="text-xs text-gray-500">Match Score</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Preferred Tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {stats.preferredTags.slice(0, 3).map(tagId => {
                                const tag = (tags as UnifiedTag[]).find((t: UnifiedTag) => t.id === tagId);
                                return tag ? (
                                  <span key={tagId} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                    #{tag.name}
                                  </span>
                                ) : null;
                              })}
                              {stats.preferredTags.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{stats.preferredTags.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule Setup */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Cấu Hình Lịch Đăng
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Date Range */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Schedule Period</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Distribution Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Distribution Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Posts per Day</label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPostsPerDay(Math.max(1, postsPerDay - 1))}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-16 text-center font-bold text-lg">{postsPerDay}</span>
                          <button
                            onClick={() => setPostsPerDay(Math.min(20, postsPerDay + 1))}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Distribution Mode</label>
                        <div className="space-y-2">
                          {[
                            { value: 'even', label: 'Even Distribution', desc: 'Equal posts across all fanpages' },
                            { value: 'weighted', label: 'Weighted Distribution', desc: 'Based on follower count & engagement' },
                            { value: 'smart', label: 'Smart AI Distribution', desc: 'AI-optimized based on content-fanpage matching' },
                          ].map(({ value, label, desc }) => (
                            <label key={value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="radio"
                                name="distributionMode"
                                value={value}
                                checked={distributionMode === value}
                                onChange={(e) => setDistributionMode(e.target.value as any)}
                                className="w-4 h-4 text-blue-600 mt-1"
                              />
                              <div>
                                <div className="font-medium">{label}</div>
                                <div className="text-sm text-gray-600">{desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview & Confirm */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Preview & Confirm
                </h3>
                
                <div className="space-y-4">
                  {/* Generate Preview Button */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={generatePreview}
                      disabled={isGeneratingPreview}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isGeneratingPreview ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Smart Preview
                        </>
                      )}
                    </button>
                    
                    {previewData.length > 0 && (
                      <div className="text-sm text-gray-600">
                        {previewData.length} posts scheduled across {selectedFanpages.length} fanpages
                      </div>
                    )}
                  </div>

                  {/* Preview Results */}
                  {previewData.length > 0 && (
                    <div className="border border-gray-200 rounded-lg">
                      <div className="p-4 bg-gray-50 border-b">
                        <h4 className="font-medium">Scheduling Preview</h4>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {previewData.map((match, index) => {
                          const fanpage = (socialAccounts as SocialAccount[]).find((acc: SocialAccount) => acc.id === match.fanpageId);
                          const content = (contentLibrary as ContentLibrary[]).find((c: ContentLibrary) => c.id === match.contentId);
                          
                          return (
                            <div key={index} className="p-4 border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <div>
                                    <div className="font-medium">{content?.title}</div>
                                    <div className="text-sm text-gray-600">{fanpage?.name}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{new Date(match.scheduledTime).toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-500">{new Date(match.scheduledTime).toLocaleTimeString()}</div>
                                </div>
                              </div>
                              {match.reasons.length > 0 && (
                                <div className="mt-2 text-xs text-blue-600">
                                  Reasons: {match.reasons.join(', ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && (selectedTags.length === 0 || contentTypes.length === 0)) ||
                  (currentStep === 3 && (!startDate || !endDate))
                }
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSchedule}
                disabled={previewData.length === 0 || schedulePostsMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {schedulePostsMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Schedule All Posts
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}