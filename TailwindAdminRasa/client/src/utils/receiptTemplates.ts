/**
 * Receipt Template System with Vietnamese Formatting
 * Professional receipt layouts for KPOS ZY307 thermal printer
 */

import { createESCPOSBuilder, ESCPOSUtils, PAPER_CONFIGS, type PaperWidth } from './escpos';
import type { Order, OrderItem, Customer, Product, ShopSettings } from '@shared/schema';

// Receipt configuration types
export interface ReceiptConfig {
  paperWidth: PaperWidth;
  logoEnabled: boolean;
  vatEnabled: boolean;
  footerMessage: string;
  printCopies: 'customer' | 'merchant' | 'both';
  paperSaving: boolean;
  barcodeEnabled: boolean;
}

export interface ReceiptData {
  order: Order;
  orderItems: (OrderItem & { product: Product })[];
  customer?: Customer;
  shopSettings: ShopSettings;
  receiptNumber: string;
  printDate: Date;
  config: ReceiptConfig;
}

// Receipt template interface
export interface ReceiptTemplate {
  name: string;
  description: string;
  generate(data: ReceiptData): string;
  generatePreview(data: ReceiptData): string;
}

/**
 * Standard Vietnamese Receipt Template
 */
export class StandardReceiptTemplate implements ReceiptTemplate {
  name = 'Hóa đơn chuẩn';
  description = 'Template hóa đơn chuẩn cho doanh nghiệp Việt Nam';

  generate(data: ReceiptData): string {
    const builder = createESCPOSBuilder(data.config.paperWidth, true);
    const { order, orderItems, customer, shopSettings, receiptNumber, printDate, config } = data;

    // Initialize printer with Vietnamese support
    builder.init();

    // Header section
    this.generateHeader(builder, shopSettings, config);

    // Receipt info section
    this.generateReceiptInfo(builder, receiptNumber, printDate, order.id);

    // Customer info section (if available)
    if (customer) {
      this.generateCustomerInfo(builder, customer);
    }

    // Items section
    this.generateItems(builder, orderItems, config);

    // Totals section
    this.generateTotals(builder, order, config);

    // Footer section
    this.generateFooter(builder, shopSettings, config);

    // Cut paper
    builder.feed(3).cut(false);

    return builder.build();
  }

