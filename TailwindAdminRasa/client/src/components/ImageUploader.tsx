import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, PlayCircle, FileImage, FileVideo, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import type { CloudinaryImage, CloudinaryVideo } from '@shared/schema';

interface MediaPreview {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
  uploading: boolean;
  uploaded: boolean;
  error?: string;
  cloudinaryData?: CloudinaryImage | CloudinaryVideo;
}

interface ImageUploaderProps {
  value: (CloudinaryImage | CloudinaryVideo)[];
  onChange: (media: (CloudinaryImage | CloudinaryVideo)[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptImages?: boolean;
  acceptVideos?: boolean;
  folder?: string;
  className?: string;
}

export function ImageUploader({
  value = [],
  onChange,
  maxFiles = 10,
  maxFileSize = 50,
  acceptImages = true,
  acceptVideos = true,
  folder = 'products',
  className = '',
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create accepted file types string
  const acceptedTypes = [
    ...(acceptImages ? ['image/*'] : []),
    ...(acceptVideos ? ['video/*'] : []),
  ].join(',');

  // Handle file validation
  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    if (acceptImages && file.type.startsWith('image/')) {
      return null;
    }
    
    if (acceptVideos && file.type.startsWith('video/')) {
      return null;
    }

    return 'File type not supported';
  };

  // Handle file selection
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newPreviews: MediaPreview[] = [];
    
    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      
      if (error) {
        // Show error toast (you can replace with your toast system)
        console.error(`File ${file.name}: ${error}`);
        return;
      }

      if (previews.length + newPreviews.length >= maxFiles) {
        console.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const preview: MediaPreview = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'video',
        uploading: false,
        uploaded: false,
      };

      newPreviews.push(preview);
    });

    if (newPreviews.length > 0) {
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  }, [previews.length, maxFiles, maxFileSize, acceptImages, acceptVideos]);

  // Upload files to Cloudinary
  const uploadFiles = async () => {
    const filesToUpload = previews.filter(p => !p.uploading && !p.uploaded && !p.error);
    
    if (filesToUpload.length === 0) return;

    // Set uploading state
    setPreviews(prev => prev.map(p => 
      filesToUpload.some(f => f.id === p.id) 
        ? { ...p, uploading: true } 
        : p
    ));

    for (const preview of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('files', preview.file);
        formData.append('folder', folder);
        formData.append('tags', JSON.stringify(['product']));

        // Simulate upload progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress > 90) progress = 90;
          setUploadProgress(prev => ({ ...prev, [preview.id]: progress }));
        }, 200);

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [preview.id]: 100 }));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        const result = await response.json();
        const cloudinaryData = result.media[0]; // Since we upload one file at a time

        // Update preview with success
        setPreviews(prev => prev.map(p => 
          p.id === preview.id 
            ? { 
                ...p, 
                uploading: false, 
                uploaded: true, 
                cloudinaryData 
              }
            : p
        ));

        // Update parent component
        const newValue = [...value, cloudinaryData];
        onChange(newValue);

      } catch (error) {
        console.error('Upload error:', error);
        setPreviews(prev => prev.map(p => 
          p.id === preview.id 
            ? { 
                ...p, 
                uploading: false, 
                error: error instanceof Error ? error.message : 'Upload failed' 
              }
            : p
        ));
      }
    }
  };

  // Remove preview
  const removePreview = (id: string) => {
    const preview = previews.find(p => p.id === id);
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreviews(prev => prev.filter(p => p.id !== id));
      
      if (preview.cloudinaryData) {
        const newValue = value.filter(v => v.public_id !== preview.cloudinaryData!.public_id);
        onChange(newValue);
      }
    }
  };

  // Remove existing media
  const removeExistingMedia = async (media: CloudinaryImage | CloudinaryVideo) => {
    try {
      await fetch(`/api/media/${encodeURIComponent(media.public_id)}?resourceType=${media.resource_type}`, {
        method: 'DELETE',
      });
      
      const newValue = value.filter(v => v.public_id !== media.public_id);
      onChange(newValue);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // File input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const totalFiles = value.length + previews.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-green-400 bg-green-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CardContent className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer text-center"
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Kéo thả hoặc click để chọn file
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {acceptImages && acceptVideos && 'Hình ảnh và video'}
              {acceptImages && !acceptVideos && 'Chỉ hình ảnh'}
              {!acceptImages && acceptVideos && 'Chỉ video'}
              {' • '}Tối đa {maxFileSize}MB{' • '} 
              {maxFiles - totalFiles} file còn lại
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedTypes}
              onChange={handleFileChange}
              className="hidden"
              disabled={totalFiles >= maxFiles}
            />
            
            {totalFiles < maxFiles && (
              <Button type="button" variant="outline">
                Chọn files
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Grid */}
      {(previews.length > 0 || value.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Existing uploaded media */}
          {value.map((media) => (
            <Card key={media.public_id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-md overflow-hidden bg-gray-100">
                  {media.resource_type === 'image' ? (
                    <img
                      src={media.secure_url}
                      alt={media.alt || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                      <video
                        src={media.secure_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <PlayCircle className="absolute inset-0 w-8 h-8 m-auto text-white drop-shadow-lg" />
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeExistingMedia(media)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* New previews */}
          {previews.map((preview) => (
            <Card key={preview.id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-md overflow-hidden bg-gray-100">
                  {preview.type === 'image' ? (
                    <img
                      src={preview.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                      <video
                        src={preview.url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <PlayCircle className="absolute inset-0 w-8 h-8 m-auto text-white drop-shadow-lg" />
                    </div>
                  )}
                  
                  {/* Upload Progress */}
                  {preview.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="mb-2">Đang upload...</div>
                        <Progress 
                          value={uploadProgress[preview.id] || 0} 
                          className="w-20"
                        />
                      </div>
                    </div>
                  )}

                  {/* Success indicator */}
                  {preview.uploaded && (
                    <div className="absolute top-1 left-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  )}

                  {/* Error indicator */}
                  {preview.error && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePreview(preview.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                {preview.error && (
                  <Alert className="mt-2">
                    <AlertDescription className="text-xs">
                      {preview.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {previews.some(p => !p.uploaded && !p.uploading && !p.error) && (
        <div className="flex justify-center">
          <Button 
            type="button"
            onClick={uploadFiles}
            className="bg-green-600 hover:bg-green-700"
          >
            Upload {previews.filter(p => !p.uploaded && !p.uploading && !p.error).length} file(s)
          </Button>
        </div>
      )}
    </div>
  );
}