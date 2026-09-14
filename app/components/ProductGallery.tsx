'use client';

import { useState } from 'react';

type ProductGalleryProps = {
  images: { url: string }[];
  productName: string;
};

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  // Determinamos la imagen principal inicial o usamos el placeholder
  const defaultImage = images && images.length > 0 
    ? images[0].url 
    : 'https://placehold.co/600x600/eeeeee/999999?text=Image+Not+Available';
    
  // Estado para controlar qué imagen se está mostrando en grande
  const [mainImage, setMainImage] = useState(defaultImage);

  return (
    <div className="flex flex-col">
      {/* Imagen Principal en Grande */}
      <div className="w-full aspect-square bg-[#f8f8f8] rounded-lg border border-gray-200 p-8 flex items-center justify-center relative">
        <img 
          src={mainImage} 
          alt={productName} 
          className="w-full h-full object-contain mix-blend-multiply transition-opacity duration-300"
        />
        <div className="absolute top-4 right-4 bg-[#ffc107] text-gray-900 text-xs font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
          TOP RATED
        </div>
      </div>

      {/* Miniaturas (Thumbnails) */}
      {images && images.length > 1 && (
        <div className="flex gap-4 mt-4 overflow-x-auto pb-2 custom-scrollbar">
          {images.map((img, index) => {
            const isActive = mainImage === img.url;
            
            return (
              <div 
                key={index} 
                onClick={() => setMainImage(img.url)}
                className={`w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-[#f8f8f8] rounded-lg p-2 cursor-pointer transition-all duration-200 
                  ${isActive 
                    ? 'border-2 border-brand-primary shadow-sm ring-1 ring-brand-primary' // Estilo cuando está seleccionada
                    : 'border border-gray-200 hover:border-brand-primary hover:shadow-md'    // Estilo normal
                  }`}
              >
                <img 
                  src={img.url} 
                  alt={`${productName} - Thumbnail ${index + 1}`} 
                  className="w-full h-full object-contain mix-blend-multiply" 
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}