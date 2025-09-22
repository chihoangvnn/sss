import { 
  TemplateDefinition, 
  TemplateCategory, 
  TargetFramework, 
  TemplateContext,
  TemplateSearchOptions,
  TemplateExportOptions,
  TemplateInstallResult,
  TemplateComplexity
} from '@/types/template';
import { ThemeDefinition } from '@/types/theme';
import { apiRequest } from '@/lib/queryClient';

/**
 * 🧩 Template Registry Service - "Component Library Manager"
 * 
 * Central management system for reusable component templates that work
 * seamlessly with the Theme Repository system.
 */
class TemplateRegistryService {
  private templates: Map<string, TemplateDefinition> = new Map();
  private categories: Map<TemplateCategory, TemplateDefinition[]> = new Map();
  private subscribers: Set<(templates: TemplateDefinition[]) => void> = new Set();
  
  // Template code cache for different frameworks
  private codeCache: Map<string, Record<TargetFramework, string>> = new Map();
  
  constructor() {
    this.initializeBuiltinTemplates();
  }
  
  /**
   * 📋 Register Template - Đăng ký template mới vào registry
   */
  registerTemplate(template: TemplateDefinition): void {
    // Validate template structure
    this.validateTemplate(template);
    
    // Store in registry
    this.templates.set(template.id, template);
    
    // Update category index
    this.updateCategoryIndex(template);
    
    // Generate code cache for all frameworks
    this.generateCodeCache(template);
    
    // Notify subscribers
    this.notifySubscribers();
    
    console.log(`🧩 Template registered: ${template.name} (${template.id})`);
  }
  
  /**
   * 🎯 Get Template - Lấy template theo ID
   */
  getTemplate(templateId: string): TemplateDefinition | null {
    return this.templates.get(templateId) || null;
  }
  
  /**
   * 📑 Search Templates - Tìm kiếm templates với filtering
   */
  searchTemplates(options: TemplateSearchOptions = {}): TemplateDefinition[] {
    let templates = Array.from(this.templates.values());
    
    // Text search
    if (options.query) {
      const query = options.query.toLowerCase();
      templates = templates.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
        template.metadata.useCase.some(useCase => useCase.toLowerCase().includes(query))
      );
    }
    
    // Category filter
    if (options.category) {
      templates = templates.filter(template => template.category === options.category);
    }
    
    // Framework filter
    if (options.framework) {
      templates = templates.filter(template => 
        template.frameworks.includes(options.framework!) || 
        template.frameworks.includes('all')
      );
    }
    
    // Complexity filter
    if (options.complexity) {
      templates = templates.filter(template => template.complexity === options.complexity);
    }
    
    // Tags filter
    if (options.tags && options.tags.length > 0) {
      templates = templates.filter(template =>
        options.tags!.some(tag => template.metadata.tags.includes(tag))
      );
    }
    
    // Industry filter
    if (options.industry && options.industry.length > 0) {
      templates = templates.filter(template =>
        options.industry!.some(industry => template.metadata.industry.includes(industry))
      );
    }
    
    // Theme compatibility filter
    if (options.compatibility) {
      templates = templates.filter(template =>
        template.compatibleThemes.includes(options.compatibility!) ||
        template.compatibleThemes.includes('all')
      );
    }
    
    // Author filter
    if (options.author) {
      templates = templates.filter(template => 
        template.metadata.author.toLowerCase().includes(options.author!.toLowerCase())
      );
    }
    
    // Featured filter
    if (options.featured !== undefined) {
      templates = templates.filter(template => template.metadata.featured === options.featured);
    }
    
    // Sorting
    if (options.sortBy) {
      templates.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (options.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'created':
            aValue = new Date(a.metadata.createdAt);
            bValue = new Date(b.metadata.createdAt);
            break;
          case 'updated':
            aValue = new Date(a.metadata.updatedAt);
            bValue = new Date(b.metadata.updatedAt);
            break;
          case 'usage':
            aValue = a.metadata.usageCount;
            bValue = b.metadata.usageCount;
            break;
          case 'rating':
            aValue = a.metadata.rating;
            bValue = b.metadata.rating;
            break;
          case 'downloads':
            aValue = a.metadata.downloads;
            bValue = b.metadata.downloads;
            break;
          default:
            return 0;
        }
        
        if (options.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
    }
    
    // Pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    
    return templates.slice(offset, offset + limit);
  }
  
  /**
   * 📂 Get Templates by Category
   */
  getTemplatesByCategory(category: TemplateCategory): TemplateDefinition[] {
    return this.categories.get(category) || [];
  }
  
  /**
   * 🎨 Apply Template - Generate template với theme context
   */
  async applyTemplate(
    templateId: string, 
    props: Record<string, any>,
    options: {
      framework: TargetFramework;
      theme?: ThemeDefinition;
      slots?: Record<string, string>;
      platform?: 'web' | 'mobile' | 'desktop';
    }
  ): Promise<TemplateContext> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    // Check framework compatibility
    if (!template.frameworks.includes(options.framework) && !template.frameworks.includes('all')) {
      throw new Error(`Template ${template.name} not compatible with ${options.framework}`);
    }
    
