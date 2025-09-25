import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCarouselProps {
  images: Array<{
    id: number;
    imagen_url: string;
    descripcion?: string;
    es_principal: boolean;
  }>;
  productName: string;
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  autoPlayDelay?: number;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  productName,
  className = '',
  showControls = true,
  autoPlay = false,
  autoPlayDelay = 3000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  // Si no hay imágenes, mostrar placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-slate-400">
          <PhotoIcon className="h-16 w-16 mx-auto mb-2" />
          <p className="text-sm">Sin imágenes disponibles</p>
        </div>
      </div>
    );
  }

  // Función helper para obtener URL completa
  const getFullImageUrl = (relativeUrl: string) => {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http')) return relativeUrl;

    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = 5000;
    return `${protocol}//${host}:${port}${relativeUrl}`;
  };

  const nextImage = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality - moved before any conditional returns
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;

    const interval = setInterval(() => {
      nextImage();
    }, autoPlayDelay);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length, autoPlayDelay, nextImage]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(autoPlay);

  const currentImage = images[currentIndex];
  const fullImageUrl = getFullImageUrl(currentImage?.imagen_url || '');

  return (
    <div
      className={`relative w-full h-64 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Imagen principal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          {fullImageUrl ? (
            <img
              src={fullImageUrl}
              alt={currentImage.descripcion || `${productName} - Imagen ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error(`Error loading image ${currentIndex}:`, fullImageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <PhotoIcon className="h-16 w-16" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Indicador de imagen principal */}
      {currentImage?.es_principal && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <HeartSolidIcon className="h-3 w-3" />
            Principal
          </div>
        </div>
      )}

      {/* Controles de navegación */}
      {showControls && images.length > 1 && (
        <>
          {/* Botón anterior */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {/* Botón siguiente */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Indicadores */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToImage(index);
              }}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Contador */}
      {images.length > 1 && (
        <div className="absolute top-2 right-2 z-20 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};
