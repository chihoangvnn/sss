import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Type, 
  Layout, 
  Accessibility, 
  Brain,
  Eye,
  Smartphone,
  Monitor,
  Save,
  Undo,
  Copy,
  AlertTriangle,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react';

// Advanced Theme Configuration Interface
export interface AdvancedThemeConfig {
  id?: string;
  name: string;
  description?: string;
  
  // Color Palette
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  
  // Typography
  typography: {
    fontFamily: string;
    headingWeight: string;
    bodyWeight: string;
    fontSize: {
      base: string;
      mobile: string;
    };
  };
  
  // Spacing & Layout
  spacing: {
    containerPadding: string;
    sectionSpacing: string;
    cardRadius: string;
    buttonRadius: string;
  };
  
  // Component Styles
  componentStyles: {
    buttons: {
      style: 'solid' | 'outline' | 'ghost';
      shadow: boolean;
    };
    cards: {
      shadow: 'none' | 'sm' | 'medium' | 'lg';
      border: boolean;
    };
    reviews: {
      style: 'shopee' | 'minimal' | 'elegant';
      avatarBorder: boolean;
    };
  };
  
  // Brand Guidelines
  brandGuidelines: {
    logo?: string;
    brandColors: string[];
    industry?: string;
    personality: string[];
  };
  
  // Accessibility
  accessibility: {
    contrastRatio: number;
    focusVisible: boolean;
    reducedMotion: boolean;
    fontSize: {
      min: string;
      max: string;
    };
  };
  
  // Psychology & Conversion
  psychology: {
    urgencyColor: string;
    trustColor: string;
    ctaColor: string;
    conversionFocus: 'high' | 'medium' | 'low';
  };
}

// Preset Themes Data
const PRESET_THEMES: Partial<AdvancedThemeConfig>[] = [
  {
    name: "Shopee Orange",
    description: "High-conversion e-commerce theme với vibrant orange colors",
    colorPalette: {
      primary: "#FF6B35",
      secondary: "#F7931E",
      accent: "#FF8C42",
      success: "#28A745",
      warning: "#FFC107",
      danger: "#DC3545",
      background: "#FFFFFF",
      surface: "#F8F9FA",
      text: "#212529",
      textMuted: "#6C757D"
    },
    psychology: {
      urgencyColor: "#DC3545",
      trustColor: "#28A745",
      ctaColor: "#FF6B35",
      conversionFocus: 'high' as const
    },
    brandGuidelines: {
      brandColors: ["#FF6B35", "#F7931E"],
      industry: "ecommerce",
      personality: ["energetic", "trustworthy", "urgent"]
    }
  },
  {
    name: "Luxury Purple",
    description: "Premium theme cho luxury brands với purple accents",
    colorPalette: {
      primary: "#8B5CF6",
      secondary: "#EC4899",
      accent: "#A855F7",
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      text: "#1F2937",
      textMuted: "#6B7280"
    },
    psychology: {
      urgencyColor: "#EF4444",
      trustColor: "#10B981",
      ctaColor: "#8B5CF6",
      conversionFocus: 'medium' as const
    },
    brandGuidelines: {
      brandColors: ["#8B5CF6", "#EC4899"],
      industry: "luxury",
      personality: ["premium", "elegant", "sophisticated"]
    }
  },
  {
    name: "Modern Teal",
    description: "Professional theme với teal colors cho tech/service companies",
    colorPalette: {
      primary: "#0891B2",
      secondary: "#06B6D4",
      accent: "#0284C7",
      success: "#16A34A",
      warning: "#CA8A04",
      danger: "#DC2626",
      background: "#FFFFFF",
      surface: "#F9FAFB",
      text: "#111827",
      textMuted: "#6B7280"
    },
    psychology: {
      urgencyColor: "#DC2626",
      trustColor: "#16A34A",
      ctaColor: "#0891B2",
      conversionFocus: 'medium' as const
    },
    brandGuidelines: {
      brandColors: ["#0891B2", "#06B6D4"],
      industry: "tech",
      personality: ["professional", "trustworthy", "modern"]
    }
  },
  {
    name: "Sale Red",
    description: "Extreme conversion theme với red psychology cho flash sales",
    colorPalette: {
      primary: "#EF4444",
      secondary: "#F59E0B",
      accent: "#DC2626",
      success: "#059669",
      warning: "#D97706",
      danger: "#B91C1C",
      background: "#FFFBEB",
      surface: "#FEF3C7",
      text: "#1F2937",
      textMuted: "#4B5563"
    },
    psychology: {
      urgencyColor: "#B91C1C",
      trustColor: "#059669",
      ctaColor: "#EF4444",
      conversionFocus: 'high' as const
    },
    brandGuidelines: {
      brandColors: ["#EF4444", "#F59E0B"],
      industry: "ecommerce",
      personality: ["urgent", "exciting", "limited-time"]
    }
  }
];

