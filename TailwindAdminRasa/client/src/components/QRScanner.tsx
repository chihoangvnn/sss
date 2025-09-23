import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, RotateCcw, Zap, ZapOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScan: (data: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface ScanResult {
  rawValue: string;
}

export function QRScanner({ onScan, isOpen, onClose }: QRScannerProps) {
  const { toast } = useToast();
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const handleScan = (result: ScanResult[]) => {
    if (result && result.length > 0 && result[0]?.rawValue) {
      onScan(result[0].rawValue);
      onClose();
      // Toast notification is handled by the parent component (POS.tsx)
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner Error:', err);
    
    if (err.name === 'NotAllowedError') {
      setHasPermission(false);
      toast({
        title: "Không có quyền truy cập camera",
        description: "Vui lòng cho phép truy cập camera để quét QR code",
        variant: "destructive",
      });
    } else if (err.name === 'NotFoundError') {
      toast({
        title: "Không tìm thấy camera",
        description: "Thiết bị của bạn không có camera hoặc camera đang được sử dụng",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Lỗi quét QR",
        description: "Có lỗi xảy ra khi quét QR code. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const toggleTorch = () => {
    setTorchEnabled(prev => !prev);
  };

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
    } catch (error) {
      setHasPermission(false);
      handleError(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Quét QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {hasPermission === false ? (
            <div className="text-center space-y-4 py-8">
              <Camera className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <h3 className="font-medium">Cần quyền truy cập camera</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Để quét QR code, bạn cần cho phép truy cập camera
                </p>
              </div>
              <Button onClick={requestCameraPermission}>
                Cho phép truy cập camera
              </Button>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                <Scanner
                  onScan={handleScan}
                  onError={handleError}
                  constraints={{
                    facingMode: facingMode,
                  }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                  }}
                  allowMultiple={false}
                  scanDelay={300}
                />
                
                {/* Overlay controls */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleCamera}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleTorch}
                    className="h-8 w-8 p-0"
                  >
                    {torchEnabled ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Close button */}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onClose}
                  className="absolute top-2 left-2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                Đưa QR code vào khung hình để quét tự động
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}