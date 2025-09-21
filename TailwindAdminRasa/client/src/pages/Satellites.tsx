import React, { useState } from 'react';
import { Satellite, Rocket, BookOpen, Users2, Target, Clock, CheckCircle } from 'lucide-react';
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
      settings: {
        autoStart: true,
        contentFiltering: 'Nội dung',
        platforms: ['facebook', 'instagram'],
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

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Rocket className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Ready to Deploy</h3>
              <p className="text-blue-700 text-sm">
                Your satellite is configured and ready. Click deploy to activate.
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