'use client';

import { useState } from 'react';
import { useCart } from '../../../context/CartContext';
import Link from 'next/link';

type FBTProduct = {
  id: string;
  variantId: string | null;
  name: string;
  price: number;
  image: string;
  slug: string;
  unit?: string | null; // 🚀 AÑADIDO: Recibe la Unidad
  sku?: string | null;  // 🚀 AÑADIDO: Recibe el SKU
};

export default function FrequentlyBoughtTogether({
  mainProduct, 
  relatedProducts
}: {
  mainProduct: FBTProduct;
  relatedProducts: FBTProduct[];
}) {
  const { addToCart, openCart } = useCart();
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleAddSingleToCart = (product: FBTProduct) => {
    const uniqueId = product.variantId ? `${product.id}-${product.variantId}` : product.id;
    
    addToCart({
      cartItemId: uniqueId,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      sku: product.sku || '', 
      options: {} 
    });

    if (openCart) openCart();
  };

  if (relatedProducts.length === 0) return null;

  const totalProducts = relatedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = relatedProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="pt-12 mt-12 border-t border-gray-200">
      
      <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-8">
        Frequently Bought Together
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {paginatedProducts.map((p, idx) => (
          <div key={idx} className="bg-white rounded-md border border-gray-200 p-3 flex flex-col hover:shadow-lg transition-shadow duration-300 group">
            
            <Link href={`/product/${p.slug}`} className="block relative w-full aspect-square mb-3 bg-[#f8f8f8] rounded p-2">
              <img 
                src={p.image} 
                alt={p.name} 
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
              />
            </Link>

            <div className="flex flex-col flex-grow">
              <Link href={`/product/${p.slug}`}>
                <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1 group-hover:text-brand-primary transition-colors line-clamp-2">
                  {p.name}
                </h3>
              </Link>
              
              {/* 🚀 AQUÍ MOSTRAMOS EL SKU Y LA UNIDAD */}
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                Item #: {p.sku || 'N/A'} 
                {p.unit && <span className="text-gray-800 ml-1 bg-gray-100 px-1 rounded border border-gray-200 shadow-sm">| UNITS: {p.unit}</span>}
              </p>
              
              <div className="mt-auto">
                <p className="text-[15px] font-black text-[#e50027] mb-3">
                  ${p.price.toFixed(2)}
                </p>
                
                <button 
                  onClick={() => handleAddSingleToCart(p)}
                  className="w-full bg-[#ffc107] hover:bg-[#e0a800] text-gray-900 text-[10px] font-black uppercase tracking-widest py-2 rounded shadow-sm transition-all duration-200"
                >
                  Add to Cart
                </button>
              </div>
            </div>
            
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-4 border-t border-gray-100 gap-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Showing {startIndex + 1} - {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts}
          </div>
          
          <div className="flex gap-2 items-center">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-xs font-bold text-gray-900">
              {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)} 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}