'use client';

import Link from 'next/link';
import { useCart } from '../../context/CartContext';

type ProductCardActionsProps = {
  product: any;
  productUrl: string;
  imageUrl: string;
};

export default function ProductCardActions({ product, productUrl, imageUrl }: ProductCardActionsProps) {
  const { addToCart } = useCart();
  
  // Determinamos si es un producto variable
  const isVariable = product.regular_price === null;

  return (
    <div className="mt-auto">
      <p className="text-[15px] font-black text-[#e50027] mb-3">
        {!isVariable ? `$${product.regular_price}` : 'View Options'}
      </p>
      
      {isVariable ? (
        <Link 
          href={productUrl} 
          className="w-full block text-center bg-transparent border border-gray-300 text-gray-600 group-hover:border-brand-primary group-hover:text-brand-primary group-hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest py-2 rounded-sm transition-all duration-200"
        >
          View Options
        </Link>
      ) : (
        <button 
          onClick={(e) => {
            e.preventDefault();
            addToCart({
              cartItemId: product.id,
              productId: product.id,
              name: product.name,
              price: product.regular_price,
              quantity: 1,
              image: imageUrl,
              sku: product.sku || ''
            });
          }}
          className="w-full flex items-center justify-center bg-transparent border border-gray-300 text-gray-600 group-hover:border-brand-primary group-hover:text-brand-primary group-hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest py-2 rounded-sm transition-all duration-200"
        >
          Add to Cart
        </button>
      )}
    </div>
  );
}