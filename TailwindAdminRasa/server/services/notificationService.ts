// =====================================================
// 🔔 VIETNAMESE NOTIFICATION SERVICE
// Integrates: Twilio SMS, SendGrid, Replit Mail
// =====================================================

import { sendEmail as sendReplitMail } from '../utils/replitmail';
import { MailService } from '@sendgrid/mail';
import { spawn } from 'child_process';
import type { 
  NotificationTemplate, 
  Notification, 
  InsertNotification, 
  InsertNotificationLog 
} from '@shared/schema';

// Vietnamese SMS carrier rates (VND per SMS)
const VIETNAMESE_SMS_RATES = {
  viettel: 550,
  vinaphone: 580,
  mobifone: 520,
  vietnamobile: 500,
  gmobile: 480,
} as const;

// Configure SendGrid at module level
const sendGridClient = process.env.SENDGRID_API_KEY ? (() => {
  const mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  return mailService;
})() : null;

export interface NotificationRequest {
  customerId?: string;
  orderId?: string;
  templateId?: string;
  
  // Message content
  title: string;
  content: string;
  
  // Recipients
  recipientPhone?: string;
  recipientEmail?: string;
  recipientMessengerId?: string;
  
  // Channels to use
  channels: ('sms' | 'email' | 'messenger')[];
  
  // Template variables
  variables?: Record<string, any>;
  
  // Scheduling
  scheduledAt?: Date;
  priority?: number;
}

export interface NotificationResult {
  success: boolean;
  notificationId: string;
  channels: {
    sms?: { success: boolean; messageId?: string; error?: string; cost?: number };
    email?: { success: boolean; messageId?: string; error?: string };
    messenger?: { success: boolean; messageId?: string; error?: string };
  };
  totalCost: number;
}

