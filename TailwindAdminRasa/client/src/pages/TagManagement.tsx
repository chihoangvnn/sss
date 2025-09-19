import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Hash, Users, Palette, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Types for Unified Tags
interface UnifiedTag {
  id: string;
  name: string;
  slug: string;
  category: string;
  platforms: string[];
  color: string;
  icon?: string;
  description?: string;
  keywords: string[];
  usageCount: number;
  lastUsed?: string;
  isSystemDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateTagData {
  name: string;
  color: string;
  category: string;
  platforms: string[];
  description?: string;
  keywords?: string[];
  icon?: string;
}

// Predefined colors and categories
const tagColors = [
  { name: "Xanh dương", value: "#3B82F6" },
  { name: "Xanh lá", value: "#10B981" },
  { name: "Đỏ", value: "#EF4444" },
  { name: "Vàng", value: "#F59E0B" },
  { name: "Tím", value: "#8B5CF6" },
  { name: "Hồng", value: "#EC4899" },
  { name: "Cam", value: "#F97316" },
  { name: "Xám", value: "#6B7280" },
];

const categories = [
  { label: "Chung", value: "general" },
  { label: "Sản phẩm", value: "product" },
  { label: "Nội dung", value: "content" },
  { label: "Khuyến mãi", value: "promotion" },
  { label: "Hướng dẫn", value: "tutorial" },
  { label: "Thông báo", value: "announcement" },
  { label: "Sự kiện", value: "event" },
];

const platforms = [
  { label: "Facebook", value: "facebook" },
  { label: "TikTok", value: "tiktok" },
  { label: "Instagram", value: "instagram" },
  { label: "Twitter", value: "twitter" },
  { label: "YouTube", value: "youtube" },
];

// API functions
const fetchTags = async (): Promise<UnifiedTag[]> => {
  const response = await fetch("/api/tags");
  if (!response.ok) throw new Error("Failed to fetch tags");
  return response.json();
};

const createTag = async (data: CreateTagData): Promise<UnifiedTag> => {
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const response = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, slug }),
  });
  if (!response.ok) throw new Error("Failed to create tag");
  return response.json();
};

const updateTag = async ({ id, ...data }: Partial<UnifiedTag> & { id: string }): Promise<UnifiedTag> => {
  const response = await fetch(`/api/tags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update tag");
  return response.json();
};

const deleteTag = async (id: string): Promise<void> => {
  const response = await fetch(`/api/tags/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete tag");
};

export default function TagManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<UnifiedTag | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState<CreateTagData>({
    name: "",
    color: "#3B82F6",
    category: "general",
    platforms: ["facebook", "tiktok", "instagram"],
    description: "",
    keywords: [],
    icon: "",
  });

  // Queries and mutations
  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });

  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setEditingTag(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  // Helper functions
  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3B82F6",
      category: "general",
      platforms: ["facebook", "tiktok", "instagram"],
      description: "",
      keywords: [],
      icon: "",
    });
  };

  const handleEdit = (tag: UnifiedTag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      category: tag.category,
      platforms: tag.platforms,
      description: tag.description || "",
      keywords: tag.keywords,
      icon: tag.icon || "",
    });
  };

  const handleSubmit = () => {
    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Filter tags
  const filteredTags = tags.filter((tag) => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || tag.category === filterCategory;
    const matchesPlatform = filterPlatform === "all" || tag.platforms.includes(filterPlatform);
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Lỗi tải tags: {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Hash className="h-8 w-8 text-blue-600" />
            🏷️ Quản lý Tag Tổng
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý tags cho tất cả nền tảng mạng xã hội - Facebook, TikTok, Instagram
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Tạo Tag Mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTag ? "Sửa Tag" : "Tạo Tag Mới"}
              </DialogTitle>
            </DialogHeader>
            <TagForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={() => {
                setIsCreateDialogOpen(false);
                setEditingTag(null);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Hash className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Tổng Tags</p>
                <p className="text-2xl font-bold">{tags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Đang Sử Dụng</p>
                <p className="text-2xl font-bold">{tags.filter(t => t.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Palette className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Danh Mục</p>
                <p className="text-2xl font-bold">{new Set(tags.map(t => t.category)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Hiển Thị</p>
                <p className="text-2xl font-bold">{filteredTags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Nền tảng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nền tảng</SelectItem>
                {platforms.map((platform) => (
                  <SelectItem key={platform.value} value={platform.value}>
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTags.map((tag) => (
          <TagCard
            key={tag.id}
            tag={tag}
            onEdit={() => handleEdit(tag)}
            onDelete={() => deleteMutation.mutate(tag.id)}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </div>

      {filteredTags.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || filterCategory !== "all" || filterPlatform !== "all"
                ? "Không tìm thấy tag nào phù hợp với bộ lọc"
                : "Chưa có tag nào. Tạo tag đầu tiên để bắt đầu!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingTag && (
        <Dialog open={!!editingTag} onOpenChange={() => {
          setEditingTag(null);
          resetForm();
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sửa Tag: {editingTag.name}</DialogTitle>
            </DialogHeader>
            <TagForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isLoading={updateMutation.isPending}
              onCancel={() => {
                setEditingTag(null);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Tag Card Component
interface TagCardProps {
  tag: UnifiedTag;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function TagCard({ tag, onEdit, onDelete, isDeleting }: TagCardProps) {
  const categoryLabel = categories.find(c => c.value === tag.category)?.label || tag.category;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: tag.color }}
          />
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              disabled={isDeleting || tag.isSystemDefault}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">{tag.name}</h3>
          <p className="text-xs text-gray-600">{tag.description || "Không có mô tả"}</p>
          
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {categoryLabel}
            </Badge>
            {tag.platforms.map((platform) => (
              <Badge key={platform} variant="outline" className="text-xs">
                {platforms.find(p => p.value === platform)?.label || platform}
              </Badge>
            ))}
          </div>

          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
            <span>Dùng: {tag.usageCount || 0}</span>
            <span>{tag.isActive ? "Hoạt động" : "Tạm dừng"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Tag Form Component
interface TagFormProps {
  formData: CreateTagData;
  setFormData: (data: CreateTagData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onCancel: () => void;
}

function TagForm({ formData, setFormData, onSubmit, isLoading, onCancel }: TagFormProps) {
  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        platforms: [...formData.platforms, platform]
      });
    } else {
      setFormData({
        ...formData,
        platforms: formData.platforms.filter(p => p !== platform)
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tên Tag *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nhập tên tag..."
          />
        </div>
        <div className="space-y-2">
          <Label>Danh mục *</Label>
          <Select value={formData.category} onValueChange={(value) => 
            setFormData({ ...formData, category: value })
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Màu sắc</Label>
        <div className="flex gap-2 flex-wrap">
          {tagColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: color.value })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                formData.color === color.value ? 'border-gray-800 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Nền tảng hỗ trợ</Label>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <label key={platform.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.platforms.includes(platform.value)}
                onChange={(e) => handlePlatformChange(platform.value, e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{platform.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Mô tả tag (tùy chọn)..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={!formData.name.trim() || isLoading}
          className="bg-gradient-to-r from-blue-500 to-blue-600"
        >
          {isLoading ? (
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Đang xử lý..." : "Lưu Tag"}
        </Button>
      </div>
    </div>
  );
}