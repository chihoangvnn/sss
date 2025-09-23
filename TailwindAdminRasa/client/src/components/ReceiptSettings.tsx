/**
 * Receipt Settings Component
 * Configure receipt printing preferences and shop settings
 */

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Save,
  RefreshCw,
  Store,
  Printer,
  Receipt,
  FileText
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type { ReceiptConfig } from '@/utils/receiptTemplates';
import type { ShopSettings } from '@shared/schema';

interface ReceiptSettingsProps {
  onConfigChange?: (config: ReceiptConfig) => void;
  trigger?: React.ReactNode;
}

// Default receipt configuration
const DEFAULT_RECEIPT_CONFIG: ReceiptConfig = {
  paperWidth: '80mm',
  logoEnabled: false,
  vatEnabled: false,
  footerMessage: 'Cảm ơn quý khách!',
  printCopies: 'customer',
  paperSaving: false,
  barcodeEnabled: false,
};

// Receipt settings stored in localStorage
const RECEIPT_SETTINGS_KEY = 'pos-receipt-settings';

export function ReceiptSettings({ onConfigChange, trigger }: ReceiptSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(DEFAULT_RECEIPT_CONFIG);
  const [shopSettings, setShopSettings] = useState<Partial<ShopSettings>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load receipt settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(RECEIPT_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setReceiptConfig({ ...DEFAULT_RECEIPT_CONFIG, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load receipt settings:', error);
    }
  }, []);

  // Fetch shop settings
  const { data: shopSettingsData, isLoading: shopSettingsLoading } = useQuery<ShopSettings[]>({
    queryKey: ['/api/shop-settings'],
    queryFn: () => fetch('/api/shop-settings').then(res => res.json()),
  });

  // Get default shop settings
  const defaultShopSettings = shopSettingsData?.find(s => s.isDefault) || shopSettingsData?.[0];

  // Initialize shop settings form
  useEffect(() => {
    if (defaultShopSettings) {
      setShopSettings({
        businessName: defaultShopSettings.businessName || '',
        phone: defaultShopSettings.phone || '',
        email: defaultShopSettings.email || '',
        address: defaultShopSettings.address || '',
        website: defaultShopSettings.website || '',
        logo: defaultShopSettings.logo || '',
        taxId: defaultShopSettings.taxId || '',
      });
    }
  }, [defaultShopSettings]);

  // Update shop settings mutation
  const updateShopSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<ShopSettings>) => {
      const settingsId = defaultShopSettings?.id;
      if (!settingsId) {
        throw new Error('No default shop settings found');
      }

      const response = await fetch(`/api/shop-settings?id=${settingsId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update shop settings');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-settings'] });
      toast({
        title: "Cài đặt đã lưu",
        description: "Thông tin cửa hàng đã được cập nhật",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi lưu cài đặt",
        description: error.message || "Không thể lưu thông tin cửa hàng",
        variant: "destructive",
      });
    },
  });

  // Update receipt configuration
  const updateReceiptConfig = (updates: Partial<ReceiptConfig>) => {
    const newConfig = { ...receiptConfig, ...updates };
    setReceiptConfig(newConfig);
    
    // Save to localStorage
    localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(newConfig));
    
    // Notify parent component
    onConfigChange?.(newConfig);
  };

  // Save all settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Update shop settings if changed
      if (Object.keys(shopSettings).length > 0) {
        await updateShopSettingsMutation.mutateAsync(shopSettings);
      }

      // Save receipt config to localStorage
      localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(receiptConfig));

      toast({
        title: "Cài đặt đã lưu",
        description: "Tất cả cài đặt hóa đơn đã được lưu",
      });

      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Lỗi lưu cài đặt",
        description: error.message || "Không thể lưu cài đặt",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleResetSettings = () => {
    setReceiptConfig(DEFAULT_RECEIPT_CONFIG);
    localStorage.removeItem(RECEIPT_SETTINGS_KEY);
    
    toast({
      title: "Đã khôi phục mặc định",
      description: "Cài đặt hóa đơn đã về mặc định",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt hóa đơn
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Receipt className="h-5 w-5 mr-2" />
            Cài đặt hóa đơn & cửa hàng
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Shop Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Store className="h-4 w-4 mr-2" />
                  Thông tin cửa hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="business-name">Tên doanh nghiệp *</Label>
                  <Input
                    id="business-name"
                    placeholder="Tên cửa hàng của bạn"
                    value={shopSettings.businessName || ''}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, businessName: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      placeholder="0123456789"
                      value={shopSettings.phone || ''}
                      onChange={(e) => setShopSettings(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-id">Mã số thuế</Label>
                    <Input
                      id="tax-id"
                      placeholder="0123456789"
                      value={shopSettings.taxId || ''}
                      onChange={(e) => setShopSettings(prev => ({ ...prev, taxId: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="info@cuahang.com"
                    value={shopSettings.email || ''}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Textarea
                    id="address"
                    placeholder="123 Đường ABC, Quận XYZ, TP. HCM"
                    value={shopSettings.address || ''}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://cuahang.com"
                    value={shopSettings.website || ''}
                    onChange={(e) => setShopSettings(prev => ({ ...prev, website: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <FileText className="h-4 w-4 mr-2" />
                  Nội dung hóa đơn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="footer-message">Lời cảm ơn</Label>
                  <Textarea
                    id="footer-message"
                    placeholder="Cảm ơn quý khách!"
                    value={receiptConfig.footerMessage}
                    onChange={(e) => updateReceiptConfig({ footerMessage: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="vat-enabled">Hiển thị VAT (10%)</Label>
                  <Switch
                    id="vat-enabled"
                    checked={receiptConfig.vatEnabled}
                    onCheckedChange={(checked) => updateReceiptConfig({ vatEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="logo-enabled">In logo cửa hàng</Label>
                  <Switch
                    id="logo-enabled"
                    checked={receiptConfig.logoEnabled}
                    onCheckedChange={(checked) => updateReceiptConfig({ logoEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="barcode-enabled">In mã vạch đơn hàng</Label>
                  <Switch
                    id="barcode-enabled"
                    checked={receiptConfig.barcodeEnabled}
                    onCheckedChange={(checked) => updateReceiptConfig({ barcodeEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-print">Tự động in sau thanh toán</Label>
                  <Switch
                    id="auto-print"
                    checked={localStorage.getItem('pos-auto-print') === 'true'}
                    onCheckedChange={(checked) => {
                      localStorage.setItem('pos-auto-print', checked.toString());
                      toast({
                        title: checked ? "Đã bật tự động in" : "Đã tắt tự động in",
                        description: checked ? "Hóa đơn sẽ tự động in sau thanh toán" : "Bạn cần nhấn nút in thủ công",
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Print Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Printer className="h-4 w-4 mr-2" />
                  Cài đặt in ấn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="paper-width">Khổ giấy</Label>
                  <Select 
                    value={receiptConfig.paperWidth} 
                    onValueChange={(value: '58mm' | '80mm') => updateReceiptConfig({ paperWidth: value })}
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
                  <Label htmlFor="print-copies">Số bản in</Label>
                  <Select 
                    value={receiptConfig.printCopies} 
                    onValueChange={(value: 'customer' | 'merchant' | 'both') => updateReceiptConfig({ printCopies: value })}
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
                  <Label htmlFor="paper-saving">Chế độ tiết kiệm giấy</Label>
                  <Switch
                    id="paper-saving"
                    checked={receiptConfig.paperSaving}
                    onCheckedChange={(checked) => updateReceiptConfig({ paperSaving: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Hướng dẫn kết nối máy in</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• Kết nối máy in KPOS ZY307 qua cáp USB</p>
                    <p>• Sử dụng Chrome/Edge mới nhất</p>
                    <p>• Bật Web Serial API trong cài đặt trình duyệt</p>
                    <p>• Chọn COM port tương ứng khi kết nối</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mẫu hóa đơn xem trước</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap leading-tight max-h-[300px] overflow-y-auto">
{`═══════════════════════════════════════════════════
               ${shopSettings.businessName || 'TÊN CỬA HÀNG'}
           ${shopSettings.address || 'Địa chỉ cửa hàng'}
              ${shopSettings.phone ? `ĐT: ${shopSettings.phone}` : 'ĐT: 0123456789'}
${receiptConfig.vatEnabled && shopSettings.taxId ? `                  MST: ${shopSettings.taxId}` : ''}
═══════════════════════════════════════════════════

HÓA ĐƠN BÁN LẺ
Hóa đơn: RC${Date.now().toString().slice(-8)}
Ngày: ${new Date().toLocaleString('vi-VN')}

-----------------------------------------------
Sản phẩm                  SL | Đ.giá | T.tiền
-----------------------------------------------
Nhang sạch thảo mộc
  1 gói x 50.000₫                    50.000₫

Tinh dầu sả chanh
  0.500 kg x 120.000₫               60.000₫

-----------------------------------------------
TỔNG CỘNG:                          110.000₫
${receiptConfig.vatEnabled ? 'VAT (10%):                            11.000₫\nTHÀNH TIỀN:                          121.000₫' : ''}
═══════════════════════════════════════════════════

                ${receiptConfig.footerMessage}
                   Hẹn gặp lại!
${shopSettings.website ? `                ${shopSettings.website}` : ''}

${receiptConfig.printCopies === 'customer' ? '        --- BẢN KHÁCH HÀNG ---' : ''}
${receiptConfig.printCopies === 'merchant' ? '        --- BẢN CỬA HÀNG ---' : ''}
═══════════════════════════════════════════════════`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleResetSettings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Khôi phục mặc định
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu cài đặt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to get current receipt settings
 */
export function useReceiptSettings(): [ReceiptConfig, (config: ReceiptConfig) => void] {
  const [config, setConfigState] = useState<ReceiptConfig>(DEFAULT_RECEIPT_CONFIG);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(RECEIPT_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setConfigState({ ...DEFAULT_RECEIPT_CONFIG, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load receipt settings:', error);
    }
  }, []);

  const setConfig = (newConfig: ReceiptConfig) => {
    setConfigState(newConfig);
    localStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(newConfig));
  };

  return [config, setConfig];
}