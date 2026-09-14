'use client';

import { useCart } from '../../context/CartContext';
import Link from 'next/link';

export default function CartDrawer() {
  const { isCartOpen, closeCart, cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <>
      {/* Fondo oscuro (Overlay) */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${isCartOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeCart}
      />

      {/* Panel lateral del Carrito */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* HEADER DEL CARRITO */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Your Cart</h2>
          <button 
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-brand-primary transition-colors rounded-full hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* LISTA DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <span className="text-5xl">🛒</span>
              <p className="font-medium text-lg">Your cart is currently empty.</p>
              
              {/* 🚀 Mejora: Ahora te lleva directamente a la tienda si el carrito está vacío */}
              <Link 
                href="/shop" 
                onClick={closeCart} 
                className="text-brand-primary font-bold hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-6">
              {cartItems.map((item) => (
                <li key={item.cartItemId} className="flex space-x-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-md border border-gray-200 flex-shrink-0 p-1">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs font-bold text-gray-900 line-clamp-2 pr-2 leading-tight">
                        {item.name}
                      </h3>
                      <button onClick={() => removeFromCart(item.cartItemId)} className="text-gray-400 hover:text-red-500 transition-colors">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    {/* Opciones seleccionadas (Color, Talla, etc) */}
                    {item.options && Object.keys(item.options).length > 0 && (
                      <div className="mt-1 text-[10px] text-gray-500 font-medium">
                        {Object.entries(item.options).map(([key, value]) => (
                          <span key={key} className="mr-3 capitalize">
                            <span className="font-bold text-gray-700">{key}:</span> {value}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                      Unit: ${item.price.toFixed(2)}
                    </div>

                    <div className="mt-auto pt-2 flex items-center justify-between">
                      {/* Control de cantidad */}
                      <div className="flex items-center border border-gray-300 rounded h-7 w-20">
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="px-2 text-gray-500 hover:text-brand-primary">-</button>
                        <span className="flex-1 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="px-2 text-gray-500 hover:text-brand-primary">+</button>
                      </div>
                      
                      <div className="font-black text-sm text-[#e50027]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* FOOTER DEL CARRITO (Subtotal y Botones) */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-5 bg-gray-50">
            <div className="flex justify-between items-center mb-4 text-gray-900">
              <span className="text-sm font-bold uppercase tracking-wider">Subtotal</span>
              <span className="text-xl font-black">${cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Link 
                href="/checkout" 
                onClick={closeCart}
                className="w-full bg-brand-primary hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm py-4 rounded text-center transition-colors shadow-lg shadow-red-500/30"
              >
                Checkout
              </Link>
              
              {/* 🚀 Aquí está el Link de View Cart. Funciona perfectamente y va a /cart */}
              <Link 
                href="/cart" 
                onClick={closeCart}
                className="w-full bg-white hover:bg-gray-100 border border-gray-300 text-gray-900 font-bold uppercase tracking-widest text-xs py-3.5 rounded text-center transition-colors"
              >
                View Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}