  generatePreview(data: ReceiptData): string {
    // Generate a text-only preview for display
    const lines: string[] = [];
    const { order, orderItems, customer, shopSettings, receiptNumber, printDate, config } = data;
    
    // Get paper width configuration
    const paperWidth = PAPER_CONFIGS[config.paperWidth].width;

    // Header
    lines.push('═'.repeat(paperWidth));
    lines.push(this.centerText(shopSettings.businessName || 'Tên cửa hàng', paperWidth));
    if (shopSettings.address) {
      lines.push(this.centerText(shopSettings.address, paperWidth));
    }
    if (shopSettings.phone) {
      lines.push(this.centerText(`ĐT: ${shopSettings.phone}`, paperWidth));
    }
    lines.push('═'.repeat(paperWidth));

    // Receipt info
    lines.push(`Hóa đơn: ${receiptNumber}`);
    lines.push(`Ngày: ${ESCPOSUtils.formatReceiptDate(printDate)}`);
    lines.push(`Đơn hàng: ${order.id.slice(-8).toUpperCase()}`);

    if (customer) {
      lines.push(`Khách hàng: ${customer.name}`);
      if (customer.phone) {
        lines.push(`SĐT: ${customer.phone}`);
      }
    }

    lines.push('-'.repeat(paperWidth));

    // Items with dynamic width formatting
    if (paperWidth >= 48) {
      // Full format for 80mm paper
      lines.push(this.formatLine('Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền', [20, 8, 10, 10]));
    } else {
      // Compact format for 58mm paper  
      lines.push(this.formatLine('Sản phẩm', 'SL', 'Tổng', '', [16, 6, 10, 0]));
    }
    lines.push('-'.repeat(paperWidth));

    orderItems.forEach(item => {
      const product = item.product;
      const quantity = ESCPOSUtils.formatQuantity(item.quantity, product.unitType || 'count');
      const unit = product.unit || 'cái';
      const quantityText = `${quantity} ${unit}`;
      const unitPrice = ESCPOSUtils.formatVND(item.price).replace('₫', '').trim();
      const totalPrice = ESCPOSUtils.formatVND(item.quantity * parseFloat(item.price.toString())).replace('₫', '').trim();

      // Product name (may span multiple lines) with dynamic width
      const nameWidth = paperWidth >= 48 ? 20 : 16;
      const nameLines = this.wrapText(product.name, nameWidth);
      nameLines.forEach((nameLine, index) => {
        if (index === 0) {
          if (paperWidth >= 48) {
            lines.push(this.formatLine(nameLine, quantityText, unitPrice, totalPrice, [20, 8, 10, 10]));
          } else {
            lines.push(this.formatLine(nameLine, quantityText, totalPrice, '', [16, 6, 10, 0]));
          }
        } else {
          if (paperWidth >= 48) {
            lines.push(this.formatLine(nameLine, '', '', '', [20, 8, 10, 10]));
          } else {
            lines.push(this.formatLine(nameLine, '', '', '', [16, 6, 10, 0]));
          }
        }
      });
    });

    lines.push('-'.repeat(paperWidth));

    // Totals with dynamic formatting
    const total = parseFloat(order.total.toString());
    const totalLabel = paperWidth >= 48 ? 'TỔNG CỘNG:' : 'TỔNG:';
    const totalWidth = paperWidth >= 48 ? [28, 0, 0, 20] : [20, 0, 0, 12];
    lines.push(this.formatLine(totalLabel, '', '', ESCPOSUtils.formatVND(total).replace('₫', '').trim(), totalWidth));

    if (config.vatEnabled) {
      const vatAmount = total * 0.1; // 10% VAT
      const vatLabel = paperWidth >= 48 ? 'VAT (10%):' : 'VAT:';
      lines.push(this.formatLine(vatLabel, '', '', ESCPOSUtils.formatVND(vatAmount).replace('₫', '').trim(), totalWidth));
    }

    lines.push('═'.repeat(paperWidth));

    // Footer
    lines.push(this.centerText(config.footerMessage || 'Cảm ơn quý khách!', paperWidth));
    lines.push(this.centerText('Hẹn gặp lại!', paperWidth));
    
    if (shopSettings.website) {
      lines.push(this.centerText(shopSettings.website, paperWidth));
    }

    lines.push('═'.repeat(paperWidth));

    return lines.join('\n');
  }

  private generateHeader(builder: any, shopSettings: ShopSettings, config: ReceiptConfig): void {
    builder
      .alignCenter()
      .bold(true)
      .doubleHeight()
      .textLine(shopSettings.businessName || 'TÊN CỬA HÀNG')
      .normalSize()
      .bold(false);

    if (shopSettings.address) {
      builder.textLine(shopSettings.address);
    }

    if (shopSettings.phone) {
      builder.textLine(`ĐT: ${shopSettings.phone}`);
    }

    if (shopSettings.email) {
      builder.textLine(`Email: ${shopSettings.email}`);
    }

    if (shopSettings.website) {
      builder.textLine(shopSettings.website);
    }

    if (config.vatEnabled && shopSettings.taxId) {
      builder.textLine(`MST: ${shopSettings.taxId}`);
    }

    builder
      .alignLeft()
      .horizontalLine('=')
      .newLine();
  }

  private generateReceiptInfo(builder: any, receiptNumber: string, printDate: Date, orderId: string): void {
    builder
      .bold(true)
      .textLine('HÓA ĐƠN BÁN LẺ')
      .bold(false)
      .leftRightText(`Hóa đơn: ${receiptNumber}`, ``)
      .leftRightText(`Ngày: ${ESCPOSUtils.formatReceiptDate(printDate)}`, ``)
      .leftRightText(`Đơn hàng: ${orderId.slice(-8).toUpperCase()}`, ``)
      .newLine();
  }

  private generateCustomerInfo(builder: any, customer: Customer): void {
    builder
      .textLine(`Khách hàng: ${customer.name}`);
    
    if (customer.phone) {
      builder.textLine(`SĐT: ${customer.phone}`);
    }
    
    if (customer.email) {
      builder.textLine(`Email: ${customer.email}`);
    }
    
    builder.newLine();
  }

