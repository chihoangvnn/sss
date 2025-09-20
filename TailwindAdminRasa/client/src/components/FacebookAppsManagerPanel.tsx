import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Settings, 
  Globe, 
  Shield, 
  Copy, 
  Check, 
  ExternalLink,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Upload,
  Shuffle,
  Info,
  Link,
  ArrowRight,
  Play,
  Pause,
  Lock,
  Tags
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface UnifiedTag {
  id: string;
  name: string;
  slug: string;
  color: string;
  category: string;
  description?: string;
}

interface AppGroup {
  id: string;
  name: string;
  description?: string;
  platform: string;
  priority: number;
  weight: string;
  isActive: boolean;
  formulaId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface FacebookApp {
  id: string;
  appName: string;
  appId: string;
  appSecret?: string; // 🔒 SECURITY: Optional since never returned from API
  appSecretSet: boolean;
  webhookUrl: string;
  verifyToken: string;
  environment: "development" | "production" | "staging";
  description?: string;
  subscriptionFields: string[];
  isActive: boolean;
  tagIds?: string[]; // References to unified_tags.id
  createdAt: string;
  updatedAt?: string;
  
  // 🎯 NEW: Limits Management fields
  groupInfo?: {
    groupId: string;
    groupName: string;
    priority: number;
    formulaName?: string;
  };
  postingStats?: {
    todayPosts: number;
    weekPosts: number;
    monthPosts: number;
    lastPostAt?: string;
    remainingQuota: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    status: "active" | "resting" | "limit_reached" | "paused";
  };
}

interface CreateAppData {
  appName: string;
  appId: string;
  appSecret: string;
  verifyToken?: string;
  environment: "development" | "production" | "staging";
  description?: string;
}

export function FacebookAppsManagerPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagEditDialogOpen, setIsTagEditDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<FacebookApp | null>(null);
  const [editingAppForTags, setEditingAppForTags] = useState<FacebookApp | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for create/edit
  const [formData, setFormData] = useState<CreateAppData>({
    appName: "",
    appId: "",
    appSecret: "",
    verifyToken: "",
    environment: "development",
    description: ""
  });

