import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit3, Trash2, Save, X, ArrowUp, ArrowDown } from "lucide-react";

interface Industry {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface IndustryFormData {
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export default function IndustryManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Safe date formatter helper
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');
  const [showForm, setShowForm] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [formData, setFormData] = useState<IndustryFormData>({
    name: "",
    description: "",
    isActive: true,
    sortOrder: 0,
  });

  // Fetch industries
  const { data: industries = [], isLoading, error } = useQuery<Industry[]>({
    queryKey: ['/api/industries'],
    queryFn: async () => {
      const response = await fetch('/api/industries');
      if (!response.ok) throw new Error('Failed to fetch industries');
      return response.json();
    },
  });

  // Save industry mutation
  const saveMutation = useMutation({
    mutationFn: async (data: IndustryFormData) => {
      const url = editingIndustry ? `/api/industries/${editingIndustry.id}` : '/api/industries';
      const method = editingIndustry ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save industry');
        } catch {
          throw new Error('Failed to save industry');
        }
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: `Ngành hàng đã được ${editingIndustry ? 'cập nhật' : 'thêm'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/industries'] });
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

  // Delete industry mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/industries/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      // Handle 204 No Content or empty response
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
      }
      try {
        return await response.json();
      } catch {
        return null; // Fallback for empty/non-JSON responses
      }
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Ngành hàng đã được xóa",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/industries'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa ngành hàng",
        variant: "destructive",
      });
    },
  });

  // Move industry up/down mutation
  const moveMutation = useMutation({
    mutationFn: async ({ id, newSortOrder }: { id: string; newSortOrder: number }) => {
      const response = await fetch(`/api/industries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: newSortOrder }),
      });
      if (!response.ok) throw new Error('Failed to move');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/industries'] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể di chuyển ngành hàng",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
      sortOrder: 0,
    });
    setShowForm(false);
    setEditingIndustry(null);
  };

  const handleEdit = (industry: Industry) => {
    setEditingIndustry(industry);
    setFormData({
      name: industry.name,
      description: industry.description || "",
      isActive: industry.isActive,
      sortOrder: industry.sortOrder,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    // Set next available sort order to avoid collisions
    const maxSortOrder = industries.length > 0 ? Math.max(...industries.map(i => i.sortOrder)) : -1;
    setFormData({
      name: "",
      description: "",
      isActive: true,
      sortOrder: maxSortOrder + 1,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên ngành hàng không được để trống",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleMove = (industry: Industry, direction: 'up' | 'down') => {
    const sortedIndustries = [...industries].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = sortedIndustries.findIndex(c => c.id === industry.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetIndustry = sortedIndustries[currentIndex - 1];
      moveMutation.mutate({ id: industry.id, newSortOrder: targetIndustry.sortOrder });
      moveMutation.mutate({ id: targetIndustry.id, newSortOrder: industry.sortOrder });
    } else if (direction === 'down' && currentIndex < sortedIndustries.length - 1) {
      const targetIndustry = sortedIndustries[currentIndex + 1];
      moveMutation.mutate({ id: industry.id, newSortOrder: targetIndustry.sortOrder });
      moveMutation.mutate({ id: targetIndustry.id, newSortOrder: industry.sortOrder });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa ngành hàng này?")) {
      deleteMutation.mutate(id);
    }
  };

  const sortedIndustries = [...industries].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Ngành hàng</h1>
          <p className="text-muted-foreground">
            Quản lý các ngành hàng trong hệ thống
          </p>
        </div>
        <Button 
          onClick={handleAdd}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm Ngành hàng
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingIndustry ? 'Chỉnh sửa Ngành hàng' : 'Thêm Ngành hàng mới'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên ngành hàng *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên ngành hàng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Thứ tự sắp xếp</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả ngành hàng"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Kích hoạt</Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {error ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-red-500 mb-4">Lỗi khi tải dữ liệu ngành hàng</p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/industries'] })}
                  variant="outline"
                >
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">Đang tải...</div>
            </CardContent>
          </Card>
        ) : sortedIndustries.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Chưa có ngành hàng nào. Hãy thêm ngành hàng đầu tiên!
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedIndustries.map((industry, index) => (
            <Card key={industry.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{industry.name}</h3>
                      <Badge variant={industry.isActive ? "default" : "secondary"}>
                        {industry.isActive ? "Kích hoạt" : "Tạm dừng"}
                      </Badge>
                      <Badge variant="outline">
                        Thứ tự: {industry.sortOrder}
                      </Badge>
                    </div>
                    {industry.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {industry.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Tạo: {formatDate(industry.createdAt)}
                      {industry.updatedAt ? <> • Cập nhật: {formatDate(industry.updatedAt)}</> : null}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(industry, 'up')}
                      disabled={index === 0 || moveMutation.isPending}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(industry, 'down')}
                      disabled={index === sortedIndustries.length - 1 || moveMutation.isPending}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(industry)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(industry.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}