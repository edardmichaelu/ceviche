import { useState, useRef, useEffect } from 'react';
import { PhotoIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { ModernModal, useModernModal } from '../ui/ModernModal';

// URL dinámico del backend (mismo host, puerto 5000)
const BACKEND_URL = (() => {
  try {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const backendUrl = `${protocol}//${host}:5000`;
    return backendUrl;
  } catch (error) {
    const fallbackUrl = 'http://localhost:5000';
    return fallbackUrl;
  }
})();

interface ImageUploadProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  className?: string;
  uploadUrl?: string;
}

interface MultiImageUploadProps {
  productId: number;
  images?: Array<{
    id: number;
    producto_id: number;
    imagen_url: string;
    orden: number;
    es_principal: boolean;
    descripcion?: string;
    creado_en?: string;
  }>;
  onImagesChange: (images: Array<{
    id: number;
    producto_id: number;
    imagen_url: string;
    orden: number;
    es_principal: boolean;
    descripcion?: string;
    creado_en?: string;
  }>) => void;
  onImagesAdded?: (ids: number[]) => void;
  onImagesRemoved?: (ids: number[]) => void;
  className?: string;
}

export function ImageUpload({ currentImage, onImageChange, className = "", uploadUrl = '/api/upload/avatar' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { alert } = useModernModal();

  // Debug: Ver qué imagen se está recibiendo
  useEffect(() => {
    // Solo actualizar si currentImage es diferente
    if (currentImage !== preview) {
      setPreview(currentImage || null);
    }
  }, [currentImage]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido', 'error');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB', 'error');
      return;
    }

    setIsUploading(true);

    try {
      // Crear URL de preview local
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Subir archivo al servidor
      const formData = new FormData();
      formData.append('file', file);
      
      // Obtener token del sessionStorage
      const token = sessionStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No hay token de autorización. Inicia sesión nuevamente.');
      }

      const fullUrl = `${BACKEND_URL}${uploadUrl}`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();

      if (result.success) {
        // Usar la URL del servidor
        const serverUrl = `${BACKEND_URL}${result.file_url}`;
        onImageChange(serverUrl);
      } else {
        throw new Error(result.error || 'Error subiendo archivo');
      }
    } catch (error) {
      alert('Error al subir la imagen. Inténtalo de nuevo.', 'error');
      setPreview(currentImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        id="avatar-input"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div
        onClick={handleClick}
        className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50"
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                setPreview(null);
                onImageChange(null);
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700 mx-auto mb-2 w-fit">
              <PhotoIcon className="h-8 w-8 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isUploading ? 'Subiendo...' : 'Subir Imagen'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para subir múltiples imágenes
export function MultiImageUpload({ productId, images = [], onImagesChange, onImagesAdded, onImagesRemoved, className = "" }: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { modalState, alert, closeModal } = useModernModal();

  // Debug: verificar que las imágenes se estén recibiendo correctamente
  useEffect(() => {
  }, [images]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validar archivos
    const invalidFiles = files.filter(file =>
      !file.type.startsWith('image/') ||
      file.size > 5 * 1024 * 1024
    );

    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(file => {
        if (!file.type.startsWith('image/')) {
          return `${file.name}: No es una imagen válida`;
        }
        if (file.size > 5 * 1024 * 1024) {
          return `${file.name}: Debe ser menor a 5MB`;
        }
        return file.name;
      }).join('\n');

      alert(`Los siguientes archivos no son válidos:\n${errorMessages}`, 'error');
      return;
    }

    const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('imagenes', file);
      });

      const token = sessionStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No hay token de autorización');
      }

      const response = await fetch(`${BACKEND_URL}/api/producto/${productId}/imagenes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        // El backend devuelve registros completos de ProductoImagen
        const newImages = [...images, ...result.data];
        onImagesChange(newImages);
        if (onImagesAdded) {
          const ids = (result.data || []).map((img: any) => img.id).filter((id: any) => typeof id === 'number');
          onImagesAdded(ids);
        }
      } else {
        throw new Error(result.error || 'Error subiendo imágenes');
      }
    } catch (error) {
      alert('Error al subir las imágenes. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (imageId: number | undefined, index: number) => {
    // Si no hay id (imágenes nuevas sin persistir), eliminar por índice
    if (typeof imageId === 'undefined' || imageId === null) {
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
      return;
    }
    // Con id definido, eliminar por id
    const newImages = images.filter(img => img.id !== imageId);
    onImagesChange(newImages);
    if (onImagesRemoved && typeof imageId === 'number') {
      onImagesRemoved([imageId]);
    }
  };

  const handleSetPrincipal = (imageId: number | undefined, index: number) => {
    // Modo edición: actualizar solo en memoria, guardar al confirmar
    const newImages = images.map((img, i) => ({
      ...img,
      es_principal: typeof imageId === 'undefined' ? i === index : img.id === imageId
    }));
    onImagesChange(newImages);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botón para subir nuevas imágenes */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-center">
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {isUploading ? 'Subiendo imágenes...' : 'Haga clic para subir imágenes'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Formatos: PNG, JPG, JPEG, GIF, WEBP (máx. 5MB cada uno)
            </p>
          </div>
        </button>

        {isUploading && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">Subiendo imágenes...</p>
          </div>
        )}
      </div>

      {/* Galería de imágenes existentes */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Imágenes del producto</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, idx) => (
              <div key={`${image.id ?? 'tmp'}-${idx}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center">
                  <img
                    src={image.imagen_url.startsWith('http') ? image.imagen_url : `${BACKEND_URL}${image.imagen_url}`}
                    alt={image.descripcion || 'Imagen del producto'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = 'none';
                      const parent = img.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div style="color:#6b7280; font-size:12px; text-align:center;">Imagen no disponible</div>';
                      }
                    }}
                  />
                </div>

                {/* Acciones flotantes (sin overlay) */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleSetPrincipal(image.id, idx)}
                    className={`p-2 rounded-full shadow ${image.es_principal ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    title={image.es_principal ? 'Imagen principal' : 'Marcar como principal'}
                  >
                    <StarIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id, idx)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
                    title="Eliminar imagen"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Indicador de imagen principal */}
                {image.es_principal && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal moderno para alertas y confirmaciones */}
      <ModernModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        confirmText={modalState.type === 'warning' ? 'Eliminar' : 'Aceptar'}
        cancelText="Cancelar"
        showCancel={modalState.type === 'warning'}
      />
    </div>
  );
}
