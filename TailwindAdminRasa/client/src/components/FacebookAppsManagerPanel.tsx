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
  Upload
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface FacebookApp {
  id: string;
  appName: string;
  appId: string;
  appSecret: string;
  appSecretSet: boolean;
  webhookUrl: string;
  verifyToken: string;
  environment: "development" | "production" | "staging";
  description?: string;
  subscriptionFields: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
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
  const [editingApp, setEditingApp] = useState<FacebookApp | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
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

  const handleDeleteApp = (id: string) => {
    deleteAppMutation.mutate(id);
  };

  const handleToggleStatus = (id: string, isActive: boolean) => {
    toggleStatusMutation.mutate({ id, isActive });
  };

  const toggleSecretVisibility = (appId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
  };

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
              Thêm Facebook App
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Facebook App mới</DialogTitle>
              <DialogDescription>
                Tạo cấu hình mới cho Facebook App và webhook
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Tên App *</Label>
                <Input
                  id="appName"
                  value={formData.appName}
                  onChange={(e) => setFormData(prev => ({ ...prev, appName: e.target.value }))}
                  placeholder="My Facebook App"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appId">App ID *</Label>
                <Input
                  id="appId"
                  value={formData.appId}
                  onChange={(e) => setFormData(prev => ({ ...prev, appId: e.target.value }))}
                  placeholder="123456789012345"
                />
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
                    Đang tạo...
                  </>
                ) : (
                  'Tạo App'
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

      {/* Apps List */}
      <div className="space-y-4">
        {filteredApps.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {apps.length === 0 ? 'Chưa có Facebook App nào' : 'Không tìm thấy kết quả'}
              </h3>
              <p className="text-gray-600 mb-4">
                {apps.length === 0 
                  ? 'Thêm Facebook App đầu tiên để bắt đầu quản lý webhook'
                  : 'Thử điều chỉnh bộ lọc để tìm Facebook App mong muốn'
                }
              </p>
              {apps.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Facebook App đầu tiên
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredApps.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{app.appName}</h3>
                      <Badge variant={getEnvironmentBadgeVariant(app.environment)}>
                        {app.environment}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={app.isActive}
                          onCheckedChange={(checked) => handleToggleStatus(app.id, checked)}
                          disabled={toggleStatusMutation.isPending}
                        />
                        <span className="text-sm text-gray-600">
                          {app.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>
                    
                    {app.description && (
                      <p className="text-gray-600 mb-4">{app.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* App ID */}
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-700">App ID</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {app.appId}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(app.appId, 'App ID')}
                            className="h-6 w-6 p-0"
                          >
                            {copied === 'App ID' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* App Secret */}
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-700">App Secret</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {showSecrets[app.id] ? app.appSecret : '••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSecretVisibility(app.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showSecrets[app.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          {app.appSecretSet && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(app.appSecret, 'App Secret')}
                              className="h-6 w-6 p-0"
                            >
                              {copied === 'App Secret' ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Verify Token */}
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-700">Verify Token</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {app.verifyToken}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(app.verifyToken, 'Verify Token')}
                            className="h-6 w-6 p-0"
                          >
                            {copied === 'Verify Token' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Webhook URL */}
                      <div className="space-y-1 md:col-span-2 lg:col-span-3">
                        <Label className="text-sm font-medium text-gray-700">Webhook URL</Label>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono flex-1 truncate">
                            {app.webhookUrl}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(app.webhookUrl, 'Webhook URL')}
                            className="h-6 w-6 p-0"
                          >
                            {copied === 'Webhook URL' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(app.webhookUrl, '_blank')}
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                      Tạo lúc: {new Date(app.createdAt).toLocaleString('vi-VN')}
                      {app.updatedAt && (
                        <> • Cập nhật: {new Date(app.updatedAt).toLocaleString('vi-VN')}</>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditApp(app)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
    </div>
  );
}