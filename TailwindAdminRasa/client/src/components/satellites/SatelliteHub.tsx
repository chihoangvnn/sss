import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Satellite,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Settings,
  Rocket,
  AlertCircle,
  CheckCircle2,
  Clock,
  Pause,
  Zap,
  Users,
  Play
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import BaseSatelliteTemplate, { SatelliteConfig } from './BaseSatelliteTemplate';
import { cn } from '../../lib/utils';

interface SatelliteHubProps {
  onCreateSatellite?: () => void;
  onSatelliteClick?: (satellite: SatelliteConfig) => void;
  className?: string;
}

export default function SatelliteHub({ 
  onCreateSatellite, 
  onSatelliteClick,
  className 
}: SatelliteHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSatellite, setSelectedSatellite] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch unified tags to create satellites from
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['unified-tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json();
    },
  });

  // Filter only content category tags, then generate satellite configurations
  const contentTags = tags.filter((tag: any) => 
    tag.category === 'Nội dung' || tag.category === 'content'
  );
  
  const satellites: SatelliteConfig[] = contentTags.map((tag: any) => ({
    id: tag.id,
    name: `${tag.name} Satellite`,
    description: `Automated content management for ${tag.name.toLowerCase()} category`,
    category: tag.category,
    tag: {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color || '#3B82F6',
      icon: tag.icon,
    },
    theme: getThemeForCategory(tag.category, tag.color),
    status: getRandomStatus(),
    metrics: {
      totalContent: tag.stats?.contentCount || 0,
      totalAccounts: tag.stats?.accountCount || 0,
      scheduledPosts: Math.floor(Math.random() * 20),
      activeAccounts: Math.floor(tag.stats?.accountCount * 0.7) || 0,
    },
    lastUpdated: new Date().toISOString(),
  }));

  // Filter satellites based on search and filters
  const filteredSatellites = satellites.filter((satellite) => {
    const matchesSearch = satellite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         satellite.tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || satellite.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || satellite.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Mutation for changing satellite status
  const statusMutation = useMutation({
    mutationFn: async ({ satelliteId, newStatus }: { satelliteId: string, newStatus: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['satellites-overview'] });
    }
  });

  // Mutation for creating orchestration campaign from satellite
  const createCampaignMutation = useMutation({
    mutationFn: async (satellite: SatelliteConfig) => {
      // First, get content and accounts by tag
      const response = await fetch(`/api/satellites/by-tag/${satellite.tag.slug}?platform=all&status=all`);
      if (!response.ok) throw new Error('Failed to fetch satellite data');
      const tagData = await response.json();

      // Create strategy from satellite configuration
      const strategy = {
        templateName: satellite.name,
        templateType: 'content' as const,
        targetContent: tagData.data.contentLibrary || [],
        targetAccounts: tagData.data.socialAccounts || [],
        customizations: {
          theme: 'default',
          primaryColor: satellite.tag.color,
          platforms: ['facebook', 'instagram'], // Default platforms
          contentFrequency: 'normal' as const
        },
        schedulingRules: {
          maxPostsPerDay: 10,
          cooldownMinutes: 30,
          timezone: 'UTC'
        }
      };

      // Plan campaign with orchestrator
      const planResponse = await fetch('/api/orchestrator/plan-from-satellite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy })
      });
      
      if (!planResponse.ok) throw new Error('Failed to create campaign plan');
      const planData = await planResponse.json();

      // Execute the campaign
      const executeResponse = await fetch('/api/orchestrator/execute-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planData.plan })
      });

      if (!executeResponse.ok) throw new Error('Failed to execute campaign');
      return executeResponse.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orchestrator-campaigns'] });
      // Show success message
      console.log('Campaign created successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to create campaign:', error);
    }
  });

  // Get summary statistics
  const totalSatellites = satellites.length;
  const activeSatellites = satellites.filter(s => s.status === 'active').length;
  const totalContent = satellites.reduce((sum, s) => sum + s.metrics.totalContent, 0);
  const totalAccounts = satellites.reduce((sum, s) => sum + s.metrics.totalAccounts, 0);

  const handleSatelliteStatusChange = (satelliteId: string, newStatus: 'active' | 'paused') => {
    statusMutation.mutate({ satelliteId, newStatus });
  };

  const handleSatelliteRefresh = (satelliteId: string) => {
    queryClient.invalidateQueries({ queryKey: ['satellite-data', satelliteId] });
  };

  const handleSatelliteConfig = (satelliteId: string) => {
    console.log('Configure satellite:', satelliteId);
  };

  if (selectedSatellite) {
    const satellite = satellites.find(s => s.id === selectedSatellite);
    if (satellite) {
      return (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedSatellite(null)}
            className="mb-4"
          >
            ← Back to Satellites
          </Button>
          <BaseSatelliteTemplate
            config={satellite}
            onStatusChange={(status) => handleSatelliteStatusChange(satellite.id, status)}
            onRefresh={() => handleSatelliteRefresh(satellite.id)}
            onConfigure={() => handleSatelliteConfig(satellite.id)}
          />
        </div>
      );
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Satellite className="w-8 h-8 text-blue-600" />
            Satellite Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Deploy and manage content satellites across different categories
          </p>
        </div>
        <Button onClick={onCreateSatellite} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Deploy New Satellite
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Satellite className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSatellites}</p>
                <p className="text-xs text-muted-foreground">Total Satellites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSatellites}</p>
                <p className="text-xs text-muted-foreground">Active Satellites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Grid3X3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalContent}</p>
                <p className="text-xs text-muted-foreground">Content Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Rocket className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAccounts}</p>
                <p className="text-xs text-muted-foreground">Connected Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search satellites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="customer_pipeline">Pipeline</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Satellites Grid/List */}
      {tagsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Satellite className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading satellites...</p>
          </div>
        </div>
      ) : filteredSatellites.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Satellite className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Satellites Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Deploy your first satellite to get started'
              }
            </p>
            <Button onClick={onCreateSatellite}>
              <Plus className="w-4 h-4 mr-2" />
              Deploy New Satellite
            </Button>
          </div>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" 
            : "space-y-4"
        )}>
          {filteredSatellites.map((satellite) => (
            <SatelliteCard
              key={satellite.id}
              satellite={satellite}
              viewMode={viewMode}
              onStatusChange={(status) => handleSatelliteStatusChange(satellite.id, status)}
              onClick={() => {
                setSelectedSatellite(satellite.id);
                onSatelliteClick?.(satellite);
              }}
              onCreateCampaign={(satellite) => createCampaignMutation.mutate(satellite)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper Components
interface SatelliteCardProps {
  satellite: SatelliteConfig;
  viewMode: 'grid' | 'list';
  onStatusChange: (status: 'active' | 'paused') => void;
  onClick: () => void;
  onCreateCampaign?: (satellite: SatelliteConfig) => void;
}

function SatelliteCard({ satellite, viewMode, onStatusChange, onClick, onCreateCampaign }: SatelliteCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'deploying': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deploying': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: satellite.theme.primaryColor + '15' }}
              >
                <Satellite className="w-5 h-5" style={{ color: satellite.theme.primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {satellite.name}
                  {satellite.tag.icon && <span>{satellite.tag.icon}</span>}
                </h3>
                <p className="text-sm text-muted-foreground">{satellite.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="font-medium">{satellite.metrics.totalContent} content</p>
                <p className="text-muted-foreground">{satellite.metrics.activeAccounts} accounts</p>
              </div>
              <Badge className={getStatusColor(satellite.status)}>
                {getStatusIcon(satellite.status)}
                {satellite.status}
              </Badge>
              
              {/* Orchestrator Campaign Button */}
              <Button 
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateCampaign?.(satellite);
                }}
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                <Zap className="w-3 h-3 mr-1" />
                Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1" 
      onClick={onClick}
      style={{ borderColor: satellite.theme.primaryColor + '20' }}
    >
      <CardHeader className="pb-3" style={{ 
        background: `linear-gradient(135deg, ${satellite.theme.primaryColor}10, ${satellite.theme.secondaryColor}05)` 
      }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: satellite.theme.primaryColor + '15' }}
            >
              <Satellite className="w-5 h-5" style={{ color: satellite.theme.primaryColor }} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {satellite.name}
                {satellite.tag.icon && <span className="text-base">{satellite.tag.icon}</span>}
              </CardTitle>
              <Badge variant="outline" className="mt-1">
                {satellite.category}
              </Badge>
            </div>
          </div>
          <Badge className={getStatusColor(satellite.status)}>
            {getStatusIcon(satellite.status)}
            {satellite.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="mb-4">
          {satellite.description}
        </CardDescription>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="font-medium">{satellite.metrics.totalContent}</p>
            <p className="text-muted-foreground">Content Items</p>
          </div>
          <div>
            <p className="font-medium">{satellite.metrics.activeAccounts}</p>
            <p className="text-muted-foreground">Active Accounts</p>
          </div>
        </div>

        {/* Orchestrator Campaign Button */}
        <Button 
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onCreateCampaign?.(satellite);
          }}
          className="w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
        >
          <Zap className="w-4 h-4 mr-2" />
          Tạo Campaign với Trợ lý Giám đốc
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper Functions
function getThemeForCategory(category: string, baseColor?: string): SatelliteConfig['theme'] {
  const defaultColor = baseColor || '#3B82F6';
  
  const themes = {
    content: {
      primaryColor: '#EC4899',
      secondaryColor: '#F97316',
      accentColor: '#8B5CF6',
      gradient: 'from-pink-500 to-orange-500'
    },
    customer_pipeline: {
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      accentColor: '#06B6D4',
      gradient: 'from-emerald-500 to-cyan-500'
    },
    general: {
      primaryColor: defaultColor,
      secondaryColor: '#64748B',
      accentColor: '#6366F1',
      gradient: 'from-blue-500 to-indigo-500'
    }
  };

  return themes[category as keyof typeof themes] || themes.general;
}

function getRandomStatus(): SatelliteConfig['status'] {
  const statuses: SatelliteConfig['status'][] = ['active', 'paused', 'deploying', 'error'];
  const weights = [0.6, 0.25, 0.1, 0.05];
  
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (rand < sum) return statuses[i];
  }
  return 'active';
}