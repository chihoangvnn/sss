/**
 * ESC/POS Command Utilities for KPOS ZY307 Thermal Printer
 * Supports 80mm paper width and Vietnamese characters
 */

// ESC/POS Commands for KPOS ZY307
export const ESC = '\x1B'; // Escape character
export const GS = '\x1D'; // Group separator
export const FS = '\x1C'; // File separator
export const US = '\x1F'; // Unit separator

// Paper width configurations
export const PAPER_CONFIGS = {
  '58mm': { width: 32, name: '58mm (32 ký tự)' },
  '80mm': { width: 48, name: '80mm (48 ký tự)' }
} as const;

export type PaperWidth = keyof typeof PAPER_CONFIGS;

// Basic ESC/POS Commands with KPOS ZY307 Vietnamese Support
export const ESCPOS_COMMANDS = {
  // Initialize printer
  INIT: ESC + '@',
  
  // Text formatting
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  UNDERLINE_ON: ESC + '-' + '\x01',
  UNDERLINE_OFF: ESC + '-' + '\x00',
  INVERSE_ON: GS + 'B' + '\x01',
  INVERSE_OFF: GS + 'B' + '\x00',
  
  // Text size
  NORMAL_SIZE: GS + '!' + '\x00',
  DOUBLE_WIDTH: GS + '!' + '\x10',
  DOUBLE_HEIGHT: GS + '!' + '\x01',
  DOUBLE_SIZE: GS + '!' + '\x11',
  
  // Alignment
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  
  // Line spacing
  DEFAULT_LINE_SPACING: ESC + '2',
  SET_LINE_SPACING: (n: number) => ESC + '3' + String.fromCharCode(n),
  
  // Feed and cut
  FEED_LINE: '\n',
  FEED_LINES: (n: number) => ESC + 'd' + String.fromCharCode(n),
  CUT_PAPER: GS + 'V' + '\x41' + '\x00', // Full cut
  PARTIAL_CUT: GS + 'V' + '\x42' + '\x00', // Partial cut
  
  // KPOS ZY307 Vietnamese Character Support
  // CP1258 (Vietnamese) code page for proper diacritical mark support
  SELECT_CHARSET_VIETNAMESE: ESC + 'R' + '\x0F', // Vietnamese character set
  SELECT_CODE_TABLE_CP1258: ESC + 't' + '\x1E', // CP1258 Vietnamese code table
  ENABLE_UTF8_MODE: FS + '&', // UTF-8 mode for modern printers
  
  // KPOS ZY307 specific commands for Vietnamese text
  KPOS_INIT_VIETNAMESE: ESC + '@' + ESC + 'R' + '\x0F' + ESC + 't' + '\x1E',
  KPOS_UTF8_START: '\xEF\xBB\xBF', // UTF-8 BOM for Vietnamese text blocks
  
  // Default paper width (will be configurable)
  PAPER_WIDTH: 48,
  
  // Text encoding modes
  ENCODING_CP1258: 'cp1258',
  ENCODING_UTF8: 'utf-8',
} as const;

/**
 * ESC/POS Command Builder Class
 */
export class ESCPOSBuilder {
  private commands: string[] = [];
  private paperWidth: number = ESCPOS_COMMANDS.PAPER_WIDTH;
  private enableVietnameseSupport: boolean = true;

  constructor(paperWidth: PaperWidth = '80mm', enableVietnamese: boolean = true) {
    this.paperWidth = PAPER_CONFIGS[paperWidth].width;
    this.enableVietnameseSupport = enableVietnamese;
    this.init();
  }

  // Initialize printer with Vietnamese support
  init(): ESCPOSBuilder {
    if (this.enableVietnameseSupport) {
      // KPOS ZY307 Vietnamese initialization sequence
      this.commands.push(ESCPOS_COMMANDS.KPOS_INIT_VIETNAMESE);
      this.commands.push(ESCPOS_COMMANDS.ENABLE_UTF8_MODE);
    } else {
      this.commands.push(ESCPOS_COMMANDS.INIT);
    }
    this.commands.push(ESCPOS_COMMANDS.DEFAULT_LINE_SPACING);
    return this;
  }

  // Text formatting
  bold(enabled: boolean = true): ESCPOSBuilder {
    this.commands.push(enabled ? ESCPOS_COMMANDS.BOLD_ON : ESCPOS_COMMANDS.BOLD_OFF);
    return this;
  }

  underline(enabled: boolean = true): ESCPOSBuilder {
    this.commands.push(enabled ? ESCPOS_COMMANDS.UNDERLINE_ON : ESCPOS_COMMANDS.UNDERLINE_OFF);
    return this;
  }