export class VietnameseNotificationService {
  /**
   * Send multi-channel notification
   */
  async sendNotification(request: NotificationRequest): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      notificationId: '',
      channels: {},
      totalCost: 0
    };

    try {
      // Process template variables
      const processedContent = this.processTemplate(request.content, request.variables || {});
      const processedTitle = this.processTemplate(request.title, request.variables || {});

      // Estimate costs
      const estimatedCost = this.estimateCost(processedContent, request.channels);
      const estimatedSmsSegments = this.calculateSmsSegments(processedContent);

      // Create notification record (would use storage service in real implementation)
      const notificationId = this.generateId();
      result.notificationId = notificationId;

      // Send via each channel
      if (request.channels.includes('sms') && request.recipientPhone) {
        result.channels.sms = await this.sendSMS(
          request.recipientPhone,
          processedContent,
          notificationId
        );
        if (result.channels.sms.cost) {
          result.totalCost += result.channels.sms.cost;
        }
      }

      if (request.channels.includes('email') && request.recipientEmail) {
        result.channels.email = await this.sendEmailNotification(
          request.recipientEmail,
          processedTitle,
          processedContent,
          notificationId
        );
      }

      if (request.channels.includes('messenger') && request.recipientMessengerId) {
        result.channels.messenger = await this.sendMessengerNotification(
          request.recipientMessengerId,
          processedContent,
          notificationId
        );
      }

      // Check if at least one channel succeeded
      result.success = Object.values(result.channels).some(channel => channel?.success);

      return result;
    } catch (error) {
      console.error('Notification service error:', error);
      result.success = false;
      return result;
    }
  }

  /**
   * Send SMS via Twilio with Vietnamese carrier support
   */
  private async sendSMS(phone: string, message: string, notificationId: string) {
    try {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        throw new Error('Twilio credentials not configured');
      }

      // Calculate SMS cost for Vietnamese carriers
      const segments = this.calculateSmsSegments(message);
      const carrier = this.detectVietnameseCarrier(phone);
      const cost = segments * VIETNAMESE_SMS_RATES[carrier];

      // Call Python Twilio script
      const result = await this.callTwilioScript(phone, message);
      
      return {
        success: true,
        messageId: result.sid,
        cost: cost,
        segments: segments,
        carrier: carrier
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS send failed'
      };
    }
  }

  /**
   * Send email via SendGrid or Replit Mail
   */
  private async sendEmailNotification(email: string, subject: string, content: string, notificationId: string) {
    try {
      // Try SendGrid first, fallback to Replit Mail
      if (process.env.SENDGRID_API_KEY) {
        return await this.sendViaSendGrid(email, subject, content);
      } else {
        return await this.sendViaReplitMail(email, subject, content);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed'
      };
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(email: string, subject: string, content: string) {
    if (!sendGridClient) {
      throw new Error('SendGrid client not configured');
    }

    const msg = {
      to: email,
      from: 'noreply@yourdomain.com', // Configure this
      subject: subject,
      text: content,
      html: this.convertToHtml(content)
    };

    const response = await sendGridClient.send(msg);
    return {
      success: true,
      messageId: response[0].headers['x-message-id']
    };
  }

  /**
   * Send email via Replit Mail
   */
  private async sendViaReplitMail(email: string, subject: string, content: string) {
    const result = await sendReplitMail({
      to: email,
      subject: subject,
      text: content,
      html: this.convertToHtml(content)
    });

    return {
      success: true,
      messageId: result.messageId
    };
  }

  /**
   * Send messenger notification (placeholder for Facebook integration)
   */
  private async sendMessengerNotification(messengerId: string, content: string, notificationId: string) {
    // This would integrate with Facebook Messenger API
    // For now, returning placeholder
    return {
      success: false,
      error: 'Messenger integration not yet implemented'
    };
  }

  /**
   * Process template variables ({{variable}})
   */
  private processTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Calculate SMS segments (160 chars per segment for Vietnamese)
   */
  private calculateSmsSegments(message: string): number {
    // Vietnamese characters may use more bytes
    const length = new TextEncoder().encode(message).length;
    return Math.ceil(length / 160);
  }

  /**
   * Detect Vietnamese carrier from phone number
   */
  private detectVietnameseCarrier(phone: string): keyof typeof VIETNAMESE_SMS_RATES {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Vietnamese carrier prefixes
    if (cleanPhone.match(/^(84|0)?(86|96|97|98|32|33|34|35|36|37|38|39)/)) return 'viettel';
    if (cleanPhone.match(/^(84|0)?(81|82|83|84|85|88)/)) return 'vinaphone';
    if (cleanPhone.match(/^(84|0)?(89|90|93|70|79|77|76|78)/)) return 'mobifone';
    if (cleanPhone.match(/^(84|0)?(52|56|58|92)/)) return 'vietnamobile';
    if (cleanPhone.match(/^(84|0)?(59|99)/)) return 'gmobile';
    
    return 'viettel'; // Default
  }

  /**
   * Estimate total cost for notification
   */
  private estimateCost(content: string, channels: string[]): number {
    let totalCost = 0;
    
    if (channels.includes('sms')) {
      const segments = this.calculateSmsSegments(content);
      totalCost += segments * VIETNAMESE_SMS_RATES.viettel; // Average rate
    }
    
    // Email costs are typically minimal for transactional emails
    if (channels.includes('email')) {
      totalCost += 0; // Usually free for reasonable volumes
    }
    
    return totalCost;
  }

  /**
   * Convert plain text to basic HTML
   */
  private convertToHtml(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  /**
   * Call Python Twilio script
   */
  private callTwilioScript(phone: string, message: string): Promise<{ sid: string }> {
    return new Promise((resolve, reject) => {
      const pythonScript = spawn('python3', ['-c', `
import os
import sys
from twilio.rest import Client

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")

try:
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    message = client.messages.create(
        body="${message.replace(/"/g, '\\"')}",
        from_=TWILIO_PHONE_NUMBER,
        to="${phone}"
    )
    print(f'{{"sid": "{message.sid}"}}')
except Exception as e:
    print(f'{{"error": "{str(e)}"}}', file=sys.stderr)
    sys.exit(1)
      `]);

      let output = '';
      let errorOutput = '';

      pythonScript.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonScript.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonScript.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(result);
          } catch (error) {
            reject(new Error('Failed to parse Twilio response'));
          }
        } else {
          reject(new Error(errorOutput || 'Twilio script failed'));
        }
      });
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const notificationService = new VietnameseNotificationService();

// Default templates for Vietnamese retail POS
export const VIETNAMESE_ORDER_TEMPLATES = {
  order_status_shipped: {
    title: "Đơn hàng {{orderNumber}} đã được gửi",
    sms: "Xin chào {{customerName}}! Đơn hàng {{orderNumber}} của bạn đã được gửi đi. Tổng tiền: {{orderTotal}}. Cảm ơn bạn!",
    email: `Xin chào {{customerName}},

Đơn hàng {{orderNumber}} của bạn đã được gửi đi thành công.

Chi tiết đơn hàng:
- Mã đơn hàng: {{orderNumber}}
- Tổng tiền: {{orderTotal}}
- Ngày gửi: {{shippedDate}}

Bạn sẽ nhận được hàng trong 1-3 ngày làm việc.

Cảm ọn bạn đã mua hàng!`
  },
  order_status_delivered: {
    title: "Đơn hàng {{orderNumber}} đã được giao",
    sms: "Đơn hàng {{orderNumber}} đã được giao thành công! Cảm ơn {{customerName}} đã tin tưởng chúng tôi. 🙏",
    email: `Xin chào {{customerName}},

Đơn hàng {{orderNumber}} đã được giao thành công đến địa chỉ của bạn.

Nếu có bất kỳ vấn đề gì với sản phẩm, vui lòng liên hệ với chúng tôi trong vòng 7 ngày.

Cảm ơn bạn đã lựa chọn chúng tôi!`
  },
  payment_confirmed: {
    title: "Xác nhận thanh toán đơn hàng {{orderNumber}}",
    sms: "Thanh toán {{amount}} cho đơn hàng {{orderNumber}} đã được xác nhận. Cảm ơn {{customerName}}!",
    email: `Xin chào {{customerName}},

Chúng tôi đã nhận được thanh toán của bạn.

Thông tin thanh toán:
- Đơn hàng: {{orderNumber}}
- Số tiền: {{amount}}
- Thời gian: {{paymentTime}}

Đơn hàng của bạn sẽ được xử lý ngay lập tức.

Trân trọng!`
  }
};