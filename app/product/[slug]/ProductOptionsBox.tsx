'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useCart } from '../../../context/CartContext'; 

type Variant = {
  id: string;
  sku: string | null;
  price: number | null;
  stock_quantity: number | null;
  attributes: any; 
};

type ProductInfo = {
  id: string;
  name: string;
  sku: string;
  regular_price: number | null;
  imageUrl?: string; 
  unit?: string | null; // 🚀 AÑADIMOS EL CAMPO UNIT AQUÍ PARA QUE EL COMPONENTE LO RECIBA
};

export default function ProductOptionsBox({ 
  product, 
  variants 
}: { 
  product: ProductInfo; 
  variants: Variant[]; 
}) {
  const { addToCart, openCart } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const [discountCode, setDiscountCode] = useState('');
  const [validatedDiscount, setValidatedDiscount] = useState<{ type: string, value: number, code: string } | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: string, value: number, code: string } | null>(null);
  const [discountStatus, setDiscountStatus] = useState<'idle' | 'verifying' | 'valid' | 'invalid' | 'applied'>('idle');

  const parsedVariants = useMemo(() => {
    if (!variants) return [];
    return variants.map(v => {
      let parsedAttr = {};
      if (typeof v.attributes === 'string') {
        try { parsedAttr = JSON.parse(v.attributes); } catch (e) {}
      } else if (v.attributes) {
        parsedAttr = v.attributes;
      }
      return { ...v, parsedAttr };
    });
  }, [variants]);

  const optionGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    parsedVariants.forEach(variant => {
      Object.entries(variant.parsedAttr).forEach(([key, value]) => {
        if (!groups[key]) groups[key] = [];
        if (!groups[key].includes(value as string)) {
          groups[key].push(value as string);
        }
      });
    });
    return groups;
  }, [parsedVariants]);

  useEffect(() => {
    if (parsedVariants.length > 0 && Object.keys(selectedOptions).length === 0) {
      setSelectedOptions(parsedVariants[0].parsedAttr);
    }
  }, [parsedVariants, selectedOptions]);

  const matchedVariant = useMemo(() => {
    if (Object.keys(selectedOptions).length === 0) return null;
    return parsedVariants.find(v => {
      return Object.entries(selectedOptions).every(([key, val]) => v.parsedAttr[key] === val);
    });
  }, [selectedOptions, parsedVariants]);

  const handleOptionSelect = (key: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleVerifyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountStatus('verifying');
    setValidatedDiscount(null);

    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', discountCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setDiscountStatus('invalid');
      return;
    }

    if (data.usage_limit !== null && data.times_used >= data.usage_limit) {
      setDiscountStatus('invalid');
      return;
    }

    setValidatedDiscount({ type: data.type, value: data.value, code: data.code });
    setDiscountStatus('valid');
  };

  const handleConfirmApply = () => {
    setAppliedDiscount(validatedDiscount);
    setDiscountStatus('applied');
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setValidatedDiscount(null);
    setDiscountCode('');
    setDiscountStatus('idle');
  };

  const isVariable = parsedVariants.length > 0;
  const displaySku = matchedVariant?.sku ? matchedVariant.sku : product.sku;
  
  const basePrice = (matchedVariant?.price !== null && matchedVariant?.price !== undefined) 
    ? matchedVariant.price 
    : product.regular_price;

  let unitPrice = Number(basePrice);
  const originalUnitPrice = unitPrice;

  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      unitPrice = unitPrice - (unitPrice * (appliedDiscount.value / 100));
    } else if (appliedDiscount.type === 'fixed') {
      unitPrice = Math.max(0, unitPrice - appliedDiscount.value);
    }
  }

  const totalPrice = unitPrice * quantity;
  const isOutOfStock = matchedVariant && matchedVariant.stock_quantity === 0;
  const isUnavailable = isVariable && !matchedVariant;

  const handleAddToCart = () => {
    if (basePrice === null || basePrice === undefined) return;

    const variantSuffix = Object.values(selectedOptions).join('-');
    const cartItemId = variantSuffix ? `${product.id}-${variantSuffix}` : product.id;

    addToCart({
      cartItemId: cartItemId,
      productId: product.id,
      name: product.name,
      price: unitPrice, 
      quantity: quantity,
      image: product.imageUrl || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image',
      sku: displaySku || '',
      options: {
        ...selectedOptions,
        ...(appliedDiscount ? { Discount: appliedDiscount.code } : {})
      }
    });

    if (openCart) openCart();
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-2">
        {product.name}
      </h1>
      
      <div className="flex items-center space-x-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 text-[#ffc107]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-xs text-[#0056b3] hover:underline cursor-pointer ml-2 font-medium">(24 Reviews)</span>
      </div>

      {/* 🚀 AQUÍ ES DONDE SE DIBUJA EL SKU Y LAS UNIDADES */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
          Item #: <span className="text-gray-800 transition-all">{displaySku || 'N/A'}</span>
        </p>
        
        {/* 🚀 LÓGICA QUE MUESTRA LAS UNIDADES SI EXISTEN */}
        {product.unit && (
          <>
            <span className="text-gray-300 hidden sm:inline-block">|</span>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
              Units: <span className="text-gray-900 transition-all bg-gray-100 px-3 py-1 rounded-md shadow-sm border border-gray-200">{product.unit}</span>
            </p>
          </>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8 shadow-sm">
        
        <div className="mb-4">
          <span className="text-sm text-gray-500 font-medium block mb-1">Price</span>
          {isUnavailable ? (
            <span className="text-2xl font-black text-gray-400">Unavailable</span>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-baseline flex-wrap gap-2">
                <span className="text-4xl font-black text-[#e50027] transition-all">
                  {basePrice !== null && basePrice !== undefined ? `$${totalPrice.toFixed(2)}` : 'Log in'}
                </span>
                
                {appliedDiscount && (
                  <span className="text-xl font-bold text-gray-400 line-through">
                    ${(originalUnitPrice * quantity).toFixed(2)}
                  </span>
                )}
                
                {basePrice !== null && basePrice !== undefined && (
                  <span className="text-xs text-gray-500 ml-2 font-medium">
                    {quantity > 1 ? `($${unitPrice.toFixed(2)} / Each)` : '/ Each'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {basePrice !== null && basePrice !== undefined && !isUnavailable && (
          <div className="mb-8 pb-6 border-b border-gray-200 relative">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest block mb-2">Discount Code</label>
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value);
                  if (discountStatus !== 'idle') setDiscountStatus('idle'); 
                }}
                placeholder="e.g. SUMMER20"
                disabled={discountStatus === 'applied'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm uppercase focus:ring-brand-primary focus:border-brand-primary outline-none disabled:bg-gray-100 disabled:text-gray-500"
              />
              
              {discountStatus !== 'applied' ? (
                <button 
                  onClick={handleVerifyDiscount}
                  disabled={discountStatus === 'verifying' || !discountCode.trim()}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 min-w-[80px]"
                >
                  {discountStatus === 'verifying' ? '...' : 'Verify'}
                </button>
              ) : (
                <button 
                  onClick={handleRemoveDiscount}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="mt-2 min-h-[40px]">
              {discountStatus === 'invalid' && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-500 flex items-center animate-pulse">
                  <span className="mr-1 text-sm">❌</span> Incorrect or expired code
                </p>
              )}

              {discountStatus === 'valid' && validatedDiscount && (
                <div className="p-3 bg-green-50 border border-green-200 rounded flex justify-between items-center animate-fade-in shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-green-700 flex items-center">
                    <span className="mr-2 text-sm">✅</span> Code is valid!
                  </p>
                  <button 
                    onClick={handleConfirmApply}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors shadow-md"
                  >
                    Apply Code
                  </button>
                </div>
              )}

              {discountStatus === 'applied' && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-green-600 flex items-center">
                  <span className="mr-1 text-sm">✅</span> Code applied successfully!
                </p>
              )}
            </div>
          </div>
        )}

        {isVariable && (
          <div className="flex flex-col space-y-6 mb-8">
            {Object.entries(optionGroups).map(([groupName, options]) => {
              const isColorGroup = groupName.toLowerCase() === 'color';

              return (
                <div key={groupName}>
                  <label className="text-sm font-bold text-gray-700 capitalize block mb-3">
                    {groupName}: <span className="font-normal text-gray-500">{selectedOptions[groupName]}</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {options.map(optionValue => {
                      const isSelected = selectedOptions[groupName] === optionValue;
                      
                      return (
                        <button
                          key={optionValue}
                          onClick={() => handleOptionSelect(groupName, optionValue)}
                          className={`
                            flex items-center justify-center px-4 py-2 text-sm font-bold border rounded-md transition-all
                            ${isSelected 
                              ? 'border-brand-primary text-brand-primary ring-1 ring-brand-primary bg-red-50/30' 
                              : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
                            }
                          `}
                        >
                          {isColorGroup && (
                            <span 
                              className="w-4 h-4 rounded-full border border-gray-200 mr-2 block shadow-sm"
                              style={{ backgroundColor: optionValue.toLowerCase().replace(" ", "") }}
                            ></span>
                          )}
                          {optionValue}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center border-2 border-gray-300 rounded bg-white w-full sm:w-32 h-12">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isUnavailable}
              className="px-4 text-gray-500 hover:text-brand-primary font-bold text-lg disabled:opacity-50"
            >
              -
            </button>
            <input 
              type="text" 
              value={quantity} 
              readOnly
              className="w-full text-center font-bold text-gray-900 outline-none bg-transparent"
            />
            <button 
              onClick={() => setQuantity(quantity + 1)}
              disabled={isUnavailable}
              className="px-4 text-gray-500 hover:text-brand-primary font-bold text-lg disabled:opacity-50"
            >
              +
            </button>
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={isUnavailable || isOutOfStock}
            className={`
              flex-1 font-black uppercase tracking-widest text-sm rounded h-12 transition-colors flex items-center justify-center shadow-lg 
              ${isUnavailable || isOutOfStock 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                : 'bg-brand-primary hover:bg-red-700 text-white shadow-brand-primary/20'
              }
            `}
          >
            <span className="mr-2 text-lg">🛒</span> 
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>

        <div className="mt-6 flex flex-col space-y-2 text-xs font-medium text-gray-600 border-t border-gray-200 pt-4">
          <div className="flex items-center">
            {isOutOfStock ? (
              <>
                <span className="text-red-500 mr-2 text-sm">✕</span> 
                <span className="text-gray-800 font-bold">Out of Stock</span>
              </>
            ) : (
              <>
                <span className="text-green-600 mr-2 text-sm">✓</span> 
                <span className="text-gray-800 font-bold">In Stock</span> & Ready to Ship
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}