  inverse(enabled: boolean = true): ESCPOSBuilder {
    this.commands.push(enabled ? ESCPOS_COMMANDS.INVERSE_ON : ESCPOS_COMMANDS.INVERSE_OFF);
    return this;
  }

  // Text size
  normalSize(): ESCPOSBuilder {
    this.commands.push(ESCPOS_COMMANDS.NORMAL_SIZE);
    return this;
  }

  doubleWidth(): ESCPOSBuilder {
    this.commands.push(ESCPOS_COMMANDS.DOUBLE_WIDTH);
    return this;
  }

  doubleHeight(): ESCPOSBuilder {
    this.commands.push(ESCPOS_COMMANDS.DOUBLE_HEIGHT);
    return this;
  }

  doubleSize(): ESCPOSBuilder {
    this.commands.push(ESCPOS_COMMANDS.DOUBLE_SIZE);
    return this;
  }

  // Alignment
  alignLeft(): ESCPOSBuilder {
    this.commands.push(ESCPOS_COMMANDS.ALIGN_LEFT);
    return this;
  }

  alignCenter(): ESCPOSBuilder {
    this.commands.push(ESCPOS_COMMANDS.ALIGN_CENTER);
    return this;
  }

  alignRight(): ESCPOSBuilder {
    this.commands.push(ESCPOS_COMMANDS.ALIGN_RIGHT);
    return this;
  }

  // Text output
  text(content: string): ESCPOSBuilder {
    // Convert Vietnamese characters to proper encoding
    const processedText = this.processVietnameseText(content);
    this.commands.push(processedText);
    return this;
  }

  textLine(content: string): ESCPOSBuilder {
    this.text(content);
    this.newLine();
    return this;
  }

  // Line management
  newLine(count: number = 1): ESCPOSBuilder {
    for (let i = 0; i < count; i++) {
      this.commands.push(ESCPOS_COMMANDS.FEED_LINE);
    }
    return this;
  }

  feed(lines: number): ESCPOSBuilder {
    this.commands.push(ESCPOS_COMMANDS.FEED_LINES(lines));
    return this;
  }

  // Horizontal line
  horizontalLine(char: string = '-', length?: number): ESCPOSBuilder {
    const lineLength = length || this.paperWidth;
    const line = char.repeat(lineLength);
    this.textLine(line);
    return this;
  }

  // Formatted text helpers
  centerText(content: string, totalWidth?: number): ESCPOSBuilder {
    const width = totalWidth || this.paperWidth;
    const contentLength = this.getStringWidth(content);
    
    if (contentLength >= width) {
      return this.textLine(content);
    }

    const padding = Math.floor((width - contentLength) / 2);
    const centeredText = ' '.repeat(padding) + content;
    return this.textLine(centeredText);
  }

  leftRightText(leftText: string, rightText: string, totalWidth?: number): ESCPOSBuilder {
    const width = totalWidth || this.paperWidth;
    const leftWidth = this.getStringWidth(leftText);
    const rightWidth = this.getStringWidth(rightText);
    
    if (leftWidth + rightWidth >= width) {
      this.textLine(leftText);
      this.alignRight().textLine(rightText).alignLeft();
      return this;
    }

    const spaces = ' '.repeat(width - leftWidth - rightWidth);
    const line = leftText + spaces + rightText;
    return this.textLine(line);
  }

  // Set paper width dynamically
  setPaperWidth(paperWidth: PaperWidth): ESCPOSBuilder {
    this.paperWidth = PAPER_CONFIGS[paperWidth].width;
    return this;
  }

  // Get current paper width
  getPaperWidth(): number {
    return this.paperWidth;
  }

  // Paper control
  cut(partial: boolean = false): ESCPOSBuilder {
    this.commands.push(partial ? ESCPOS_COMMANDS.PARTIAL_CUT : ESCPOS_COMMANDS.CUT_PAPER);
    return this;
  }

  // Build final command string
  build(): string {
    return this.commands.join('');
  }

  // Get commands as Uint8Array for Web Serial API
  buildBytes(): Uint8Array {
    const commandString = this.build();
    return new TextEncoder().encode(commandString);
  }

  // Clear commands
  clear(): ESCPOSBuilder {
    this.commands = [];
    this.init();
    return this;
  }

  // Helper methods
  private processVietnameseText(text: string): string {
    if (!this.enableVietnameseSupport) {
      return this.fallbackToAscii(text);
    }

    // KPOS ZY307 Vietnamese character processing
    // Handle full Vietnamese character set including diacritical marks
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
    
    if (vietnameseChars.test(text)) {
      // For KPOS ZY307, prepend UTF-8 BOM for Vietnamese text blocks
      return ESCPOS_COMMANDS.KPOS_UTF8_START + text;
    }
    
    return text; // Return original text for non-Vietnamese content
  }

