import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

// 🎯 Group Interface with Custom Quantities
interface AppGroup {
  id: string;
  name: string;
  description?: string;
  priority: number; // 1 = highest, 3 = lowest
  color: string;
  formulaId?: string;
  formulaName?: string;
  isActive: boolean;
  
  // Group-level settings
  weight: number; // Default weight for distribution
  platform: string; // "facebook", "instagram", etc.
  
  // Custom quantities per account in this group
  customQuantities: {
    defaultWeight: number; // Default weight for new accounts
    allowCustomWeight: boolean; // Can accounts have custom weights?
    defaultDailyCapOverride?: number; // Default daily cap override
    defaultCooldownMinutes?: number; // Default cooldown between posts
  };
  
  // Stats
  appsCount: number;
  accountsCount: number; // How many accounts in this group
  todayPosts: number;
  weekPosts: number;
  monthPosts: number;
  remainingQuota: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  status: "active" | "resting" | "limit_reached" | "paused";
  createdAt: string;
  updatedAt?: string;
}

// 🎯 Create Group Data with Custom Quantities
interface CreateGroupData {
  name: string;
  description?: string;
  priority: number;
  color: string;
  formulaId?: string;
  
  // Custom quantities settings
  weight: number;
  platform: string;
  customQuantities: {
    defaultWeight: number;
    allowCustomWeight: boolean;
    defaultDailyCapOverride?: number;
    defaultCooldownMinutes?: number;
  };
}

// 🎯 Account in Group with Custom Quantities
interface GroupAccount {
  id: string;
  groupId: string;
  socialAccountId: string;
  accountName: string;
  platform: string;
  
  // Custom overrides per account
  weight: number; // Custom weight for this account
  dailyCapOverride?: number; // Override daily limit
  cooldownMinutes?: number; // Custom cooldown between posts
  isActive: boolean;
  
  // Stats
  todayPosts: number;
  weekPosts: number;
  monthPosts: number;
  lastPostAt?: string;
  
  createdAt: string;
  updatedAt?: string;
}

