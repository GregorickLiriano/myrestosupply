'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css'; 

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateSlug = (name: string) => {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
};

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean'] 
  ],
};

export default function AdminDashboard() {
  const router = useRouter();
  
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'categories' | 'discounts' | 'products' | 'storefront'>('orders');

  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // 🚀 ESTADOS STOREFRONT
  const [storefrontLayout, setStorefrontLayout] = useState<{id: string, position: number, is_visible: boolean}[]>([]);
  const [storefrontAds, setStorefrontAds] = useState<any[]>([]); 
  const [storefrontGrids, setStorefrontGrids] = useState<any[]>([]); 
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);   
  
  // ESTADOS NUEVO BANNER
  const [newAdName, setNewAdName] = useState('');
  const [newAdFile, setNewAdFile] = useState<File | null>(null);
  const [linkType, setLinkType] = useState<'none' | 'category' | 'custom'>('none');
  const [newAdCategory, setNewAdCategory] = useState(''); 
  const [customLink, setCustomLink] = useState('');
  const [uploadingAd, setUploadingAd] = useState(false);

  // ESTADOS NUEVO GRID DINÁMICO
  const [newGridName, setNewGridName] = useState('');
  const [newGridCategory, setNewGridCategory] = useState('');
  const [newGridMaxProducts, setNewGridMaxProducts] = useState<number | string>(15);
  const [newGridColumns, setNewGridColumns] = useState<number | string>(5);
  const [creatingGrid, setCreatingGrid] = useState(false);

  // ESTADOS EDITAR PUBLICIDAD (POPUP)
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editAdName, setEditAdName] = useState('');
  const [editLinkType, setEditLinkType] = useState<'none' | 'category' | 'custom'>('none');
  const [editAdCategory, setEditAdCategory] = useState('');
  const [editCustomLink, setEditCustomLink] = useState('');
  const [editAdFile, setEditAdFile] = useState<File | null>(null);
  const [isUpdatingAd, setIsUpdatingAd] = useState(false);

  // 🚀 ESTADOS EDITAR GRID DINÁMICO (POPUP)
  const [editingGridId, setEditingGridId] = useState<string | null>(null);
  const [editGridName, setEditGridName] = useState('');
  const [editGridCategory, setEditGridCategory] = useState('');
  const [editGridMaxProducts, setEditGridMaxProducts] = useState<number | string>(15);
  const [editGridColumns, setEditGridColumns] = useState<number | string>(5);
  const [isUpdatingGrid, setIsUpdatingGrid] = useState(false);

  const [newDiscount, setNewDiscount] = useState({ type: 'percentage', value: '', usageLimit: '', target_category: '' });
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });
  const [newUserProfile, setNewUserProfile] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'customer' });

  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [relatedBundleItems, setRelatedBundleItems] = useState<{productId: string, variantId: string | null, price: number, name: string}[]>([]);
  const [relatedSearchQuery, setRelatedSearchQuery] = useState('');

  const [productToDelete, setProductToDelete] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [sortOption, setSortOption] = useState('date-desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      const role = profile?.role || 'customer';
      setCurrentUserRole(role);

      if (role === 'customer') router.push('/account'); 
      else if (role === 'editor') { setActiveTab('products'); setAuthChecking(false); } 
      else setAuthChecking(false);
    };
    initAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecking) loadData();
  }, [activeTab, authChecking]);

  const loadData = async () => {
    setLoading(true);
    if (currentUserRole === 'editor' && activeTab !== 'products') { setLoading(false); return; }
    
    const { data: catData } = await supabase.from('categories').select('*').order('name');
    setCategories(catData || []);

    if (activeTab === 'orders') {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      setOrders(data || []);
    } else if (activeTab === 'users') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } else if (activeTab === 'discounts') {
      const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
      setDiscounts(data || []);
    } else if (activeTab === 'products') {
      const { data } = await supabase.from('products').select(`*, product_categories(category_id), product_variants(*)`).order('created_at', { ascending: false });
      setProducts(data || []);
    } else if (activeTab === 'storefront') {
      const { data: layoutData } = await supabase.from('home_layout').select('*').order('position', { ascending: true });
      setStorefrontLayout(layoutData || []);

      const { data: adsData } = await supabase.from('storefront_ads').select('*');
      setStorefrontAds(adsData || []);

      const { data: gridsData } = await supabase.from('storefront_grids').select('*');
      setStorefrontGrids(gridsData || []);
    }
    setLoading(false);
  };

  const handleDragStart = (index: number) => { 
    dragItem.current = index; 
    setDraggingIndex(index);
  };
  
  const handleDragEnter = (e: React.DragEvent, index: number) => { 
    e.preventDefault(); 
    dragOverItem.current = index; 
    if (index !== draggingIndex) {
      setHoveredIndex(index);
    }
  };
  
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const _layout = [...storefrontLayout];
      const draggedItemContent = _layout.splice(dragItem.current, 1)[0];
      _layout.splice(dragOverItem.current, 0, draggedItemContent);
      const updatedLayout = _layout.map((item, index) => ({ ...item, position: index + 1 }));
      setStorefrontLayout(updatedLayout);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
    setHoveredIndex(null);
  };
  
  const handleToggleStorefrontVisibility = (index: number) => {
    const _layout = [...storefrontLayout];
    _layout[index].is_visible = !_layout[index].is_visible;
    setStorefrontLayout(_layout);
  };

  const handleSaveStorefrontLayout = async () => {
    setLoading(true);
    const { error } = await supabase.from('home_layout').upsert(storefrontLayout);
    if (error) alert(`Error saving layout: ${error.message}`);
    else alert('Storefront layout updated successfully! Refresh your home page to see changes.');
    setLoading(false);
  };

  const handleAdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) {
      alert('The image is too large. Maximum size is 300KB.');
      e.target.value = '';
      return;
    }
    setNewAdFile(file);
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdName || !newAdFile) return alert('Name and image are required.');
    
    if (linkType === 'custom' && !customLink.trim()) return alert('Please enter the custom link.');
    if (linkType === 'category' && !newAdCategory) return alert('Please select a category.');

    setUploadingAd(true);

    const fileExt = newAdFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, newAdFile);

    if (uploadError) {
      setUploadingAd(false);
      return alert(`Upload error: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from('banners').getPublicUrl(fileName);
    const imageUrl = publicUrlData.publicUrl;

    let finalUrl = '';
    if (linkType === 'category' && newAdCategory) {
      finalUrl = `/${newAdCategory}`; 
    } else if (linkType === 'custom' && customLink) {
      finalUrl = customLink.startsWith('/') || customLink.startsWith('http') ? customLink : `/${customLink}`;
    }

    const { data: adData, error: adError } = await supabase
      .from('storefront_ads')
      .insert([{ 
        name: newAdName, 
        image_url: imageUrl,
        category_slug: newAdCategory || null,
        link_url: finalUrl || null
      }])
      .select()
      .single();

    if (adError) {
      setUploadingAd(false);
      return alert(`Database error: ${adError.message}`);
    }

    const newLayoutId = `Ad-${adData.id}`;
    const newPos = storefrontLayout.length + 1;
    const newLayoutItem = { id: newLayoutId, position: newPos, is_visible: true };
    await supabase.from('home_layout').insert([newLayoutItem]);

    setStorefrontLayout([...storefrontLayout, newLayoutItem]);
    setStorefrontAds([...storefrontAds, adData]);
    
    setNewAdName(''); setNewAdFile(null); setNewAdCategory(''); setCustomLink(''); setLinkType('none'); setUploadingAd(false);
    const fileInput = document.getElementById('adFileInput') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
    alert('Banner created!');
  };

  const handleCreateGrid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGridName || !newGridCategory) return alert('Name and category are required.');
    setCreatingGrid(true);

    const { data: gridData, error: gridError } = await supabase
      .from('storefront_grids')
      .insert([{ 
        name: newGridName, 
        category_id: newGridCategory,
        max_products: Number(newGridMaxProducts) || 15,
        columns: Number(newGridColumns) || 5
      }])
      .select()
      .single();

    if (gridError) {
      setCreatingGrid(false);
      return alert(`Database error: ${gridError.message}`);
    }

    const newLayoutId = `Grid-${gridData.id}`;
    const newPos = storefrontLayout.length + 1;
    const newLayoutItem = { id: newLayoutId, position: newPos, is_visible: true };
    await supabase.from('home_layout').insert([newLayoutItem]);

    setStorefrontLayout([...storefrontLayout, newLayoutItem]);
    setStorefrontGrids([...storefrontGrids, gridData]);
    
    setNewGridName(''); setNewGridCategory(''); setNewGridMaxProducts(15); setNewGridColumns(5);
    setCreatingGrid(false);
    alert('Product Grid created!');
  };

  const handleDeleteDynamicItem = async (layoutId: string) => {
    if(!window.confirm('Delete this item from the store completely?')) return;
    setLoading(true);
    await supabase.from('home_layout').delete().eq('id', layoutId);
    
    if (layoutId.startsWith('Ad-')) {
      const adId = layoutId.replace('Ad-', '');
      await supabase.from('storefront_ads').delete().eq('id', adId);
      setStorefrontAds(storefrontAds.filter(a => a.id !== adId));
    } else if (layoutId.startsWith('Grid-')) {
      const gridId = layoutId.replace('Grid-', '');
      await supabase.from('storefront_grids').delete().eq('id', gridId);
      setStorefrontGrids(storefrontGrids.filter(g => g.id !== gridId));
    }

    setStorefrontLayout(storefrontLayout.filter(l => l.id !== layoutId));
    setLoading(false);
  };

  // ====== EDICIÓN DE ADS ======
  const openEditAdModal = (layoutId: string) => {
    const adId = layoutId.replace('Ad-', '');
    const ad = storefrontAds.find(a => a.id === adId);
    if (!ad) return alert('Ad data not found.');

    setEditingAdId(adId); setEditAdName(ad.name);
    
    if (ad.category_slug) {
      setEditLinkType('category'); setEditAdCategory(ad.category_slug); setEditCustomLink('');
    } else if (ad.link_url) {
      setEditLinkType('custom'); setEditCustomLink(ad.link_url); setEditAdCategory('');
    } else {
      setEditLinkType('none'); setEditCustomLink(''); setEditAdCategory('');
    }
    setEditAdFile(null);
  };

  const handleEditAdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) { alert('The image is too large. Maximum size is 300KB.'); e.target.value = ''; return; }
    setEditAdFile(file);
  };

  const handleUpdateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdName) return alert('Name is required.');
    if (editLinkType === 'custom' && !editCustomLink.trim()) return alert('Please enter the custom link.');
    if (editLinkType === 'category' && !editAdCategory) return alert('Please select a category.');

    setIsUpdatingAd(true);
    let imageUrl = undefined;

    if (editAdFile) {
      const fileExt = editAdFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, editAdFile);
      if (uploadError) { setIsUpdatingAd(false); return alert(`Upload error: ${uploadError.message}`); }
      const { data: publicUrlData } = supabase.storage.from('banners').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    let finalUrl = '';
    if (editLinkType === 'category' && editAdCategory) { finalUrl = `/${editAdCategory}`; } 
    else if (editLinkType === 'custom' && editCustomLink) { finalUrl = editCustomLink.startsWith('/') || editCustomLink.startsWith('http') ? editCustomLink : `/${editCustomLink}`; }

    const updateData: any = { name: editAdName, category_slug: editLinkType === 'category' ? editAdCategory : null, link_url: editLinkType !== 'none' ? finalUrl : null };
    if (imageUrl) { updateData.image_url = imageUrl; }

    const { error: adError } = await supabase.from('storefront_ads').update(updateData).eq('id', editingAdId);
    if (adError) { setIsUpdatingAd(false); return alert(`Database error: ${adError.message}`); }

    setStorefrontAds(storefrontAds.map(ad => ad.id === editingAdId ? { ...ad, ...updateData } : ad));
    setEditingAdId(null); setIsUpdatingAd(false); alert('Banner updated successfully!');
  };

  // 🚀 EDICIÓN DE GRIDS DINÁMICOS
  const openEditGridModal = (layoutId: string) => {
    const gridId = layoutId.replace('Grid-', '');
    const grid = storefrontGrids.find(g => g.id === gridId);
    if (!grid) return alert('Grid data not found.');

    setEditingGridId(gridId);
    setEditGridName(grid.name);
    setEditGridCategory(grid.category_id);
    setEditGridMaxProducts(grid.max_products);
    setEditGridColumns(grid.columns);
  };

  const handleUpdateGrid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGridName || !editGridCategory) return alert('Name and Category are required.');
    
    setIsUpdatingGrid(true);

    const updateData = {
      name: editGridName,
      category_id: editGridCategory,
      max_products: Number(editGridMaxProducts) || 15,
      columns: Number(editGridColumns) || 5
    };

    const { error: gridError } = await supabase
      .from('storefront_grids')
      .update(updateData)
      .eq('id', editingGridId);

    if (gridError) {
      setIsUpdatingGrid(false);
      return alert(`Database error: ${gridError.message}`);
    }

    setStorefrontGrids(storefrontGrids.map(g => g.id === editingGridId ? { ...g, ...updateData } : g));
    setEditingGridId(null);
    setIsUpdatingGrid(false);
    alert('Product Grid updated successfully!');
  };

  // ==========================================

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) alert(`Error updating order status: ${error.message}`);
    else setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  let filteredProducts = [...products];
  if (searchQuery) filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())));
  if (selectedCategoryFilter !== 'all') filteredProducts = filteredProducts.filter(p => p.product_categories?.some((pc: any) => pc.category_id === selectedCategoryFilter));
  if (selectedTypeFilter === 'simple') filteredProducts = filteredProducts.filter(p => !p.product_variants || p.product_variants.length === 0);
  else if (selectedTypeFilter === 'variable') filteredProducts = filteredProducts.filter(p => p.product_variants && p.product_variants.length > 0);

  filteredProducts.sort((a, b) => {
    const priceA = a.regular_price ?? a.price ?? 0;
    const priceB = b.regular_price ?? b.price ?? 0;
    if (sortOption === 'date-desc') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (sortOption === 'date-asc') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
    if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
    if (sortOption === 'price-desc') return priceB - priceA;
    if (sortOption === 'price-asc') return priceA - priceB;
    return 0;
  });

  const totalProducts = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / itemsPerPage));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (setter: any, value: any) => { setter(value); setCurrentPage(1); };

  const handleCreateCategory = async (e: React.FormEvent) => { e.preventDefault(); const slug = newCategory.slug || generateSlug(newCategory.name); const { data, error } = await supabase.from('categories').insert([{ name: newCategory.name, slug: slug, is_visible: true }]).select(); if (error) return alert(`Error: ${error.message}`); if (data) { setCategories([...categories, data[0]]); setNewCategory({ name: '', slug: '' }); } };
  const handleToggleCategory = async (id: string, currentStatus: boolean) => { const newStatus = !currentStatus; setCategories(categories.map(c => c.id === id ? { ...c, is_visible: newStatus } : c)); await supabase.from('categories').update({ is_visible: newStatus }).eq('id', id); };
  
  const handleCreateDiscount = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    const autoCode = generateRandomCode(); 
    const limit = newDiscount.usageLimit ? parseInt(newDiscount.usageLimit) : null; 
    const targetCategory = newDiscount.target_category || null;

    const { data, error } = await supabase.from('discount_codes').insert([{ 
      code: autoCode, type: newDiscount.type, value: parseFloat(newDiscount.value), usage_limit: limit, times_used: 0, target_category: targetCategory 
    }]).select(); 

    if (error) return alert(`Error: ${error.message}`); 
    if (data) { setDiscounts([data[0], ...discounts]); setNewDiscount({ type: newDiscount.type, value: '', usageLimit: '', target_category: '' }); } 
  };
  
  const handleToggleDiscount = async (id: string, currentStatus: boolean) => { const newStatus = !currentStatus; setDiscounts(discounts.map(d => d.id === id ? { ...d, is_active: newStatus } : d)); await supabase.from('discount_codes').update({ is_active: newStatus }).eq('id', id); };
  const handleDeleteDiscount = async (id: string) => { if (!window.confirm('Delete this code permanently?')) return; await supabase.from('discount_codes').delete().eq('id', id); setDiscounts(discounts.filter(d => d.id !== id)); };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({ email: newUserProfile.email, password: newUserProfile.password });
    if (authError) { alert(`Error creating user: ${authError.message}`); setLoading(false); return; }
    if (authData?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({ id: authData.user.id, first_name: newUserProfile.firstName, last_name: newUserProfile.lastName, role: newUserProfile.role, email: newUserProfile.email });
      if (profileError) alert(`Error saving profile: ${profileError.message}`);
      else { alert('User created successfully!'); setUsers([{ id: authData.user.id, first_name: newUserProfile.firstName, last_name: newUserProfile.lastName, role: newUserProfile.role, created_at: new Date().toISOString() }, ...users]); setNewUserProfile({ firstName: '', lastName: '', email: '', password: '', role: 'customer' }); }
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) alert(`Error updating role: ${error.message}`);
    else setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };
  const handleDeleteUser = async (userId: string) => { if (!window.confirm('Are you sure you want to delete this user profile?')) return; await supabase.from('profiles').delete().eq('id', userId); setUsers(users.filter(u => u.id !== userId)); };

  const openProductEditor = async (product: any = null) => {
    setRelatedSearchQuery(''); 
    if (product) {
      const { data: variants } = await supabase.from('product_variants').select('*').eq('product_id', product.id);
      const formattedVariants = (variants || []).map(v => ({ ...v, unit: v.unit || '', attributes: typeof v.attributes === 'object' ? JSON.stringify(v.attributes) : v.attributes }));
      setProductVariants(formattedVariants);
      let activePrice = product.regular_price ?? product.price;
      if ((activePrice === null || activePrice === undefined) && variants && variants.length > 0) activePrice = variants[0].price;

      // 🚀 INICIALIZAMOS LOS CAMPOS DE SHIPPING EN EL ESTADO
      setCurrentProduct({ 
        ...product, 
        name: product.name || '', 
        sku: product.sku || '', 
        unit: product.unit || '', 
        description: product.description || '', 
        regular_price: activePrice !== null && activePrice !== undefined ? activePrice : 0,
        weight: product.weight || '',
        measurement_system: product.measurement_system || 'imperial',
        dimensions_length: product.dimensions_length || '',
        dimensions_width: product.dimensions_width || '',
        dimensions_height: product.dimensions_height || ''
      });
      setProductCategories(product.product_categories?.map((pc: any) => pc.category_id) || []);
      setRelatedBundleItems(product.related_products || []);
    } else {
      setCurrentProduct({ 
        name: '', slug: '', sku: '', unit: '', regular_price: 0, description: '',
        weight: '', measurement_system: 'imperial', dimensions_length: '', dimensions_width: '', dimensions_height: ''
      });
      setProductCategories([]); setProductVariants([]); setRelatedBundleItems([]);
    }
    setIsEditingProduct(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);

    // 🚀 AGREGAMOS LOS CAMPOS DE SHIPPING A LA BD
    const productData = { 
      name: currentProduct.name, 
      slug: currentProduct.slug || generateSlug(currentProduct.name), 
      sku: currentProduct.sku, 
      unit: currentProduct.unit || null, 
      regular_price: parseFloat(currentProduct.regular_price) || 0, 
      description: currentProduct.description, 
      related_products: relatedBundleItems,
      weight: parseFloat(currentProduct.weight) || null,
      measurement_system: currentProduct.measurement_system,
      dimensions_length: parseFloat(currentProduct.dimensions_length) || null,
      dimensions_width: parseFloat(currentProduct.dimensions_width) || null,
      dimensions_height: parseFloat(currentProduct.dimensions_height) || null
    };

    let savedProductId = currentProduct.id;
    if (currentProduct.id) {
      const { error } = await supabase.from('products').update(productData).eq('id', currentProduct.id);
      if (error) { setLoading(false); return alert(`Error actualizando: ${error.message}`); }
    } else {
      const { data, error } = await supabase.from('products').insert([productData]).select();
      if (error) { setLoading(false); return alert(`Error creando: ${error.message}`); }
      savedProductId = data[0].id;
    }

    if (savedProductId) {
      await supabase.from('product_categories').delete().eq('product_id', savedProductId);
      if (productCategories.length > 0) {
        const catInserts = productCategories.map(catId => ({ product_id: savedProductId, category_id: catId }));
        await supabase.from('product_categories').insert(catInserts);
      }

      const currentVariantIds = productVariants.map(v => v.id).filter(id => !id.startsWith('temp-'));
      const { data: existingVariants } = await supabase.from('product_variants').select('id').eq('product_id', savedProductId);
      if (existingVariants) {
        const idsToDelete = existingVariants.map(v => v.id).filter(id => !currentVariantIds.includes(id));
        if (idsToDelete.length > 0) await supabase.from('product_variants').delete().in('id', idsToDelete);
      }
    }

    for (const variant of productVariants) {
      let parsedAttributes = {};
      try { parsedAttributes = typeof variant.attributes === 'string' ? JSON.parse(variant.attributes) : variant.attributes; } catch (err) { parsedAttributes = { "Option": "Default" }; }
      const variantData = { product_id: savedProductId, sku: variant.sku || '', price: parseFloat(variant.price) || 0, stock_quantity: parseInt(variant.stock_quantity) || 0, unit: variant.unit || null, attributes: parsedAttributes };
      
      if (variant.id && !variant.id.startsWith('temp-')) { await supabase.from('product_variants').update(variantData).eq('id', variant.id); } 
      else { await supabase.from('product_variants').insert([variantData]); }
    }

    if (relatedBundleItems.length > 0) {
      const exactCluster = [ { productId: savedProductId, variantId: null, price: productData.regular_price || 0, name: productData.name }, ...relatedBundleItems ];
      for (const member of exactCluster) {
        const bundleForMember = exactCluster.filter(item => item.productId !== member.productId);
        await supabase.from('products').update({ related_products: bundleForMember }).eq('id', member.productId);
      }
      const oldRelated = currentProduct?.related_products || [];
      const orphanedItems = oldRelated.filter((oldItem: any) => !relatedBundleItems.some(newItem => newItem.productId === oldItem.productId));
      for (const orphan of orphanedItems) {
        const { data: orphanDb } = await supabase.from('products').select('related_products').eq('id', orphan.productId).single();
        if (orphanDb && orphanDb.related_products) {
          const cleanedList = orphanDb.related_products.filter((rel: any) => rel.productId !== savedProductId);
          await supabase.from('products').update({ related_products: cleanedList }).eq('id', orphan.productId);
        }
      }
    }

    alert('Product saved successfully!');
    setIsEditingProduct(false);
    loadData();
  };

  const executeDeleteProduct = async () => {
    if (!productToDelete) return;
    await supabase.from('product_categories').delete().eq('product_id', productToDelete.id);
    await supabase.from('product_variants').delete().eq('product_id', productToDelete.id);
    const { error } = await supabase.from('products').delete().eq('id', productToDelete.id);
    if (error) alert(`Error deleting product: ${error.message}`);
    else setProducts(products.filter(p => p.id !== productToDelete.id));
    setProductToDelete(null);
  };

  const toggleProductCategory = (categoryId: string) => {
    if (productCategories.includes(categoryId)) setProductCategories(productCategories.filter(id => id !== categoryId));
    else setProductCategories([...productCategories, categoryId]);
  };

  const addVariantRow = () => { setProductVariants(prev => [ ...prev, { id: `temp-${Date.now()}-${Math.random()}`, sku: '', price: '', stock_quantity: '10', unit: '', attributes: '{"Color": "Black"}' } ]); };
  const handleVariantChange = (index: number, field: string, value: string) => { setProductVariants(prev => { const updated = [...prev]; updated[index] = { ...updated[index], [field]: value }; return updated; }); };
  const removeVariantRow = (indexToRemove: number) => { setProductVariants(prev => prev.filter((_, index) => index !== indexToRemove)); };

  const searchedRelatedProducts = products.filter(p => {
    if (p.id === currentProduct?.id) return false;
    if (!p.name.toLowerCase().includes(relatedSearchQuery.toLowerCase())) return false;
    const isVariable = p.product_variants && p.product_variants.length > 0;
    if (!isVariable) { return !relatedBundleItems.some(item => item.productId === p.id); } 
    else { const allVariantsAdded = p.product_variants.every((v: any) => relatedBundleItems.some(item => item.variantId === v.id)); return !allVariantsAdded; }
  }).slice(0, 5); 

  const addRelatedProduct = (productId: string, variantId: string | null, price: number, name: string) => { setRelatedBundleItems(prev => [...prev, { productId, variantId, price, name }]); setRelatedSearchQuery(''); };
  const removeRelatedProduct = (index: number) => { setRelatedBundleItems(prev => prev.filter((_, i) => i !== index)); };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-brand-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Verifying Access...</p>
      </div>
    );
  }

  const availableTabs = currentUserRole === 'admin' 
    ? ['orders', 'products', 'categories', 'discounts', 'users', 'storefront']
    : ['products']; 

  return (
    <div className="bg-gray-50 min-h-screen pb-16 relative">
      
      {/* 🚀 POPUP PARA EDITAR GRID DINÁMICO */}
      {editingGridId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl max-w-2xl w-full border border-gray-100 scale-100 animate-slide-up">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide">Edit Product Grid Options</h3>
              <button onClick={() => setEditingGridId(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateGrid} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Grid Title</label>
                  <input type="text" required value={editGridName} onChange={e => setEditGridName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[40px]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category</label>
                  <select value={editGridCategory} onChange={e => setEditGridCategory(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white h-[40px]">
                    <option value="">Select Category...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Max Products</label>
                  <input type="number" min="1" max="50" required value={editGridMaxProducts} onChange={e => setEditGridMaxProducts(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[40px]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Columns</label>
                  <select value={editGridColumns} onChange={e => setEditGridColumns(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white h-[40px]">
                    <option value="4">4 Columns</option><option value="5">5 Columns</option><option value="6">6 Columns</option><option value="7">7 Columns</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditingGridId(null)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isUpdatingGrid} className="flex-1 px-4 py-3 bg-brand-primary text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors disabled:opacity-50">{isUpdatingGrid ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP PARA EDITAR BANNER (PUBLICIDAD) */}
      {editingAdId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl max-w-2xl w-full border border-gray-100 scale-100 animate-slide-up">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide">Edit Banner Options</h3>
              <button onClick={() => setEditingAdId(null)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateAd} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Ad Banner Name</label>
                <input type="text" required value={editAdName} onChange={e => setEditAdName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[40px]" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Link Destination</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={editLinkType} onChange={e => setEditLinkType(e.target.value as any)} className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white h-[40px]">
                    <option value="none">No Link</option><option value="category">Shop Category</option><option value="custom">Custom Page</option>
                  </select>
                  
                  {editLinkType === 'category' && (
                    <select value={editAdCategory} onChange={e => setEditAdCategory(e.target.value)} required className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white h-[40px]">
                      <option value="">Select Category...</option>
                      {categories.map(cat => <option key={cat.id} value={cat.slug || cat.id}>{cat.name}</option>)}
                    </select>
                  )}

                  {editLinkType === 'custom' && (
                    <input type="text" placeholder="e.g. /glove" value={editCustomLink} onChange={e => setEditCustomLink(e.target.value)} required className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[40px]" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Replace Image (Optional)</label>
                <input type="file" accept="image/*" onChange={handleEditAdFileChange} className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer h-[40px]" />
                <p className="text-[10px] text-gray-500 mt-1 italic">Leave blank to keep the current image.</p>
              </div>

              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditingAdId(null)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isUpdatingAd} className="flex-1 px-4 py-3 bg-brand-primary text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors disabled:opacity-50">{isUpdatingAd ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full border border-gray-100 scale-100 animate-slide-up">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <span className="text-xl">⚠️</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center uppercase tracking-wide mb-2">Delete Product</h3>
            <p className="text-sm text-gray-600 text-center mb-8">Are you sure you want to delete <strong className="text-gray-900">{productToDelete.name}</strong>? This action cannot be undone and will remove all its variants.</p>
            <div className="flex gap-4">
              <button onClick={() => setProductToDelete(null)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={executeDeleteProduct} className="flex-1 px-4 py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border-b border-gray-800 py-6 mb-8 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-widest flex items-center gap-2"><span className="text-brand-primary">⚡</span> Admin Panel</h1>
            <p className="text-xs text-gray-400 mt-1">Store Management System - <span className="text-green-400 uppercase tracking-widest font-bold">{currentUserRole}</span></p>
          </div>
          <Link href="/" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors border border-gray-700 hover:border-gray-500 px-4 py-2 rounded">View Store</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
        
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col space-y-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            {availableTabs.map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab as any); setIsEditingProduct(false); }} className={`text-left px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-colors ${ activeTab === tab ? 'bg-brand-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100' }`}>{tab}</button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[500px]">
          {loading ? (
            <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin"></div></div>
          ) : (
            <>
              {activeTab === 'storefront' && currentUserRole === 'admin' && (
                <div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">Storefront Builder</h2>
                      <p className="text-xs text-gray-500 mt-1">Add banners and product grids, then drag them to reorder the homepage.</p>
                    </div>
                    <button onClick={handleSaveStorefrontLayout} className="bg-brand-primary text-white px-6 py-2.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-md">
                      Save Layout
                    </button>
                  </div>

                  {/* FORMULARIO PARA BANNERS */}
                  <form onSubmit={handleCreateAd} className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6 flex flex-col gap-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2">🖼️ Add New Banner</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Banner Name</label>
                        <input type="text" required placeholder="e.g. Promo Navidad" value={newAdName} onChange={e => setNewAdName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[38px]" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Link Destination</label>
                        <div className="flex gap-2">
                          <select value={linkType} onChange={e => setLinkType(e.target.value as any)} className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white h-[38px]">
                            <option value="none">No Link</option><option value="category">Shop Category</option><option value="custom">Custom Page</option>
                          </select>
                          {linkType === 'category' && (
                            <select value={newAdCategory} onChange={e => setNewAdCategory(e.target.value)} className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white h-[38px]" required>
                              <option value="">Select Category...</option>
                              {categories.map(cat => <option key={cat.id} value={cat.slug || cat.id}>{cat.name}</option>)}
                            </select>
                          )}
                          {linkType === 'custom' && (
                            <input type="text" placeholder="e.g. /glove" value={customLink} onChange={e => setCustomLink(e.target.value)} className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[38px]" required />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Image (Max width 1200px - Max 300kb)</label>
                        <input type="file" id="adFileInput" accept="image/*" required onChange={handleAdFileChange} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm bg-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer h-[38px]" />
                      </div>
                      <button type="submit" disabled={uploadingAd} className="bg-gray-900 text-white font-bold uppercase tracking-widest text-xs px-6 py-2.5 rounded hover:bg-black transition-colors h-[38px] disabled:opacity-50 min-w-[150px]">
                        {uploadingAd ? 'Uploading...' : '+ Add Banner'}
                      </button>
                    </div>
                  </form>

                  {/* FORMULARIO PARA PRODUCT GRIDS */}
                  <form onSubmit={handleCreateGrid} className="bg-blue-50/50 p-5 rounded-lg border border-blue-100 mb-8 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2 mb-3">📦 Add Product Grid</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Grid Title</label>
                          <input type="text" required placeholder="e.g. New Arrivals" value={newGridName} onChange={e => setNewGridName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[38px] bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category</label>
                          <select value={newGridCategory} onChange={e => setNewGridCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white h-[38px]" required>
                            <option value="">Select Category...</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Max Products</label>
                          <input type="number" min="1" max="50" required value={newGridMaxProducts} onChange={e => setNewGridMaxProducts(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[38px] bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Columns</label>
                          <select value={newGridColumns} onChange={e => setNewGridColumns(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white h-[38px]">
                            <option value="4">4 Columns</option><option value="5">5 Columns</option><option value="6">6 Columns</option><option value="7">7 Columns</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={creatingGrid} className="bg-brand-primary text-white font-bold uppercase tracking-widest text-xs px-6 py-2.5 rounded hover:bg-red-700 transition-colors h-[38px] disabled:opacity-50 min-w-[150px]">
                      {creatingGrid ? 'Creating...' : '+ Add Grid'}
                    </button>
                  </form>

                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-3">Drag to Reorder</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {storefrontLayout.map((component, index) => {
                      const isDynamicAd = component.id.startsWith('Ad-');
                      const isDynamicGrid = component.id.startsWith('Grid-');
                      const isDynamic = isDynamicAd || isDynamicGrid;
                      
                      let displayName = component.id;
                      let badgeText = '';
                      let badgeColor = '';

                      if (isDynamicAd) {
                        const adId = component.id.replace('Ad-', '');
                        const adData = storefrontAds.find(ad => ad.id === adId);
                        displayName = adData ? adData.name : 'Unknown Banner';
                        badgeText = 'CUSTOM AD';
                        badgeColor = 'bg-blue-100 text-blue-700';
                      } else if (isDynamicGrid) {
                        const gridId = component.id.replace('Grid-', '');
                        const gridData = storefrontGrids.find(g => g.id === gridId);
                        displayName = gridData ? gridData.name : 'Unknown Grid';
                        badgeText = 'PRODUCT GRID';
                        badgeColor = 'bg-purple-100 text-purple-700';
                      }

                      return (
                        <div 
                          key={component.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragEnter={(e) => handleDragEnter(e, index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          className={`
                            flex items-center justify-between p-4 mb-3 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-300 ease-in-out
                            ${!component.is_visible ? 'opacity-50 grayscale' : 'hover:border-brand-primary'}
                            ${draggingIndex === index ? 'opacity-30 scale-95 border border-brand-primary' : 'border border-gray-200 bg-white shadow-sm'}
                            ${hoveredIndex === index ? 'translate-x-8 border-l-4 border-l-brand-primary shadow-md bg-blue-50/50' : ''}
                          `}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400 cursor-grab text-lg">⠿</span>
                            <div>
                              <p className="font-black text-sm text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                {isDynamic ? <span className={`text-[10px] px-1.5 py-0.5 rounded ${badgeColor}`}>{badgeText}</span> : null}
                                {displayName}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono mt-1">Position: {index + 1}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={component.is_visible} 
                                onChange={() => handleToggleStorefrontVisibility(index)} 
                              />
                              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>

                            {isDynamic && (
                              <div className="flex items-center">
                                {/* 🚀 BOTONES DE EDICIÓN Y BORRADO */}
                                {isDynamicAd && (
                                  <button onClick={() => openEditAdModal(component.id)} className="text-blue-500 hover:text-blue-700 font-bold ml-2 text-lg px-2" title="Edit Banner">✏️</button>
                                )}
                                {isDynamicGrid && (
                                  <button onClick={() => openEditGridModal(component.id)} className="text-blue-500 hover:text-blue-700 font-bold ml-2 text-lg px-2" title="Edit Grid">✏️</button>
                                )}
                                <button onClick={() => handleDeleteDynamicItem(component.id)} className="text-red-500 hover:text-red-700 font-bold text-lg px-2" title="Delete Item">🗑️</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* PESTAÑAS ANTERIORES (Órdenes, Productos, Descuentos, Usuarios, Categorías) */}
              {activeTab === 'discounts' && currentUserRole === 'admin' && (
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wide border-b border-gray-100 pb-4">Discount Codes</h2>
                  
                  <form onSubmit={handleCreateDiscount} className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-[15%]">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Type</label>
                      <select value={newDiscount.type} onChange={e => setNewDiscount({...newDiscount, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-brand-primary h-[38px]">
                        <option value="percentage">% OFF</option>
                        <option value="fixed">$ OFF</option>
                      </select>
                    </div>
                    
                    <div className="w-full md:w-[15%]">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Value</label>
                      <input type="number" required min="1" placeholder="e.g. 20" value={newDiscount.value} onChange={e => setNewDiscount({...newDiscount, value: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[38px]" />
                    </div>
                    
                    <div className="w-full md:w-[15%]">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Limit</label>
                      <input type="number" min="1" placeholder="e.g. 50 (Blank = ∞)" value={newDiscount.usageLimit} onChange={e => setNewDiscount({...newDiscount, usageLimit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary h-[38px]" />
                    </div>
                    
                    <div className="w-full md:w-1/4">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Applies To</label>
                      <select 
                        value={newDiscount.target_category} 
                        onChange={e => setNewDiscount({...newDiscount, target_category: e.target.value})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-brand-primary h-[38px]"
                      >
                        <option value="">Entire Store (All Products)</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name} Only</option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className="w-full md:w-auto bg-brand-primary text-white font-bold uppercase tracking-widest text-xs px-6 py-2.5 rounded hover:bg-red-700 transition-colors h-[38px] flex-1">
                      Generate Code
                    </button>
                  </form>
                  
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3">Code Hash</th>
                        <th className="py-3">Discount</th>
                        <th className="py-3">Applies To</th>
                        <th className="py-3 text-center">Usage</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {discounts.map(discount => {
                        const isLimitReached = discount.usage_limit !== null && discount.times_used >= discount.usage_limit;
                        const isInactive = !discount.is_active || isLimitReached;
                        
                        let appliesToText = 'Entire Store';
                        if (discount.target_category) {
                          const targetCat = categories.find(c => c.id === discount.target_category);
                          appliesToText = targetCat ? `${targetCat.name} Only` : 'Deleted Category';
                        }

                        return (
                          <tr key={discount.id} className={`hover:bg-gray-50 transition-colors ${isInactive ? 'bg-gray-50/50' : ''}`}>
                            <td className={`py-4 text-sm font-black tracking-widest ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>{discount.code}</td>
                            
                            <td className={`py-4 text-sm font-bold ${isInactive ? 'text-gray-400' : 'text-brand-primary'}`}>
                              {discount.type === 'percentage' ? `${discount.value}% OFF` : `$${discount.value} OFF`}
                            </td>
                            
                            <td className={`py-4 text-xs font-bold uppercase tracking-wider ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
                              {discount.target_category ? (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{appliesToText}</span>
                              ) : (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{appliesToText}</span>
                              )}
                            </td>

                            <td className={`py-4 text-sm font-medium text-center ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
                              {discount.times_used} / {discount.usage_limit !== null ? discount.usage_limit : '∞'}
                            </td>
                            
                            <td className="py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                {!isLimitReached && (
                                  <button onClick={() => handleToggleDiscount(discount.id, discount.is_active)} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors ${discount.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700'}`}>
                                    {discount.is_active ? 'Deactivate' : 'Activate'}
                                  </button>
                                )}
                                <button onClick={() => handleDeleteDiscount(discount.id)} className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 🚀 GESTIÓN DE ÓRDENES EN EL ADMIN */}
              {activeTab === 'orders' && currentUserRole === 'admin' && (
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wide border-b border-gray-100 pb-4">Customer Orders Management</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-5xl block mb-4">📦</span>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map(order => {
                        const customerName = order.customer_name || 'Guest Customer';
                        const customerEmail = order.customer_email || 'No email provided';

                        return (
                          <div key={order.id} className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-3 mb-4 gap-2">
                              <div>
                                <span className="text-xs font-black bg-gray-900 text-white px-2 py-1 rounded uppercase tracking-widest">
                                  Order #{order.id.split('-')[0].toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-500 ml-3">{new Date(order.created_at).toLocaleString()}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border">
                                  TxID: <strong className="text-gray-900">{order.stripe_transaction_id || 'N/A'}</strong>
                                </span>
                                <select 
                                  value={order.status || 'Pending'} 
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} 
                                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded outline-none ${order.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs">
                              <div>
                                <p className="text-gray-400 uppercase font-bold">Customer Name:</p>
                                <p className="text-gray-900 font-bold">{customerName}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 uppercase font-bold">Email Address:</p>
                                <p className="text-gray-900 font-bold">{customerEmail}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 uppercase font-bold">Total Paid:</p>
                                <p className="text-brand-primary font-black text-sm">${order.total_amount?.toFixed(2)}</p>
                              </div>
                            </div>

                            {/* Detalle de Productos Comprados */}
                            <div className="bg-white rounded border border-gray-200 p-3">
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  {!isEditingProduct ? (
                    <>
                      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">All Products</h2>
                        <button onClick={() => openProductEditor(null)} className="bg-brand-primary text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">+ Add Product</button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex-1"><input type="text" placeholder="Search by name or SKU..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-brand-primary" /></div>
                        <select value={selectedCategoryFilter} onChange={(e) => handleFilterChange(setSelectedCategoryFilter, e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded outline-none bg-white min-w-[150px]">
                          <option value="all">All Categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={selectedTypeFilter} onChange={(e) => handleFilterChange(setSelectedTypeFilter, e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded outline-none bg-white min-w-[130px]">
                          <option value="all">All Types</option><option value="simple">Simple</option><option value="variable">Variable</option>
                        </select>
                        <select value={sortOption} onChange={(e) => handleFilterChange(setSortOption, e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded outline-none bg-white min-w-[150px]">
                          <option value="date-desc">Newest First</option><option value="date-asc">Oldest First</option><option value="name-asc">Name (A-Z)</option><option value="name-desc">Name (Z-A)</option><option value="price-desc">Price (High to Low)</option><option value="price-asc">Price (Low to High)</option>
                        </select>
                        <div className="flex bg-white border border-gray-300 rounded overflow-hidden">
                          <button onClick={() => handleFilterChange(setViewMode, 'table')} className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${viewMode === 'table' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>Table</button>
                          <button onClick={() => handleFilterChange(setViewMode, 'grid')} className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-l border-gray-300 ${viewMode === 'grid' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>Grid</button>
                        </div>
                      </div>

                      {paginatedProducts.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-sm">No products match your criteria.</div>
                      ) : viewMode === 'table' ? (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              <th className="py-3">Name</th><th className="py-3">SKU</th><th className="py-3">Type</th><th className="py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedProducts.map(product => {
                              const isVariable = product.product_variants && product.product_variants.length > 0;
                              return (
                                <tr key={product.id} className="hover:bg-gray-50">
                                  <td className="py-4"><p className="text-sm font-bold text-gray-900">{product.name}</p><p className="text-[10px] text-gray-400 uppercase">{product.slug}</p></td>
                                  <td className="py-4 text-sm text-gray-600">{product.sku || 'N/A'}</td>
                                  <td className="py-4">{isVariable ? <span className="bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Variable</span> : <span className="bg-gray-100 text-gray-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Simple</span>}</td>
                                  <td className="py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => openProductEditor(product)} className="text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded uppercase tracking-wider transition-colors">Edit</button>
                                      <button onClick={() => setProductToDelete(product)} className="text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded uppercase tracking-wider transition-colors">X</button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {paginatedProducts.map(product => {
                            const isVariable = product.product_variants && product.product_variants.length > 0;
                            return (
                              <div key={product.id} className="border border-gray-200 rounded p-4 bg-gray-50 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-gray-200 rounded mb-3 flex items-center justify-center text-xl">📦</div>
                                <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-1">{product.name}</p>
                                <p className="text-xs text-gray-500 mb-4">{product.sku || 'No SKU'}</p>
                                <div className="mb-4">{isVariable ? <span className="bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Variable</span> : <span className="bg-gray-100 text-gray-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Simple</span>}</div>
                                <div className="flex w-full gap-2 mt-auto">
                                  <button onClick={() => openProductEditor(product)} className="flex-1 text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white py-2 rounded uppercase tracking-wider transition-colors">Edit</button>
                                  <button onClick={() => setProductToDelete(product)} className="flex-1 text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white py-2 rounded uppercase tracking-wider transition-colors">Delete</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {totalProducts > 0 && (
                        <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-4">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts}</div>
                          <div className="flex items-center gap-4">
                            <select value={itemsPerPage} onChange={(e) => handleFilterChange(setItemsPerPage, Number(e.target.value))} className="px-2 py-1 text-xs border border-gray-300 rounded outline-none bg-white"><option value={10}>10 / page</option><option value={20}>20 / page</option><option value={50}>50 / page</option></select>
                            <div className="flex gap-1 items-center"><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold disabled:opacity-50">Prev</button><span className="px-3 py-1 text-xs font-bold">{currentPage} / {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold disabled:opacity-50">Next</button></div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* EDITOR DE PRODUCTOS */
                    <form onSubmit={handleSaveProduct}>
                      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-wide">{currentProduct.id ? 'Edit Product' : 'New Product'}</h2>
                        <div className="space-x-2">
                          <button type="button" onClick={() => setIsEditingProduct(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-gray-300 transition-colors">Cancel</button>
                          <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">Save Product</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Product Name</label>
                              <input type="text" required value={currentProduct.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-brand-primary outline-none" />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Price ($)</label>
                                <input type="number" step="0.01" required value={currentProduct.regular_price ?? ''} onChange={e => setCurrentProduct({...currentProduct, regular_price: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Main SKU</label>
                                <input type="text" value={currentProduct.sku || ''} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unit</label>
                                <input type="text" placeholder="e.g. 500, 12 oz" value={currentProduct.unit || ''} onChange={e => setCurrentProduct({...currentProduct, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary" />
                              </div>
                            </div>

                            {/* 🚀 NUEVA SECCIÓN DE SHIPPING (UPS) */}
                            <div className="pt-4 pb-2 border-t border-gray-100 mt-4">
                              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">Shipping Details (UPS)</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-blue-50/30 p-4 rounded border border-blue-100">
                                
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Measurement System</label>
                                  <select 
                                    value={currentProduct.measurement_system || 'imperial'} 
                                    onChange={e => setCurrentProduct({...currentProduct, measurement_system: e.target.value})} 
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white"
                                  >
                                    <option value="imperial">Imperial (lb, in)</option>
                                    <option value="metric">Metric (kg, cm)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Weight ({currentProduct.measurement_system === 'metric' ? 'kg' : 'lb'})
                                  </label>
                                  <input 
                                    type="number" step="0.01" placeholder="e.g. 2.5" 
                                    value={currentProduct.weight || ''} 
                                    onChange={e => setCurrentProduct({...currentProduct, weight: e.target.value})} 
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white" 
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Dimensions (L x W x H in {currentProduct.measurement_system === 'metric' ? 'cm' : 'inches'})
                                  </label>
                                  <div className="flex gap-2">
                                    <input type="number" step="0.01" placeholder="Length" value={currentProduct.dimensions_length || ''} onChange={e => setCurrentProduct({...currentProduct, dimensions_length: e.target.value})} className="w-1/3 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white" />
                                    <input type="number" step="0.01" placeholder="Width" value={currentProduct.dimensions_width || ''} onChange={e => setCurrentProduct({...currentProduct, dimensions_width: e.target.value})} className="w-1/3 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white" />
                                    <input type="number" step="0.01" placeholder="Height" value={currentProduct.dimensions_height || ''} onChange={e => setCurrentProduct({...currentProduct, dimensions_height: e.target.value})} className="w-1/3 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-brand-primary bg-white" />
                                  </div>
                                </div>

                              </div>
                            </div>
                            
                            <div className="pb-10">
                              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Description</label>
                              <div className="bg-white h-[200px] mb-8">
                                <ReactQuill theme="snow" value={currentProduct.description || ''} onChange={(content) => setCurrentProduct({...currentProduct, description: content})} modules={quillModules} className="h-full" />
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-gray-200">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-1">Frequently Bought Together</h3>
                            <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-widest">Select products and specific variants to show as bundles.</p>
                            
                            <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
                              <div className="relative mb-4">
                                <input 
                                  type="text" 
                                  placeholder="Search a product to add..." 
                                  value={relatedSearchQuery}
                                  onChange={(e) => setRelatedSearchQuery(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-brand-primary"
                                />
                                {relatedSearchQuery.length > 1 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-64 overflow-y-auto custom-scrollbar">
                                    {searchedRelatedProducts.length > 0 ? (
                                      searchedRelatedProducts.map(sp => {
                                        const isVariable = sp.product_variants && sp.product_variants.length > 0;
                                        return (
                                          <div key={sp.id} className="px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="font-bold text-gray-900 text-sm truncate pr-2">{sp.name}</span>
                                              {!isVariable && (
                                                <button type="button" onClick={() => addRelatedProduct(sp.id, null, sp.regular_price || 0, sp.name)} className="text-[10px] bg-brand-primary text-white px-2 py-1 rounded font-bold uppercase tracking-wider flex-shrink-0">Add Simple</button>
                                              )}
                                            </div>
                                            {isVariable && (
                                              <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-brand-primary/20">
                                                {sp.product_variants.map((v: any) => {
                                                  if (relatedBundleItems.some(item => item.variantId === v.id)) return null;
                                                  const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
                                                  const varName = Object.values(attrs).join(' - ');
                                                  return (
                                                    <div key={v.id} className="flex justify-between items-center bg-white border border-gray-200 p-1.5 rounded text-xs shadow-sm">
                                                      <span className="text-gray-600 truncate pr-2">{varName} <strong className="text-gray-900">${v.price}</strong></span>
                                                      <button type="button" onClick={() => addRelatedProduct(sp.id, v.id, v.price || 0, `${sp.name} (${varName})`)} className="text-[9px] bg-gray-200 text-gray-800 hover:bg-brand-primary hover:text-white px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors flex-shrink-0">Add Variant</button>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })
                                    ) : (
                                      <div className="px-3 py-2 text-xs text-gray-500 italic">No products found.</div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {relatedBundleItems.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-300 text-xs text-gray-400 font-bold uppercase tracking-widest">No related products yet</div>
                              ) : (
                                <ul className="space-y-2">
                                  {relatedBundleItems.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-blue-50 text-blue-900 border border-blue-100 px-3 py-2 rounded text-sm">
                                      <span><strong className="font-bold block text-[11px] uppercase tracking-wider text-blue-500 mb-0.5">Bundle Item {idx + 1}</strong>{item.name} <strong className="text-brand-primary ml-1">${item.price}</strong></span>
                                      <button type="button" onClick={() => removeRelatedProduct(idx)} className="text-red-500 font-black hover:text-red-700 px-2 text-lg">×</button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-gray-200 mt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Variants</h3>
                              <button type="button" onClick={addVariantRow} className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded font-bold uppercase tracking-wider transition-colors">+ Add Variant</button>
                            </div>
                            {productVariants.length === 0 ? (
                              <p className="text-xs text-gray-500 italic">No variants (Single Product).</p>
                            ) : (
                              <div className="space-y-3">
                                {productVariants.map((variant, index) => (
                                  <div key={variant.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                                    <input type="text" placeholder="SKU" value={variant.sku || ''} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)} className="w-[18%] px-2 py-1 text-xs border rounded" />
                                    <input type="number" placeholder="Price" value={variant.price ?? ''} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} className="w-[15%] px-2 py-1 text-xs border rounded" />
                                    <input type="number" placeholder="Stock" value={variant.stock_quantity ?? ''} onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)} className="w-[12%] px-2 py-1 text-xs border rounded" />
                                    <input type="text" placeholder="Unit" value={variant.unit || ''} onChange={(e) => handleVariantChange(index, 'unit', e.target.value)} className="w-[15%] px-2 py-1 text-xs border rounded" />
                                    <input type="text" placeholder='{"Color":"Red"}' value={typeof variant.attributes === 'string' ? variant.attributes : JSON.stringify(variant.attributes)} onChange={(e) => handleVariantChange(index, 'attributes', e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded font-mono" />
                                    <button type="button" onClick={() => removeVariantRow(index)} className="text-red-500 font-bold px-2">X</button>
                                  </div>
                                ))}
                                <p className="text-[9px] text-gray-400 mt-1">Attributes must be valid JSON format. Example: <code>&#123;"Color": "Red", "Size": "M"&#125;</code></p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-fit sticky top-6">
                          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">Categories</h3>
                          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {categories.map(cat => (
                              <label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={productCategories.includes(cat.id)} onChange={() => toggleProductCategory(cat.id)} className="rounded text-brand-primary focus:ring-brand-primary" />
                                <span className="text-sm text-gray-700">{cat.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'categories' && currentUserRole === 'admin' && (
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wide border-b border-gray-100 pb-4">Manage Categories</h2>
                  <form onSubmit={handleCreateCategory} className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category Name</label>
                      <input type="text" required placeholder="e.g. T-Shirts" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Slug (Optional)</label>
                      <input type="text" placeholder="t-shirts" value={newCategory.slug} onChange={e => setNewCategory({...newCategory, slug: e.target.value.toLowerCase()})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm" />
                    </div>
                    <button type="submit" className="bg-brand-primary text-white font-bold uppercase tracking-widest text-xs px-6 py-2.5 rounded hover:bg-red-700 transition-colors h-[38px]">
                      Add Category
                    </button>
                  </form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(category => (
                      <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-primary transition-colors">
                        <div>
                          <p className="font-bold text-sm text-gray-900">{category.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{category.slug}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={category.is_visible ?? true} onChange={() => handleToggleCategory(category.id, category.is_visible ?? true)} />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'users' && currentUserRole === 'admin' && (
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-6 uppercase tracking-wide border-b border-gray-100 pb-4">Registered Users</h2>
                  
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">Create New User</h3>
                    <form onSubmit={handleCreateUser} className="flex flex-wrap gap-4 items-end">
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">First Name</label>
                        <input type="text" required value={newUserProfile.firstName} onChange={e => setNewUserProfile({...newUserProfile, firstName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-brand-primary outline-none" />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Last Name</label>
                        <input type="text" required value={newUserProfile.lastName} onChange={e => setNewUserProfile({...newUserProfile, lastName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-brand-primary outline-none" />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email</label>
                        <input type="email" required value={newUserProfile.email} onChange={e => setNewUserProfile({...newUserProfile, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-brand-primary outline-none" />
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                        <input type="password" required minLength={6} value={newUserProfile.password} onChange={e => setNewUserProfile({...newUserProfile, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-brand-primary outline-none" />
                      </div>
                      <div className="w-[120px]">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Role</label>
                        <select value={newUserProfile.role} onChange={e => setNewUserProfile({...newUserProfile, role: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white font-bold text-gray-700 outline-none">
                          <option value="customer">Customer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <button type="submit" className="bg-brand-primary text-white font-bold uppercase tracking-widest text-xs px-6 py-2.5 rounded hover:bg-red-700 transition-colors h-[38px] w-full md:w-auto">
                        Create User
                      </button>
                    </form>
                    <p className="text-[10px] text-gray-500 mt-3 italic">
                      * Note: Creating a user here will automatically sign you into their account on this browser. You may need to log back into your Admin account afterwards.
                    </p>
                  </div>

                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3">Name</th>
                        <th className="py-3">Joined</th>
                        <th className="py-3">Role</th>
                        <th className="py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <p className="text-sm font-bold text-gray-900">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-400 font-mono">{user.id.split('-')[0]}</p>
                          </td>
                          <td className="py-4 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="py-4 text-sm text-gray-600">
                            <select value={user.role || 'customer'} onChange={(e) => handleRoleChange(user.id, e.target.value)} className={`px-2 py-1 text-xs border border-gray-300 rounded outline-none font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-red-50 text-red-700' : user.role === 'editor' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-700'}`}>
                              <option value="customer">Customer</option><option value="editor">Editor</option><option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-4 text-right">
                            <button onClick={() => handleDeleteUser(user.id)} className="text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded uppercase tracking-wider transition-colors">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </>
          )}
        </main>
      </div>
    </div>
  );
}