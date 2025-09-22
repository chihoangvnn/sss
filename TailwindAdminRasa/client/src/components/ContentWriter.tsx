import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, Save, Eye, Wand2, Hash, Globe, Users, Clock,
  Send, Trash2, Edit, Plus, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DOMPurify from 'dompurify';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/RichTextEditor';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  platforms: string[];
}

interface ContentWriterProps {}

export function ContentWriter({}: ContentWriterProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('blog');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['web']);
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [activeTab, setActiveTab] = useState('write');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // AI Generation states
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiContentType, setAiContentType] = useState('blog');
  const [aiTargetLength, setAiTargetLength] = useState('medium');
  const [aiTargetAudience, setAiTargetAudience] = useState('general');
  const [aiSelectedPlatforms, setAiSelectedPlatforms] = useState<string[]>(['facebook']);
  const [aiSeoKeywords, setAiSeoKeywords] = useState('');
  const [aiGenerationMode, setAiGenerationMode] = useState('full-article');
  const [aiGeneratedVariations, setAiGeneratedVariations] = useState<any[]>([]);
  const [showVariationSelector, setShowVariationSelector] = useState(false);

  // Fetch available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['content-tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags?category=content');
      if (!response.ok) return [];
      return await response.json() as Tag[];
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/content/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          baseContent: content,
          contentType: 'text',
          platforms,
          priority,
          status: 'draft',
          tagIds: selectedTagIds,
          metadata: {
            category,
            wordCount: wordCount,
            articleType: aiContentType
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to save draft');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Lưu bản nháp thành công",
        description: "Bài viết đã được lưu vào thư viện",
      });
      queryClient.invalidateQueries({ queryKey: ['content-library-items'] });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi lưu bản nháp",
        description: "Không thể lưu bài viết. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/content/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          baseContent: content,
          contentType: 'text',
          platforms,
          priority,
          status: 'active',
          tagIds: selectedTagIds,
          metadata: {
            category,
            wordCount: wordCount,
            articleType: aiContentType,
            publishedAt: new Date().toISOString()
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to publish');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "🚀 Xuất bản thành công!",
        description: "Bài viết đã được xuất bản và có thể dùng cho các hệ thống khác",
      });
      queryClient.invalidateQueries({ queryKey: ['content-library-items'] });
      // Reset form
      setTitle('');
      setContent('');
      setSelectedTagIds([]);
    },
    onError: () => {
      toast({
        title: "❌ Lỗi xuất bản",
        description: "Không thể xuất bản bài viết. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  });

  // AI content generation
  const generateWithAI = async () => {
    if (!aiKeywords.trim()) {
      toast({
        title: "Cần keywords",
        description: "Vui lòng nhập từ khóa hoặc outline cho AI",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/content/ai/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseContent: `Mode: ${aiGenerationMode}; Length: ${aiTargetLength}; Audience: ${aiTargetAudience}; Content: ${aiKeywords}${aiSeoKeywords ? ` | SEO Keywords: ${aiSeoKeywords}` : ''}`,
          platforms: aiSelectedPlatforms,
          tones: [aiTone],
          variationsPerPlatform: 1,
          includeHashtags: true,
          targetAudience: aiTargetAudience,
          contentType: aiContentType
        })
      });

      if (!response.ok) throw new Error('AI generation failed');
      
      const result = await response.json();
      if (result.variations && result.variations.length > 0) {
        setAiGeneratedVariations(result.variations);
        
        if (result.variations.length === 1) {
          // Auto-insert single variation
          const variation = result.variations[0];
          setTitle(`Bài viết về ${aiKeywords}`);
          setContent(variation.variation || '');
        } else {
          // Show selection UI for multiple variations
          setShowVariationSelector(true);
          setActiveTab('write'); // Switch to write tab to show selector
        }
      }
      
      toast({
        title: "✨ AI tạo nội dung thành công!",
        description: "Đã tạo bài viết từ keywords của bạn",
      });
      
      setActiveTab('write');
    } catch (error) {
      toast({
        title: "❌ Lỗi AI generation",
        description: "Không thể tạo nội dung. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Tag management
  const addTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      // Create new tag first
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTag.trim(),
          slug: newTag.trim().toLowerCase().replace(/\s+/g, '-'),
          color: '#6b7280',
          platforms: platforms
        })
      });
      
      if (response.ok) {
        const newTagData = await response.json();
        setSelectedTagIds(prev => [...prev, newTagData.id]);
        setNewTag('');
        // Refresh available tags
        queryClient.invalidateQueries({ queryKey: ['content-tags'] });
      }
    } catch (error) {
      toast({
        title: "Lỗi tạo tag",
        description: "Không thể tạo tag mới",
        variant: "destructive",
      });
    }
  };

  const removeTag = (tagIdToRemove: string) => {
    setSelectedTagIds(prev => prev.filter(id => id !== tagIdToRemove));
  };

  const addExistingTag = (tagId: string) => {
    if (!selectedTagIds.includes(tagId)) {
      setSelectedTagIds(prev => [...prev, tagId]);
    }
  };

  const plainTextContent = content.replace(/<[^>]*>/g, '').trim();
  const wordCount = plainTextContent.split(/\s+/).filter(word => word.length > 0).length;
  const isFormValid = title.trim() && plainTextContent.length > 10;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Content Writer
          </h1>
          <p className="text-gray-600 mt-1">
            Viết bài báo chí, tạp chí, blog với AI support
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => saveDraftMutation.mutate()}
            disabled={!isFormValid || saveDraftMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Lưu nháp
          </Button>
          
          <Button
            onClick={() => publishMutation.mutate()}
            disabled={!isFormValid || publishMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Xuất bản
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai-assist" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="write" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Write & Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* AI Assistant Tab */}
        <TabsContent value="ai-assist" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Content Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  AI Content Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ai-generation-mode">Generation Mode</Label>
                  <Select value={aiGenerationMode} onValueChange={setAiGenerationMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-article">📝 Full Article</SelectItem>
                      <SelectItem value="outline">📋 Outline Only</SelectItem>
                      <SelectItem value="introduction">🚀 Introduction</SelectItem>
                      <SelectItem value="summary">📊 Summary</SelectItem>
                      <SelectItem value="headline">🎯 Headlines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-keywords">Topic / Keywords</Label>
                  <Textarea
                    id="ai-keywords"
                    placeholder="Mô tả chủ đề, từ khóa chính, hoặc outline sơ bộ..."
                    value={aiKeywords}
                    onChange={(e) => setAiKeywords(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="ai-seo-keywords">SEO Keywords (optional)</Label>
                  <Input
                    id="ai-seo-keywords"
                    placeholder="từ khóa SEO, thẻ #hashtag..."
                    value={aiSeoKeywords}
                    onChange={(e) => setAiSeoKeywords(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ai-tone">Writing Tone</Label>
                    <Select value={aiTone} onValueChange={setAiTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">👔 Professional</SelectItem>
                        <SelectItem value="casual">😊 Casual & Friendly</SelectItem>
                        <SelectItem value="formal">🎩 Formal</SelectItem>
                        <SelectItem value="creative">🎨 Creative</SelectItem>
                        <SelectItem value="journalistic">📰 Journalistic</SelectItem>
                        <SelectItem value="academic">🎓 Academic</SelectItem>
                        <SelectItem value="conversational">💬 Conversational</SelectItem>
                        <SelectItem value="persuasive">💡 Persuasive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ai-content-type">Content Type</Label>
                    <Select value={aiContentType} onValueChange={setAiContentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">📝 Blog Post</SelectItem>
                        <SelectItem value="news">📰 News Article</SelectItem>
                        <SelectItem value="magazine">📖 Magazine</SelectItem>
                        <SelectItem value="review">⭐ Review</SelectItem>
                        <SelectItem value="tutorial">🎯 Tutorial</SelectItem>
                        <SelectItem value="opinion">💭 Opinion</SelectItem>
                        <SelectItem value="interview">🎤 Interview</SelectItem>
                        <SelectItem value="listicle">📋 Listicle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={generateWithAI}
                  disabled={isGenerating || aiSelectedPlatforms.length === 0}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating content...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate with AI ✨
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Optimization Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ai-target-length">Target Length</Label>
                  <Select value={aiTargetLength} onValueChange={setAiTargetLength}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">📏 Short (200-500 words)</SelectItem>
                      <SelectItem value="medium">📐 Medium (500-1000 words)</SelectItem>
                      <SelectItem value="long">📏 Long (1000-2000 words)</SelectItem>
                      <SelectItem value="very-long">📚 Very Long (2000+ words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-audience">Target Audience</Label>
                  <Select value={aiTargetAudience} onValueChange={setAiTargetAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">👥 General Audience</SelectItem>
                      <SelectItem value="professionals">👔 Professionals</SelectItem>
                      <SelectItem value="students">🎓 Students</SelectItem>
                      <SelectItem value="experts">🔬 Experts</SelectItem>
                      <SelectItem value="beginners">🌱 Beginners</SelectItem>
                      <SelectItem value="teenagers">🧒 Teenagers</SelectItem>
                      <SelectItem value="seniors">👴 Seniors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-platforms">Target Platforms</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['facebook', 'instagram', 'twitter', 'tiktok'].map(platform => (
                      <div key={platform} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`platform-${platform}`}
                          checked={aiSelectedPlatforms.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAiSelectedPlatforms(prev => [...prev, platform]);
                            } else {
                              setAiSelectedPlatforms(prev => prev.filter(p => p !== platform));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`platform-${platform}`} className="text-sm">
                          {platform === 'facebook' && '📘 Facebook'}
                          {platform === 'instagram' && '📸 Instagram'}
                          {platform === 'twitter' && '🐦 Twitter'}
                          {platform === 'tiktok' && '🎵 TikTok'}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {aiSelectedPlatforms.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">Select at least one platform</p>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">💡 AI Tips</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Be specific with your topic and keywords</li>
                    <li>• Choose platform for optimized formatting</li>
                    <li>• Add SEO keywords for better search ranking</li>
                    <li>• Try different tones for various audiences</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Write & Edit Tab */}
        <TabsContent value="write" className="mt-6">
          {/* Platform Variation Selector */}
          {showVariationSelector && aiGeneratedVariations.length > 1 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Choose Platform Variation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiGeneratedVariations.map((variation, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {variation.platform === 'facebook' && '📘 Facebook'}
                          {variation.platform === 'instagram' && '📸 Instagram'}
                          {variation.platform === 'twitter' && '🐦 Twitter'}
                          {variation.platform === 'tiktok' && '🎵 TikTok'}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => {
                            setTitle(`Bài viết về ${aiKeywords}`);
                            setContent(variation.variation || '');
                            setShowVariationSelector(false);
                            toast({
                              title: "✅ Content inserted!",
                              description: `Using ${variation.platform} optimized content`,
                            });
                          }}
                        >
                          Use This
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 max-h-20 overflow-hidden">
                        {variation.variation?.substring(0, 200)}...
                      </div>
                      {variation.hashtags && variation.hashtags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {variation.hashtags.slice(0, 3).map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowVariationSelector(false)}
                  >
                    Cancel Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Nội dung bài viết</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="article-title">Tiêu đề</Label>
                    <Input
                      id="article-title"
                      placeholder="Nhập tiêu đề bài viết..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg font-medium"
                    />
                  </div>

                  <div>
                    <Label htmlFor="article-content">Nội dung</Label>
                    <RichTextEditor
                      id="article-content"
                      value={content}
                      onChange={setContent}
                      placeholder="Bắt đầu viết bài của bạn..."
                      height="400px"
                      className="mt-2"
                    />
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>{wordCount} từ</span>
                      <span>Ước tính: {Math.ceil(wordCount / 200)} phút đọc</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Settings */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cài đặt bài viết</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="category">Danh mục</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="news">Tin tức</SelectItem>
                        <SelectItem value="magazine">Tạp chí</SelectItem>
                        <SelectItem value="press">Báo chí</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Độ ưu tiên</Label>
                    <Select value={priority} onValueChange={(value: 'high' | 'normal' | 'low') => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Cao</SelectItem>
                        <SelectItem value="normal">Bình thường</SelectItem>
                        <SelectItem value="low">Thấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="platforms">Nền tảng</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['web', 'facebook', 'instagram', 'linkedin'].map(platform => (
                        <Button
                          key={platform}
                          variant={platforms.includes(platform) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setPlatforms(prev => 
                              prev.includes(platform) 
                                ? prev.filter(p => p !== platform)
                                : [...prev, platform]
                            );
                          }}
                        >
                          {platform}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Thêm tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1"
                    />
                    <Button onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedTagIds.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId);
                      return (
                        <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                          {tag?.name || tagId}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-red-500" 
                            onClick={() => removeTag(tagId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>

                  {availableTags.length > 0 && (
                    <div>
                      <Label className="text-xs text-gray-500">Tags có sẵn:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {availableTags.slice(0, 10).map(tag => (
                          <Badge 
                            key={tag.id}
                            variant="outline" 
                            className="cursor-pointer text-xs hover:bg-gray-100"
                            onClick={() => addExistingTag(tag.id)}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview bài viết</CardTitle>
            </CardHeader>
            <CardContent>
              {title || content ? (
                <article className="prose prose-gray max-w-none">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{title || 'Tiêu đề bài viết'}</h1>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {Math.ceil(wordCount / 200)} phút đọc
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {wordCount} từ
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {category}
                    </span>
                  </div>

                  <div 
                    className="prose-content"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(content || '<p>Chưa có nội dung...</p>')
                    }}
                  />

                  {selectedTagIds.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tags:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTagIds.map(tagId => {
                          const tag = availableTags.find(t => t.id === tagId);
                          return (
                            <Badge key={tagId} variant="secondary">
                              {tag?.name || tagId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có nội dung để preview</p>
                  <p className="text-sm">Hãy viết tiêu đề và nội dung ở tab "Write & Edit"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}