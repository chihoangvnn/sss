/**
 * Receipt Printer Component with Web Serial API and Export Options
 * Supports KPOS ZY307 thermal printer and multiple export formats
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Printer, 
  Download, 
  Eye, 
  Settings, 
  FileText, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Copy,
  AlertTriangle,
  CheckCircle,
  Save
} from "lucide-react";

import { 
  StandardReceiptTemplate,
  type ReceiptConfig,
  type ReceiptTemplate 
} from '@/utils/receiptTemplates';
import { createESCPOSBuilder, ESCPOSUtils } from '@/utils/escpos';
import type { Order, OrderItem, Customer, Product, ShopSettings } from '@shared/schema';

// Web Serial API types for KPOS ZY307
interface SerialPort {
  open(options: { 
    baudRate: number;
    dataBits?: number;
    stopBits?: number;
    parity?: 'none' | 'even' | 'odd';
    flowControl?: 'none' | 'hardware';
  }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array> | null;
  readable: ReadableStream<Uint8Array> | null;
}

interface Navigator {
  serial?: {
    requestPort(): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  };
}

interface ReceiptPrinterProps {
  // Receipt data
  order: Order;
  orderItems: (OrderItem & { product: Product })[];
  shopSettings: ShopSettings;
  customer?: Customer;
  receiptNumber?: string;
  
  // UI props
  trigger?: React.ReactNode;
  onPrintSuccess?: () => void;
  onPrintError?: (error: string) => void;
  
  // Auto-print settings
  autoPrint?: boolean;
  autoClose?: boolean;
}

export function ReceiptPrinter({
  order,
  orderItems,
  shopSettings,
  customer,
  receiptNumber,
  trigger,
  onPrintSuccess,
  onPrintError,
  autoPrint = false,
  autoClose = false
}: ReceiptPrinterProps) {
  const { toast } = useToast();
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerPort, setPrinterPort] = useState<SerialPort | null>(null);
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  
  // Configuration state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [config, setConfig] = useState<ReceiptConfig>({
    paperWidth: '80mm',
    logoEnabled: false,
    vatEnabled: false,
    footerMessage: 'Cảm ơn quý khách!',
    printCopies: 'customer',
    paperSaving: false,
    barcodeEnabled: false,
  });
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [customFooter, setCustomFooter] = useState(config.footerMessage);
  
  // Refs
  const previewRef = useRef<HTMLPreElement>(null);
  
  // Available receipt templates
  const availableTemplates = [
    { key: 'standard', template: new StandardReceiptTemplate() },
    { key: 'compact', template: new StandardReceiptTemplate() },
    { key: 'detailed', template: new StandardReceiptTemplate() }
  ];
  
  // Get current template
  const currentTemplate = availableTemplates.find(t => t.key === selectedTemplate)?.template || new StandardReceiptTemplate();
  
  // Check Web Serial API support
  const isSerialSupported = typeof (navigator as any).serial !== 'undefined';

  // Generate receipt preview with Vietnamese support
  const generatePreview = () => {
    try {
      const currentReceiptNumber = receiptNumber || ESCPOSUtils.generateReceiptNumber(order.id);
      
      const receiptData = {
        order,
        orderItems,
        customer,
        shopSettings: {
          ...shopSettings,
          businessName: shopSettings.businessName || 'Cửa hàng Bách hóa Sài Gòn' // Vietnamese test text
        },
        receiptNumber: currentReceiptNumber,
        printDate: new Date(),
        config
      };
      
      const preview = currentTemplate.generatePreview(receiptData);
      setReceiptPreview(preview);
    } catch (error) {
      console.error('Error generating receipt preview:', error);
      setReceiptPreview('Lỗi tạo preview hóa đơn');
    }
  };

  // Update preview when config changes
  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [isOpen, selectedTemplate, config, order, orderItems, shopSettings, customer, receiptNumber]);

  // Auto-print on mount if enabled
  useEffect(() => {
    if (autoPrint && isOpen) {
      handleDirectPrint();
    }
  }, [autoPrint, isOpen]);

  // Test printer connection
  const testPrinterConnection = async (port: SerialPort) => {
    try {
      if (port.writable) {
        const writer = port.writable.getWriter();
        // Send Vietnamese initialization sequence for KPOS ZY307
        const testCommand = new TextEncoder().encode('\x1B@\x1BR\x0F\x1Bt\x1E'); // ESC @ + Vietnamese charset
        await writer.write(testCommand);
        await writer.releaseLock();
      }
    } catch (error) {
      console.warn('Printer test failed:', error);
    }
  };

  // Connect to thermal printer via Web Serial API with enhanced error handling
  const connectPrinter = async () => {
    if (!isSerialSupported) {
      toast({
        title: "Không hỗ trợ",
        description: "Trình duyệt không hỗ trợ Web Serial API. Hãy sử dụng Chrome/Edge mới nhất.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // First, close any existing connection
      if (printerPort) {
        await disconnectPrinter();
      }

      const port = await navigator.serial!.requestPort({
        filters: [
          // KPOS ZY307 and common thermal printer USB identifiers
          { usbVendorId: 0x0403, usbProductId: 0x6001 }, // FTDI
          { usbVendorId: 0x10C4, usbProductId: 0xEA60 }, // Silicon Labs
          { usbVendorId: 0x067B, usbProductId: 0x2303 }, // Prolific
          { usbVendorId: 0x1659, usbProductId: 0x8963 }, // KPOS specific
        ]
      });

      // Open with optimal settings for thermal printers
      await port.open({ 
        baudRate: 9600, 
        dataBits: 8, 
        stopBits: 1, 
        parity: 'none',
        flowControl: 'none'
      });
      
      setPrinterPort(port);
      setPrinterStatus('connected');
      
      toast({
        title: "Kết nối thành công",
        description: "Đã kết nối với máy in nhiệt KPOS ZY307",
      });

      // Test printer connection with Vietnamese initialization
      await testPrinterConnection(port);
      
    } catch (error: any) {
      setPrinterStatus('error');
      let errorMessage = 'Không thể kết nối máy in';
      
      if (error.name === 'NotFoundError') {
        errorMessage = 'Không tìm thấy máy in. Vui lòng kiểm tra kết nối USB.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Quyền truy cập bị từ chối. Vui lòng cho phép truy cập cổng serial.';
      } else if (error.name === 'NetworkError') {
        errorMessage = 'Máy in đã được sử dụng bởi ứng dụng khác.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Lỗi kết nối",
        description: errorMessage,
        variant: "destructive",
      });
      
      onPrintError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect printer with proper cleanup
  const disconnectPrinter = async () => {
    if (printerPort) {
      try {
        // Ensure any active writers are released
        if (printerPort.writable) {
          const writer = printerPort.writable.getWriter();
          try {
            await writer.releaseLock();
          } catch (e) {
            // Writer may already be released
          }
        }
        
        // Close the port
        await printerPort.close();
        setPrinterPort(null);
        setPrinterStatus('disconnected');
        
        toast({
          title: "Đã ngắt kết nối",
          description: "Đã ngắt kết nối khỏi máy in",
        });
      } catch (error: any) {
        console.error('Disconnect error:', error);
        // Force reset even on error
        setPrinterPort(null);
        setPrinterStatus('disconnected');
        
        toast({
          title: "Lỗi ngắt kết nối",
          description: error.message || 'Lỗi không xác định',
          variant: "destructive",
        });
      }
    }
  };

  // Print receipt directly to thermal printer with enhanced error handling
  const handleDirectPrint = async () => {
    if (printerStatus !== 'connected' || !printerPort?.writable) {
      await connectPrinter();
      return;
    }

    setIsPrinting(true);
    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    
    try {
      // Generate receipt data with proper Vietnamese encoding
      const currentReceiptNumber = receiptNumber || ESCPOSUtils.generateReceiptNumber(order.id);
      
      // Generate receipt template with Vietnamese test
      const receiptData = {
        order,
        orderItems,
        customer,
        shopSettings: {
          ...shopSettings,
          businessName: shopSettings.businessName || 'Cửa hàng Bách hóa Sài Gòn' // Vietnamese test text
        },
        receiptNumber: currentReceiptNumber,
        printDate: new Date(),
        config
      };
      
      const receiptContent = currentTemplate.generate(receiptData);
      
      // Generate receipt based on print copies setting
      const receipts: string[] = [];
      
      if (config.printCopies === 'customer' || config.printCopies === 'both') {
        receipts.push(receiptContent + '\n\n        --- BẢN KHÁCH HÀNG ---\n');
      }
      
      if (config.printCopies === 'merchant' || config.printCopies === 'both') {
        receipts.push(receiptContent + '\n\n        --- BẢN CỬA HÀNG ---\n');
      }

      // Get writer and ensure proper cleanup
      writer = printerPort.writable.getWriter();
      
      for (let i = 0; i < receipts.length; i++) {
        const receipt = receipts[i];
        
        // Convert to bytes with proper Vietnamese encoding
        const receiptBytes = new TextEncoder().encode(receipt);
        
        // Write to printer with error detection
        await writer.write(receiptBytes);
        
        // Add spacing between copies
        if (i < receipts.length - 1) {
          const spacingBytes = new TextEncoder().encode('\n\n\n');
          await writer.write(spacingBytes);
        }
        
        // Small delay between copies to prevent buffer overflow
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Add final cut command
      const cutCommand = new TextEncoder().encode('\x1D\x56\x41\x00'); // GS V A 0 (Full cut)
      await writer.write(cutCommand);
      
      // Properly release writer
      await writer.releaseLock();
      writer = null;
      
      toast({
        title: "In thành công",
        description: `Đã in ${receipts.length} bản hóa đơn ${currentReceiptNumber}`,
      });
      
      onPrintSuccess?.();
      
      if (autoClose) {
        setIsOpen(false);
      }
      
    } catch (error: any) {
      let errorMessage = 'Không thể in hóa đơn';
      
      if (error.name === 'NetworkError') {
        errorMessage = 'Máy in đã ngắt kết nối. Vui lòng kiểm tra cáp USB.';
        setPrinterStatus('disconnected');
        setPrinterPort(null);
      } else if (error.name === 'AbortError') {
        errorMessage = 'In ấn bị hủy. Vui lòng thử lại.';
      } else if (error.message?.includes('paper')) {
        errorMessage = 'Máy in hết giấy. Vui lòng thêm giấy và thử lại.';
      } else if (error.message?.includes('offline')) {
        errorMessage = 'Máy in đang offline. Vui lòng kiểm tra nguồn điện.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Lỗi in ấn",
        description: errorMessage,
        variant: "destructive",
      });
      
      onPrintError?.(errorMessage);
      
    } finally {
      // Ensure writer is always released
      if (writer) {
        try {
          await writer.releaseLock();
        } catch (e) {
          console.warn('Failed to release writer:', e);
        }
      }
      setIsPrinting(false);
    }
  };

  // Export as text file
  const exportAsText = () => {
    try {
      const builder = createESCPOSBuilder(currentTemplate, config);
      const receiptText = builder.generatePreview(order, orderItems, shopSettings, customer, receiptNumber);
      
      const blob = new Blob([receiptText], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber || order.id.slice(-8)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Xuất file thành công",
        description: "Đã tải file hóa đơn .txt",
      });
    } catch (error) {
      toast({
        title: "Lỗi xuất file",
        description: "Không thể tạo file text",
        variant: "destructive",
      });
    }
  };

  // Export ESC/POS commands as file  
  const exportESCPOS = () => {
    try {
      const builder = createESCPOSBuilder(currentTemplate, config);
      const escposCommands = builder.generateReceipt(order, orderItems, shopSettings, customer, receiptNumber);
      
      const blob = new Blob([escposCommands], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${receiptNumber || order.id.slice(-8)}.escpos`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Xuất ESC/POS thành công",
        description: "Đã tải file lệnh ESC/POS",
      });
    } catch (error) {
      toast({
        title: "Lỗi xuất ESC/POS",
        description: "Không thể tạo file ESC/POS",
        variant: "destructive",
      });
    }
  };

  // Copy receipt to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(receiptPreview).then(() => {
      toast({
        title: "Đã sao chép",
        description: "Nội dung hóa đơn đã được sao chép",
      });
    }).catch(() => {
      toast({
        title: "Lỗi sao chép",
        description: "Không thể sao chép nội dung",
        variant: "destructive",
      });
    });
  };

  // Update config
  const updateConfig = (updates: Partial<ReceiptConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Apply custom footer
  const applyCustomFooter = () => {
    updateConfig({ footerMessage: customFooter });
    setShowSettings(false);
    toast({
      title: "Đã lưu cài đặt",
      description: "Cài đặt hóa đơn đã được cập nhật",
    });
  };

  // Printer status indicator
  const StatusIndicator = () => {
    const statusConfig = {
      disconnected: { 
        icon: WifiOff, 
        color: 'text-gray-500', 
        bg: 'bg-gray-100', 
        text: 'Chưa kết nối' 
      },
      connected: { 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-100', 
        text: 'Đã kết nối' 
      },
      error: { 
        icon: AlertTriangle, 
        color: 'text-red-600', 
        bg: 'bg-red-100', 
        text: 'Lỗi kết nối' 
      },
    };

    const { icon: Icon, color, bg, text } = statusConfig[printerStatus];

    return (
      <Badge variant="outline" className={`${color} ${bg} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {text}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
            <Printer className="h-4 w-4 mr-2" />
            In hóa đơn
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>In hóa đơn - KPOS ZY307</span>
            <StatusIndicator />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-4">
            {/* Template Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Mẫu hóa đơn</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mẫu hóa đơn" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map(({ key, template }) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentTemplate.description}
                </p>
              </CardContent>
            </Card>

            {/* Print Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tùy chọn in</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="paper-width">Khổ giấy</Label>
                  <Select 
                    value={config.paperWidth} 
                    onValueChange={(value: '58mm' | '80mm') => updateConfig({ paperWidth: value })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm</SelectItem>
                      <SelectItem value="80mm">80mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="print-copies">Bản sao</Label>
                  <Select 
                    value={config.printCopies} 
                    onValueChange={(value: 'customer' | 'merchant' | 'both') => updateConfig({ printCopies: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Khách hàng</SelectItem>
                      <SelectItem value="merchant">Cửa hàng</SelectItem>
                      <SelectItem value="both">Cả hai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="vat-enabled">Hiển thị VAT</Label>
                  <Switch
                    id="vat-enabled"
                    checked={config.vatEnabled}
                    onCheckedChange={(checked) => updateConfig({ vatEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="paper-saving">Tiết kiệm giấy</Label>
                  <Switch
                    id="paper-saving"
                    checked={config.paperSaving}
                    onCheckedChange={(checked) => updateConfig({ paperSaving: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="barcode-enabled">In mã vạch</Label>
                  <Switch
                    id="barcode-enabled"
                    checked={config.barcodeEnabled}
                    onCheckedChange={(checked) => updateConfig({ barcodeEnabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Tùy chỉnh
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              {showSettings && (
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="custom-footer">Lời cảm ơn</Label>
                    <Textarea
                      id="custom-footer"
                      placeholder="Cảm ơn quý khách!"
                      value={customFooter}
                      onChange={(e) => setCustomFooter(e.target.value)}
                      className="mt-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyCustomFooter}
                      className="mt-2"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Áp dụng
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Print Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Hành động</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Direct Print */}
                {isSerialSupported && (
                  <div className="space-y-2">
                    {printerStatus === 'disconnected' && (
                      <Button
                        onClick={connectPrinter}
                        disabled={isConnecting}
                        className="w-full"
                      >
                        {isConnecting ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Wifi className="h-4 w-4 mr-2" />
                        )}
                        Kết nối máy in
                      </Button>
                    )}

                    {printerStatus === 'connected' && (
                      <div className="space-y-2">
                        <Button
                          onClick={handleDirectPrint}
                          disabled={isPrinting}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {isPrinting ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4 mr-2" />
                          )}
                          In ngay
                        </Button>
                        <Button
                          onClick={disconnectPrinter}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <WifiOff className="h-4 w-4 mr-2" />
                          Ngắt kết nối
                        </Button>
                      </div>
                    )}

                    {printerStatus === 'error' && (
                      <Button
                        onClick={connectPrinter}
                        variant="destructive"
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Kết nối lại
                      </Button>
                    )}
                  </div>
                )}

                <Separator />

                {/* Export Options */}
                <div className="space-y-2">
                  <Button
                    onClick={exportAsText}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Xuất file Text
                  </Button>
                  
                  <Button
                    onClick={exportESCPOS}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Xuất ESC/POS
                  </Button>
                  
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Sao chép
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Xem trước hóa đơn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-4">
                  <pre
                    ref={previewRef}
                    className="text-xs font-mono whitespace-pre-wrap break-words leading-tight max-h-[500px] overflow-y-auto"
                    style={{ fontFamily: 'Courier New, monospace' }}
                  >
                    {receiptPreview}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {!isSerialSupported && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <strong>Lưu ý:</strong> Trình duyệt hiện tại không hỗ trợ in trực tiếp. 
                Hãy sử dụng Chrome hoặc Edge mới nhất để kết nối trực tiếp với máy in nhiệt.
                Bạn vẫn có thể xuất file để in sau.
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}