// Default Theme Configuration
const DEFAULT_THEME: AdvancedThemeConfig = {
  name: "Custom Theme",
  description: "",
  colorPalette: {
    primary: "#007bff",
    secondary: "#6c757d",
    accent: "#17a2b8",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
    background: "#ffffff",
    surface: "#f8f9fa",
    text: "#212529",
    textMuted: "#6c757d"
  },
  typography: {
    fontFamily: "Nunito Sans",
    headingWeight: "700",
    bodyWeight: "400",
    fontSize: {
      base: "16px",
      mobile: "14px"
    }
  },
  spacing: {
    containerPadding: "1rem",
    sectionSpacing: "3rem",
    cardRadius: "8px",
    buttonRadius: "6px"
  },
  componentStyles: {
    buttons: {
      style: 'solid',
      shadow: true
    },
    cards: {
      shadow: 'medium',
      border: false
    },
    reviews: {
      style: 'shopee',
      avatarBorder: true
    }
  },
  brandGuidelines: {
    brandColors: [],
    personality: []
  },
  accessibility: {
    contrastRatio: 4.5,
    focusVisible: true,
    reducedMotion: false,
    fontSize: {
      min: "14px",
      max: "24px"
    }
  },
  psychology: {
    urgencyColor: "#dc3545",
    trustColor: "#28a745",
    ctaColor: "#007bff",
    conversionFocus: 'medium'
  }
};

interface AdvancedThemeBuilderProps {
  initialConfig?: Partial<AdvancedThemeConfig>;
  onThemeChange?: (config: AdvancedThemeConfig) => void;
  onSave?: (config: AdvancedThemeConfig) => void;
  isPreviewMode?: boolean;
}