    // Validate props
    this.validateTemplateProps(template, props);
    
    // Create template context
    const context: TemplateContext = {
      template,
      theme: options.theme,
      props,
      slots: options.slots,
      framework: options.framework,
      platform: options.platform || 'web'
    };
    
    // Track usage
    this.trackTemplateUsage(templateId, options.framework);
    
    return context;
  }
  
  /**
   * 🔄 Generate Code - Tạo code cho framework cụ thể
   */
  generateCode(context: TemplateContext): string {
    const { template, theme, props, slots, framework } = context;
    
    // Get base code for framework
    const baseCode = this.getFrameworkCode(template, framework);
    if (!baseCode) {
      throw new Error(`No ${framework} implementation found for template ${template.name}`);
    }
    
    // Apply theme variables if theme is provided
    let processedCode = baseCode;
    if (theme) {
      processedCode = this.applyThemeToCode(processedCode, theme);
    }
    
    // Replace prop placeholders
    processedCode = this.replacePropPlaceholders(processedCode, props);
    
    // Replace slot placeholders
    if (slots) {
      processedCode = this.replaceSlotPlaceholders(processedCode, slots);
    }
    
    return processedCode;
  }
  
  /**
   * 📦 Export Template - Export template cho external usage
   */
  async exportTemplate(
    templateId: string, 
    options: TemplateExportOptions
  ): Promise<TemplateInstallResult> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const files: TemplateInstallResult['files'] = [];
    const dependencies: string[] = [];
    const instructions: string[] = [];
    
    // Get code for target framework
    const code = this.getFrameworkCode(template, options.framework);
    if (!code) {
      throw new Error(`No ${options.framework} implementation available`);
    }
    
    // Generate main component file
    const fileExtension = this.getFileExtension(options.framework);
    files.push({
      path: `${template.name}${fileExtension}`,
      content: code,
      type: 'component'
    });
    
    // Include styles if needed
    if (template.styles.customCSS) {
      files.push({
        path: `${template.name}.css`,
        content: template.styles.customCSS,
        type: 'style'
      });
    }
    
    // Include assets if requested
    if (options.includeAssets) {
      for (const asset of template.assets) {
        if (asset.required || options.includeAssets) {
          files.push({
            path: `assets/${asset.url.split('/').pop()}`,
            content: `// Asset: ${asset.url}`,
            type: 'asset'
          });
        }
      }
    }
    
    // Include dependencies
    if (options.includeDependencies) {
      const frameworkCode = template.code[options.framework];
      if (frameworkCode && 'dependencies' in frameworkCode) {
        dependencies.push(...(frameworkCode as any).dependencies);
      }
    }
    
    // Generate installation instructions
    instructions.push(`Install ${template.name} template`);
    if (dependencies.length > 0) {
      instructions.push(`Install dependencies: ${dependencies.join(', ')}`);
    }
    
    return {
      success: true,
      files,
      dependencies,
      instructions
    };
  }
  
  /**
   * 💾 Save Template - Lưu template mới hoặc update
   */
  async saveTemplate(template: TemplateDefinition): Promise<void> {
    try {
      const method = template.id.startsWith('temp_') ? 'POST' : 'PUT';
      const url = template.id.startsWith('temp_') ? '/api/templates' : `/api/templates/${template.id}`;
      const response = await apiRequest(method, url, template);
      
      if (response.ok) {
        this.registerTemplate(template);
        console.log(`💾 Template saved: ${template.name}`);
      }
    } catch (error) {
      console.error('❌ Failed to save template:', error);
      throw error;
    }
  }
  
  /**
   * 🗑️ Delete Template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const response = await apiRequest('DELETE', `/api/templates/${templateId}`);
      
      if (response.ok) {
        const template = this.templates.get(templateId);
        if (template) {
          this.templates.delete(templateId);
          this.removeCategoryIndex(template);
          this.codeCache.delete(templateId);
          this.notifySubscribers();
        }
        console.log(`🗑️ Template deleted: ${templateId}`);
      }
    } catch (error) {
      console.error('❌ Failed to delete template:', error);
      throw error;
    }
  }
  
  /**
   * 🔄 Sync from Server
   */
  async syncFromServer(): Promise<void> {
    try {
      const response = await apiRequest('GET', '/api/templates');
      const data = await response.json();
      
      if (data.templates) {
        // Clear existing templates
        this.templates.clear();
        this.categories.clear();
        
        // Register all templates from server
        data.templates.forEach((template: TemplateDefinition) => {
          this.registerTemplate(template);
        });
        
        console.log(`🔄 Synced ${data.templates.length} templates from server`);
      }
    } catch (error) {
      console.error('❌ Failed to sync templates:', error);
    }
  }
  
  /**
   * 🔔 Subscribe to Template Changes
   */
  subscribe(callback: (templates: TemplateDefinition[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  // === PRIVATE METHODS ===
  
  private validateTemplate(template: TemplateDefinition): void {
    if (!template.id || !template.name || !template.category) {
      throw new Error('Template must have id, name, and category');
    }
    
    if (!template.code || Object.keys(template.code).length === 0) {
      throw new Error('Template must have at least one framework implementation');
    }
  }
  
  private validateTemplateProps(template: TemplateDefinition, props: Record<string, any>): void {
    for (const prop of template.props) {
      if (prop.required && !(prop.name in props)) {
        throw new Error(`Required prop '${prop.name}' is missing`);
      }
      
      if (prop.name in props) {
        // Basic type validation
        const value = props[prop.name];
        const expectedType = prop.type;
        
        if (expectedType === 'string' && typeof value !== 'string') {
          throw new Error(`Prop '${prop.name}' must be a string`);
        }
        if (expectedType === 'number' && typeof value !== 'number') {
          throw new Error(`Prop '${prop.name}' must be a number`);
        }
        if (expectedType === 'boolean' && typeof value !== 'boolean') {
          throw new Error(`Prop '${prop.name}' must be a boolean`);
        }
      }
    }
  }
  
  private updateCategoryIndex(template: TemplateDefinition): void {
    if (!this.categories.has(template.category)) {
      this.categories.set(template.category, []);
    }
    
    const categoryTemplates = this.categories.get(template.category)!;
    const existingIndex = categoryTemplates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      categoryTemplates[existingIndex] = template;
    } else {
      categoryTemplates.push(template);
    }
  }
  
  private removeCategoryIndex(template: TemplateDefinition): void {
    const categoryTemplates = this.categories.get(template.category);
    if (categoryTemplates) {
      const index = categoryTemplates.findIndex(t => t.id === template.id);
      if (index >= 0) {
        categoryTemplates.splice(index, 1);
      }
    }
  }
  
  private generateCodeCache(template: TemplateDefinition): void {
    const cache: Record<TargetFramework, string> = {} as any;
    
    Object.entries(template.code).forEach(([framework, code]) => {
      if (framework === 'react' && code.jsx) {
        cache.react = code.jsx;
      } else if (framework === 'vue' && code.template) {
        cache.vue = code.template;
      } else if (framework === 'angular' && code.component) {
        cache.angular = code.component;
      } else if (framework === 'vanilla' && code.html) {
        cache.vanilla = code.html;
      }
    });
    
    this.codeCache.set(template.id, cache);
  }
  
  private getFrameworkCode(template: TemplateDefinition, framework: TargetFramework): string | null {
    const cache = this.codeCache.get(template.id);
    return cache?.[framework] || null;
  }
  
  private applyThemeToCode(code: string, theme: ThemeDefinition): string {
    // Replace theme placeholders with actual theme values
    let processedCode = code;
    
    // Replace color variables
    Object.entries(theme.colorPalette).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{theme\\.color\\.${key}}}`, 'g');
      processedCode = processedCode.replace(placeholder, value);
    });
    
    // Replace typography variables
    processedCode = processedCode.replace(/{{theme\.font\.family}}/g, theme.typography.fontFamily);
    
    return processedCode;
  }
  
  private replacePropPlaceholders(code: string, props: Record<string, any>): string {
    let processedCode = code;
    
    Object.entries(props).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{props\\.${key}}}`, 'g');
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      processedCode = processedCode.replace(placeholder, stringValue);
    });
    
    return processedCode;
  }
  
  private replaceSlotPlaceholders(code: string, slots: Record<string, string>): string {
    let processedCode = code;
    
    Object.entries(slots).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{slot\\.${key}}}`, 'g');
      processedCode = processedCode.replace(placeholder, value);
    });
    
    return processedCode;
  }
  
  private getFileExtension(framework: TargetFramework): string {
    switch (framework) {
      case 'react': return '.tsx';
      case 'vue': return '.vue';
      case 'angular': return '.component.ts';
      case 'vanilla': return '.html';
      default: return '.js';
    }
  }
  
  private trackTemplateUsage(templateId: string, framework: TargetFramework): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.metadata.usageCount++;
      // TODO: Send to analytics
    }
  }
  
  private notifySubscribers(): void {
    const allTemplates = Array.from(this.templates.values());
    this.subscribers.forEach(callback => {
      try {
        callback(allTemplates);
      } catch (error) {
        console.error('❌ Template subscriber error:', error);
      }
    });
  }
  
  private initializeBuiltinTemplates(): void {
    // Built-in templates will be loaded here
    // This will include extracted Shopee components
  }
}

// Export singleton instance
export const templateRegistry = new TemplateRegistryService();
export default templateRegistry;