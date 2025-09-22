import { ThemeDefinition, ThemeCategory, TargetPlatform, ThemeApplyOptions, ThemeContext } from '@/types/theme';
import { apiRequest } from '@/lib/queryClient';

/**
 * 🎨 Theme Registry Service - "Giám Đốc Làm Đẹp"
 * Centralized theme management system for the entire ecosystem
 */
class ThemeRegistryService {
  private themes: Map<string, ThemeDefinition> = new Map();
  private currentTheme: ThemeDefinition | null = null;
  private subscribers: Set<(context: ThemeContext) => void> = new Set();
  
  // CSS Variables Cache
  private cssVariablesCache: Map<string, Record<string, string>> = new Map();
  
  constructor() {
    this.loadBuiltinThemes();
  }
  
  /**
   * 📋 Register Theme - Đăng ký theme mới vào registry
   */
  registerTheme(theme: ThemeDefinition): void {
    // Validate theme structure
    this.validateTheme(theme);
    
    // Store in registry
    this.themes.set(theme.id, theme);
    
    // Generate CSS variables
    this.generateCSSVariables(theme);
    
    console.log(`🎨 Theme registered: ${theme.name} (${theme.id})`);
  }
  
  /**
   * 🎯 Get Theme - Lấy theme theo ID
   */
  getTheme(themeId: string): ThemeDefinition | null {
    return this.themes.get(themeId) || null;
  }
  