export default function AdvancedThemeBuilder({ 
  initialConfig, 
  onThemeChange, 
  onSave,
  isPreviewMode = false
}: AdvancedThemeBuilderProps) {
  const [themeConfig, setThemeConfig] = useState<AdvancedThemeConfig>({
    ...DEFAULT_THEME,
    ...initialConfig
  });

  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop');
  const [originalConfig] = useState<AdvancedThemeConfig>({ ...DEFAULT_THEME, ...initialConfig });
  
  // Update theme configuration
  const updateTheme = useCallback((updates: Partial<AdvancedThemeConfig>) => {
    const newConfig = { ...themeConfig, ...updates };
    setThemeConfig(newConfig);
    onThemeChange?.(newConfig);
  }, [themeConfig, onThemeChange]);

  // Apply preset theme
  const applyPreset = useCallback((preset: Partial<AdvancedThemeConfig>) => {
    const mergedConfig = { ...themeConfig, ...preset };
    setThemeConfig(mergedConfig);
    onThemeChange?.(mergedConfig);
    setActivePreset(preset.name || '');
  }, [themeConfig, onThemeChange]);

  // Reset theme to original/default
  const resetTheme = useCallback(() => {
    setThemeConfig(originalConfig);
    onThemeChange?.(originalConfig);
    setActivePreset(null);
  }, [originalConfig, onThemeChange]);

  // Duplicate theme (copy to clipboard)
  const duplicateTheme = useCallback(async () => {
    try {
      const configJson = JSON.stringify(themeConfig, null, 2);
      await navigator.clipboard.writeText(configJson);
      // In a real app, you might show a toast notification here
      console.log('Theme configuration copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy theme configuration:', error);
      // Fallback: log the configuration for manual copy
      console.log('Theme Configuration:', themeConfig);
    }
  }, [themeConfig]);

  // WCAG 2.1 Color accessibility checker - Proper relative luminance algorithm
  const getRelativeLuminance = useCallback((color: string): number => {
    // Parse hex color to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Apply sRGB gamma correction (WCAG 2.1 formula)
    const sRGBtoLinear = (val: number) => {
      if (val <= 0.03928) {
        return val / 12.92;
      }
      return Math.pow((val + 0.055) / 1.055, 2.4);
    };
    
    const rLinear = sRGBtoLinear(r);
    const gLinear = sRGBtoLinear(g);
    const bLinear = sRGBtoLinear(b);
    
    // Calculate relative luminance with WCAG coefficients
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }, []);

  const checkContrast = useCallback((color1: string, color2: string): number => {
    const l1 = getRelativeLuminance(color1);
    const l2 = getRelativeLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    // WCAG contrast ratio formula
    return (lighter + 0.05) / (darker + 0.05);
  }, [getRelativeLuminance]);

  const contrastRatio = useMemo(() => 
    checkContrast(themeConfig.colorPalette.text, themeConfig.colorPalette.background),
    [themeConfig.colorPalette.text, themeConfig.colorPalette.background, checkContrast]
  );

  const isAccessible = contrastRatio >= 4.5;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Advanced Theme Builder
          </h2>
          <p className="text-muted-foreground">
            Customize every aspect of your landing page design với comprehensive theming system
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('desktop')}
              className="h-8"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mobile')}
              className="h-8"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Action Buttons */}
          <Button variant="outline" size="sm" onClick={resetTheme}>
            <Undo className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={duplicateTheme}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button onClick={() => onSave?.(themeConfig)} size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save Theme
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theme Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="presets" className="space-y-6">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="psychology">Psychology</TabsTrigger>
            </TabsList>

            {/* Preset Themes */}
            <TabsContent value="presets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Conversion-Optimized Presets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRESET_THEMES.map((preset, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          activePreset === preset.name ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-8 h-8 rounded-full shadow-sm"
                            style={{ backgroundColor: preset.colorPalette?.primary }}
                          />
                          <div>
                            <h3 className="font-semibold">{preset.name}</h3>
                            <p className="text-sm text-muted-foreground">{preset.description}</p>
                          </div>
                        </div>
                        
                        {/* Color Preview */}
                        <div className="flex gap-1 mb-2">
                          {preset.colorPalette && Object.values(preset.colorPalette).slice(0, 6).map((color, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 rounded-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        
                        {/* Personality Tags */}
                        <div className="flex gap-1 flex-wrap">
                          {preset.brandGuidelines?.personality?.map((trait, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {trait}
                            </Badge>
                          )) || []}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Color Palette */}
            <TabsContent value="colors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Color Palette
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Primary Colors */}
                  <div>
                    <h3 className="font-semibold mb-4">Primary Colors</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(['primary', 'secondary', 'accent'] as const).map((colorKey) => (
                        <div key={colorKey} className="space-y-2">
                          <Label className="capitalize">{colorKey}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={themeConfig.colorPalette[colorKey]}
                              onChange={(e) => updateTheme({
                                colorPalette: {
                                  ...themeConfig.colorPalette,
                                  [colorKey]: e.target.value
                                }
                              })}
                              className="w-16 h-10 p-1 rounded"
                            />
                            <Input
                              value={themeConfig.colorPalette[colorKey]}
                              onChange={(e) => updateTheme({
                                colorPalette: {
                                  ...themeConfig.colorPalette,
                                  [colorKey]: e.target.value
                                }
                              })}
                              className="flex-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Semantic Colors */}
                  <div>
                    <h3 className="font-semibold mb-4">Semantic Colors</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {(['success', 'warning', 'danger'] as const).map((colorKey) => (
                        <div key={colorKey} className="space-y-2">
                          <Label className="capitalize">{colorKey}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={themeConfig.colorPalette[colorKey]}
                              onChange={(e) => updateTheme({
                                colorPalette: {
                                  ...themeConfig.colorPalette,
                                  [colorKey]: e.target.value
                                }
                              })}
                              className="w-16 h-10 p-1 rounded"
                            />
                            <Input
                              value={themeConfig.colorPalette[colorKey]}
                              onChange={(e) => updateTheme({
                                colorPalette: {
                                  ...themeConfig.colorPalette,
                                  [colorKey]: e.target.value
                                }
                              })}
                              className="flex-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Surface Colors */}
                  <div>
                    <h3 className="font-semibold mb-4">Surface & Text Colors</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {(['background', 'surface', 'text', 'textMuted'] as const).map((colorKey) => (
                        <div key={colorKey} className="space-y-2">
                          <Label className="capitalize">{colorKey.replace(/([A-Z])/g, ' $1')}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={themeConfig.colorPalette[colorKey]}
                              onChange={(e) => updateTheme({
                                colorPalette: {
                                  ...themeConfig.colorPalette,
                                  [colorKey]: e.target.value
                                }
                              })}
                              className="w-16 h-10 p-1 rounded"
                            />
                            <Input
                              value={themeConfig.colorPalette[colorKey]}
                              onChange={(e) => updateTheme({
                                colorPalette: {
                                  ...themeConfig.colorPalette,
                                  [colorKey]: e.target.value
                                }
                              })}
                              className="flex-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Psychology & Conversion */}
            <TabsContent value="psychology" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Psychology & Conversion Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Conversion Colors */}
                  <div>
                    <h3 className="font-semibold mb-4">Conversion Colors</h3>
                    <div className="space-y-4">
                      {([
                        { key: 'ctaColor' as const, label: 'Call-to-Action', description: 'Primary action buttons' },
                        { key: 'urgencyColor' as const, label: 'Urgency', description: 'Limited time offers, stock alerts' },
                        { key: 'trustColor' as const, label: 'Trust', description: 'Badges, reviews, guarantees' }
                      ]).map(({ key, label, description }) => (
                        <div key={key} className="space-y-2">
                          <div>
                            <Label>{label}</Label>
                            <p className="text-sm text-muted-foreground">{description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={themeConfig.psychology[key]}
                              onChange={(e) => updateTheme({
                                psychology: {
                                  ...themeConfig.psychology,
                                  [key]: e.target.value
                                }
                              })}
                              className="w-16 h-10 p-1 rounded"
                            />
                            <Input
                              value={themeConfig.psychology[key]}
                              onChange={(e) => updateTheme({
                                psychology: {
                                  ...themeConfig.psychology,
                                  [key]: e.target.value
                                }
                              })}
                              className="flex-1 font-mono text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Conversion Focus */}
                  <div>
                    <h3 className="font-semibold mb-4">Conversion Focus</h3>
                    <Select
                      value={themeConfig.psychology.conversionFocus}
                      onValueChange={(value: 'high' | 'medium' | 'low') => updateTheme({
                        psychology: {
                          ...themeConfig.psychology,
                          conversionFocus: value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High - Maximum urgency & conversion</SelectItem>
                        <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                        <SelectItem value="low">Low - Subtle, premium feel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview & Accessibility Panel */}
        <div className="space-y-6">
          {/* Accessibility Checker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="h-5 w-5" />
                Accessibility Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contrast Ratio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Contrast Ratio</Label>
                  <div className="flex items-center gap-2">
                    {isAccessible ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className={`font-mono text-sm ${isAccessible ? 'text-green-600' : 'text-yellow-600'}`}>
                      {contrastRatio.toFixed(2)}:1
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {isAccessible ? 'WCAG AA compliant' : 'Below WCAG AA standard (4.5:1)'}
                </div>
              </div>

              <Separator />

              {/* Accessibility Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Focus Visible</Label>
                  <Switch
                    checked={themeConfig.accessibility.focusVisible}
                    onCheckedChange={(checked) => updateTheme({
                      accessibility: {
                        ...themeConfig.accessibility,
                        focusVisible: checked
                      }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Reduced Motion</Label>
                  <Switch
                    checked={themeConfig.accessibility.reducedMotion}
                    onCheckedChange={(checked) => updateTheme({
                      accessibility: {
                        ...themeConfig.accessibility,
                        reducedMotion: checked
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
                <Badge variant="secondary" className="ml-auto">
                  {viewMode}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className={`
                  border transition-all duration-300 overflow-hidden
                  ${viewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'}
                `}
                style={{
                  backgroundColor: themeConfig.colorPalette.background,
                  borderColor: themeConfig.colorPalette.textMuted + '40',
                  borderRadius: themeConfig.spacing.cardRadius,
                  padding: themeConfig.spacing.containerPadding,
                  fontFamily: themeConfig.typography.fontFamily,
                  fontSize: viewMode === 'mobile' ? themeConfig.typography.fontSize.mobile : themeConfig.typography.fontSize.base,
                  '--theme-primary': themeConfig.colorPalette.primary,
                  '--theme-secondary': themeConfig.colorPalette.secondary,
                  '--theme-accent': themeConfig.colorPalette.accent,
                  '--theme-success': themeConfig.colorPalette.success,
                  '--theme-text': themeConfig.colorPalette.text,
                  '--theme-bg': themeConfig.colorPalette.background
                } as React.CSSProperties}
              >
                {/* Enhanced Mini Landing Page Preview */}
                <div style={{ marginBottom: themeConfig.spacing.sectionSpacing }}>
                  
                  {/* Hero Section */}
                  <div 
                    className="p-4 mb-4"
                    style={{ 
                      backgroundColor: themeConfig.colorPalette.surface,
                      borderRadius: themeConfig.spacing.cardRadius,
                      boxShadow: themeConfig.componentStyles.cards.shadow !== 'none' ? 
                        themeConfig.componentStyles.cards.shadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.1)' :
                        themeConfig.componentStyles.cards.shadow === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' :
                        '0 10px 15px rgba(0,0,0,0.1)' : 'none',
                      border: themeConfig.componentStyles.cards.border ? `1px solid ${themeConfig.colorPalette.textMuted}40` : 'none'
                    }}
                  >
                    <h3 
                      style={{ 
                        color: themeConfig.colorPalette.text,
                        fontWeight: themeConfig.typography.headingWeight,
                        fontSize: viewMode === 'mobile' ? '1.25rem' : '1.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      iPhone 15 Pro Max
                    </h3>
                    <p 
                      style={{ 
                        color: themeConfig.colorPalette.textMuted,
                        fontWeight: themeConfig.typography.bodyWeight,
                        marginBottom: '1rem'
                      }}
                    >
                      Latest flagship with advanced camera system and titanium design
                    </p>
                    
                    {/* Price Section */}
                    <div className="flex items-center gap-3 mb-3">
                      <span 
                        style={{ 
                          color: themeConfig.psychology.ctaColor,
                          fontSize: viewMode === 'mobile' ? '1.5rem' : '1.75rem',
                          fontWeight: '700'
                        }}
                      >
                        25.990.000đ
                      </span>
                      <span 
                        style={{ 
                          color: themeConfig.colorPalette.textMuted,
                          fontSize: '0.9rem',
                          textDecoration: 'line-through'
                        }}
                      >
                        29.990.000đ
                      </span>
                      <span 
                        style={{ 
                          backgroundColor: themeConfig.psychology.urgencyColor,
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        -13%
                      </span>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <button
                    className="w-full py-3 px-6 font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
                    style={{ 
                      backgroundColor: themeConfig.psychology.ctaColor,
                      color: 'white',
                      borderRadius: themeConfig.spacing.buttonRadius,
                      fontWeight: themeConfig.typography.headingWeight,
                      fontSize: viewMode === 'mobile' ? '1rem' : '1.1rem',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: themeConfig.componentStyles.buttons.shadow ? 
                        `0 4px 12px ${themeConfig.psychology.ctaColor}40` : 'none'
                    }}
                  >
                    {viewMode === 'mobile' ? 'Mua ngay' : 'Đặt hàng ngay - Giao hàng miễn phí'}
                  </button>
                  
                  {/* Trust & Social Proof Badges */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <div 
                      className="px-3 py-2 text-sm font-medium rounded-full"
                      style={{ 
                        backgroundColor: themeConfig.psychology.trustColor,
                        color: 'white'
                      }}
                    >
                      ⭐ 4.9/5 (2,543 đánh giá)
                    </div>
                    <div 
                      className="px-3 py-2 text-sm font-medium rounded-full"
                      style={{ 
                        backgroundColor: themeConfig.psychology.urgencyColor,
                        color: 'white'
                      }}
                    >
                      🔥 Chỉ còn 12 sản phẩm
                    </div>
                    <div 
                      className="px-3 py-2 text-sm font-medium rounded-full"
                      style={{ 
                        backgroundColor: themeConfig.colorPalette.success,
                        color: 'white'
                      }}
                    >
                      ✅ Chính hãng
                    </div>
                  </div>

                  {/* Review Card Preview */}
                  <div 
                    className="mt-4 p-3"
                    style={{
                      backgroundColor: themeConfig.componentStyles.reviews.style === 'shopee' ? '#FFFFFF' : themeConfig.colorPalette.surface,
                      borderRadius: themeConfig.spacing.cardRadius,
                      boxShadow: themeConfig.componentStyles.reviews.style === 'shopee' ? 
                        '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
                      border: themeConfig.componentStyles.reviews.style === 'minimal' ? 
                        `1px solid ${themeConfig.colorPalette.textMuted}20` : 'none'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: themeConfig.colorPalette.primary,
                          border: themeConfig.componentStyles.reviews.avatarBorder ? 
                            `3px solid ${themeConfig.psychology.trustColor}40` : 'none'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: themeConfig.colorPalette.text, fontWeight: '600', fontSize: '0.9rem' }}>
                            Nguyễn A***
                          </span>
                          <div className="flex" style={{ color: themeConfig.psychology.trustColor }}>
                            ⭐⭐⭐⭐⭐
                          </div>
                        </div>
                        <p style={{ color: themeConfig.colorPalette.textMuted, fontSize: '0.85rem', lineHeight: '1.4' }}>
                          Sản phẩm chất lượng tốt, giao hàng nhanh. Rất hài lòng!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}