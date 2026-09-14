'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  dob: string;
  avatar_url: string | null;
};

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

type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  stripe_transaction_id: string;
  items: any[];
};

export default function AccountPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [user, setUser] = useState<any>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [orderPage, setOrderPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ORDERS_PER_PAGE = 12;

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    address_line1: '', address_line2: '', city: '', state: '', zip_code: '', country: 'US'
  });

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (profileData) setProfile(profileData);

      await fetchAddresses(session.user.id);
      await fetchOrders(session.user.id, 1);

      setLoading(false);
    }
    loadData();
  }, [router]);

  const fetchAddresses = async (userId: string) => {
    const { data } = await supabase.from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false });
    if (data) setAddresses(data);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const isFirst = addresses.length === 0;
    
    await supabase.from('addresses').insert([{ ...newAddress, user_id: user.id, is_default: isFirst }]);
    await fetchAddresses(user.id);
    setShowAddressForm(false);
    setNewAddress({ address_line1: '', address_line2: '', city: '', state: '', zip_code: '', country: 'US' });
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', addressId);
    await fetchAddresses(user.id);
  };

  const handleDeleteAddress = async (addressId: string) => {
    await supabase.from('addresses').delete().eq('id', addressId);
    await fetchAddresses(user.id);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    if (profile && user) {
      await supabase.from('profiles').update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        dob: profile.dob,
      }).eq('id', user.id);
    }
    setUpdatingProfile(false);
    alert('Profile updated successfully!');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('You must select an image to upload.');
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      setProfile({ ...profile!, avatar_url: data.publicUrl });
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fetchOrders = async (userId: string, page: number) => {
    const from = (page - 1) * ORDERS_PER_PAGE;
    const to = from + ORDERS_PER_PAGE - 1;
    
    const { data, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (data) setOrders(data);
    if (count) setTotalOrders(count);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      
      <div className="bg-white border-b border-gray-200 py-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">My Account</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back, {profile?.first_name || 'User'}!</p>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-gray-500 hover:text-red-600 uppercase tracking-widest transition-colors border border-gray-300 hover:border-red-600 px-4 py-2 rounded">
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
        
        {/* MENU LATERAL */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`text-left px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'profile' ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Profile Details
            </button>
            <button 
              onClick={() => setActiveTab('addresses')}
              className={`text-left px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'addresses' ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Addresses
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`text-left px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'orders' ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Order History
            </button>
          </nav>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1">
          
          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide border-b border-gray-100 pb-4">Personal Information</h2>
              
              <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
                <div className="flex flex-col items-center space-y-4 w-full md:w-1/3">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">👤</div>
                    )}
                  </div>
                  <label className="cursor-pointer text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-red-700 transition-colors">
                    {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                  </label>
                </div>

                <form onSubmit={handleUpdateProfile} className="w-full md:w-2/3 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
                      <input type="text" value={profile?.first_name || ''} onChange={(e) => setProfile({ ...profile!, first_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
                      <input type="text" value={profile?.last_name || ''} onChange={(e) => setProfile({ ...profile!, last_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input type="email" value={user?.email || ''} disabled className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded text-sm text-gray-500 cursor-not-allowed" />
                    <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed here.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number (Optional)</label>
                      <input type="tel" value={profile?.phone || ''} onChange={(e) => setProfile({ ...profile!, phone: e.target.value })} placeholder="+1 234 567 8900" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Date of Birth (Optional)</label>
                      <input type="date" value={profile?.dob || ''} onChange={(e) => setProfile({ ...profile!, dob: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-brand-primary focus:border-brand-primary" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <button type="submit" disabled={updatingProfile} className="bg-brand-primary hover:bg-red-700 text-white font-bold uppercase tracking-widest text-xs py-3 px-6 rounded transition-colors shadow-md">
                      {updatingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Shipping Addresses</h2>
                <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline">
                  + Add New
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="bg-gray-50 p-5 rounded border border-gray-200 mb-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Address Line 1</label>
                      <input type="text" required value={newAddress.address_line1} onChange={e => setNewAddress({...newAddress, address_line1: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Address Line 2 (Apt, Suite)</label>
                      <input type="text" value={newAddress.address_line2} onChange={e => setNewAddress({...newAddress, address_line2: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
                      <input type="text" required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">State / Province</label>
                      <input type="text" required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Zip Code</label>
                      <input type="text" required value={newAddress.zip_code} onChange={e => setNewAddress({...newAddress, zip_code: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button type="submit" className="bg-gray-900 text-white text-xs font-bold uppercase tracking-widest py-2 px-4 rounded hover:bg-brand-primary transition-colors">Save Address</button>
                    <button type="button" onClick={() => setShowAddressForm(false)} className="text-gray-500 text-xs font-bold uppercase tracking-widest py-2 px-4 hover:bg-gray-200 rounded transition-colors">Cancel</button>
                  </div>
                </form>
              )}

              {addresses.length === 0 && !showAddressForm ? (
                <p className="text-gray-500 text-sm text-center py-8">You haven't saved any addresses yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div key={addr.id} className={`p-4 rounded-md border ${addr.is_default ? 'border-brand-primary bg-red-50/30' : 'border-gray-200'} relative`}>
                      {addr.is_default && <span className="absolute top-4 right-4 bg-brand-primary text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm">Default</span>}
                      <p className="text-sm font-medium text-gray-900">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-sm text-gray-600">{addr.address_line2}</p>}
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.zip_code}</p>
                      <p className="text-sm text-gray-600">{addr.country}</p>
                      
                      <div className="mt-4 flex space-x-4">
                        {!addr.is_default && (
                          <button onClick={() => handleSetDefaultAddress(addr.id)} className="text-[10px] font-bold text-brand-primary uppercase tracking-wider hover:underline">Set as Default</button>
                        )}
                        <button onClick={() => handleDeleteAddress(addr.id)} className="text-[10px] font-bold text-red-500 uppercase tracking-wider hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ORDERS DETALLADAS */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide border-b border-gray-100 pb-4">Order History</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-gray-500 text-sm">You haven't placed any orders yet.</p>
                  <Link href="/shop" className="mt-4 inline-block text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline">Start Shopping</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order.id} className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-3 mb-4 gap-2">
                        <div>
                          <span className="text-xs font-black bg-gray-900 text-white px-2 py-1 rounded uppercase tracking-widest">
                            Order #{order.id.split('-')[0].toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 ml-3">{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {order.stripe_transaction_id && (
                            <span className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border">
                              TxID: <strong className="text-gray-900">{order.stripe_transaction_id}</strong>
                            </span>
                          )}
                          <span className="bg-green-100 text-green-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                            {order.status || 'Completed'}
                          </span>
                        </div>
                      </div>

                      {/* Lista detallada de productos comprados */}
                      <div className="bg-white rounded border border-gray-200 p-3 mb-3">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Purchased Items:</p>
                        <ul className="divide-y divide-gray-100 text-xs">
                          {order.items && Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                            <li key={idx} className="py-2 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-gray-900">{item.name}</span>
                                {item.options && Object.keys(item.options).length > 0 && (
                                  <span className="text-gray-500 ml-2 uppercase text-[10px]">
                                    ({Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(' - ')})
                                  </span>
                                )}
                                <span className="text-gray-400 ml-2">x{item.quantity}</span>
                              </div>
                              <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Total Paid:</span>
                        <span className="text-base font-black text-brand-primary">${order.total_amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}