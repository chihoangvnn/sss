import React, { useState, useRef } from 'react';
import { Upload, Download, Copy, AlertCircle, CheckCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ScheduledPost, SocialAccount } from '../../../shared/schema';

interface BulkUploadProps {
  accounts: SocialAccount[];
  onClose: () => void;
  onBulkUpload: (posts: Partial<ScheduledPost>[]) => void;
}

interface BulkUploadData {
  caption: string;
  hashtags: string;
  platform: string;
  accountName: string;
  scheduledTime: string;
  timezone?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function BulkUpload({ accounts, onClose, onBulkUpload }: BulkUploadProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [pasteData, setPasteData] = useState('');
  const [parsedData, setParsedData] = useState<BulkUploadData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV Template for download
  const csvTemplate = `caption,hashtags,platform,accountName,scheduledTime,timezone
"Khám phá sản phẩm mới của chúng tôi!","#sanpham #moi #thuonghieu","facebook","My Page","2025-09-20 10:00","Asia/Ho_Chi_Minh"
"Ưu đãi đặc biệt cuối tuần","#uudai #cuoituan #sale","instagram","My Store","2025-09-21 14:30","Asia/Ho_Chi_Minh"
"Tips hữu ích cho khách hàng","#tips #hochuyniem #khachhang","tiktok","My Brand","2025-09-22 18:00","Asia/Ho_Chi_Minh"`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-upload-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    setIsProcessing(true);
    setProcessProgress(10);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let data: BulkUploadData[] = [];

      if (fileExtension === 'csv') {
        // Parse CSV file
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            data = results.data as BulkUploadData[];
            processParsedData(data);
          },
          error: (error: unknown) => {
            console.error('CSV parsing error:', error);
            setValidationErrors([{ row: 0, field: 'file', message: 'Lỗi khi đọc file CSV' }]);
          }
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        data = jsonData as BulkUploadData[];
        processParsedData(data);
      } else {
        setValidationErrors([{ row: 0, field: 'file', message: 'Định dạng file không được hỗ trợ. Chỉ chấp nhận CSV và Excel.' }]);
      }
    } catch (error) {
      console.error('File parsing error:', error);
      setValidationErrors([{ row: 0, field: 'file', message: 'Lỗi khi xử lý file' }]);
    }

    setIsProcessing(false);
  };

  const handlePasteData = () => {
    if (!pasteData.trim()) return;

    setIsProcessing(true);
    setProcessProgress(10);

    // Parse pasted CSV data
    Papa.parse(pasteData.trim(), {
      header: true,
      complete: (results) => {
        const data = results.data as BulkUploadData[];
        processParsedData(data);
        setIsProcessing(false);
      },
      error: (error) => {
        console.error('Paste parsing error:', error);
        setValidationErrors([{ row: 0, field: 'paste', message: 'Lỗi khi phân tích dữ liệu dán' }]);
        setIsProcessing(false);
      }
    });
  };

  const processParsedData = (data: BulkUploadData[]) => {
    setProcessProgress(50);
    
    // Filter out empty rows
    const filteredData = data.filter(row => 
      row.caption && row.caption.toString().trim() !== ''
    );

    setParsedData(filteredData);
    validateData(filteredData);
    setProcessProgress(100);
  };

  const validateData = (data: BulkUploadData[]) => {
    const errors: ValidationError[] = [];
    const accountMap = new Map(accounts.map(acc => [acc.name.toLowerCase(), acc]));

    data.forEach((row, index) => {
      const rowNum = index + 1;

      // Validate required fields
      if (!row.caption || !row.caption.toString().trim()) {
        errors.push({ row: rowNum, field: 'caption', message: 'Caption là bắt buộc' });
      }

      if (!row.platform || !row.platform.toString().trim()) {
        errors.push({ row: rowNum, field: 'platform', message: 'Platform là bắt buộc' });
      } else if (!['facebook', 'instagram', 'tiktok'].includes(row.platform.toLowerCase())) {
        errors.push({ row: rowNum, field: 'platform', message: 'Platform phải là facebook, instagram hoặc tiktok' });
      }

      if (!row.accountName || !row.accountName.toString().trim()) {
        errors.push({ row: rowNum, field: 'accountName', message: 'Tên account là bắt buộc' });
      } else if (!accountMap.has(row.accountName.toLowerCase())) {
        errors.push({ row: rowNum, field: 'accountName', message: 'Account không tồn tại trong hệ thống' });
      }

      if (!row.scheduledTime || !row.scheduledTime.toString().trim()) {
        errors.push({ row: rowNum, field: 'scheduledTime', message: 'Thời gian lên lịch là bắt buộc' });
      } else {
        // Validate date format
        const dateValue = new Date(row.scheduledTime);
        if (isNaN(dateValue.getTime())) {
          errors.push({ row: rowNum, field: 'scheduledTime', message: 'Định dạng thời gian không hợp lệ (YYYY-MM-DD HH:mm)' });
        } else if (dateValue < new Date()) {
          errors.push({ row: rowNum, field: 'scheduledTime', message: 'Thời gian lên lịch phải ở tương lai' });
        }
      }

      // Validate caption length
      if (row.caption && row.caption.toString().length > 2200) {
        errors.push({ row: rowNum, field: 'caption', message: 'Caption quá dài (tối đa 2200 ký tự)' });
      }

      // Validate hashtags format
      if (row.hashtags && row.hashtags.toString().includes('#')) {
        const hashtags = row.hashtags.toString().split(/[,\s]+/).filter(Boolean);
        if (hashtags.length > 30) {
          errors.push({ row: rowNum, field: 'hashtags', message: 'Quá nhiều hashtags (tối đa 30)' });
        }
      }
    });

    setValidationErrors(errors);
  };

  const handleBulkUpload = () => {
    if (validationErrors.length > 0) return;

    const accountMap = new Map(accounts.map(acc => [acc.name.toLowerCase(), acc]));
    
    const posts: Partial<ScheduledPost>[] = parsedData.map(row => {
      const account = accountMap.get(row.accountName.toLowerCase());
      return {
        caption: row.caption.toString().trim(),
        hashtags: row.hashtags ? row.hashtags.toString().split(/[,\s]+/).filter(Boolean) : [],
        platform: row.platform.toLowerCase() as 'facebook' | 'instagram' | 'tiktok',
        socialAccountId: account?.id || '',
        scheduledTime: new Date(row.scheduledTime),
        timezone: row.timezone || 'Asia/Ho_Chi_Minh',
        status: 'scheduled' as const,
        assetIds: []
      };
    });

    onBulkUpload(posts);
  };

  const isValid = parsedData.length > 0 && validationErrors.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Tải Lên Hàng Loạt</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('file')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'file'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Tải File
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'paste'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Copy className="w-4 h-4 inline mr-2" />
            Dán Dữ Liệu
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'file' ? (
            /* File Upload Tab */
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Tải Template CSV</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Tải file mẫu để xem định dạng dữ liệu chính xác
                    </p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Tải Template
                  </button>
                </div>
              </div>

              {/* File Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chọn File CSV hoặc Excel
                </h3>
                <p className="text-gray-600">
                  Kéo thả file vào đây hoặc click để chọn file
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Hỗ trợ: .csv, .xlsx, .xls
                </p>
              </div>

              {file && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm text-gray-600">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        setParsedData([]);
                        setValidationErrors([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Paste Data Tab */
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-900">Định Dạng Dữ Liệu</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Dán dữ liệu CSV với header: caption, hashtags, platform, accountName, scheduledTime, timezone
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dán Dữ Liệu CSV
                </label>
                <textarea
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder={csvTemplate}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none font-mono text-sm"
                />
              </div>

              <button
                onClick={handlePasteData}
                disabled={!pasteData.trim() || isProcessing}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Phân Tích Dữ Liệu
              </button>
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Đang xử lý...</span>
                <span className="text-sm text-gray-600">{processProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-900">
                  Tìm thấy {validationErrors.length} lỗi cần sửa
                </h3>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700">
                    <span className="font-medium">Dòng {error.row}:</span> {error.message} 
                    <span className="text-red-600"> ({error.field})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Summary */}
          {parsedData.length > 0 && validationErrors.length === 0 && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">
                  Dữ liệu hợp lệ! Sẵn sàng tạo {parsedData.length} bài đăng
                </h3>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {parsedData.length > 0 && (
              <span>{parsedData.length} bài đăng được tìm thấy</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleBulkUpload}
              disabled={!isValid || isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Tạo {parsedData.length} Bài Đăng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}