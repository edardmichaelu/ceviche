import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../apiClient';
import { ErrorHandler } from '../../utils/errorHandler';
import {
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ImageUploadProductoProps {
  onImageUploaded: (fileUrl: string, fileName: string) => void;
  onImageRemoved: () => void;
  currentImage?: string;
  disabled?: boolean;
  className?: string;
}

const ImageUploadProducto: React.FC<ImageUploadProductoProps> = ({
  onImageUploaded,
  onImageRemoved,
  currentImage,
  disabled = false,
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG y WebP.');
      return;
    }

    // Validar tamaño
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. Máximo 5MB permitido.');
      return;
    }

    try {
      setUploading(true);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Subir archivo
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.upload('/upload/producto', formData);

      if (ErrorHandler.isSuccessResponse(response)) {
        const { file_url, filename } = response.data || response;
        onImageUploaded(file_url, filename);
        toast.success('Imagen subida correctamente');
      } else {
        throw new Error(ErrorHandler.getFriendlyErrorMessage(response));
      }
    } catch (error: any) {
      ErrorHandler.logError('subir imagen', error);
      const errorMessage = ErrorHandler.showErrorNotification(error, 'subir imagen');
      toast.error(errorMessage);

      // Limpiar preview en caso de error
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = async () => {
    if (!preview) return;

    try {
      setUploading(true);

      // Extraer el nombre del archivo de la URL
      const filename = preview.split('/').pop() || '';

      // Eliminar del servidor
      const response = await apiClient.deleteFile(`/upload/producto/${filename}`);

      if (ErrorHandler.isSuccessResponse(response)) {
        setPreview(null);
        onImageRemoved();
        toast.success('Imagen eliminada correctamente');
      } else {
        throw new Error(ErrorHandler.getFriendlyErrorMessage(response));
      }
    } catch (error: any) {
      ErrorHandler.logError('eliminar imagen', error);
      const errorMessage = ErrorHandler.showErrorNotification(error, 'eliminar imagen');
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  if (uploading) {
    return (
      <div className={`w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Subiendo imagen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={`
          w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center
          transition-all duration-200 cursor-pointer
          ${dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            {!disabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Eliminar imagen"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center p-4">
            <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Arrastra y suelta una imagen aquí
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                PNG, JPG, WebP hasta 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {preview && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
          <span>Imagen subida correctamente</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploadProducto;
