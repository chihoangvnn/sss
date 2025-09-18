import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, Plus, Search, Filter, Grid, List, Eye, Edit2, Trash2,
  Image, Video, Tag, Calendar, MoreVertical, Download, Copy
} from 'lucide-react';
import { ContentAsset, ContentCategory } from '../../../shared/schema';
import { ContentUploadModal } from '../components/ContentUploadModal';

interface ContentLibraryProps {}

export function ContentLibrary({}: ContentLibraryProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch content assets
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['content-assets', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/content/assets?category=${selectedCategory}`
        : '/api/content/assets';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json() as ContentAsset[];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['content-categories'],
    queryFn: async () => {
      const response = await fetch('/api/content/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json() as ContentCategory[];
    },
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await fetch(`/api/content/assets/${assetId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete asset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assets'] });
      setSelectedAssets(new Set());
    },
  });

  // Filter assets based on search query
  const filteredAssets = assets.filter(asset => 
    asset.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (asset.altText && asset.altText.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (asset.caption && asset.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleAssetSelect = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedAssets.size === 0) return;
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedAssets.size} tệp đã chọn?`)) {
      return;
    }

    for (const assetId of selectedAssets) {
      await deleteAssetMutation.mutateAsync(assetId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thư Viện Nội Dung</h1>
            <p className="text-gray-600 mt-1">
              Quản lý hình ảnh, video và tài liệu cho mạng xã hội
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedAssets.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Xóa {selectedAssets.size} tệp
              </button>
            )}
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Tải Lên
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm tệp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng tệp</p>
                <p className="text-2xl font-bold text-gray-900">{filteredAssets.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hình ảnh</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAssets.filter(a => a.mimeType.startsWith('image/')).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Image className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Video</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAssets.filter(a => a.mimeType.startsWith('video/')).length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã chọn</p>
                <p className="text-2xl font-bold text-gray-900">{selectedAssets.size}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Tag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {assetsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có nội dung nào
            </h3>
            <p className="text-gray-600 mb-4">
              Bắt đầu bằng cách tải lên hình ảnh hoặc video đầu tiên của bạn
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Tải Lên Ngay
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className={`bg-white rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedAssets.has(asset.id) 
                    ? 'border-blue-500 shadow-md' 
                    : 'border-gray-200'
                }`}
                onClick={() => handleAssetSelect(asset.id)}
              >
                <div className="relative p-4">
                  {/* Preview */}
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                    {asset.mimeType.startsWith('image/') ? (
                      <img
                        src={asset.cloudinarySecureUrl}
                        alt={asset.altText || asset.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : asset.mimeType.startsWith('video/') ? (
                      <video
                        src={asset.cloudinarySecureUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Type indicator */}
                    <div className="absolute top-2 right-2">
                      {asset.mimeType.startsWith('video/') ? (
                        <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
                          VIDEO
                        </div>
                      ) : (
                        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                          IMG
                        </div>
                      )}
                    </div>

                    {/* Selection overlay */}
                    {selectedAssets.has(asset.id) && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Asset info */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900 truncate" title={asset.filename}>
                      {asset.filename}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{formatFileSize(asset.fileSize)}</span>
                      <span>{formatDate(asset.createdAt)}</span>
                    </div>

                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {asset.tags.length > 3 && (
                          <span className="text-gray-500 text-xs">
                            +{asset.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {asset.usageCount > 0 && (
                      <div className="text-xs text-gray-600">
                        Đã sử dụng {asset.usageCount} lần
                      </div>
                    )}
                  </div>

                  {/* Action menu */}
                  <div className="absolute top-2 left-2">
                    <div className="relative group">
                      <button className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1 rounded transition-all">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-40">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(asset.cloudinarySecureUrl, '_blank');
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Xem chi tiết
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(asset.cloudinarySecureUrl);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Sao chép liên kết
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const a = document.createElement('a');
                            a.href = asset.cloudinarySecureUrl;
                            a.download = asset.filename;
                            a.click();
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Tải xuống
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Bạn có chắc chắn muốn xóa tệp này?')) {
                              deleteAssetMutation.mutate(asset.id);
                            }
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
                          } else {
                            setSelectedAssets(new Set());
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Xem trước</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tên tệp</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kích thước</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ngày tạo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sử dụng</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedAssets.has(asset.id)}
                          onChange={() => handleAssetSelect(asset.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {asset.mimeType.startsWith('image/') ? (
                            <img
                              src={asset.cloudinarySecureUrl}
                              alt={asset.altText || asset.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : asset.mimeType.startsWith('video/') ? (
                            <video
                              src={asset.cloudinarySecureUrl}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Image className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{asset.filename}</p>
                          {asset.altText && (
                            <p className="text-sm text-gray-600">{asset.altText}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatFileSize(asset.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(asset.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {asset.usageCount} lần
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => window.open(asset.cloudinarySecureUrl, '_blank')}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(asset.cloudinarySecureUrl)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Sao chép liên kết"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa tệp này?')) {
                                deleteAssetMutation.mutate(asset.id);
                              }
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-red-600"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <ContentUploadModal 
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['content-assets'] });
              setShowUploadModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}