  private generateItems(builder: any, orderItems: (OrderItem & { product: Product })[], config: ReceiptConfig): void {
    const paperWidth = PAPER_CONFIGS[config.paperWidth].width;
    builder.horizontalLine('-');

    // Header row with dynamic format based on paper width
    if (config.paperSaving || paperWidth < 40) {
      // Compact format for 58mm or paper saving mode
      builder.textLine('Sản phẩm - SL - Thành tiền');
    } else {
      // Full format for 80mm
      builder
        .leftRightText('Sản phẩm', 'SL | Đ.giá | T.tiền')
        .horizontalLine('-');
    }

    // Items
    orderItems.forEach((item, index) => {
      const product = item.product;
      const quantity = ESCPOSUtils.formatQuantity(item.quantity, product.unitType || 'count');
      const unit = product.unit || 'cái';
      const quantityText = `${quantity} ${unit}`;
      const unitPrice = parseFloat(item.price.toString());
      const totalPrice = item.quantity * unitPrice;

      if (config.paperSaving || paperWidth < 40) {
        // Compact format for 58mm paper or paper saving mode
        const nameLines = ESCPOSUtils.wrapText(product.name, Math.floor(paperWidth * 0.7));
        nameLines.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            builder.textLine(`${line}`);
            builder.textLine(`  ${quantityText} x ${ESCPOSUtils.formatVND(unitPrice)} = ${ESCPOSUtils.formatVND(totalPrice)}`);
          } else {
            builder.textLine(`${line}`);
          }
        });
      } else {
        // Full format for 80mm paper
        const nameLines = ESCPOSUtils.wrapText(product.name, Math.floor(paperWidth * 0.6));
        nameLines.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            builder.textLine(line);
            builder.leftRightText(
              `  ${quantityText} x ${ESCPOSUtils.formatVND(unitPrice)}`,
              ESCPOSUtils.formatVND(totalPrice)
            );
          } else {
            builder.textLine(line);
          }
        });
      }

      if (index < orderItems.length - 1) {
        builder.newLine();
      }
    });

    builder.horizontalLine('-');
  }

  private generateTotals(builder: any, order: Order, config: ReceiptConfig): void {
    const total = parseFloat(order.total.toString());

    builder
      .bold(true)
      .leftRightText('TỔNG CỘNG:', ESCPOSUtils.formatVND(total))
      .bold(false);

    if (config.vatEnabled) {
      const vatAmount = total * 0.1; // 10% VAT
      const totalWithVAT = total + vatAmount;
      
      builder
        .leftRightText('VAT (10%):', ESCPOSUtils.formatVND(vatAmount))
        .bold(true)
        .leftRightText('THÀNH TIỀN:', ESCPOSUtils.formatVND(totalWithVAT))
        .bold(false);
    }

    builder.horizontalLine('=').newLine();
  }

  private generateFooter(builder: any, shopSettings: ShopSettings, config: ReceiptConfig): void {
    builder
      .alignCenter()
      .textLine(config.footerMessage || 'Cảm ơn quý khách!')
      .textLine('Hẹn gặp lại!')
      .newLine();

    if (shopSettings.website) {
      builder.textLine(shopSettings.website);
    }

    if (config.printCopies === 'customer') {
      builder.textLine('--- BẢN KHÁCH HÀNG ---');
    } else if (config.printCopies === 'merchant') {
      builder.textLine('--- BẢN CỬA HÀNG ---');
    }

    builder.alignLeft();
  }

  // Helper methods
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  private formatLine(col1: string, col2: string, col3: string, col4: string, widths: number[]): string {
    const pad = (str: string, width: number, align: 'left' | 'right' = 'left') => {
      if (str.length >= width) return str.substring(0, width);
      const padding = width - str.length;
      return align === 'right' ? ' '.repeat(padding) + str : str + ' '.repeat(padding);
    };

    return [
      pad(col1, widths[0], 'left'),
      pad(col2, widths[1], 'right'),
      pad(col3, widths[2], 'right'),
      pad(col4, widths[3], 'right')
    ].join('');
  }

  private wrapText(text: string, maxWidth: number): string[] {
    return ESCPOSUtils.wrapText(text, maxWidth);
  }
}

/**
 * Compact Receipt Template (Paper Saving)
 */
