import React, { useState } from 'react';
import { Satellite, Rocket, BookOpen, Users2, Target, Clock, CheckCircle, Settings, Palette, Globe, Calendar, HelpCircle, Play } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
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
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showMainGuide, setShowMainGuide] = useState(false);

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

  const handleShowGuide = (templateName: string) => {
    setSelectedGuide(templateName);
    setShowGuide(true);
  };

  const getTemplateGuide = (templateName: string) => {
    const guides: Record<string, any> = {
      'Beauty Content Hub': {
        title: 'Beauty Content Satellite Setup Guide',
        description: 'Complete guide to automate your beauty content marketing',
        icon: '✨',
        steps: [
          {
            step: 1,
            title: 'Content Preparation',
            description: 'Set up your beauty content library',
            details: [
              'Upload high-quality beauty product photos and videos',
              'Tag content with "làm-đẹp", "skincare", "makeup" categories',
              'Write engaging captions with beauty tips and tricks',
              'Include product information and affiliate links'
            ]
          },
          {
            step: 2,
            title: 'Audience & Platform Setup',
            description: 'Configure targeting and platform preferences',
            details: [
              'Target women aged 18-45 interested in beauty and skincare',
              'Focus on visual platforms: Instagram, TikTok, Pinterest',
              'Schedule posts during peak engagement: 7-9 AM, 6-8 PM',
              'Use trending beauty hashtags: #skincare #makeup #beautytips #vietnamese'
            ]
          },
          {
            step: 3,
            title: 'Automation Rules',
            description: 'Set up intelligent posting and engagement',
            details: [
              'Post 2-3 times daily: morning routine, evening skincare, product highlights',
              'Auto-engage with comments about skin concerns and product questions',
              'Track performance: saves, shares, comments, click-through rates',
              'A/B test different content formats: tutorials vs. before/after posts'
            ]
          }
        ]
      },
      'Fitness & Sports Hub': {
        title: 'Fitness & Sports Satellite Setup Guide',
        description: 'Build an engaged fitness community with automation',
        icon: '💪',
        steps: [
          {
            step: 1,
            title: 'Workout Content Creation',
            description: 'Build your fitness content library',
            details: [
              'Create 30-60 second workout demonstration videos',
              'Tag with "fitness", "workout", "health", "exercise" categories',
              'Include proper form instructions and safety tips',
              'Add motivational quotes and progress tracking tips'
            ]
          },
          {
            step: 2,
            title: 'Community Targeting',
            description: 'Reach fitness enthusiasts effectively',
            details: [
              'Target active individuals aged 25-50',
              'Peak times: 6-8 AM (pre-workout motivation), 6-9 PM (post-work fitness)',
              'Platforms: Instagram Stories, Facebook Groups, TikTok fitness challenges',
              'Use fitness hashtags: #fitness #workout #motivation #vietnam #healthylife'
            ]
          },
          {
            step: 3,
            title: 'Engagement Strategy',
            description: 'Build motivation and community',
            details: [
              'Share weekly fitness challenges and goals',
              'Celebrate member achievements and transformations',
              'Provide workout modifications for different fitness levels',
              'Monitor which exercises get most engagement and shares'
            ]
          }
        ]
      },
      'VIP Customer Hub': {
        title: 'VIP Customer Management Guide',
        description: 'Automate premium customer relationship management',
        icon: '👑',
        steps: [
          {
            step: 1,
            title: 'VIP Customer Identification',
            description: 'Set criteria for VIP recognition',
            details: [
              'Define VIP tiers: purchase amount, frequency, engagement level',
              'Tag high-value customers in your CRM system',
              'Track customer lifetime value and loyalty metrics',
              'Set up automated VIP welcome and recognition sequences'
            ]
          },
          {
            step: 2,
            title: 'Personalized Experiences',
            description: 'Create exclusive VIP communication',
            details: [
              'Send personalized product recommendations based on history',
              'Offer early access to new products and exclusive deals',
              'Provide priority customer support and dedicated channels',
              'Create VIP-only content and behind-the-scenes access'
            ]
          },
          {
            step: 3,
            title: 'Retention & Loyalty',
            description: 'Keep VIP customers engaged long-term',
            details: [
              'Schedule regular check-ins and satisfaction surveys',
              'Offer birthday and anniversary special treatments',
              'Create referral rewards for VIP customers',
              'Monitor VIP engagement and adjust strategies based on feedback'
            ]
          }
        ]
      },
      'Follow-up Hub': {
        title: 'Customer Follow-up Automation Guide',
        description: 'Never miss a customer touchpoint with smart automation',
        icon: '📞',
        steps: [
          {
            step: 1,
            title: 'Follow-up Triggers',
            description: 'Set up automated follow-up conditions',
            details: [
              'Purchase confirmations: Immediate thank you and order details',
              'Delivery updates: Shipping notifications and tracking info',
              'Post-purchase: Product usage tips and satisfaction check',
              'Inquiry responses: Answer questions and provide additional information'
            ]
          },
          {
            step: 2,
            title: 'Timing Strategy',
            description: 'Optimize follow-up timing for best results',
            details: [
              'Immediate (0-1 hour): Order confirmation and thank you',
              'Short-term (1-3 days): Shipping updates and usage tips',
              'Medium-term (1-2 weeks): Satisfaction survey and review request',
              'Long-term (1-3 months): Repurchase reminders and loyalty offers'
            ]
          },
          {
            step: 3,
            title: 'Personalization',
            description: 'Make every follow-up relevant and valuable',
            details: [
              'Use customer name and purchase history in messages',
              'Recommend related products based on previous purchases',
              'Segment customers by behavior, preferences, and purchase patterns',
              'Test different message tones and timing for optimal response'
            ]
          }
        ]
      }
    };
    
    return guides[templateName] || null;
  };

  const getMainSystemGuide = () => {
    return {
      title: 'Satellite System Complete Guide',
      description: 'Master your automated social media management system',
      icon: '🚀',
      sections: [
        {
          title: 'Getting Started',
          icon: '🌟',
          steps: [
            'Navigate to the Satellite Hub to see your automated content satellites',
            'Browse available satellite templates in the Templates section',
            'Each satellite represents automated content management for specific niches',
            'Templates are pre-configured for different industries and customer segments'
          ]
        },
        {
          title: 'Choosing Your Satellite',
          icon: '🎯',
          steps: [
            'Content Satellites: Beauty, Fitness, Health, Mindfulness - for niche content automation',
            'Customer Pipeline Satellites: VIP Management, Follow-up Hub - for customer relationship automation',
            'Click the info (📖) icon on any template to see detailed setup instructions',
            'Consider your target audience and business goals when selecting'
          ]
        },
        {
          title: 'Customization & Setup',
          icon: '⚙️',
          steps: [
            'Click "Deploy Satellite" to start customization process',
            'Choose your theme: Modern, Classic, or Minimal design',
            'Select primary color to match your brand identity',
            'Pick target platforms: Facebook, Instagram, Twitter, TikTok',
            'Set posting frequency: Hourly, Daily, Weekly, or Custom schedule',
            'Enable auto-optimization for best posting times'
          ]
        },
        {
          title: 'Content Management',
          icon: '📝',
          steps: [
            'Satellites automatically filter content by "Nội dung" (content) category tags',
            'Upload your content to the Content Library with appropriate tags',
            'Each satellite pulls relevant content based on its specialization',
            'AI variations are generated automatically for different platforms'
          ]
        },
        {
          title: 'Deployment & Monitoring',
          icon: '🚀',
          steps: [
            'Review your configuration in the preview section',
            'Click "Deploy Satellite" to activate automated posting',
            'Monitor performance in the Satellite Hub dashboard',
            'Adjust settings anytime through the customization interface',
            'Track engagement, reach, and conversion metrics'
          ]
        },
        {
          title: 'Best Practices',
          icon: '💡',
          steps: [
            'Start with 1-2 satellites to learn the system before scaling',
            'Use high-quality, tagged content for best results',
            'Monitor audience engagement and adjust posting schedules',
            'Combine content satellites with customer pipeline satellites for complete automation',
            'Review and update your satellite configurations monthly'
          ]
        }
      ]
    };
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <BookOpen className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">{getTemplateGuide(config.name)?.icon}</span>
                            {getTemplateGuide(config.name)?.title}
                          </DialogTitle>
                          <DialogDescription>
                            {getTemplateGuide(config.name)?.description}
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                          <div className="space-y-6 pr-6">
                            {getTemplateGuide(config.name)?.steps.map((step: any, index: number) => (
                              <div key={step.step} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                                    {step.step}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg">{step.title}</h3>
                                    <p className="text-muted-foreground text-sm">{step.description}</p>
                                  </div>
                                </div>
                                <div className="ml-11 space-y-2">
                                  {step.details.map((detail: string, detailIndex: number) => (
                                    <div key={detailIndex} className="flex items-start gap-2 text-sm">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                      <span>{detail}</span>
                                    </div>
                                  ))}
                                </div>
                                {index < getTemplateGuide(config.name)!.steps.length - 1 && (
                                  <Separator className="ml-4 mt-4" />
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <BookOpen className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">{getTemplateGuide(config.name)?.icon}</span>
                            {getTemplateGuide(config.name)?.title}
                          </DialogTitle>
                          <DialogDescription>
                            {getTemplateGuide(config.name)?.description}
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                          <div className="space-y-6 pr-6">
                            {getTemplateGuide(config.name)?.steps.map((step: any, index: number) => (
                              <div key={step.step} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                                    {step.step}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg">{step.title}</h3>
                                    <p className="text-muted-foreground text-sm">{step.description}</p>
                                  </div>
                                </div>
                                <div className="ml-11 space-y-2">
                                  {step.details.map((detail: string, detailIndex: number) => (
                                    <div key={detailIndex} className="flex items-start gap-2 text-sm">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                      <span>{detail}</span>
                                    </div>
                                  ))}
                                </div>
                                {index < getTemplateGuide(config.name)!.steps.length - 1 && (
                                  <Separator className="ml-4 mt-4" />
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
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
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Satellite System</h1>
            <p className="text-muted-foreground">
              Deploy and manage content satellites for automated social media management
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4" />
                Quick Start Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getMainSystemGuide().icon}</span>
                  {getMainSystemGuide().title}
                </DialogTitle>
                <DialogDescription>
                  {getMainSystemGuide().description}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-8 pr-6">
                  {getMainSystemGuide().sections.map((section: any, sectionIndex: number) => (
                    <div key={sectionIndex} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <span className="text-2xl">{section.icon}</span>
                        <h2 className="text-xl font-bold">{section.title}</h2>
                      </div>
                      <div className="grid gap-3">
                        {section.steps.map((step: string, stepIndex: number) => (
                          <div key={stepIndex} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-xs">
                              {stepIndex + 1}
                            </div>
                            <p className="text-sm leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h3 className="font-semibold text-blue-900 mb-2">Ready to get started?</h3>
                    <p className="text-blue-800 text-sm mb-3">
                      Begin by exploring the Satellite Hub to see your current satellites, then visit Templates to deploy your first automated content satellite.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setActiveView('hub')}>
                        View Satellite Hub
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setActiveView('templates')}>
                        Browse Templates
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
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