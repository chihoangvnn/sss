import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, X, Image, Video, Tag, Check, AlertCircle, Loader2,
  Plus, Trash2, Eye
} from 'lucide-react';
import { ContentCategory } from '../../../shared/schema';

interface ContentUploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

interface FileWithPreview {
  file: File;
  id: string;
  preview: string;
  category?: number;
  altText?: string;
  caption?: string;
  tags: string[];
}

export function ContentUploadModal({ onClose, onUploadComplete }: ContentUploadModalProps) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['content-categories'],
    queryFn: async () => {
      const response = await fetch('/api/content/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json() as ContentCategory[];
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (fileData: FileWithPreview) => {
      const formData = new FormData();
      formData.append('file', fileData.file);
      if (fileData.category) formData.append('categoryId', fileData.category.toString());
      if (fileData.altText) formData.append('altText', fileData.altText);
      if (fileData.caption) formData.append('caption', fileData.caption);
      if (fileData.tags.length > 0) formData.append('tags', JSON.stringify(fileData.tags));

      const response = await fetch('/api/content/assets/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-assets'] });
    },
  });

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    const newFiles: FileWithPreview[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      tags: [],
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFile = (id: string, updates: Partial<FileWithPreview>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  };

  const addTag = (fileId: string, tag: string) => {
    if (!tag.trim()) return;
    
    updateFile(fileId, {
      tags: [...(files.find(f => f.id === fileId)?.tags || []), tag.trim()]
    });
  };

  const removeTag = (fileId: string, tagIndex: number) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    const newTags = [...file.tags];
    newTags.splice(tagIndex, 1);
    updateFile(fileId, { tags: newTags });
  };

  const handleUploadAll = async () => {
    for (const file of files) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.id]: 0 }));
        await uploadMutation.mutateAsync(file);
        setUploadProgress(prev => ({ ...prev, [file.id]: 100 }));
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadProgress(prev => ({ ...prev, [file.id]: -1 })); // -1 for error
      }
    }

    // Clear files and close modal after successful uploads
    const allSuccessful = Object.values(uploadProgress).every(progress => progress === 100);
    if (allSuccessful) {
      setFiles([]);
      onUploadComplete();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Tải Lên Nội Dung</h3>
            <p className="text-gray-600 mt-1">
              Kéo thả hoặc chọn hình ảnh và video để tải lên
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Upload Area */}
          <div className="p-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${
                dragActive ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Kéo thả tệp vào đây
              </h4>
              <p className="text-gray-600 mb-4">
                Hoặc click để chọn tệp từ máy tính
              </p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer inline-block"
              >
                Chọn Tệp
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Hỗ trợ: JPG, PNG, GIF, MP4, MOV (tối đa 50MB mỗi tệp)
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="px-6 pb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Tệp đã chọn ({files.length})
              </h4>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {files.map((fileData) => (
                  <div
                    key={fileData.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start gap-4">
                      {/* Preview */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {fileData.file.type.startsWith('image/') ? (
                          <img
                            src={fileData.preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={fileData.preview}
                            className="w-full h-full object-cover"
                            muted
                          />
                        )}
                        
                        {/* Type indicator */}
                        <div className="absolute top-1 right-1">
                          {fileData.file.type.startsWith('video/') ? (
                            <div className="bg-purple-500 text-white px-1 py-0.5 rounded text-xs">
                              <Video className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="bg-green-500 text-white px-1 py-0.5 rounded text-xs">
                              <Image className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* File Info & Form */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{fileData.file.name}</h5>
                            <p className="text-sm text-gray-600">
                              {formatFileSize(fileData.file.size)}
                            </p>
                          </div>
                          
                          {/* Upload Status */}
                          <div className="flex items-center gap-2">
                            {uploadProgress[fileData.id] !== undefined && (
                              <div className="flex items-center gap-2">
                                {uploadProgress[fileData.id] === -1 ? (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                ) : uploadProgress[fileData.id] === 100 ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                )}
                                {uploadProgress[fileData.id] > 0 && uploadProgress[fileData.id] < 100 && (
                                  <span className="text-sm text-gray-600">
                                    {uploadProgress[fileData.id]}%
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <button
                              onClick={() => removeFile(fileData.id)}
                              className="p-1 hover:bg-gray-200 rounded text-red-600"
                              disabled={uploadMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Category */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Danh mục
                            </label>
                            <select
                              value={fileData.category || ''}
                              onChange={(e) => updateFile(fileData.id, {
                                category: e.target.value ? parseInt(e.target.value) : undefined
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Chọn danh mục</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Alt Text */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mô tả (Alt Text)
                            </label>
                            <input
                              type="text"
                              value={fileData.altText || ''}
                              onChange={(e) => updateFile(fileData.id, { altText: e.target.value })}
                              placeholder="Mô tả hình ảnh cho accessibility"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        {/* Caption */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chú thích
                          </label>
                          <textarea
                            value={fileData.caption || ''}
                            onChange={(e) => updateFile(fileData.id, { caption: e.target.value })}
                            placeholder="Thêm chú thích cho nội dung này"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thẻ (Tags)
                          </label>
                          
                          {/* Existing tags */}
                          {fileData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {fileData.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    onClick={() => removeTag(fileData.id, index)}
                                    className="hover:bg-blue-200 rounded-full p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Add tag input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Thêm thẻ..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.target as HTMLInputElement;
                                  addTag(fileData.id, input.value);
                                  input.value = '';
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                addTag(fileData.id, input.value);
                                input.value = '';
                              }}
                              className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {files.length > 0 && (
              <span>
                {files.length} tệp được chọn 
                {Object.keys(uploadProgress).length > 0 && (
                  <span>
                    {' '}• {Object.values(uploadProgress).filter(p => p === 100).length} đã tải xong
                  </span>
                )}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={uploadMutation.isPending}
            >
              Hủy
            </button>
            
            {files.length > 0 && (
              <button
                onClick={handleUploadAll}
                disabled={uploadMutation.isPending}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Tải Lên Tất Cả
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}