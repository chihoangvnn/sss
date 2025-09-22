import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Filter, Edit2, Trash2, Eye, EyeOff, 
  Tag, Hash, CheckCircle2, AlertCircle, Save, X,
  GripVertical, MoreVertical, FileQuestion, 
  Calendar, TrendingUp, Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface FAQLibraryItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  keywords: string[] | null;
  tagIds: string[] | null;
  usageCount: number | null;
  lastUsed: Date | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  category: string;
  platforms: string[];
}

interface FAQLibraryManagementProps {
  className?: string;
}

export function FAQLibraryManagement({ className = "" }: FAQLibraryManagementProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FAQLibraryItem | null>(null);
  
  // Form states
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [keywordInput, setKeywordInput] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch FAQ Library items
  const { data: faqResponse, isLoading: faqsLoading, refetch: refetchFAQs } = useQuery({
    queryKey: ['faq-library', currentPage, pageSize, searchQuery, selectedCategory, selectedPriority, selectedStatus, selectedTag],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedPriority !== 'all') params.append('priority', selectedPriority);
      if (selectedStatus !== 'all') params.append('isActive', selectedStatus === 'active' ? 'true' : 'false');
      if (selectedTag !== 'all') params.append('tagIds', selectedTag);
      
      const response = await fetch(`/api/faq-library/faqs?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 401) return { faqs: [], totalCount: 0, currentPage: 1, totalPages: 1 };
        throw new Error('Failed to fetch FAQ library items');
      }
      return await response.json();
    },
  });

  // Fetch tags (filter by "Sản phẩm" category)
  const { data: tags = [] } = useQuery({
    queryKey: ['unified-tags-products'],
    queryFn: async () => {
      const response = await fetch('/api/tags?category=product');
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch tags');
      }
      const allTags = await response.json() as Tag[];
      // Filter for "Sản phẩm" category tags
      return allTags.filter(tag => tag.category === 'product' || tag.name.toLowerCase().includes('sản phẩm'));
    },
  });

  // Create FAQ mutation
  const createFAQMutation = useMutation({
    mutationFn: async (data: {
      question: string;
      answer: string;
      category: string;
      priority: string;
      keywords: string[];
      tagIds: string[];
      isActive: boolean;
    }) => {
      const response = await fetch('/api/faq-library/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-library'] });
      resetForm();
      setShowCreateModal(false);
      toast({
        title: "✅ FAQ đã được tạo",
        description: "FAQ mới đã được thêm vào thư viện thành công!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi tạo FAQ",
        description: "Không thể tạo FAQ. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Update FAQ mutation
  const updateFAQMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      question: string;
      answer: string;
      category: string;
      priority: string;
      keywords: string[];
      tagIds: string[];
      isActive: boolean;
    }) => {
      const { id, ...updateData } = data;
      const response = await fetch(`/api/faq-library/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update FAQ');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-library'] });
      resetForm();
      setEditingItem(null);
      setShowCreateModal(false);
      toast({
        title: "✅ FAQ đã được cập nhật",
        description: "Thông tin FAQ đã được lưu thành công!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi cập nhật FAQ",
        description: "Không thể cập nhật FAQ. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Delete FAQ mutation
  const deleteFAQMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/faq-library/faqs/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete FAQ');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-library'] });
      setSelectedItems(new Set());
      toast({
        title: "✅ FAQ đã được xóa",
        description: "FAQ đã được xóa khỏi thư viện thành công!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi xóa FAQ",
        description: "Không thể xóa FAQ. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const faqs = faqResponse?.faqs || [];
  const totalCount = faqResponse?.totalCount || 0;
  const totalPages = faqResponse?.totalPages || 1;

  const resetForm = () => {
    setFormQuestion('');
    setFormAnswer('');
    setFormCategory('');
    setFormPriority('medium');
    setFormKeywords([]);
    setFormTags([]);
    setFormIsActive(true);
    setKeywordInput('');
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
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.size} FAQ đã chọn?`)) {
      return;
    }

    for (const itemId of Array.from(selectedItems)) {
      await deleteFAQMutation.mutateAsync(itemId);
    }
  };

  const handleEditItem = (item: FAQLibraryItem) => {
    setEditingItem(item);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setFormCategory(item.category);
    setFormPriority(item.priority);
    setFormKeywords(item.keywords || []);
    setFormTags(item.tagIds || []);
    setFormIsActive(item.isActive);
    setShowCreateModal(true);
  };

  const handleSubmitForm = async () => {
    if (!formQuestion.trim() || !formAnswer.trim() || !formCategory.trim()) {
      toast({
        title: "⚠️ Thiếu thông tin",
        description: "Vui lòng điền đầy đủ câu hỏi, câu trả lời và danh mục.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      question: formQuestion.trim(),
      answer: formAnswer.trim(),
      category: formCategory.trim(),
      priority: formPriority,
      keywords: formKeywords,
      tagIds: formTags,
      isActive: formIsActive,
    };

    if (editingItem) {
      await updateFAQMutation.mutateAsync({ ...data, id: editingItem.id });
    } else {
      await createFAQMutation.mutateAsync(data);
    }
  };

  const addKeyword = (keyword: string) => {
    if (!keyword.trim()) return;
    const newKeyword = keyword.trim().toLowerCase();
    if (!formKeywords.includes(newKeyword)) {
      setFormKeywords([...formKeywords, newKeyword]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (index: number) => {
    setFormKeywords(formKeywords.filter((_, i) => i !== index));
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
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTagColor = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.color || '#6B7280';
  };

  const getTagName = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.name || tagId;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-blue-500" />
            FAQ Library
          </h2>
          <p className="text-gray-600 mt-1">
            Quản lý thư viện FAQ theo tags sản phẩm
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
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Thêm FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Chỉnh sửa FAQ' : 'Tạo FAQ mới'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Cập nhật thông tin FAQ' : 'Thêm FAQ mới vào thư viện'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label htmlFor="question">Câu hỏi *</Label>
                  <Input
                    id="question"
                    placeholder="Nhập câu hỏi..."
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="answer">Câu trả lời *</Label>
                  <Textarea
                    id="answer"
                    placeholder="Nhập câu trả lời chi tiết..."
                    value={formAnswer}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Danh mục *</Label>
                    <Input
                      id="category"
                      placeholder="VD: sản phẩm, dịch vụ..."
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Độ ưu tiên</Label>
                    <Select value={formPriority} onValueChange={(value: 'high' | 'medium' | 'low') => setFormPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Cao</SelectItem>
                        <SelectItem value="medium">Bình thường</SelectItem>
                        <SelectItem value="low">Thấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <Label>Từ khóa tìm kiếm</Label>
                  
                  {formKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(index)}
                            className="hover:bg-purple-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Thêm từ khóa..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKeyword(keywordInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addKeyword(keywordInput)}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags sản phẩm</Label>
                  {formTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formTags.map((tagId) => (
                        <span
                          key={tagId}
                          className="px-2 py-1 rounded text-sm flex items-center gap-1"
                          style={{
                            backgroundColor: `${getTagColor(tagId)}20`,
                            color: getTagColor(tagId),
                            border: `1px solid ${getTagColor(tagId)}40`
                          }}
                        >
                          {getTagName(tagId)}
                          <button
                            type="button"
                            onClick={() => setFormTags(formTags.filter(id => id !== tagId))}
                            className="hover:bg-gray-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !formTags.includes(value)) {
                        setFormTags([...formTags, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tags..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formIsActive}
                    onCheckedChange={(checked) => setFormIsActive(checked === true)}
                  />
                  <Label htmlFor="active">FAQ hoạt động</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreateModal(false);
                  setEditingItem(null);
                  resetForm();
                }}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleSubmitForm}
                  disabled={createFAQMutation.isPending || updateFAQMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingItem ? 'Cập nhật' : 'Tạo FAQ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Tìm kiếm</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm trong câu hỏi/trả lời..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Danh mục</Label>
            <Input
              placeholder="Lọc theo danh mục..."
              value={selectedCategory === 'all' ? '' : selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value || 'all')}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Độ ưu tiên</Label>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
                <SelectItem value="medium">Bình thường</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Trạng thái</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Tags sản phẩm</Label>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Hiển thị {faqs.length} / {totalCount} FAQ
          {searchQuery && ` (tìm kiếm: "${searchQuery}")`}
        </span>
        <span>Trang {currentPage} / {totalPages}</span>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {faqsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : faqs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileQuestion className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có FAQ nào</h3>
              <p className="text-gray-600 text-center mb-4">
                {searchQuery ? 'Không tìm thấy FAQ phù hợp với tìm kiếm của bạn.' : 'Hãy tạo FAQ đầu tiên cho thư viện.'}
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo FAQ đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          faqs.map((faq: FAQLibraryItem) => (
            <Card key={faq.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        checked={selectedItems.has(faq.id)}
                        onCheckedChange={() => handleItemSelect(faq.id)}
                      />
                      
                      <Badge className={getPriorityColor(faq.priority)}>
                        {faq.priority === 'high' ? 'Cao' : faq.priority === 'medium' ? 'Bình thường' : 'Thấp'}
                      </Badge>
                      
                      <Badge variant="outline">
                        {faq.category}
                      </Badge>
                      
                      {!faq.isActive && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Tạm dừng
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {faq.question}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {faq.answer}
                    </p>

                    {/* Keywords */}
                    {faq.keywords && faq.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {faq.keywords.map((keyword: string, index: number) => (
                          <span
                            key={index}
                            className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs"
                          >
                            #{keyword}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    {faq.tagIds && faq.tagIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {faq.tagIds.map((tagId: string) => (
                          <span
                            key={tagId}
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: `${getTagColor(tagId)}20`,
                              color: getTagColor(tagId),
                              border: `1px solid ${getTagColor(tagId)}40`
                            }}
                          >
                            <Tag className="w-3 h-3 mr-1 inline" />
                            {getTagName(tagId)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Usage Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Sử dụng: {faq.usageCount || 0} lần
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Cập nhật: {formatDate(faq.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditItem(faq)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFAQMutation.mutate(faq.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            Đầu
          </Button>
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          >
            Trước
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          >
            Sau
          </Button>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            Cuối
          </Button>
        </div>
      )}
    </div>
  );
}