export class CompactReceiptTemplate extends StandardReceiptTemplate {
  name = 'Hóa đơn tiết kiệm';
  description = 'Template thu gọn để tiết kiệm giấy';

  generate(data: ReceiptData): string {
    // Override config to use paper saving mode
    const compactConfig = { ...data.config, paperSaving: true };
    const compactData = { ...data, config: compactConfig };
    return super.generate(compactData);
  }
}

/**
 * Template Registry
 */
export class ReceiptTemplateRegistry {
  private templates: Map<string, ReceiptTemplate> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register('standard', new StandardReceiptTemplate());
    this.register('compact', new CompactReceiptTemplate());
  }

  register(key: string, template: ReceiptTemplate): void {
    this.templates.set(key, template);
  }

  get(key: string): ReceiptTemplate | undefined {
    return this.templates.get(key);
  }

  getAll(): Array<{ key: string; template: ReceiptTemplate }> {
    return Array.from(this.templates.entries()).map(([key, template]) => ({ key, template }));
  }

  getDefault(): ReceiptTemplate {
    return this.get('standard') || new StandardReceiptTemplate();
  }
}

// Default registry instance
export const receiptTemplates = new ReceiptTemplateRegistry();

/**
 * Receipt Builder - Main interface for generating receipts
 */
export class ReceiptBuilder {
  private template: ReceiptTemplate;
  private config: ReceiptConfig;

  constructor(
    template: ReceiptTemplate = receiptTemplates.getDefault(),
    config: Partial<ReceiptConfig> = {}
  ) {
    this.template = template;
    this.config = {
      paperWidth: '80mm',
      logoEnabled: false,
      vatEnabled: false,
      footerMessage: 'Cảm ơn quý khách!',
      printCopies: 'customer',
      paperSaving: false,
      barcodeEnabled: false,
      ...config
    };
  }

  setTemplate(template: ReceiptTemplate): ReceiptBuilder {
    this.template = template;
    return this;
  }

  setConfig(config: Partial<ReceiptConfig>): ReceiptBuilder {
    this.config = { ...this.config, ...config };
    return this;
  }

  generateReceipt(
    order: Order,
    orderItems: (OrderItem & { product: Product })[],
    shopSettings: ShopSettings,
    customer?: Customer,
    receiptNumber?: string
  ): string {
    const receiptData: ReceiptData = {
      order,
      orderItems,
      customer,
      shopSettings,
      receiptNumber: receiptNumber || ESCPOSUtils.generateReceiptNumber(order.id),
      printDate: new Date(),
      config: this.config
    };

    return this.template.generate(receiptData);
  }

  generatePreview(
    order: Order,
    orderItems: (OrderItem & { product: Product })[],
    shopSettings: ShopSettings,
    customer?: Customer,
    receiptNumber?: string
  ): string {
    const receiptData: ReceiptData = {
      order,
      orderItems,
      customer,
      shopSettings,
      receiptNumber: receiptNumber || ESCPOSUtils.generateReceiptNumber(order.id),
      printDate: new Date(),
      config: this.config
    };

    return this.template.generatePreview(receiptData);
  }

  // Generate receipt for different copy types
  generateCustomerCopy(
    order: Order,
    orderItems: (OrderItem & { product: Product })[],
    shopSettings: ShopSettings,
    customer?: Customer,
    receiptNumber?: string
  ): string {
    const originalConfig = this.config;
    this.config = { ...this.config, printCopies: 'customer' };
    const receipt = this.generateReceipt(order, orderItems, shopSettings, customer, receiptNumber);
    this.config = originalConfig;
    return receipt;
  }

  generateMerchantCopy(
    order: Order,
    orderItems: (OrderItem & { product: Product })[],
    shopSettings: ShopSettings,
    customer?: Customer,
    receiptNumber?: string
  ): string {
    const originalConfig = this.config;
    this.config = { ...this.config, printCopies: 'merchant' };
    const receipt = this.generateReceipt(order, orderItems, shopSettings, customer, receiptNumber);
    this.config = originalConfig;
    return receipt;
  }
}

// Default receipt builder instance
export function createReceiptBuilder(
  template?: ReceiptTemplate,
  config?: Partial<ReceiptConfig>
): ReceiptBuilder {
  return new ReceiptBuilder(template, config);
}