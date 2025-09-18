/**
 * 🏦 VietQR Service - Automatic QR Code Generation for Vietnamese Banking
 * 
 * This service handles automatic QR code generation using VietQR.io API
 * for seamless payment integration with Vietnamese banks.
 * 
 * Bank: SHB (Ngân hàng TMCP Sài Gòn - Hà Nội) - 970443
 * Uses official VietQR quicklink format with URL parameters
 */

export interface BankInfo {
  bank: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface QRGenerationOptions {
  amount: number;
  orderId: string;
  description?: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export interface QRResult {
  qrCodeUrl: string;
  bankInfo: BankInfo;
  amount: number;
  orderId: string; // ✅ Original order ID
  standardReference: string; // ✅ Separate standardized reference for QR memo
  expiresAt: Date;
}

export class VietQRService {
  /**
   * 🔒 Get required environment variable (no fallbacks for production safety)
   */
  private static getRequiredEnvVar(varName: string): string {
    const value = process.env[varName];
    if (!value) {
      throw new Error(`⚠️  CRITICAL: ${varName} environment variable is required for VietQR integration. Please set it in Replit Secrets.`);
    }
    return value;
  }

  private static readonly SHB_BANK_INFO: BankInfo = {
    bank: "SHB",
    bankCode: "970443", // ✅ CORRECT SHB NAPAS BIN code (confirmed from official VietQR list)
    bankName: "Ngân hàng TMCP Sài Gòn - Hà Nội", 
    accountNumber: VietQRService.getRequiredEnvVar('SHB_BANK_ACCOUNT'), // MUST be from Replit Secrets
    accountName: VietQRService.getRequiredEnvVar('SHB_ACCOUNT_NAME') // MUST be from Replit Secrets
  };

  private static readonly BASE_URL = "https://img.vietqr.io/image";
  private static readonly QR_EXPIRY_MINUTES = 15;

  /**
   * 📋 Generate standardized reference for consistency between QR and UI
   */
  static generateStandardReference(orderId: string): string {
    return `DH-${orderId.slice(-8).toUpperCase()}`;
  }

  /**
   * 🎯 Generate QR Code URL for Payment
   * Uses VietQR.io Quicklink API (FREE tier) with validation
   */
  static generateQRCode(options: QRGenerationOptions): QRResult {
    // ✅ Enforce validation first
    const validation = this.validateParams(options);
    if (!validation.isValid) {
      throw new Error(`VietQR validation failed: ${validation.error}`);
    }

    const { amount, orderId, description, template = 'compact' } = options;
    
    // 🏦 Build VietQR URL format: /image/{BANK}-{ACCOUNT}-{TEMPLATE}.jpg 
    // ✅ Using official VietQR quicklink format as shown by user
    const baseUrl = `${this.BASE_URL}/${this.SHB_BANK_INFO.bank.toLowerCase()}-${this.SHB_BANK_INFO.accountNumber}-${template}.jpg`;
    
    // 📋 Generate standardized reference for invoice ID (addInfo = id hóa đơn)
    const standardRef = this.generateStandardReference(orderId);
    
    // 💰 Add query parameters với proper VietQR format
    const roundedAmount = Math.round(amount); // ✅ Use Math.round for proper VND rounding
    const params = new URLSearchParams({
      amount: roundedAmount.toString(),
      addInfo: standardRef, // ✅ addInfo = id hóa đơn (invoice ID)
      accountName: this.SHB_BANK_INFO.accountName // ✅ No double-encoding (URLSearchParams encodes automatically)
    });
    
    const qrCodeUrl = `${baseUrl}?${params.toString()}`;
    
    // ⏰ Calculate expiry time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.QR_EXPIRY_MINUTES);
    
    return {
      qrCodeUrl,
      bankInfo: this.SHB_BANK_INFO,
      amount: roundedAmount,
      orderId, // ✅ Return original orderId, not standardized reference
      standardReference: standardRef, // ✅ Add separate field for memo
      expiresAt
    };
  }

  /**
   * 🎨 Generate QR with Different Templates
   */
  static generateWithTemplate(options: QRGenerationOptions, template: 'compact' | 'compact2' | 'qr_only' | 'print'): QRResult {
    return this.generateQRCode({
      ...options,
      template
    });
  }

  /**
   * 📱 Generate Mobile-Optimized QR (Compact)
   */
  static generateMobileQR(amount: number, orderId: string, description?: string): QRResult {
    return this.generateQRCode({
      amount,
      orderId,
      description,
      template: 'compact'
    });
  }

  /**
   * 🖨️ Generate Print-Ready QR
   */
  static generatePrintQR(amount: number, orderId: string, description?: string): QRResult {
    return this.generateQRCode({
      amount,
      orderId,
      description,
      template: 'print'
    });
  }

  /**
   * ✅ Validate QR Generation Parameters
   */
  static validateParams(options: QRGenerationOptions): { isValid: boolean; error?: string } {
    const { amount, orderId } = options;
    
    if (!amount || amount <= 0) {
      return { isValid: false, error: "Amount must be greater than 0" };
    }
    
    if (!orderId || orderId.trim().length === 0) {
      return { isValid: false, error: "Order ID is required" };
    }
    
    if (amount > 999999999) {
      return { isValid: false, error: "Amount too large for QR generation" };
    }
    
    return { isValid: true };
  }

  /**
   * 🌟 Get Bank Information
   */
  static getBankInfo(): BankInfo {
    return this.SHB_BANK_INFO;
  }

  /**
   * 🕐 Check if QR Code is Expired
   */
  static isQRExpired(createdAt: Date): boolean {
    const now = new Date();
    const expiryTime = new Date(createdAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + this.QR_EXPIRY_MINUTES);
    
    return now > expiryTime;
  }

  /**
   * 🔄 Generate Deep Link for Banking Apps
   * ✅ Uses standardized reference for consistency with QR code
   */
  static generateDeepLink(amount: number, orderId: string): string {
    const standardRef = this.generateStandardReference(orderId); // ✅ Use standard reference
    const roundedAmount = Math.round(amount); // ✅ Consistent rounding
    const { bankCode, accountNumber, accountName } = this.SHB_BANK_INFO;
    
    const params = new URLSearchParams({
      bank: bankCode,
      account: accountNumber,
      amount: roundedAmount.toString(),
      memo: standardRef, // ✅ Consistent with QR addInfo
      accountName: accountName
    });
    
    return `vietqr://pay?${params.toString()}`;
  }
}

export default VietQRService;