  /**
   * 📑 List Themes - Lấy danh sách themes với filtering
   */
  listThemes(options?: {
    category?: ThemeCategory;
    platform?: TargetPlatform;
    search?: string;
  }): ThemeDefinition[] {
    let themes = Array.from(this.themes.values());
    
    if (options?.category) {
      themes = themes.filter(theme => theme.category === options.category);
    }
    
    if (options?.platform) {
      themes = themes.filter(theme => 
        theme.platforms.includes(options.platform!) || 
        theme.platforms.includes('all')
      );
    }
    
    if (options?.search) {
      const search = options.search.toLowerCase();
      themes = themes.filter(theme => 
        theme.name.toLowerCase().includes(search) ||
        theme.description.toLowerCase().includes(search) ||
        theme.metadata.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    return themes.sort((a, b) => b.metadata.usageCount - a.metadata.usageCount);
  }
  
  /**
   * ⚡ Apply Theme - Áp dụng theme cho platform cụ thể
   */
  async applyTheme(themeId: string, options: ThemeApplyOptions): Promise<void> {
    const theme = this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }
    
    // Check platform compatibility
    if (!theme.platforms.includes(options.platform) && !theme.platforms.includes('all')) {
      console.warn(`⚠️ Theme ${theme.name} not optimized for ${options.platform}`);
    }
    
    // Apply customizations if provided
    const appliedTheme = options.customizations 
      ? this.mergeThemeWithCustomizations(theme, options.customizations)
      : theme;
    
    // Generate and inject CSS variables
    this.injectThemeCSS(appliedTheme);
    
    // Update current theme
    this.currentTheme = appliedTheme;
    
    // Notify subscribers
    this.notifySubscribers({
      currentTheme: appliedTheme,
      platform: options.platform,
      customizations: options.customizations,
      isPreview: options.preview
    });
    
    // Persist if requested
    if (options.persist && !options.preview) {
      await this.persistThemeChoice(themeId, options);
    }
    
    // Track usage
    this.trackThemeUsage(themeId, options.platform);
    
    console.log(`🎨 Applied theme: ${theme.name} for ${options.platform}`);
  }
  
  /**
   * 🔄 Subscribe to Theme Changes
   */
  subscribe(callback: (context: ThemeContext) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  /**
   * 💾 Save Theme - Lưu theme mới hoặc update
   */
  async saveTheme(theme: ThemeDefinition): Promise<void> {
    try {
      const method = theme.id.startsWith('temp_') ? 'POST' : 'PUT';
      const url = theme.id.startsWith('temp_') ? '/api/themes' : `/api/themes/${theme.id}`;
      const response = await apiRequest(method, url, theme);
      
      if (response.ok) {
        this.registerTheme(theme);
        console.log(`💾 Theme saved: ${theme.name}`);
      }
    } catch (error) {
      console.error('❌ Failed to save theme:', error);
      throw error;
    }
  }
  
  /**
   * 🗑️ Delete Theme
   */
  async deleteTheme(themeId: string): Promise<void> {
    try {
      const response = await apiRequest('DELETE', `/api/themes/${themeId}`);
      
      if (response.ok) {
        this.themes.delete(themeId);
        this.cssVariablesCache.delete(themeId);
        console.log(`🗑️ Theme deleted: ${themeId}`);
      }
    } catch (error) {
      console.error('❌ Failed to delete theme:', error);
      throw error;
    }
  }
  
  /**
   * 🔄 Sync from Server - Đồng bộ themes từ API
   */
  async syncFromServer(): Promise<void> {
    try {
      const response = await apiRequest('GET', '/api/themes');
      const data = await response.json();
      
      if (data.themes) {
        data.themes.forEach((theme: ThemeDefinition) => {
          this.registerTheme(theme);
        });
        console.log(`🔄 Synced ${data.themes.length} themes from server`);
      }
    } catch (error) {
      console.error('❌ Failed to sync themes:', error);
    }
  }
  
  /**
   * 🏗️ Private: Generate CSS Variables from Theme
   */
  private generateCSSVariables(theme: ThemeDefinition): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Color Palette
    Object.entries(theme.colorPalette).forEach(([key, value]) => {
      variables[`--theme-${key}`] = value;
      // Generate RGB values for transparency
      const rgb = this.hexToRgb(value);
      if (rgb) {
        variables[`--theme-${key}-rgb`] = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
      }
    });
    
    // Typography
    variables['--theme-font-family'] = theme.typography.fontFamily;
    Object.entries(theme.typography.fontSizes).forEach(([key, value]) => {
      variables[`--theme-font-${key}`] = value;
    });
    Object.entries(theme.typography.fontWeights).forEach(([key, value]) => {
      variables[`--theme-weight-${key}`] = value;
    });
    
    // Layout
    variables['--theme-container-max-width'] = theme.layout.containerMaxWidth;
    variables['--theme-container-padding'] = theme.layout.containerPadding;
    variables['--theme-section-spacing'] = theme.layout.sectionSpacing;
    variables['--theme-grid-gap'] = theme.layout.gridGap;
    
    // Border Radius
    Object.entries(theme.layout.borderRadius).forEach(([key, value]) => {
      variables[`--theme-radius-${key}`] = value;
    });
    
    // Animation
    Object.entries(theme.animations.duration).forEach(([key, value]) => {
      variables[`--theme-duration-${key}`] = value;
    });
    
    // Cache variables
    this.cssVariablesCache.set(theme.id, variables);
    
    return variables;
  }
  
  /**
   * 💉 Inject Theme CSS into DOM
   */
  private injectThemeCSS(theme: ThemeDefinition): void {
    const variables = this.cssVariablesCache.get(theme.id) || this.generateCSSVariables(theme);
    
    // Remove existing theme style
    const existingStyle = document.getElementById('theme-registry-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create new style element
    const style = document.createElement('style');
    style.id = 'theme-registry-css';
    
    // Build CSS content
    const cssContent = `:root {\n${
      Object.entries(variables)
        .map(([key, value]) => `  ${key}: ${value};`)
        .join('\n')
    }\n}`;
    
    style.textContent = cssContent;
    document.head.appendChild(style);
  }
  
  /**
   * 🔗 Merge Theme with Customizations
   */
  private mergeThemeWithCustomizations(
    theme: ThemeDefinition, 
    customizations: Partial<ThemeDefinition>
  ): ThemeDefinition {
    return {
      ...theme,
      ...customizations,
      colorPalette: { ...theme.colorPalette, ...customizations.colorPalette },
      typography: { ...theme.typography, ...customizations.typography },
      layout: { ...theme.layout, ...customizations.layout },
      components: { ...theme.components, ...customizations.components },
    };
  }
  
  /**
   * 📢 Notify Subscribers
   */
  private notifySubscribers(context: ThemeContext): void {
    this.subscribers.forEach(callback => {
      try {
        callback(context);
      } catch (error) {
        console.error('❌ Theme subscriber error:', error);
      }
    });
  }
  
  /**
   * ✅ Validate Theme Structure
   */
  private validateTheme(theme: ThemeDefinition): void {
    if (!theme.id || !theme.name || !theme.category) {
      throw new Error('Theme must have id, name, and category');
    }
    
    if (!theme.colorPalette || !theme.typography || !theme.layout) {
      throw new Error('Theme must have colorPalette, typography, and layout');
    }
  }
  
  /**
   * 💾 Persist Theme Choice
   */
  private async persistThemeChoice(themeId: string, options: ThemeApplyOptions): Promise<void> {
    try {
      localStorage.setItem(`theme-choice-${options.platform}`, JSON.stringify({
        themeId,
        options,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to persist theme choice:', error);
    }
  }
  
  /**
   * 📊 Track Theme Usage
   */
  private trackThemeUsage(themeId: string, platform: TargetPlatform): void {
    const theme = this.themes.get(themeId);
    if (theme) {
      theme.metadata.usageCount++;
      // TODO: Send to analytics
    }
  }
  
  /**
   * 🎨 Convert Hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  /**
   * 🏗️ Load Built-in Themes
   */
  private loadBuiltinThemes(): void {
    // Built-in themes will be loaded here
    // This will include ShopeeTheme, MinimalTheme, etc.
  }
}

// Export singleton instance
export const themeRegistry = new ThemeRegistryService();
export default themeRegistry;