export function GroupsManagerPanel() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AppGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for create/edit
  const [formData, setFormData] = useState<CreateGroupData>({
    name: "",
    description: "",
    priority: 2,
    color: "#22c55e",
    formulaId: "",
    weight: 1.0,
    platform: "facebook",
    customQuantities: {
      defaultWeight: 1.0,
      allowCustomWeight: true,
      defaultDailyCapOverride: undefined,
      defaultCooldownMinutes: undefined
    }
  });

  // 🎯 Load Groups (demo data for now)
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ['app-groups'],
    queryFn: async () => {
      // TODO: Replace with real API call
      const demoGroups: AppGroup[] = [
        {
          id: "group-vip",
          name: "VIP Group",
          description: "High-priority accounts with premium posting privileges",
          priority: 1,
          color: "#8b5cf6",
          formulaId: "formula-vip",
          formulaName: "Formula VIP",
          isActive: true,
          weight: 2.0,
          platform: "facebook",
          customQuantities: {
            defaultWeight: 2.0,
            allowCustomWeight: true,
            defaultDailyCapOverride: 50,
            defaultCooldownMinutes: 10
          },
          appsCount: 3,
          accountsCount: 8,
          todayPosts: 15,
          weekPosts: 89,
          monthPosts: 312,
          remainingQuota: { daily: 25, weekly: 151, monthly: 688 },
          status: "active",
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "group-normal",
          name: "Normal Group", 
          description: "Standard posting limits for regular accounts",
          priority: 2,
          color: "#3b82f6",
          formulaId: "formula-standard",
          formulaName: "Formula Standard",
          isActive: true,
          weight: 1.0,
          platform: "facebook",
          customQuantities: {
            defaultWeight: 1.0,
            allowCustomWeight: true,
            defaultDailyCapOverride: 30,
            defaultCooldownMinutes: 15
          },
          appsCount: 5,
          accountsCount: 12,
          todayPosts: 28,
          weekPosts: 156,
          monthPosts: 543,
          remainingQuota: { daily: 12, weekly: 94, monthly: 457 },
          status: "active",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "group-test",
          name: "Test Group",
          description: "Safe testing environment with conservative limits",
          priority: 3,
          color: "#22c55e",
          formulaId: "formula-safe",
          formulaName: "Formula Safe",
          isActive: true,
          weight: 0.5,
          platform: "facebook",
          customQuantities: {
            defaultWeight: 0.5,
            allowCustomWeight: false,
            defaultDailyCapOverride: 10,
            defaultCooldownMinutes: 30
          },
          appsCount: 2,
          accountsCount: 4,
          todayPosts: 8,
          weekPosts: 34,
          monthPosts: 98,
          remainingQuota: { daily: 2, weekly: 16, monthly: 52 },
          status: "resting",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      return demoGroups;
    }
  });

  // 🎯 Filter Groups
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === "all" || group.priority.toString() === priorityFilter;
    const matchesStatus = statusFilter === "all" || group.status === statusFilter;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // 🎯 Reset Form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priority: 2,
      color: "#22c55e",
      formulaId: "",
      weight: 1.0,
      platform: "facebook",
      customQuantities: {
        defaultWeight: 1.0,
        allowCustomWeight: true,
        defaultDailyCapOverride: undefined,
        defaultCooldownMinutes: undefined
      }
    });
  };

  // 🎯 Open Edit Dialog
  const openEditDialog = (group: AppGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      priority: group.priority,
      color: group.color,
      formulaId: group.formulaId || "",
      weight: group.weight,
      platform: group.platform,
      customQuantities: group.customQuantities
    });
    setIsEditDialogOpen(true);
  };

  // 🎯 Create Group Mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupData) => {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: Date.now().toString(), ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-groups'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Group Created",
        description: "New app group has been created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive"
      });
    }
  });

  // 🎯 Update Group Mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupData) => {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...editingGroup, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-groups'] });
      setIsEditDialogOpen(false);
      setEditingGroup(null);
      resetForm();
      toast({
        title: "Group Updated",
        description: "App group has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to update group. Please try again.",
        variant: "destructive"
      });
    }
  });

  // 🎯 Delete Group Mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // TODO: Replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-groups'] });
      toast({
        title: "Group Deleted",
        description: "App group has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive"
      });
    }
  });

  // 🎯 Handle Create/Update Submit
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Group name is required.",
        variant: "destructive"
      });
      return;
    }

    if (editingGroup) {
      updateGroupMutation.mutate(formData);
    } else {
      createGroupMutation.mutate(formData);
    }
  };

  // 🎯 Handle Delete
  const handleDelete = (groupId: string) => {
    if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  // 🎯 Get Priority Badge
  const getPriorityBadge = (priority: number) => {
    const config = {
      1: { label: "High", color: "bg-purple-100 text-purple-700 border-purple-300" },
      2: { label: "Normal", color: "bg-blue-100 text-blue-700 border-blue-300" },
      3: { label: "Low", color: "bg-green-100 text-green-700 border-green-300" }
    };
    
    const { label, color } = config[priority as keyof typeof config] || config[2];
    return <Badge className={`text-xs ${color}`}>{label}</Badge>;
  };

  // 🎯 Get Status Badge
  const getStatusBadge = (status: string) => {
    const config = {
      active: { icon: <CheckCircle className="w-3 h-3" />, color: "bg-green-100 text-green-700" },
      resting: { icon: <Clock className="w-3 h-3" />, color: "bg-yellow-100 text-yellow-700" },
      limit_reached: { icon: <AlertCircle className="w-3 h-3" />, color: "bg-red-100 text-red-700" },
      paused: { icon: <Target className="w-3 h-3" />, color: "bg-gray-100 text-gray-700" }
    };
    
    const { icon, color } = config[status as keyof typeof config] || config.paused;
    return (
      <Badge className={`text-xs ${color} flex items-center gap-1`}>
        {icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Groups</h3>
        <p className="text-gray-600">Failed to load app groups. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups Management</h1>
          <p className="text-gray-600 mt-1">Manage Facebook App groups, priorities, and posting limits</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Configure group settings, custom quantities, and posting limits for Facebook app management.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter group name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">High Priority</SelectItem>
                    <SelectItem value="2">Normal Priority</SelectItem>
                    <SelectItem value="3">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>

              {/* 🎯 Custom Quantities Section */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Custom Quantities & Limits
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Group Weight</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1.0 })}
                      placeholder="1.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Distribution weight (0.1-10.0)</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultWeight">Default Account Weight</Label>
                    <Input
                      id="defaultWeight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="5"
                      value={formData.customQuantities.defaultWeight}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        customQuantities: { 
                          ...formData.customQuantities, 
                          defaultWeight: parseFloat(e.target.value) || 1.0 
                        }
                      })}
                      placeholder="1.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Weight for new accounts</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="dailyCapOverride">Daily Cap Override</Label>
                    <Input
                      id="dailyCapOverride"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.customQuantities.defaultDailyCapOverride || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        customQuantities: { 
                          ...formData.customQuantities, 
                          defaultDailyCapOverride: e.target.value ? parseInt(e.target.value) : undefined 
                        }
                      })}
                      placeholder="Optional"
                    />
                    <p className="text-xs text-gray-500 mt-1">Override daily posting limit</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cooldownMinutes">Cooldown Minutes</Label>
                    <Input
                      id="cooldownMinutes"
                      type="number"
                      min="1"
                      max="1440"
                      value={formData.customQuantities.defaultCooldownMinutes || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        customQuantities: { 
                          ...formData.customQuantities, 
                          defaultCooldownMinutes: e.target.value ? parseInt(e.target.value) : undefined 
                        }
                      })}
                      placeholder="Optional"
                    />
                    <p className="text-xs text-gray-500 mt-1">Rest time between posts</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowCustomWeight"
                      checked={formData.customQuantities.allowCustomWeight}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        customQuantities: { 
                          ...formData.customQuantities, 
                          allowCustomWeight: e.target.checked 
                        }
                      })}
                      className="rounded"
                    />
                    <Label htmlFor="allowCustomWeight" className="text-sm">
                      Allow Custom Account Weights
                    </Label>
                  </div>
                </div>
              </div>

              {/* 🎯 Posting Formula Selection */}
              <div className="border-t pt-4">
                <div>
                  <Label htmlFor="formulaId">Posting Formula</Label>
                  <Select value={formData.formulaId || "none"} onValueChange={(value) => setFormData({ ...formData, formulaId: value === 'none' ? undefined : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select formula (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Formula</SelectItem>
                      <SelectItem value="formula-vip">Formula VIP - High Priority</SelectItem>
                      <SelectItem value="formula-standard">Formula Standard - Normal Limits</SelectItem>
                      <SelectItem value="formula-safe">Formula Safe - Conservative</SelectItem>
                      <SelectItem value="formula-aggressive">Formula Aggressive - Maximum Posts</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Choose posting limits and timing rules</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createGroupMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="1">High</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="3">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resting">Resting</SelectItem>
                <SelectItem value="limit_reached">Limit Reached</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Groups List */}
      <TooltipProvider>
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {groups.length === 0 ? 'No Groups Yet' : 'No Groups Found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {groups.length === 0 
                  ? 'Create your first Facebook App group to start managing posting limits'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {groups.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Group
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getPriorityBadge(group.priority)}
                          {getStatusBadge(group.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(group)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Group</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(group.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete Group</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-2">{group.description}</p>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <Users className="w-3 h-3" />
                        Apps
                      </div>
                      <div className="font-medium">{group.appsCount}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1 text-gray-600 mb-1">
                        <BarChart3 className="w-3 h-3" />
                        Today
                      </div>
                      <div className="font-medium">{group.todayPosts}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600 mb-1">Week</div>
                      <div className="font-medium">{group.weekPosts}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-600 mb-1">Month</div>
                      <div className="font-medium">{group.monthPosts}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Daily Quota Left:</span>
                      <span className={`font-medium ${
                        group.remainingQuota.daily < 5 ? 'text-orange-600' : 
                        group.remainingQuota.daily < 2 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {group.remainingQuota.daily}
                      </span>
                    </div>
                  </div>
                  
                  {group.formulaName && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        {group.formulaName}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TooltipProvider>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Modify group settings, custom quantities, and posting limits for this Facebook app group.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter group name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High Priority</SelectItem>
                  <SelectItem value="2">Normal Priority</SelectItem>
                  <SelectItem value="3">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>

            {/* 🎯 Custom Quantities Section */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Custom Quantities & Limits
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-weight">Group Weight</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1.0 })}
                    placeholder="1.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Distribution weight (0.1-10.0)</p>
                </div>
                
                <div>
                  <Label htmlFor="edit-platform">Platform</Label>
                  <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-defaultWeight">Default Account Weight</Label>
                  <Input
                    id="edit-defaultWeight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5"
                    value={formData.customQuantities.defaultWeight}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customQuantities: { 
                        ...formData.customQuantities, 
                        defaultWeight: parseFloat(e.target.value) || 1.0 
                      }
                    })}
                    placeholder="1.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Weight for new accounts</p>
                </div>
                
                <div>
                  <Label htmlFor="edit-dailyCapOverride">Daily Cap Override</Label>
                  <Input
                    id="edit-dailyCapOverride"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.customQuantities.defaultDailyCapOverride || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customQuantities: { 
                        ...formData.customQuantities, 
                        defaultDailyCapOverride: e.target.value ? parseInt(e.target.value) : undefined 
                      }
                    })}
                    placeholder="Optional"
                  />
                  <p className="text-xs text-gray-500 mt-1">Override daily posting limit</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cooldownMinutes">Cooldown Minutes</Label>
                  <Input
                    id="edit-cooldownMinutes"
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.customQuantities.defaultCooldownMinutes || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customQuantities: { 
                        ...formData.customQuantities, 
                        defaultCooldownMinutes: e.target.value ? parseInt(e.target.value) : undefined 
                      }
                    })}
                    placeholder="Optional"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rest time between posts</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-allowCustomWeight"
                    checked={formData.customQuantities.allowCustomWeight}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customQuantities: { 
                        ...formData.customQuantities, 
                        allowCustomWeight: e.target.checked 
                      }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="edit-allowCustomWeight" className="text-sm">
                    Allow Custom Account Weights
                  </Label>
                </div>
              </div>
            </div>

            {/* 🎯 Posting Formula Selection */}
            <div className="border-t pt-4">
              <div>
                <Label htmlFor="edit-formulaId">Posting Formula</Label>
                <Select value={formData.formulaId || "none"} onValueChange={(value) => setFormData({ ...formData, formulaId: value === 'none' ? undefined : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select formula (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Formula</SelectItem>
                    <SelectItem value="formula-vip">Formula VIP - High Priority</SelectItem>
                    <SelectItem value="formula-standard">Formula Standard - Normal Limits</SelectItem>
                    <SelectItem value="formula-safe">Formula Safe - Conservative</SelectItem>
                    <SelectItem value="formula-aggressive">Formula Aggressive - Maximum Posts</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Choose posting limits and timing rules</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={updateGroupMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}