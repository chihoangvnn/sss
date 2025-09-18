/**
 * 🏦 VietQR Service - Automatic QR Code Generation for Vietnamese Banking
 * 
 * This service handles automatic QR code generation using VietQR.io API
 * for seamless payment integration with Vietnamese banks.
 * 
 * Bank: SHB (SaigonBank) - 970431
 * Account: 4555567777
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
  orderId: string;
  expiresAt: Date;
}

export class VietQRService {
  private static readonly SHB_BANK_INFO: BankInfo = {
    bank: "SHB",
    bankCode: "970431", // SaigonBank official code
    bankName: "Ngân hàng TMCP Sài Gòn - Hà Nội", 
    accountNumber: "4555567777",
    accountName: "CONG TY TNHH ABC TECH"
  };

  private static readonly BASE_URL = "https://img.vietqr.io/image";
  private static readonly QR_EXPIRY_MINUTES = 15;

  /**
   * 🎯 Generate QR Code URL for Payment
   * Uses VietQR.io Quicklink API (FREE tier)
   */
  static generateQRCode(options: QRGenerationOptions): QRResult {
    const { amount, orderId, description, template = 'compact' } = options;
    
    // 🏦 Build VietQR URL format: /image/{BANK}-{ACCOUNT}-{TEMPLATE}.jpg
    const baseUrl = `${this.BASE_URL}/${this.SHB_BANK_INFO.bank.toLowerCase()}-${this.SHB_BANK_INFO.accountNumber}-${template}.jpg`;
    
    // 💰 Add query parameters for amount and order info
    const params = new URLSearchParams({
      amount: amount.toString(),
      addInfo: orderId,
      ...(description && { description })
    });
    
    const qrCodeUrl = `${baseUrl}?${params.toString()}`;
    
    // ⏰ Calculate expiry time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.QR_EXPIRY_MINUTES);
    
    return {
      qrCodeUrl,
      bankInfo: this.SHB_BANK_INFO,
      amount,
      orderId,
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
   * Automatically opens customer's banking app for payment
   */
  static generateDeepLink(amount: number, orderId: string): string {
    const { bankCode, accountNumber } = this.SHB_BANK_INFO;
    
    // Universal banking deep link format
    return `vietqr://pay?bank=${bankCode}&account=${accountNumber}&amount=${amount}&memo=${orderId}`;
  }
}

export default VietQRService;