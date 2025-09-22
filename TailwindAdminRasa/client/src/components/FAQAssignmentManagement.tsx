import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Link, Unlink, Edit2, Trash2, 
  ArrowUpDown, MoreVertical, FileText, HelpCircle,
  Tag, Calendar, Users, CheckCircle2, AlertCircle,
  Move, RefreshCw, Copy, Zap, Filter
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface FAQAssignment {
  id: string;
  contentId: string;
  faqId: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  
  // Joined data
  contentTitle?: string;
  faqQuestion?: string;
  faqAnswer?: string;
  contentTags?: string[];
  faqTags?: string[];
}

interface ContentLibraryItem {
  id: string;
  title: string;
  baseContent: string;
  tagIds: string[] | null;
  priority: string;
  status: string;
}

interface FAQLibraryItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: string;
  tagIds: string[] | null;
  isActive: boolean;
}

interface Tag {
  id: string;
  name: string;
  color: string;
  category: string;
}

interface FAQAssignmentManagementProps {
  className?: string;
}

export function FAQAssignmentManagement({ className = "" }: FAQAssignmentManagementProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedContent, setSelectedContent] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Form states
  const [formContentId, setFormContentId] = useState('');
  const [formFaqIds, setFormFaqIds] = useState<string[]>([]);
  const [formIsVisible, setFormIsVisible] = useState(true);
  
  // Bulk assignment states
  const [bulkContentIds, setBulkContentIds] = useState<string[]>([]);
  const [bulkFaqIds, setBulkFaqIds] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch FAQ Assignments
  const { data: assignmentResponse, isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery({
    queryKey: ['faq-assignments', currentPage, pageSize, searchQuery, selectedStatus, selectedContent],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedStatus !== 'all') params.append('isVisible', selectedStatus === 'active' ? 'true' : 'false');
      if (selectedContent !== 'all') params.append('contentId', selectedContent);
      
      const response = await fetch(`/api/faq-assignments?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 401) return { assignments: [], totalCount: 0, currentPage: 1, totalPages: 1 };
        throw new Error('Failed to fetch FAQ assignments');
      }
      return await response.json();
    },
  });

  // Fetch Content Library items for selection
  const { data: contentItems = [] } = useQuery({
    queryKey: ['content-library-items-for-assignment'],
    queryFn: async () => {
      const response = await fetch('/api/content/library?status=active');
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch content items');
      }
      return await response.json() as ContentLibraryItem[];
    },
  });

  // Fetch FAQ Library items for selection
  const { data: faqItems = [] } = useQuery({
    queryKey: ['faq-library-items-for-assignment'],
    queryFn: async () => {
      const response = await fetch('/api/faq-library/faqs?isActive=true&limit=100');
      if (!response.ok) {
        if (response.status === 401) return { faqs: [] };
        throw new Error('Failed to fetch FAQ items');
      }
      const result = await response.json();
      return result.faqs || [];
    },
  });

  // Fetch tags for display
  const { data: tags = [] } = useQuery({
    queryKey: ['unified-tags-assignment'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch tags');
      }
      return await response.json() as Tag[];
    },
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: {
      contentId: string;
      faqId: string;
      isVisible: boolean;
    }) => {
      const response = await fetch('/api/faq-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create FAQ assignment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-assignments'] });
      resetForm();
      setShowCreateModal(false);
      toast({
        title: "✅ Assignment đã được tạo",
        description: "FAQ đã được gắn kết với content thành công!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi tạo assignment",
        description: "Không thể tạo assignment. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Bulk assignment mutation
  const bulkAssignmentMutation = useMutation({
    mutationFn: async (data: {
      contentId: string;
      faqIds: string[];
    }) => {
      const response = await fetch('/api/faq-assignments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create bulk assignments');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-assignments'] });
      setBulkContentIds([]);
      setBulkFaqIds([]);
      setShowBulkModal(false);
      toast({
        title: "✅ Bulk assignment hoàn thành",
        description: "Đã tạo nhiều assignments thành công!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi bulk assignment",
        description: "Không thể tạo bulk assignments. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/faq-assignments/assignments/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete assignment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-assignments'] });
      setSelectedItems(new Set());
      toast({
        title: "✅ Assignment đã được xóa",
        description: "Liên kết FAQ-Content đã được xóa thành công!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi xóa assignment",
        description: "Không thể xóa assignment. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Reorder assignments mutation
  const reorderAssignmentsMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; newSortOrder: number }[]) => {
      const response = await fetch('/api/faq-assignments/assignments/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: data }),
      });
      if (!response.ok) throw new Error('Failed to reorder assignments');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-assignments'] });
      toast({
        title: "✅ Đã sắp xếp lại",
        description: "Thứ tự FAQ đã được cập nhật!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Lỗi sắp xếp",
        description: "Không thể sắp xếp lại assignments. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const assignments = assignmentResponse?.assignments || [];
  const totalCount = assignmentResponse?.totalCount || 0;
  const totalPages = assignmentResponse?.totalPages || 1;

  const resetForm = () => {
    setFormContentId('');
    setFormFaqIds([]);
    setFormIsVisible(true);
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
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.size} assignment đã chọn?`)) {
      return;
    }

    for (const itemId of Array.from(selectedItems)) {
      await deleteAssignmentMutation.mutateAsync(itemId);
    }
  };

  const handleSubmitForm = async () => {
    if (!formContentId || formFaqIds.length === 0) {
      toast({
        title: "⚠️ Thiếu thông tin",
        description: "Vui lòng chọn content và ít nhất 1 FAQ.",
        variant: "destructive",
      });
      return;
    }

    // Create individual assignments for each FAQ
    for (const faqId of formFaqIds) {
      await createAssignmentMutation.mutateAsync({
        contentId: formContentId,
        faqId: faqId,
        isVisible: formIsVisible,
      });
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkContentIds.length === 0 || bulkFaqIds.length === 0) {
      toast({
        title: "⚠️ Thiếu thông tin",
        description: "Vui lòng chọn ít nhất 1 content và 1 FAQ.",
        variant: "destructive",
      });
      return;
    }

    // Create bulk assignments for each content
    for (const contentId of bulkContentIds) {
      await bulkAssignmentMutation.mutateAsync({
        contentId: contentId,
        faqIds: bulkFaqIds,
      });
    }
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

  const getTagName = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.name || tagId;
  };

  const getTagColor = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.color || '#6B7280';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link className="w-6 h-6 text-blue-500" />
            FAQ Assignments
          </h2>
          <p className="text-gray-600 mt-1">
            Quản lý liên kết giữa Content và FAQ Library
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
          
          <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Bulk Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk FAQ Assignment</DialogTitle>
                <DialogDescription>
                  Gắn kết nhiều Content với nhiều FAQ cùng lúc
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Chọn Content Items</Label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {contentItems.map((content: ContentLibraryItem) => (
                      <label key={content.id} className="flex items-center gap-2 py-1 cursor-pointer">
                        <Checkbox
                          checked={bulkContentIds.includes(content.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkContentIds([...bulkContentIds, content.id]);
                            } else {
                              setBulkContentIds(bulkContentIds.filter(id => id !== content.id));
                            }
                          }}
                        />
                        <span className="text-sm">{content.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Chọn FAQ Items</Label>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {faqItems.map((faq: FAQLibraryItem) => (
                      <label key={faq.id} className="flex items-center gap-2 py-1 cursor-pointer">
                        <Checkbox
                          checked={bulkFaqIds.includes(faq.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkFaqIds([...bulkFaqIds, faq.id]);
                            } else {
                              setBulkFaqIds(bulkFaqIds.filter(id => id !== faq.id));
                            }
                          }}
                        />
                        <span className="text-sm">{faq.question}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBulkModal(false)}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleBulkSubmit}
                  disabled={bulkAssignmentMutation.isPending}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Tạo Bulk Assignments
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Thêm Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo FAQ Assignment</DialogTitle>
                <DialogDescription>
                  Gắn kết FAQ với Content Library item
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">Chọn Content *</Label>
                  <Select value={formContentId} onValueChange={setFormContentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn content item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contentItems.map((content: ContentLibraryItem) => (
                        <SelectItem key={content.id} value={content.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{content.title}</span>
                            <span className="text-xs text-gray-500 truncate">
                              {content.baseContent.substring(0, 50)}...
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Chọn FAQs *</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {faqItems.map((faq: FAQLibraryItem) => (
                      <label key={faq.id} className="flex items-start gap-2 py-2 cursor-pointer border-b last:border-b-0">
                        <Checkbox
                          checked={formFaqIds.includes(faq.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormFaqIds([...formFaqIds, faq.id]);
                            } else {
                              setFormFaqIds(formFaqIds.filter(id => id !== faq.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{faq.question}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {faq.answer.substring(0, 80)}...
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {faq.category}
                            </Badge>
                            <Badge variant={faq.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                              {faq.priority}
                            </Badge>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formIsVisible}
                    onCheckedChange={(checked) => setFormIsVisible(checked === true)}
                  />
                  <Label htmlFor="active">Assignment hoạt động</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleSubmitForm}
                  disabled={createAssignmentMutation.isPending}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Tạo Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Tìm kiếm</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm trong content/FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <Label className="text-sm font-medium text-gray-700">Content Item</Label>
            <Select value={selectedContent} onValueChange={setSelectedContent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả content</SelectItem>
                {contentItems.map((content: ContentLibraryItem) => (
                  <SelectItem key={content.id} value={content.id}>
                    {content.title}
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
          Hiển thị {assignments.length} / {totalCount} assignments
          {searchQuery && ` (tìm kiếm: "${searchQuery}")`}
        </span>
        <span>Trang {currentPage} / {totalPages}</span>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {assignmentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Link className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có assignment nào</h3>
              <p className="text-gray-600 text-center mb-4">
                {searchQuery ? 'Không tìm thấy assignment phù hợp với tìm kiếm của bạn.' : 'Hãy tạo assignment đầu tiên để liên kết FAQ với content.'}
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Assignment đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment: FAQAssignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        checked={selectedItems.has(assignment.id)}
                        onCheckedChange={() => handleItemSelect(assignment.id)}
                      />
                      
                      <Badge className="bg-blue-100 text-blue-800">
                        Thứ tự: {assignment.sortOrder}
                      </Badge>
                      
                      {!assignment.isVisible && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Tạm dừng
                        </Badge>
                      )}
                    </div>

                    {/* Content Info */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Content</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {assignment.contentTitle || 'N/A'}
                      </h3>
                      {assignment.contentTags && assignment.contentTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {assignment.contentTags.map((tagId: string) => (
                            <span
                              key={tagId}
                              className="px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: `${getTagColor(tagId)}20`,
                                color: getTagColor(tagId),
                                border: `1px solid ${getTagColor(tagId)}40`
                              }}
                            >
                              {getTagName(tagId)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* FAQ Info */}
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">FAQ</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {assignment.faqQuestion || 'N/A'}
                      </h4>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {assignment.faqAnswer || 'N/A'}
                      </p>
                      {assignment.faqTags && assignment.faqTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {assignment.faqTags.map((tagId: string) => (
                            <span
                              key={tagId}
                              className="px-2 py-1 rounded text-xs"
                              style={{
                                backgroundColor: `${getTagColor(tagId)}20`,
                                color: getTagColor(tagId),
                                border: `1px solid ${getTagColor(tagId)}40`
                              }}
                            >
                              {getTagName(tagId)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Tạo: {formatDate(assignment.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Cập nhật: {formatDate(assignment.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Unlink className="w-4 h-4" />
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