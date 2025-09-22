import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Filter, Grid, List, Eye, Edit2, Trash2, Wand2,
  Tag, Calendar, MoreVertical, Copy, Sparkles, RefreshCw,
  FileText, Hash, ChevronDown, Settings, Star, Brain, CheckCircle2,
  HelpCircle, Link, Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FAQLibraryManagement } from '@/components/FAQLibraryManagement';
import { FAQAssignmentManagement } from '@/components/FAQAssignmentManagement';

interface ContentLibraryItem {
  id: string;
  title: string;
  baseContent: string;
  contentType: 'text' | 'image' | 'video' | 'mixed';
  platforms: string[];
  priority: 'high' | 'normal' | 'low';
  status: 'draft' | 'active' | 'archived';
  tagIds: string[] | null;
  usageCount: number | null;
  lastUsed: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  platforms: string[];
}

interface AIVariation {
  variation: string;
  tone: string;
  platform: string;
  hashtags: string[];
  length: 'short' | 'medium' | 'long';
}

interface ContentLibraryProps {}

export function ContentLibrary({}: ContentLibraryProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('content');
  
  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentLibraryItem | null>(null);
  
  // AI Generation states
  const [aiBaseContent, setAiBaseContent] = useState('');
  const [aiPlatforms, setAiPlatforms] = useState<string[]>(['facebook']);
  const [aiTones, setAiTones] = useState<string[]>(['professional']);
  const [aiVariationsPerPlatform, setAiVariationsPerPlatform] = useState(2);
  const [aiTargetAudience, setAiTargetAudience] = useState('general audience');
  const [aiVariations, setAiVariations] = useState<AIVariation[]>([]);
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Set<number>>(new Set());

  // Create/Edit form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPlatforms, setFormPlatforms] = useState<string[]>([]);
  const [formPriority, setFormPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [formStatus, setFormStatus] = useState<'draft' | 'active' | 'archived'>('active');
  const [formTags, setFormTags] = useState<string[]>([]);

  // Fetch content library items
  const { data: contentItems = [], isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['content-library-items', selectedPlatform, selectedPriority, selectedStatus, selectedTag],
    queryFn: async () => {
      let url = '/api/content/library';
      const params = new URLSearchParams();
      
      if (selectedPlatform !== 'all') params.append('platform', selectedPlatform);
      if (selectedPriority !== 'all') params.append('priority', selectedPriority);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedTag !== 'all') params.append('tag', selectedTag);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 401) {
          return []; // Return empty array for unauthorized access
        }
        throw new Error('Failed to fetch content library items');
      }
      return await response.json() as ContentLibraryItem[];
    },
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['unified-tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch tags');
      }
      return await response.json() as Tag[];
    },
  });

  // Create content item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      baseContent: string;
      platforms: string[];
      priority: string;
      status: string;
      tagIds: string[];
    }) => {
      const response = await fetch('/api/content/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          contentType: 'text'
        }),
      });
      if (!response.ok) throw new Error('Failed to create content item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library-items'] });
      resetForm();
      setShowCreateModal(false);
      toast({
        title: "✅ Thành công",
        description: "Content đã được tạo thành công!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi",
        description: "Không thể tạo content. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Update content item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      baseContent: string;
      platforms: string[];
      priority: string;
      status: string;
      tagIds: string[];
    }) => {
      const { id, ...updateData } = data;
      const response = await fetch(`/api/content/library/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update content item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library-items'] });
      resetForm();
      setEditingItem(null);
      setShowCreateModal(false);
      toast({
        title: "✅ Cập nhật thành công",
        description: "Content đã được cập nhật!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi",
        description: "Không thể cập nhật content. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Delete content item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content/library/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete content item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-library-items'] });
      setSelectedItems(new Set());
      toast({
        title: "✅ Đã xóa",
        description: "Content đã được xóa thành công!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi",
        description: "Không thể xóa content. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // AI Variations generation mutation
  const generateAIMutation = useMutation({
    mutationFn: async (data: {
      baseContent: string;
      platforms: string[];
      tones: string[];
      variationsPerPlatform: number;
      targetAudience: string;
      includeHashtags: boolean;
    }) => {
      const response = await fetch('/api/content/ai/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          contentType: 'promotional'
        }),
      });
      if (!response.ok) throw new Error('Failed to generate AI variations');
      return response.json();
    },
    onSuccess: (data) => {
      setAiVariations(data.variations || []);
      setShowAIPreview(true);
      toast({
        title: "🤖 AI Preview sẵn sàng",
        description: `Đã tạo ${data.variations?.length || 0} variations!`,
      });
    },
    onError: () => {
      toast({
        title: "❌ AI Generation lỗi",
        description: "Không thể tạo variations. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Save AI variations to library mutation
  const saveAIVariationsMutation = useMutation({
    mutationFn: async (selectedVariations: AIVariation[]) => {
      const response = await fetch('/api/content/library/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variations: selectedVariations.map(variation => ({
            title: `AI Content - ${variation.platform} (${variation.tone})`,
            baseContent: variation.variation,
            contentType: 'text',
            platforms: [variation.platform],
            priority: 'normal',
            status: 'active',
            tagIds: [],
            hashtags: variation.hashtags
          }))
        }),
      });
      if (!response.ok) throw new Error('Failed to save AI variations');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-library-items'] });
      setShowAIModal(false);
      setShowAIPreview(false);
      setAiBaseContent('');
      setAiVariations([]);
      setSelectedVariations(new Set());
      toast({
        title: "🎉 AI Content đã lưu!",
        description: `Đã lưu ${selectedVariations.size} variations vào library!`,
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi lưu AI content",
        description: "Không thể lưu variations. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Filter items based on search query
  const filteredItems = contentItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.baseContent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormPlatforms([]);
    setFormPriority('normal');
    setFormStatus('active');
    setFormTags([]);
  };

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.size} nội dung đã chọn?`)) {
      return;
    }

    for (const itemId of Array.from(selectedItems)) {
      await deleteItemMutation.mutateAsync(itemId);
    }
  };

  const handleEditItem = (item: ContentLibraryItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.baseContent);
    setFormPlatforms(item.platforms);
    setFormPriority(item.priority);
    setFormStatus(item.status);
    setFormTags(item.tagIds || []);
    setShowCreateModal(true);
  };

  const handleSubmitForm = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    const data = {
      title: formTitle,
      baseContent: formContent,
      platforms: formPlatforms,
      priority: formPriority,
      status: formStatus,
      tagIds: formTags,
    };

    if (editingItem) {
      await updateItemMutation.mutateAsync({ ...data, id: editingItem.id });
    } else {
      await createItemMutation.mutateAsync(data);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiBaseContent.trim()) return;

    await generateAIMutation.mutateAsync({
      baseContent: aiBaseContent,
      platforms: aiPlatforms,
      tones: aiTones,
      variationsPerPlatform: aiVariationsPerPlatform,
      targetAudience: aiTargetAudience,
      includeHashtags: true,
    });
  };

  const handleSaveAIVariations = async () => {
    if (selectedVariations.size === 0) {
      toast({
        title: "⚠️ Chưa chọn variations",
        description: "Vui lòng chọn ít nhất 1 variation để lưu.",
        variant: "destructive",
      });
      return;
    }

    const variationsToSave = Array.from(selectedVariations).map(index => aiVariations[index]);
    await saveAIVariationsMutation.mutateAsync(variationsToSave);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Chưa có';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const platforms = [
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'twitter', label: 'Twitter', icon: '🐦' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  ];

  const tones = [
    { value: 'professional', label: 'Chuyên nghiệp' },
    { value: 'casual', label: 'Thân thiện' },
    { value: 'engaging', label: 'Hấp dẫn' },
    { value: 'funny', label: 'Hài hước' },
    { value: 'urgent', label: 'Khẩn cấp' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📚 Content Management</h1>
            <p className="text-gray-600 mt-1">
              Quản lý nội dung thông minh, FAQ và assignments với AI automation
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa {selectedItems.size} mục
              </Button>
            )}
            
            <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Generator
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    AI Content Generator
                  </DialogTitle>
                  <DialogDescription>
                    Tạo nội dung tự động cho nhiều platform với AI
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-content">Nội dung gốc</Label>
                    <Textarea
                      id="ai-content"
                      placeholder="Nhập nội dung cần tạo variations..."
                      value={aiBaseContent}
                      onChange={(e) => setAiBaseContent(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Platforms</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {platforms.map((platform) => (
                          <label
                            key={platform.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={aiPlatforms.includes(platform.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAiPlatforms([...aiPlatforms, platform.value]);
                                } else {
                                  setAiPlatforms(aiPlatforms.filter(p => p !== platform.value));
                                }
                              }}
                            />
                            <span className="text-sm">
                              {platform.icon} {platform.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Tones</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tones.map((tone) => (
                          <label
                            key={tone.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={aiTones.includes(tone.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAiTones([...aiTones, tone.value]);
                                } else {
                                  setAiTones(aiTones.filter(t => t !== tone.value));
                                }
                              }}
                            />
                            <span className="text-sm">{tone.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="variations-count">Variations mỗi platform</Label>
                      <Input
                        id="variations-count"
                        type="number"
                        min="1"
                        max="5"
                        value={aiVariationsPerPlatform}
                        onChange={(e) => setAiVariationsPerPlatform(parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="target-audience">Đối tượng mục tiêu</Label>
                      <Input
                        id="target-audience"
                        placeholder="young adults, professionals..."
                        value={aiTargetAudience}
                        onChange={(e) => setAiTargetAudience(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Variations Preview */}
                {showAIPreview && aiVariations.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        🤖 AI Variations Preview ({aiVariations.length})
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          Đã chọn: {selectedVariations.size}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedVariations.size === aiVariations.length) {
                              setSelectedVariations(new Set());
                            } else {
                              setSelectedVariations(new Set(aiVariations.map((_, i) => i)));
                            }
                          }}
                        >
                          {selectedVariations.size === aiVariations.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {aiVariations.map((variation, index) => (
                        <div 
                          key={index} 
                          className={`bg-white p-4 rounded-lg border-2 transition-all ${
                            selectedVariations.has(index) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedVariations.has(index)}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(selectedVariations);
                                  if (checked) {
                                    newSelected.add(index);
                                  } else {
                                    newSelected.delete(index);
                                  }
                                  setSelectedVariations(newSelected);
                                }}
                              />
                              <Badge variant="outline" className="text-xs">
                                {platforms.find(p => p.value === variation.platform)?.icon}{' '}
                                {platforms.find(p => p.value === variation.platform)?.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {variation.tone}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {variation.length}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                            {variation.variation}
                          </p>
                          
                          {variation.hashtags && variation.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {variation.hashtags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAIModal(false);
                      setShowAIPreview(false);
                      setAiVariations([]);
                      setAiBaseContent('');
                    }}
                  >
                    Hủy
                  </Button>
                  
                  {!showAIPreview ? (
                    <Button
                      onClick={handleGenerateAI}
                      disabled={!aiBaseContent.trim() || generateAIMutation.isPending}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      {generateAIMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      Tạo Preview
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAIPreview(false);
                          setAiVariations([]);
                          setSelectedVariations(new Set());
                        }}
                        className="mr-2"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tạo lại
                      </Button>
                      <Button
                        onClick={handleSaveAIVariations}
                        disabled={saveAIVariationsMutation.isPending || selectedVariations.size === 0}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        {saveAIVariationsMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Lưu {selectedVariations.size} variations
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showCreateModal} onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) {
                setEditingItem(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Tạo Content
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Chỉnh sửa Content' : 'Tạo Content Mới'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Cập nhật thông tin content' : 'Thêm content mới vào thư viện'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tiêu đề</Label>
                    <Input
                      id="title"
                      placeholder="Tiêu đề content..."
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Nội dung</Label>
                    <Textarea
                      id="content"
                      placeholder="Nội dung chi tiết..."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Platforms</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {platforms.map((platform) => (
                          <label
                            key={platform.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={formPlatforms.includes(platform.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormPlatforms([...formPlatforms, platform.value]);
                                } else {
                                  setFormPlatforms(formPlatforms.filter(p => p !== platform.value));
                                }
                              }}
                            />
                            <span className="text-sm">
                              {platform.icon} {platform.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Độ ưu tiên</Label>
                        <Select value={formPriority} onValueChange={(value: 'high' | 'normal' | 'low') => setFormPriority(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">⭐ Cao</SelectItem>
                            <SelectItem value="normal">📝 Bình thường</SelectItem>
                            <SelectItem value="low">📋 Thấp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Trạng thái</Label>
                        <Select value={formStatus} onValueChange={(value: 'draft' | 'active' | 'archived') => setFormStatus(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">✅ Hoạt động</SelectItem>
                            <SelectItem value="draft">📝 Nháp</SelectItem>
                            <SelectItem value="archived">📦 Lưu trữ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingItem(null);
                      resetForm();
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSubmitForm}
                    disabled={!formTitle.trim() || !formContent.trim() || createItemMutation.isPending || updateItemMutation.isPending}
                  >
                    {(createItemMutation.isPending || updateItemMutation.isPending) ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {editingItem ? 'Cập nhật' : 'Tạo Content'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Social Content
            </TabsTrigger>
            <TabsTrigger value="faq-library" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ Library
            </TabsTrigger>
            <TabsTrigger value="faq-assignments" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              FAQ Assignments
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-6">

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.icon} {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="high">⭐ Cao</SelectItem>
                  <SelectItem value="normal">📝 Bình thường</SelectItem>
                  <SelectItem value="low">📋 Thấp</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">✅ Hoạt động</SelectItem>
                  <SelectItem value="draft">📝 Nháp</SelectItem>
                  <SelectItem value="archived">📦 Lưu trữ</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="p-2"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="p-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng Content</p>
                <p className="text-2xl font-bold text-gray-900">{filteredItems.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ưu tiên cao</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredItems.filter(item => item.priority === 'high').length}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredItems.filter(item => item.status === 'active').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã chọn</p>
                <p className="text-2xl font-bold text-gray-900">{selectedItems.size}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Tag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid/List */}
        {itemsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-20 bg-gray-200 rounded mb-3"></div>
                <div className="flex gap-2 mb-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có content nào
            </h3>
            <p className="text-gray-600 mb-4">
              Bắt đầu bằng cách tạo content đầu tiên hoặc sử dụng AI Generator
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Tạo Content
              </Button>
              <Button
                onClick={() => setShowAIModal(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Generator
              </Button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedItems.has(item.id) 
                    ? 'border-blue-500 shadow-md' 
                    : 'border-gray-200'
                }`}
                onClick={() => handleItemSelect(item.id)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority === 'high' ? '⭐ Cao' : 
                           item.priority === 'normal' ? '📝 Bình thường' : '📋 Thấp'}
                        </Badge>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status === 'active' ? '✅ Hoạt động' : 
                           item.status === 'draft' ? '📝 Nháp' : '📦 Lưu trữ'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Action menu */}
                    <div className="relative group">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-40">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditItem(item);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(item.baseContent);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Sao chép nội dung
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Bạn có chắc chắn muốn xóa content này?')) {
                              deleteItemMutation.mutate(item.id);
                            }
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content preview */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {item.baseContent}
                  </p>

                  {/* Platforms */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.platforms.map((platform) => {
                      const platformData = platforms.find(p => p.value === platform);
                      return (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platformData?.icon} {platformData?.label}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {item.usageCount ? `Đã sử dụng ${item.usageCount} lần` : 'Chưa sử dụng'}
                    </span>
                    <span>{formatDate(item.updatedAt)}</span>
                  </div>

                  {/* Selection overlay */}
                  {selectedItems.has(item.id) && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(new Set(filteredItems.map(item => item.id)));
                          } else {
                            setSelectedItems(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tiêu đề</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Platforms</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ưu tiên</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sử dụng</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Cập nhật</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => handleItemSelect(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{item.title}</p>
                          <p className="text-sm text-gray-600 truncate">{item.baseContent}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {item.platforms.map((platform) => {
                            const platformData = platforms.find(p => p.value === platform);
                            return (
                              <Badge key={platform} variant="outline" className="text-xs">
                                {platformData?.icon}
                              </Badge>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority === 'high' ? 'Cao' : 
                           item.priority === 'normal' ? 'Bình thường' : 'Thấp'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status === 'active' ? 'Hoạt động' : 
                           item.status === 'draft' ? 'Nháp' : 'Lưu trữ'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.usageCount || 0} lần
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(item.baseContent)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa content này?')) {
                                deleteItemMutation.mutate(item.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </TabsContent>

          {/* FAQ Library Tab */}
          <TabsContent value="faq-library" className="mt-6">
            <FAQLibraryManagement />
          </TabsContent>

          {/* FAQ Assignments Tab */}
          <TabsContent value="faq-assignments" className="mt-6">
            <FAQAssignmentManagement />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}