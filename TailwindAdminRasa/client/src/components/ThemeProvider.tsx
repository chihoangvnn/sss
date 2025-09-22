import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeDefinition, ThemeContext, TargetPlatform } from '@/types/theme';
import { themeRegistry } from '@/services/ThemeRegistry';
import { ShopeeTheme } from '@/themes/ShopeeTheme';

/**
 * 🎨 ThemeProvider - Central Theme Management
 * 
 * Provides theme context throughout the application and integrates with
 * the existing AdvancedThemeBuilder for dynamic theme switching
 */

// Theme Context
const ThemeContextReact = createContext<{
  currentTheme: ThemeDefinition | null;
  availableThemes: ThemeDefinition[];
  platform: TargetPlatform;
  isLoading: boolean;
  
  // Theme operations
  applyTheme: (themeId: string, customizations?: Partial<ThemeDefinition>) => Promise<void>;
  resetTheme: () => void;
  loadThemes: () => Promise<void>;
  
  // Customization helpers
  updateCustomizations: (customizations: Partial<ThemeDefinition>) => void;
  getCurrentCustomizations: () => Partial<ThemeDefinition> | undefined;
  
  // Platform switching
  switchPlatform: (platform: TargetPlatform) => void;
} | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  defaultPlatform?: TargetPlatform;
  enablePersistence?: boolean;
}