  private fallbackToAscii(text: string): string {
    // Complete Vietnamese to ASCII mapping for compatibility
    const vietnameseMap: { [key: string]: string } = {
      // Lowercase vowels with diacritics
      'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
      'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
      'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
      'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
      'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
      'đ': 'd',
      // Uppercase vowels with diacritics
      'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
      'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
      'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
      'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
      'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
      'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
      'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
      'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
      'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
      'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
      'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
      'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
      'Đ': 'D'
    };

    let processedText = text;
    for (const [vietnamese, ascii] of Object.entries(vietnameseMap)) {
      processedText = processedText.replace(new RegExp(vietnamese, 'g'), ascii);
    }
    return processedText;
  }

  private getStringWidth(text: string): number {
    // Calculate display width considering Vietnamese characters
    // Vietnamese characters are single-width in most thermal printers
    return text.replace(/[\u0300-\u036f]/g, '').length; // Remove combining marks
  }
}

/**
 * Create a new ESC/POS command builder
 */
export function createESCPOSBuilder(paperWidth: PaperWidth = '80mm', enableVietnamese: boolean = true): ESCPOSBuilder {
  return new ESCPOSBuilder(paperWidth, enableVietnamese);
}

/**
 * Utility functions for common printing tasks
 */
export const ESCPOSUtils = {
  // Format Vietnamese currency
  formatVND(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  },

  // Format date for receipts
  formatReceiptDate(date: Date = new Date()): string {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  },

  // Format quantity with proper decimals
  formatQuantity(quantity: number, unitType: string = 'count'): string {
    if (unitType === 'weight' || unitType === 'volume') {
      return quantity.toFixed(3).replace(/\.?0+$/, '');
    }
    return quantity.toString();
  },

  // Generate incremental receipt number with persistence
  generateReceiptNumber(orderId?: string): string {
    const RECEIPT_COUNTER_KEY = 'pos-receipt-counter';
    
    // Get current counter from localStorage
    let counter = parseInt(localStorage.getItem(RECEIPT_COUNTER_KEY) || '0', 10);
    counter += 1;
    
    // Save updated counter
    localStorage.setItem(RECEIPT_COUNTER_KEY, counter.toString());
    
    // Format as RCP001, RCP002, etc. (Vietnamese business compliance)
    const receiptNumber = `RCP${counter.toString().padStart(3, '0')}`;
    
    // Also save mapping to order ID for tracking
    if (orderId) {
      const RECEIPT_MAPPING_KEY = 'pos-receipt-mapping';
      const mapping = JSON.parse(localStorage.getItem(RECEIPT_MAPPING_KEY) || '{}');
      mapping[receiptNumber] = {
        orderId,
        timestamp: new Date().toISOString(),
        counter
      };
      localStorage.setItem(RECEIPT_MAPPING_KEY, JSON.stringify(mapping));
    }
    
    return receiptNumber;
  },

  // Reset receipt counter (for new business period)
  resetReceiptCounter(): void {
    localStorage.removeItem('pos-receipt-counter');
    localStorage.removeItem('pos-receipt-mapping');
  },

  // Get receipt mapping for reprinting
  getReceiptMapping(receiptNumber?: string): any {
    const RECEIPT_MAPPING_KEY = 'pos-receipt-mapping';
    const mapping = JSON.parse(localStorage.getItem(RECEIPT_MAPPING_KEY) || '{}');
    return receiptNumber ? mapping[receiptNumber] : mapping;
  },

  // Text wrapping for long product names with dynamic width
  wrapText(text: string, maxWidth?: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      
      if (testLine.length <= (maxWidth || 48)) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is longer than maxWidth, need to break it
          const breakWidth = maxWidth || 48;
          lines.push(word.substring(0, breakWidth));
          currentLine = word.substring(breakWidth);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  },

  // Validate ESC/POS command string
  isValidESCPOSCommand(command: string): boolean {
    try {
      new TextEncoder().encode(command);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Test Vietnamese text encoding
  testVietnameseText(): string {
    return "Cửa hàng Bách hóa Sài Gòn";
  },

  // Get paper width configurations
  getPaperConfigs(): typeof PAPER_CONFIGS {
    return PAPER_CONFIGS;
  },

  // Format text for specific paper width
  formatTextForPaper(text: string, paperWidth: PaperWidth): string {
    const width = PAPER_CONFIGS[paperWidth].width;
    if (text.length <= width) {
      return text;
    }
    return text.substring(0, width - 3) + '...';
  }
};