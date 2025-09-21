import React, { useState } from 'react';
import { Satellite, Rocket, BookOpen, Users2, Target, Clock, CheckCircle, Settings, Palette, Globe, Calendar } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import SatelliteHub from '@/components/satellites/SatelliteHub';
import { 
  BeautyContentSatellite,
  FitnessSportsSatellite,
  HealthyLivingSatellite,
  MeditationSatellite,
  VIPCustomerSatellite,
  FollowUpSatellite,
  getSatelliteConfigsByCategory
} from '../components/satellites/SatelliteInstances';

export default function Satellites() {
  const [activeView, setActiveView] = useState<'hub' | 'templates' | 'deploy'>('hub');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    theme: 'modern',
    primaryColor: '#10B981',
    platforms: ['facebook', 'instagram'],
    contentFrequency: 'daily',
    autoOptimize: true,
    targetAudience: 'general'
  });

  const satelliteConfigs = getSatelliteConfigsByCategory();

  const handleCreateSatellite = () => {
    setActiveView('templates');
  };

  const handleDeployTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    setActiveView('deploy');
    setDeploySuccess(false);
  };

  // Deployment mutation
  const deployMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await fetch('/api/satellites/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName: selectedTemplate,
          templateData,
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error('Deployment failed');
      return response.json();
    },
    onSuccess: () => {
      setDeploySuccess(true);
      setIsDeploying(false);
      // Auto redirect back to hub after 3 seconds
      setTimeout(() => {
        setActiveView('hub');
        setSelectedTemplate(null);
        setDeploySuccess(false);
      }, 3000);
    },
    onError: () => {
      setIsDeploying(false);
    }
  });

  const handleActualDeploy = async () => {
    if (!selectedTemplate || isDeploying) return;
    
    setIsDeploying(true);
    // Simulate deployment with template configuration
    const templateConfig = satelliteConfigs.content.find(c => c.name === selectedTemplate) ||
                          satelliteConfigs.customer_pipeline.find(c => c.name === selectedTemplate);
    
    deployMutation.mutate({
      template: selectedTemplate,
      config: templateConfig,
      customizations: customSettings,
      settings: {
        autoStart: true,
        contentFiltering: 'Nội dung',
        ...customSettings
      }
    });
  };

  const handleSaveDraft = () => {
    console.log('Saving as draft:', selectedTemplate);
    // TODO: Implement draft saving functionality
  };

  const renderTemplateView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Satellite Templates</h2>
          <p className="text-muted-foreground">Choose a template to customize and deploy</p>
        </div>
        <Button variant="outline" onClick={() => setActiveView('hub')}>
          ← Back to Hub
        </Button>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Content Satellites
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Customer Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {satelliteConfigs.content.map((config) => (
              <Card key={config.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: config.color + '15' }}
                    >
                      <span className="text-xl">{config.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                      </CardTitle>
                      <Badge variant="outline">Content</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {config.description}
                  </CardDescription>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => handleDeployTemplate(config.name)}
                      className="flex-1"
                      style={{ backgroundColor: config.color }}
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Deploy Satellite
                    </Button>
                    <Button variant="outline">
                      <BookOpen className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {satelliteConfigs.customer_pipeline.map((config) => (
              <Card key={config.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: config.color + '15' }}
                    >
                      <span className="text-xl">{config.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                      </CardTitle>
                      <Badge variant="outline">Pipeline</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {config.description}
                  </CardDescription>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => handleDeployTemplate(config.name)}
                      className="flex-1"
                      style={{ backgroundColor: config.color }}
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Deploy Satellite
                    </Button>
                    <Button variant="outline">
                      <BookOpen className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderDeployView = () => {
    if (!selectedTemplate) return null;

    // Find the template component based on selection
    const getTemplateComponent = () => {
      switch (selectedTemplate) {
        case 'Beauty Content Hub':
          return <BeautyContentSatellite />;
        case 'Fitness & Sports Hub':
          return <FitnessSportsSatellite />;
        case 'Healthy Living Hub':
          return <HealthyLivingSatellite />;
        case 'Mindfulness Hub':
          return <MeditationSatellite />;
        case 'VIP Customer Hub':
          return <VIPCustomerSatellite />;
        case 'Follow-up Hub':
          return <FollowUpSatellite />;
        default:
          return <BeautyContentSatellite />;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Deploy: {selectedTemplate}</h2>
            <p className="text-muted-foreground">Configure and deploy your satellite</p>
          </div>
          <Button variant="outline" onClick={() => setActiveView('templates')}>
            ← Back to Templates
          </Button>
        </div>

        {/* Customization Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme & Design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Theme Style</label>
                <div className="flex gap-2">
                  {['modern', 'classic', 'minimal'].map(theme => (
                    <Button
                      key={theme}
                      variant={customSettings.theme === theme ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCustomSettings({...customSettings, theme})}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Primary Color</label>
                <div className="flex gap-2">
                  {['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        customSettings.primaryColor === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCustomSettings({...customSettings, primaryColor: color})}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Platforms & Targeting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Active Platforms</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{id: 'facebook', name: 'Facebook'}, {id: 'instagram', name: 'Instagram'}, {id: 'twitter', name: 'Twitter'}, {id: 'tiktok', name: 'TikTok'}].map(platform => (
                    <label key={platform.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={customSettings.platforms.includes(platform.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomSettings({...customSettings, platforms: [...customSettings.platforms, platform.id]});
                          } else {
                            setCustomSettings({...customSettings, platforms: customSettings.platforms.filter(p => p !== platform.id)});
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{platform.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Target Audience</label>
                <select
                  value={customSettings.targetAudience}
                  onChange={(e) => setCustomSettings({...customSettings, targetAudience: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="general">General Audience</option>
                  <option value="young-adults">Young Adults (18-30)</option>
                  <option value="professionals">Professionals (25-45)</option>
                  <option value="seniors">Seniors (50+)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Content & Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Posting Frequency</label>
              <select
                value={customSettings.contentFrequency}
                onChange={(e) => setCustomSettings({...customSettings, contentFrequency: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom Schedule</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={customSettings.autoOptimize}
                onChange={(e) => setCustomSettings({...customSettings, autoOptimize: e.target.checked})}
                className="rounded"
              />
              <label className="text-sm font-medium">Auto-optimize posting times</label>
            </div>
            <div className="text-sm">
              <strong>Content Source:</strong> {selectedTemplate} Tag
              <br />
              <span className="text-muted-foreground">Posts will be filtered by content category</span>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Configuration Complete</h3>
              <p className="text-green-700 text-sm">
                Satellite configured for {customSettings.platforms.length} platform(s) with {customSettings.contentFrequency} posting.
              </p>
            </div>
          </div>
        </Card>

        {/* Live Preview of Satellite */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Live Preview</h3>
          {getTemplateComponent()}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t">
          <Button 
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            onClick={handleActualDeploy}
            disabled={isDeploying || deploySuccess}
          >
            {isDeploying ? (
              <><Clock className="w-4 h-4 animate-spin" />Deploying...</>
            ) : deploySuccess ? (
              <><CheckCircle className="w-4 h-4" />Deployed!</>
            ) : (
              <><Rocket className="w-4 h-4" />Deploy Satellite</>
            )}
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isDeploying}>
            Save as Draft
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6" data-testid="page-satellites">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Satellite className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Satellite System</h1>
            <p className="text-muted-foreground">
              Deploy and manage content satellites for automated social media management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList>
          <TabsTrigger value="hub" className="flex items-center gap-2">
            <Satellite className="h-4 w-4" />
            Satellite Hub
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hub" className="mt-6">
          <SatelliteHub onCreateSatellite={handleCreateSatellite} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          {renderTemplateView()}
        </TabsContent>

        <TabsContent value="deploy" className="mt-6">
          {renderDeployView()}
        </TabsContent>
      </Tabs>
    </div>
  );
}