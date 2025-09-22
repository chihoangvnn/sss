import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, GripVertical, Save, X, Eye, EyeOff, Filter } from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';

interface ProductFAQ {
  id: string;
  productId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FAQManagementProps {
  productId: string;
  className?: string;
}

interface FAQFormData {
  question: string;
  answer: string;
  isActive: boolean;
}

export function FAQManagement({ productId, className = "" }: FAQManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState<FAQFormData>({
    question: '',
    answer: '',
    isActive: true
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Fetch FAQs for this product
  const { data: faqs = [], isLoading, error } = useQuery<ProductFAQ[]>({
    queryKey: [`/api/products/${productId}/faqs`, { showInactive }],
    queryFn: async () => {
      const url = `/api/products/${productId}/faqs${showInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      return response.json();
    },
    enabled: !!productId
  });

  // Create FAQ mutation
  const createFAQMutation = useMutation({
    mutationFn: async (data: FAQFormData) => {
      const response = await fetch('/api/product-faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          question: data.question.trim(),
          answer: data.answer.trim(),
          // sortOrder handled by server to prevent collisions
          isActive: data.isActive
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create FAQ');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "FAQ đã được thêm thành công",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/faqs`] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update FAQ mutation
  const updateFAQMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FAQFormData> }) => {
      const response = await fetch(`/api/product-faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update FAQ');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "FAQ đã được cập nhật thành công",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/faqs`] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete FAQ mutation
  const deleteFAQMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/product-faqs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete FAQ');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "FAQ đã được xóa thành công",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/faqs`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reorder FAQs mutation
  const reorderFAQsMutation = useMutation({
    mutationFn: async (faqIds: string[]) => {
      const response = await fetch(`/api/product-faqs/reorder/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqIds }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reorder FAQs');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Thứ tự FAQ đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/faqs`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({ question: '', answer: '', isActive: true });
    setIsAddingFAQ(false);
    setEditingFAQ(null);
  };

  const startEdit = (faq: ProductFAQ) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive
    });
    setEditingFAQ(faq.id);
    setIsAddingFAQ(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ câu hỏi và câu trả lời",
        variant: "destructive",
      });
      return;
    }

    if (editingFAQ) {
      updateFAQMutation.mutate({ id: editingFAQ, data: formData });
    } else {
      createFAQMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa FAQ này?')) {
      deleteFAQMutation.mutate(id);
    }
  };

  const toggleActive = (faq: ProductFAQ) => {
    updateFAQMutation.mutate({
      id: faq.id,
      data: { isActive: !faq.isActive }
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, faqId: string) => {
    setDraggedItem(faqId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = faqs.findIndex(f => f.id === draggedItem);
    const targetIndex = faqs.findIndex(f => f.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new order array
    const newOrder = [...faqs];
    const [draggedFAQ] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedFAQ);

    // Update order
    const faqIds = newOrder.map(f => f.id);
    reorderFAQsMutation.mutate(faqIds);
    setDraggedItem(null);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            Lỗi khi tải danh sách FAQ
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">🙋‍♂️ Quản lý FAQ</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={showInactive ? "all" : "active"} onValueChange={(value) => setShowInactive(value === "all")}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang hiển thị</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={() => setIsAddingFAQ(true)}
          disabled={isAddingFAQ || !!editingFAQ}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm FAQ
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(isAddingFAQ || editingFAQ) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingFAQ ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="faq-question">Câu hỏi *</Label>
                <Input
                  id="faq-question"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Nhập câu hỏi..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="faq-answer">Câu trả lời *</Label>
                <RichTextEditor
                  id="faq-answer"
                  value={formData.answer}
                  onChange={(value) => setFormData(prev => ({ ...prev, answer: value }))}
                  placeholder="Nhập câu trả lời chi tiết..."
                  height="150px"
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="faq-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="faq-active">Hiển thị FAQ này</Label>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createFAQMutation.isPending || updateFAQMutation.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingFAQ ? 'Cập nhật' : 'Thêm FAQ'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* FAQ List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Đang tải danh sách FAQ...
            </div>
          </CardContent>
        </Card>
      ) : faqs.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Chưa có FAQ nào. Hãy thêm FAQ đầu tiên!
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card
              key={faq.id}
              className={`transition-all duration-200 ${
                !faq.isActive ? 'opacity-60' : ''
              } ${draggedItem === faq.id ? 'rotate-1 scale-105' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, faq.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, faq.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">
                        {index + 1}. {faq.question}
                      </h4>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(faq)}
                          className="h-8 w-8 p-0"
                          title={faq.isActive ? 'Ẩn FAQ' : 'Hiển thị FAQ'}
                        >
                          {faq.isActive ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(faq)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(faq.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div 
                      className="text-sm text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}