  // Load Facebook apps
  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ['facebook-apps'],
    queryFn: async () => {
      const response = await fetch('/api/facebook-apps', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Facebook apps');
      }
      
      return await response.json() as FacebookApp[];
    },
  });

  // Create Facebook app mutation
  const createAppMutation = useMutation({
    mutationFn: async (data: CreateAppData) => {
      const response = await fetch('/api/facebook-apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create Facebook app');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-apps'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Thành công",
        description: "Đã tạo Facebook App mới thành công",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo Facebook App",
        variant: "destructive",
      });
    },
  });

  // Update Facebook app mutation
  const updateAppMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAppData> }) => {
      const response = await fetch(`/api/facebook-apps/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update Facebook app');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-apps'] });
      setIsEditDialogOpen(false);
      setEditingApp(null);
      resetForm();
      toast({
        title: "Thành công",
        description: "Đã cập nhật Facebook App thành công",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật Facebook App",
        variant: "destructive",
      });
    },
  });

  // Delete Facebook app mutation
  const deleteAppMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/facebook-apps/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete Facebook app');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-apps'] });
      toast({
        title: "Thành công",
        description: "Đã xóa Facebook App thành công",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa Facebook App",
        variant: "destructive",
      });
    },
  });

  // Toggle app status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/facebook-apps/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to toggle app status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-apps'] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái app thành công",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái app",
        variant: "destructive",
      });
    },
  });

  // Load unified tags
  const { data: allTags = [], isLoading: isTagsLoading } = useQuery({
    queryKey: ['unified-tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      
      return await response.json() as UnifiedTag[];
    },
  });

  // Load Facebook groups  
  const { data: facebookGroups = [] } = useQuery({
    queryKey: ['groups', 'facebook'],
    queryFn: async () => {
      const response = await fetch('/api/groups?platform=facebook', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Facebook groups');
      }
      
      return await response.json() as AppGroup[];
    },
  });

  // Update Facebook app group mutation
  const updateAppGroupMutation = useMutation({
    mutationFn: async ({ appId, groupId }: { appId: string; groupId?: string }) => {
      const response = await fetch(`/api/facebook-apps/${appId}/group`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ groupId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update app group');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-apps'] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật nhóm cho Facebook App thành công",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật nhóm cho Facebook App",
        variant: "destructive",
      });
    },
  });

  // Update Facebook app tags mutation
  const updateAppTagsMutation = useMutation({
    mutationFn: async ({ id, tagIds }: { id: string; tagIds: string[] }) => {
      const response = await fetch(`/api/facebook-apps/${id}/tags`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tagIds }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update app tags');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facebook-apps'] });
      setIsTagEditDialogOpen(false);
      setEditingAppForTags(null);
      setSelectedTagIds([]);
      toast({
        title: "Thành công",
        description: "Đã cập nhật tags cho Facebook App thành công",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật tags cho Facebook App",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      appName: "",
      appId: "",
      appSecret: "",
      verifyToken: "",
      environment: "development",
      description: ""
    });
  };

  // Random Vietnamese business app names generator
  const generateRandomAppName = () => {
    const adjectives = [
      "Thông Minh", "Nhanh Chóng", "Hiện Đại", "Tiện Lợi", "Đáng Tin", 
      "Chuyên Nghiệp", "Sáng Tạo", "Hiệu Quả", "An Toàn", "Tiên Phong",
      "Xuất Sắc", "Linh Hoạt", "Tối Ưu", "Thân Thiện", "Đột Phá"
    ];
    const nouns = [
      "Shop", "Store", "Market", "Business", "Commerce", "Trade", "Sales",
      "Hub", "Center", "Point", "Zone", "Plaza", "Mall", "Mart", "Express",
      "Connect", "Link", "Bridge", "Network", "Pro", "Max", "Plus"
    ];
    const businessTypes = [
      "Bán Hàng", "Kinh Doanh", "Thương Mại", "Dịch Vụ", "Cửa Hàng",
      "Siêu Thị", "Showroom", "Boutique", "Outlet", "Gallery"
    ];
    
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomType = businessTypes[Math.floor(Math.random() * businessTypes.length)];
    
    const formats = [
      `${randomAdjective} ${randomNoun}`,
      `${randomType} ${randomAdjective}`,
      `${randomNoun} ${randomType}`,
      `${randomAdjective} ${randomType} ${randomNoun}`
    ];
    
    return formats[Math.floor(Math.random() * formats.length)];
  };

  const handleGenerateRandomName = () => {
    const randomName = generateRandomAppName();
    setFormData(prev => ({ ...prev, appName: randomName }));
    toast({
      title: "Đã tạo tên ngẫu nhiên",
      description: `Tên app: ${randomName}`,
    });
  };


  const handleCreateApp = () => {
    if (!formData.appName || !formData.appId || !formData.appSecret) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }
    createAppMutation.mutate(formData);
  };

  const handleUpdateApp = () => {
    if (!editingApp) return;
    updateAppMutation.mutate({ id: editingApp.id, data: formData });
  };

  const handleEditApp = (app: FacebookApp) => {
    setEditingApp(app);
    setFormData({
      appName: app.appName,
      appId: app.appId,
      appSecret: "", // Don't prefill secret for security
      verifyToken: app.verifyToken,
      environment: app.environment,
      description: app.description || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleEditAppTags = (app: FacebookApp) => {
    setEditingAppForTags(app);
    setSelectedTagIds(app.tagIds || []);
    setIsTagEditDialogOpen(true);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSaveAppTags = () => {
    if (!editingAppForTags) return;
    updateAppTagsMutation.mutate({ 
      id: editingAppForTags.id, 
      tagIds: selectedTagIds 
    });
  };

  // Helper function to get tag info by ID
  const getTagById = (tagId: string) => allTags.find(tag => tag.id === tagId);

  const handleDeleteApp = (id: string) => {
    deleteAppMutation.mutate(id);
  };

  const handleToggleStatus = (id: string, isActive: boolean) => {
    toggleStatusMutation.mutate({ id, isActive });
  };

  // Removed toggleSecretVisibility function - no longer needed for security

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: "Đã sao chép",
        description: `${type} đã được sao chép vào clipboard`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép vào clipboard",
        variant: "destructive",
      });
    }
  };

  // Filter apps based on search and filters
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.appId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnvironment = environmentFilter === "all" || app.environment === environmentFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && app.isActive) ||
                         (statusFilter === "inactive" && !app.isActive);
    
    return matchesSearch && matchesEnvironment && matchesStatus;
  });

  const getEnvironmentBadgeVariant = (env: string) => {
    switch (env) {
      case "production": return "destructive";
      case "staging": return "default";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Facebook Apps Manager</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Facebook Apps Manager</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Lỗi tải danh sách Facebook Apps: {(error as any)?.message || 'Unknown error'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facebook Apps Manager</h1>
          <p className="text-gray-600 mt-1">Quản lý cấu hình Facebook Apps và webhook</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Kết nối Facebook App
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Kết nối Facebook App có sẵn</DialogTitle>
              <DialogDescription>
                Nhập thông tin Facebook App đã tạo trên Facebook Developer Console để kết nối vào hệ thống quản lý
              </DialogDescription>
              <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-50 rounded border">
                💡 <strong>Lưu ý:</strong> Bạn cần tạo App trên Facebook Developer Console trước, sau đó nhập thông tin ở đây để kết nối
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Tên App *</Label>
                <div className="flex gap-2">
                  <Input
                    id="appName"
                    value={formData.appName}
                    onChange={(e) => setFormData(prev => ({ ...prev, appName: e.target.value }))}
                    placeholder="My Facebook App"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRandomName}
                    className="px-3"
                    title="Tạo tên ngẫu nhiên"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appId">App ID *</Label>
                <Input
                  id="appId"
                  value={formData.appId}
                  onChange={(e) => setFormData(prev => ({ ...prev, appId: e.target.value }))}
                  placeholder="123456789012345"
                />
                {/* Facebook Developer Console Links */}
                {formData.appId && formData.appId.length >= 10 && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Link className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Facebook Developer Links</span>
                    </div>
                    
                    <div className="space-y-3">
                      {/* App Secret URL */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600 flex items-center gap-1">
                          🔐 Lấy App Secret tại:
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={`https://developers.facebook.com/apps/${formData.appId}/settings/basic/`}
                            readOnly
                            className="text-xs bg-white font-mono text-blue-600"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(`https://developers.facebook.com/apps/${formData.appId}/settings/basic/`, 'App Secret Link')}
                            className="shrink-0"
                          >
                            {copied === 'App Secret Link' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Webhook URL */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600 flex items-center gap-1">
                          🪝 Cài đặt Webhook tại:
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={`https://developers.facebook.com/apps/${formData.appId}/webhooks/`}
                            readOnly
                            className="text-xs bg-white font-mono text-blue-600"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(`https://developers.facebook.com/apps/${formData.appId}/webhooks/`, 'Webhook Link')}
                            className="shrink-0"
                          >
                            {copied === 'Webhook Link' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="appSecret">App Secret *</Label>
                <Input
                  id="appSecret"
                  type="password"
                  value={formData.appSecret}
                  onChange={(e) => setFormData(prev => ({ ...prev, appSecret: e.target.value }))}
                  placeholder="••••••••••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verifyToken">Verify Token</Label>
                <Input
                  id="verifyToken"
                  value={formData.verifyToken}
                  onChange={(e) => setFormData(prev => ({ ...prev, verifyToken: e.target.value }))}
                  placeholder="Để trống để tự động tạo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="environment">Môi trường</Label>
                <Select 
                  value={formData.environment} 
                  onValueChange={(value: "development" | "production" | "staging") => 
                    setFormData(prev => ({ ...prev, environment: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về Facebook App này..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateApp} disabled={createAppMutation.isPending}>
                {createAppMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Đang kết nối...
                  </>
                ) : (
                  'Kết nối App'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng Apps</p>
                <p className="text-xl font-semibold">{apps.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đang hoạt động</p>
                <p className="text-xl font-semibold">{apps.filter(app => app.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tạm dừng</p>
                <p className="text-xl font-semibold">{apps.filter(app => !app.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Globe className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Production</p>
                <p className="text-xl font-semibold">{apps.filter(app => app.environment === 'production').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo tên app hoặc App ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Môi trường" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môi trường</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Apps List - Ultra Compact Single Line */}
      <TooltipProvider>
        {filteredApps.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {apps.length === 0 ? 'Chưa có Facebook App nào' : 'Không tìm thấy kết quả'}
              </h3>
              <p className="text-gray-600 mb-4">
                {apps.length === 0 
                  ? 'Kết nối Facebook App đầu tiên để bắt đầu quản lý webhook'
                  : 'Thử điều chỉnh bộ lọc để tìm Facebook App mong muốn'
                }
              </p>
              {apps.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Kết nối Facebook App đầu tiên
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Facebook Apps ({filteredApps.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                <div className="flex items-center text-xs font-medium text-gray-600 gap-2">
                  <div className="w-[160px]">Tên App</div>
                  <div className="w-[120px]">App ID</div>
                  <div className="w-[80px]">Status</div>
                  <div className="w-[120px]">Group</div>
                  <div className="w-[140px]">Stats (T/W/M)</div>
                  <div className="w-[140px]">Tags</div>
                  <div className="flex-1">Actions</div>
                </div>
              </div>
              
              {/* Ultra Compact Single-Line Apps Rows */}
              <div className="divide-y divide-gray-100">
                {filteredApps.map((app) => (
                  <div key={app.id} className="flex items-center gap-2 h-9 text-xs px-4 hover:bg-gray-50 transition-colors">
                    {/* Name Column */}
                    <div className="w-[160px] flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate" title={app.appName}>{app.appName}</span>
                      <span className={`shrink-0 w-4 h-4 rounded text-[9px] leading-4 text-center font-bold ${
                        app.environment === 'production' 
                          ? 'bg-red-100 text-red-700'
                          : app.environment === 'staging'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`} title={`Environment: ${app.environment}`}>
                        {app.environment === 'production' ? 'P' : 
                         app.environment === 'staging' ? 'S' : 'D'}
                      </span>
                    </div>
                    
                    {/* App ID Column */}
                    <div className="w-[120px] shrink-0">
                      <button
                        onClick={() => copyToClipboard(app.appId, app.id)}
                        className="font-mono text-[10px] bg-slate-50 hover:bg-slate-100 rounded px-2 py-0.5 truncate max-w-full cursor-pointer transition-colors"
                        title={`Click to copy: ${app.appId}`}
                      >
                        {app.appId}
                        {copied === app.id && <span className="ml-1 text-green-600">✓</span>}
                      </button>
                    </div>
                    
                    {/* Status Column */}
                    <div className="w-[80px] shrink-0 flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        app.isActive ? 'bg-green-500' : 'bg-red-400'
                      }`} title={app.isActive ? 'Active' : 'Inactive'}></div>
                      <span className="text-[10px] text-gray-600">
                        {app.isActive ? 'ON' : 'OFF'}
                      </span>
                      {app.appSecretSet && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Lock className="w-3 h-3 text-green-600" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>App Secret configured</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    
                    {/* 🎯 NEW: Group Selector */}
                    <div className="w-[120px] shrink-0">
                      <Select 
                        value={app.groupInfo?.groupId || "none"} 
                        onValueChange={(groupId) => updateAppGroupMutation.mutate({ appId: app.id, groupId: groupId === 'none' ? undefined : groupId })}
                      >
                        <SelectTrigger className="h-6 text-[10px] border-gray-200 bg-white/50">
                          <SelectValue placeholder="No Group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Group</SelectItem>
                          {facebookGroups.map(group => (
                            <SelectItem key={group.id} value={group.id}>
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  group.priority === 1 ? 'bg-purple-500' :
                                  group.priority === 2 ? 'bg-blue-500' : 
                                  'bg-green-500'
                                }`}></div>
                                <span className="truncate">{group.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* 🎯 NEW: Posting Stats Column */}
                    <div className="w-[140px] shrink-0">
                      {app.postingStats ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[9px]" title="Today/Week/Month posts">
                            {app.postingStats.todayPosts}/{app.postingStats.weekPosts}/{app.postingStats.monthPosts}
                          </span>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            app.postingStats.status === 'active' ? 'bg-green-500' :
                            app.postingStats.status === 'resting' ? 'bg-yellow-500' :
                            app.postingStats.status === 'limit_reached' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} title={`Status: ${app.postingStats.status}`}></div>
                          {app.postingStats.remainingQuota.daily < 5 && (
                            <span className="text-[8px] text-orange-600 font-bold" title={`Remaining daily quota: ${app.postingStats.remainingQuota.daily}`}>
                              !{app.postingStats.remainingQuota.daily}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">No stats</span>
                      )}
                    </div>
                    
                    {/* Tags Column - Từ phải sang trái */}
                    <div className="w-[140px] shrink-0 flex items-center justify-end gap-1 overflow-hidden">
                      {app.tagIds && app.tagIds.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap-reverse justify-end">
                          {app.tagIds.slice(0, 3).reverse().map((tagId) => {
                            const tag = getTagById(tagId);
                            if (!tag) return null;
                            return (
                              <Badge
                                key={tagId}
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 h-4 leading-4 truncate max-w-[50px]"
                                style={{ 
                                  backgroundColor: `${tag.color}15`, 
                                  borderColor: tag.color,
                                  color: tag.color 
                                }}
                                title={tag.name}
                              >
                                {tag.name}
                              </Badge>
                            );
                          })}
                          {app.tagIds.length > 3 && (
                            <span className="text-[9px] text-gray-500 ml-1">+{app.tagIds.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">Chưa có tags</span>
                      )}
                    </div>
                    
                    {/* Actions Column */}
                    <div className="flex-1 flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(app.id, !app.isActive)}
                            className="h-6 w-6 p-0"
                          >
                            {app.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{app.isActive ? 'Pause' : 'Activate'}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`https://developers.facebook.com/apps/${app.appId}/settings/basic/`, '_blank', 'noopener,noreferrer')}
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Facebook Developer Console</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditApp(app)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit App</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAppTags(app)}
                            className="h-6 w-6 p-0"
                          >
                            <Tags className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Tags</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <AlertDialog>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete App</p>
                          </TooltipContent>
                        </Tooltip>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa Facebook App "{app.appName}"? 
                              Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteApp(app.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              }
              </div>
            </CardContent>
          </Card>
        )}
      </TooltipProvider>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Facebook App</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin Facebook App
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-appName">Tên App *</Label>
              <Input
                id="edit-appName"
                value={formData.appName}
                onChange={(e) => setFormData(prev => ({ ...prev, appName: e.target.value }))}
                placeholder="My Facebook App"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-appId">App ID *</Label>
              <Input
                id="edit-appId"
                value={formData.appId}
                onChange={(e) => setFormData(prev => ({ ...prev, appId: e.target.value }))}
                placeholder="123456789012345"
              />
              {/* Facebook Developer Console Links */}
              {formData.appId && formData.appId.length >= 10 && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Link className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Facebook Developer Links</span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* App Secret URL */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 flex items-center gap-1">
                        🔐 Lấy App Secret tại:
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`https://developers.facebook.com/apps/${formData.appId}/settings/basic/`}
                          readOnly
                          className="text-xs bg-white font-mono text-blue-600"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`https://developers.facebook.com/apps/${formData.appId}/settings/basic/`, 'App Secret Link')}
                          className="shrink-0"
                        >
                          {copied === 'App Secret Link' ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Webhook URL */}
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600 flex items-center gap-1">
                        🪝 Cài đặt Webhook tại:
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`https://developers.facebook.com/apps/${formData.appId}/webhooks/`}
                          readOnly
                          className="text-xs bg-white font-mono text-blue-600"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`https://developers.facebook.com/apps/${formData.appId}/webhooks/`, 'Webhook Link')}
                          className="shrink-0"
                        >
                          {copied === 'Webhook Link' ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-appSecret">App Secret (để trống nếu không muốn thay đổi)</Label>
              <Input
                id="edit-appSecret"
                type="password"
                value={formData.appSecret}
                onChange={(e) => setFormData(prev => ({ ...prev, appSecret: e.target.value }))}
                placeholder="••••••••••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-verifyToken">Verify Token</Label>
              <Input
                id="edit-verifyToken"
                value={formData.verifyToken}
                onChange={(e) => setFormData(prev => ({ ...prev, verifyToken: e.target.value }))}
                placeholder="verify_token"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-environment">Môi trường</Label>
              <Select 
                value={formData.environment} 
                onValueChange={(value: "development" | "production" | "staging") => 
                  setFormData(prev => ({ ...prev, environment: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả về Facebook App này..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateApp} disabled={updateAppMutation.isPending}>
              {updateAppMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Edit Modal */}
      <Dialog open={isTagEditDialogOpen} onOpenChange={setIsTagEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Tags</DialogTitle>
            <DialogDescription>
              Chọn tags cho Facebook App "{editingAppForTags?.appName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isTagsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Đang tải tags...</span>
              </div>
            ) : allTags.length === 0 ? (
              <div className="text-center py-8">
                <Tags className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chưa có tags nào</p>
                <p className="text-sm text-gray-500">Tạo tags trong Tag Management trước</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {allTags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() => handleTagToggle(tag.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Badge
                          variant="outline"
                          className="text-xs shrink-0"
                          style={{ 
                            backgroundColor: `${tag.color}15`, 
                            borderColor: tag.color,
                            color: tag.color 
                          }}
                        >
                          {tag.name}
                        </Badge>
                        <span className="text-xs text-gray-500 capitalize">({tag.category})</span>
                        {tag.description && (
                          <span className="text-xs text-gray-400 truncate" title={tag.description}>
                            {tag.description}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTagEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleSaveAppTags} 
              disabled={updateAppTagsMutation.isPending || !editingAppForTags}
            >
              {updateAppTagsMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu Tags'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}