export function ThemeProvider({ 
  children, 
  defaultPlatform = 'landing-page',
  enablePersistence = true 
}: ThemeProviderProps) {
  // State management
  const [currentTheme, setCurrentTheme] = useState<ThemeDefinition | null>(null);
  const [availableThemes, setAvailableThemes] = useState<ThemeDefinition[]>([]);
  const [platform, setPlatform] = useState<TargetPlatform>(defaultPlatform);
  const [isLoading, setIsLoading] = useState(true);
  const [customizations, setCustomizations] = useState<Partial<ThemeDefinition> | undefined>();

  /**
   * 🚀 Initialize Theme System
   */
  useEffect(() => {
    initializeThemes();
  }, []);

  /**
   * 💾 Load persisted theme on platform change
   */
  useEffect(() => {
    if (enablePersistence) {
      loadPersistedTheme();
    }
  }, [platform, enablePersistence]);

  /**
   * 🏗️ Initialize themes and load built-ins
   */
  const initializeThemes = async () => {
    try {
      setIsLoading(true);
      
      // Register built-in themes
      themeRegistry.registerTheme(ShopeeTheme);
      
      // Load themes from server
      await themeRegistry.syncFromServer();
      
      // Get available themes for current platform
      const themes = themeRegistry.listThemes({ platform });
      setAvailableThemes(themes);
      
      // Set default theme if none is set
      if (!currentTheme && themes.length > 0) {
        await applyTheme(themes[0].id);
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize themes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🎯 Apply Theme
   */
  const applyTheme = async (themeId: string, newCustomizations?: Partial<ThemeDefinition>) => {
    try {
      setIsLoading(true);
      
      await themeRegistry.applyTheme(themeId, {
        platform,
        customizations: newCustomizations || customizations,
        persist: enablePersistence
      });
      
      const theme = themeRegistry.getTheme(themeId);
      if (theme) {
        setCurrentTheme(theme);
        if (newCustomizations) {
          setCustomizations(newCustomizations);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to apply theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔄 Reset Theme
   */
  const resetTheme = () => {
    setCurrentTheme(null);
    setCustomizations(undefined);
    
    // Remove theme CSS
    const existingStyle = document.getElementById('theme-registry-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Clear persistence
    if (enablePersistence) {
      localStorage.removeItem(`theme-choice-${platform}`);
    }
  };

  /**
   * 📋 Load Themes
   */
  const loadThemes = async () => {
    try {
      setIsLoading(true);
      await themeRegistry.syncFromServer();
      const themes = themeRegistry.listThemes({ platform });
      setAvailableThemes(themes);
    } catch (error) {
      console.error('❌ Failed to load themes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ✏️ Update Customizations
   */
  const updateCustomizations = (newCustomizations: Partial<ThemeDefinition>) => {
    setCustomizations(newCustomizations);
    
    // Reapply theme with new customizations
    if (currentTheme) {
      applyTheme(currentTheme.id, newCustomizations);
    }
  };

  /**
   * 📖 Get Current Customizations
   */
  const getCurrentCustomizations = () => customizations;

  /**
   * 🔄 Switch Platform
   */
  const switchPlatform = (newPlatform: TargetPlatform) => {
    setPlatform(newPlatform);
    
    // Filter themes for new platform
    const themes = themeRegistry.listThemes({ platform: newPlatform });
    setAvailableThemes(themes);
  };

  /**
   * 💾 Load Persisted Theme
   */
  const loadPersistedTheme = () => {
    try {
      const persistedData = localStorage.getItem(`theme-choice-${platform}`);
      if (persistedData) {
        const { themeId, options } = JSON.parse(persistedData);
        const theme = themeRegistry.getTheme(themeId);
        
        if (theme) {
          setCurrentTheme(theme);
          setCustomizations(options.customizations);
          
          // Reapply theme CSS
          themeRegistry.applyTheme(themeId, {
            platform,
            customizations: options.customizations,
            persist: false // Don't double-persist
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted theme:', error);
    }
  };

  // Context value
  const contextValue = {
    currentTheme,
    availableThemes,
    platform,
    isLoading,
    applyTheme,
    resetTheme,
    loadThemes,
    updateCustomizations,
    getCurrentCustomizations,
    switchPlatform,
  };

  return (
    <ThemeContextReact.Provider value={contextValue}>
      {children}
    </ThemeContextReact.Provider>
  );
}

/**
 * 🎣 useTheme Hook
 */
export function useTheme() {
  const context = useContext(ThemeContextReact);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * 🎨 useThemeCSS Hook - Get CSS variables for current theme
 */
export function useThemeCSS() {
  const { currentTheme } = useTheme();
  
  if (!currentTheme) {
    return {};
  }
  
  // Generate CSS variables
  const cssVars: Record<string, string> = {};
  
  // Color palette
  Object.entries(currentTheme.colorPalette).forEach(([key, value]) => {
    cssVars[`--theme-${key}`] = value;
  });
  
  // Typography
  cssVars['--theme-font-family'] = currentTheme.typography.fontFamily;
  Object.entries(currentTheme.typography.fontSizes).forEach(([key, value]) => {
    cssVars[`--theme-font-${key}`] = value;
  });
  
  // Layout
  cssVars['--theme-container-max-width'] = currentTheme.layout.containerMaxWidth;
  cssVars['--theme-container-padding'] = currentTheme.layout.containerPadding;
  
  return cssVars;
}

/**
 * 🎯 withTheme HOC - Inject theme props into components
 */
export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme?: ThemeDefinition }>
) {
  return function ThemedComponent(props: P) {
    const { currentTheme } = useTheme();
    return <Component {...props} theme={currentTheme || undefined} />;
  };
}

/**
 * 🔧 Theme Utility Functions
 */
export const themeUtils = {
  /**
   * Get CSS class for current theme
   */
  getThemeClass: (baseClass: string, currentTheme?: ThemeDefinition | null) => {
    if (!currentTheme) return baseClass;
    return `${baseClass} theme-${currentTheme.id}`;
  },
  
  /**
   * Check if theme is compatible with platform
   */
  isThemeCompatible: (theme: ThemeDefinition, platform: TargetPlatform) => {
    return theme.platforms.includes(platform) || theme.platforms.includes('all');
  },
  
  /**
   * Get theme color with fallback
   */
  getThemeColor: (colorKey: keyof ThemeDefinition['colorPalette'], fallback: string, currentTheme?: ThemeDefinition | null) => {
    return currentTheme?.colorPalette[colorKey] || fallback;
  },
  
  /**
   * Generate theme-aware styles
   */
  createThemeStyles: (currentTheme?: ThemeDefinition | null) => {
    if (!currentTheme) return {};
    
    return {
      '--primary-color': currentTheme.colorPalette.primary,
      '--secondary-color': currentTheme.colorPalette.secondary,
      '--background-color': currentTheme.colorPalette.background,
      '--text-color': currentTheme.colorPalette.text,
      '--font-family': currentTheme.typography.fontFamily,
    } as React.CSSProperties;
  }
};

export default ThemeProvider;