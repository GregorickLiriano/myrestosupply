'use client';

import Link from 'next/link';
import { useCart } from '../../context/CartContext'; // Asegúrate de que esta ruta apunte bien a tu contexto

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <div className="bg-white min-h-screen pb-16">
      
      {/* BREADCRUMBS Y HEADER */}
      <div className="bg-gray-50 border-b border-gray-200 py-6 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex text-xs font-medium text-gray-500 space-x-2 items-center mb-3">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Shopping Cart</span>
          </nav>

          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            Shopping Cart
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {cartItems.length === 0 ? (
          // ESTADO DE CARRITO VACÍO
          <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link 
              href="/shop"
              className="inline-block bg-brand-primary text-white px-8 py-3 rounded text-sm font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          // CONTENIDO DEL CARRITO
          <div className="flex flex-col lg:flex-row gap-10">
            
            {/* LISTA DE PRODUCTOS (Lado Izquierdo) */}
            <div className="w-full lg:w-2/3">
              
              {/* Encabezados de Tabla (Solo visible en Desktop) */}
              <div className="hidden md:grid grid-cols-12 gap-4 border-b border-gray-200 pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Items del Carrito */}
              <ul className="space-y-6 md:space-y-0 md:divide-y md:divide-gray-100">
                {cartItems.map((item) => (
                  <li key={item.cartItemId} className="py-4 flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    
                    {/* INFO DEL PRODUCTO */}
                    <div className="col-span-6 flex items-start space-x-4 mb-4 md:mb-0">
                      <Link href={`/product/${item.productId}`} className="w-24 h-24 bg-gray-50 rounded-md border border-gray-200 flex-shrink-0 p-2">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                      </Link>
                      <div className="flex flex-col">
                        <Link href={`/product/${item.productId}`}>
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-brand-primary transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        {item.sku && (
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                            Item #: {item.sku}
                          </p>
                        )}
                        
                        {/* Opciones (Color, Talla) */}
                        {item.options && Object.keys(item.options).length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            {Object.entries(item.options).map(([key, value]) => (
                              <span key={key} className="mr-3 capitalize">
                                <span className="font-bold">{key}:</span> {value}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Botón Eliminar en Móvil */}
                        <button 
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="md:hidden mt-3 text-xs font-bold text-red-500 hover:underline flex items-center"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* PRECIO UNITARIO */}
                    <div className="col-span-2 flex justify-between md:justify-center items-center mb-4 md:mb-0">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">Price:</span>
                      <span className="text-sm font-semibold text-gray-900">${item.price.toFixed(2)}</span>
                    </div>

                    {/* CANTIDAD */}
                    <div className="col-span-2 flex justify-between md:justify-center items-center mb-4 md:mb-0">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">Qty:</span>
                      <div className="flex items-center border border-gray-300 rounded h-9 w-24">
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="px-3 text-gray-500 hover:text-brand-primary">-</button>
                        <span className="flex-1 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="px-3 text-gray-500 hover:text-brand-primary">+</button>
                      </div>
                    </div>

                    {/* TOTAL DEL ITEM Y BOTÓN ELIMINAR (Desktop) */}
                    <div className="col-span-2 flex justify-between md:justify-end items-center">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">Total:</span>
                      <div className="flex items-center space-x-4">
                        <span className="font-black text-brand-primary text-base">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="hidden md:flex text-gray-400 hover:text-red-500 transition-colors p-2"
                          title="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* RESUMEN DE ORDEN (Lado Derecho) */}
            <div className="w-full lg:w-1/3">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 sticky top-6">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-4 mb-4 uppercase tracking-widest">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm text-gray-600 border-b border-gray-200 pb-4 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="italic text-gray-500">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span className="italic text-gray-500">Calculated at checkout</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <span className="text-base font-bold text-gray-900 uppercase">Estimated Total</span>
                  <span className="text-2xl font-black text-brand-primary">${cartTotal.toFixed(2)}</span>
                </div>

                <Link 
                  href="/checkout"
                  className="w-full block text-center bg-brand-primary hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm py-4 rounded transition-colors shadow-lg shadow-red-500/30 mb-3"
                >
                  Proceed to Checkout
                </Link>

                <Link 
                  href="/shop"
                  className="w-full block text-center bg-transparent border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 font-bold uppercase tracking-widest text-xs py-3 rounded transition-colors"
                >
                  Continue Shopping
                </Link>
                
                {/* Opciones de pago seguro (Opcional visualmente) */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Secure Checkout</span>
                  <div className="flex space-x-2 grayscale opacity-60">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4 object-contain" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-4 object-contain" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png" alt="Paypal" className="h-4 object-contain" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}