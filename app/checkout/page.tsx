'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCart } from '../../context/CartContext';
import StripeCheckoutForm from '../components/StripeCheckoutForm'; 

type Address = {
  id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart(); 
  
  // Estados de Autenticación y Carga
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Estados de Direcciones
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  
  // Estado del Formulario Manual
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  // 1. Verificar Sesión y Cargar Direcciones
  useEffect(() => {
    async function loadCheckoutData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        setFormData(prev => ({ ...prev, email: session.user.email || '' }));

        // Obtener Perfil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          setProfile(profileData);
          setFormData(prev => ({ 
            ...prev, 
            firstName: profileData.first_name || '', 
            lastName: profileData.last_name || '' 
          }));
        }

        // Obtener Direcciones Guardadas
        const { data: addressData } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', session.user.id)
          .order('is_default', { ascending: false });

        if (addressData && addressData.length > 0) {
          setSavedAddresses(addressData);
          setSelectedAddressId(addressData[0].id);
        }
      }
      
      setLoading(false);
    }
    
    loadCheckoutData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Cálculos del resumen
  const shippingCost = 0.00; 
  const taxRate = 0.00; 
  const finalTotal = cartTotal + shippingCost + (cartTotal * taxRate);

  // 🚀 LÓGICA CUANDO EL PAGO DE STRIPE ES EXITOSO
  const handlePaymentSuccess = async (transactionId: string) => {
    // 1. Crear el registro completo de la orden en Supabase
    const orderData = {
      user_id: user ? user.id : null,
      customer_name: `${formData.firstName} ${formData.lastName}`.trim() || 'Customer',
      customer_email: formData.email,
      items: cartItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        options: item.options || {} 
      })),
      total_amount: finalTotal,
      stripe_transaction_id: transactionId,
      status: 'Completed',
    };

    const { data: orderResponse, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error("Error guardando la orden en BD:", error.message);
      alert(`Error al registrar la orden: ${error.message}`);
      return;
    } else {
      // 2. Disparar los correos de confirmación
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'success',
          customerName: orderData.customer_name,
          customerEmail: orderData.customer_email,
          orderId: orderResponse.id,
          items: cartItems, 
          total: finalTotal,
          transactionId: transactionId 
        })
      });
    }

    // 🚀 3. LIMPIAR EL CARRITO DE COMPRAS DE FORMA OFICIAL
    if (clearCart) {
      clearCart();
    }

    // 4. Redirigir al historial en la cuenta del usuario
    alert("¡Pago procesado con éxito! Revisa tu correo electrónico. 🎉");
    router.push('/account'); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 py-12">
        <span className="text-6xl mb-4">🛒</span>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide mb-2">Your Cart is Empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/shop" className="bg-brand-primary hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs py-3 px-8 rounded transition-colors shadow-md">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-16">
      
      {/* HEADER SIMPLE DE CHECKOUT */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <Link href="/">
            <img src="/Logo.png" alt="Logo" className="h-10 w-auto" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* COLUMNA IZQUIERDA: FORMULARIOS */}
          <div className="flex-1 lg:w-2/3">
            <div className="flex flex-col">
              
              {/* 1. CONTACT INFO */}
              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">Contact Information</h2>
                  {!user && (
                    <span className="text-xs text-gray-500">
                      Already have an account? <Link href="/login?redirect=/checkout" className="text-brand-primary font-bold hover:underline">Log in</Link>
                    </span>
                  )}
                </div>
                
                {user ? (
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{profile?.first_name} {profile?.last_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-3 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary outline-none" 
                    />
                  </div>
                )}
              </div>

              {/* 2. SHIPPING ADDRESS */}
              <div className="mb-10">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-4">Shipping Address</h2>
                
                {savedAddresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {savedAddresses.map((address) => (
                      <label 
                        key={address.id} 
                        className={`flex items-start p-4 border rounded cursor-pointer transition-all ${selectedAddressId === address.id ? 'border-brand-primary bg-red-50/20 ring-1 ring-brand-primary' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <input 
                          type="radio" 
                          name="saved_address" 
                          value={address.id} 
                          checked={selectedAddressId === address.id}
                          onChange={() => setSelectedAddressId(address.id)}
                          className="mt-1 mr-3 text-brand-primary focus:ring-brand-primary"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {profile?.first_name} {profile?.last_name} {address.is_default && <span className="ml-2 bg-gray-900 text-white text-[9px] uppercase px-2 py-0.5 rounded">Default</span>}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{address.address_line1} {address.address_line2}</p>
                          <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zip_code}</p>
                        </div>
                      </label>
                    ))}
                    
                    <label className={`flex items-center p-4 border rounded cursor-pointer transition-all ${selectedAddressId === 'new' ? 'border-brand-primary bg-red-50/20 ring-1 ring-brand-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="saved_address" 
                        value="new" 
                        checked={selectedAddressId === 'new'}
                        onChange={() => setSelectedAddressId('new')}
                        className="mr-3 text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="text-sm font-bold text-gray-900">Use a different address</span>
                    </label>
                  </div>
                )}

                {(savedAddresses.length === 0 || selectedAddressId === 'new') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-5 rounded border border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
                      <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
                      <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Address</label>
                      <input type="text" name="address1" required value={formData.address1} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary outline-none" placeholder="Street address or P.O. Box" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Apartment, suite, etc. (optional)</label>
                      <input type="text" name="address2" value={formData.address2} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City</label>
                      <input type="text" name="city" required value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State</label>
                      <input type="text" name="state" required value={formData.state} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">ZIP Code</label>
                      <input type="text" name="zip" required value={formData.zip} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary outline-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. PAYMENT (STRIPE) */}
              <div className="mb-8">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-4">Payment</h2>
                <div className="bg-gray-50 p-5 rounded border border-gray-200">
                  <StripeCheckoutForm 
                    amount={finalTotal} 
                    customerEmail={formData.email}
                    onPaymentSuccess={handlePaymentSuccess} 
                  />
                </div>
              </div>

            </div>
          </div>

          {/* COLUMNA DERECHA: ORDER SUMMARY */}
          <div className="w-full lg:w-1/3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sticky top-8 shadow-sm">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-6">Order Summary</h2>
              
              <ul className="space-y-4 mb-6 max-h-96 overflow-y-auto custom-scrollbar pr-2 pt-4">
                {cartItems.map((item) => (
                  <li key={item.cartItemId} className="flex space-x-4 pt-2">
                    <div className="w-16 h-16 bg-white border border-gray-200 rounded flex-shrink-0 p-1 relative">
                      <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {item.quantity}
                      </span>
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-[11px] font-bold text-gray-900 line-clamp-2 leading-tight">
                        {item.name}
                      </h3>
                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="mt-0.5 text-[9px] text-gray-500 uppercase">
                          {Object.values(item.options).join(' / ')}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-black text-gray-900 flex items-center">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="font-bold">{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="text-base font-black text-gray-900 uppercase tracking-wide">Total</span>
                  <span className="text-2xl font-black text-[#e50027]">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}