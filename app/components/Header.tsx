'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { usePathname } from 'next/navigation';
import { useCart } from '../../context/CartContext';

type Category = {
  id: string;
  name: string;
  slug: string; 
};

type Product = {
  id: string;
  name: string;
  slug: string; 
  sku: string;
  regular_price: number | null;
  product_images: { url: string }[]; 
  product_categories?: { categories: { id: string; name: string } }[];
};

type UserProfile = {
  first_name: string;
  avatar_url: string | null;
} | null;

export default function Header() {
  const { openCart, cartCount } = useCart();

  // Estados de Usuario
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Estados para Navegación y Categorías
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // ESTADOS PARA EL BUSCADOR EN VIVO
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // EFECTO PARA ESCUCHAR LA SESIÓN DE SUPABASE
  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, avatar_url')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile(data);
      }
      setIsCheckingAuth(false);
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setIsCheckingAuth(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setActiveCategory(null);
    setShowSearchDropdown(false);
    setSearchQuery('');
  }, [pathname]);

  // Cerrar buscador al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cargar categorías
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_visible', true) // 🚀 AQUÍ SE FILTRAN LAS CATEGORÍAS ACTIVAS
        .order('name'); 

      if (data && !error) {
        setCategories(data);
      }
    }
    fetchCategories();
  }, []);

  // Buscador en Vivo
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setShowSearchDropdown(true);

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          slug, 
          sku,
          regular_price,
          product_images ( url ),
          product_categories (
            categories ( id, name )
          )
        `)
        .ilike('name', `%${searchQuery}%`)
        .limit(20); 

      if (data && !error) {
        const uniqueProductsMap = new Map();
        data.forEach(p => {
          const key = p.slug || p.name;
          if (!uniqueProductsMap.has(key)) {
            uniqueProductsMap.set(key, p);
          }
        });

        const uniqueProducts = Array.from(uniqueProductsMap.values()).slice(0, 6);
        setSearchResults(uniqueProducts as unknown as Product[]);
      } else {
        setSearchResults([]);
      }
      setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Mega menú
  const handleMouseEnterCategory = async (categoryId: string) => {
    setActiveCategory(categoryId);
    setIsLoadingProducts(true);

    const { data, error } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        slug, 
        sku,
        regular_price,
        product_categories!inner(category_id),
        product_images ( url )
      `) 
      .eq('product_categories.category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(30); 

    if (data && !error) {
      const uniqueProductsMap = new Map();
      data.forEach(p => {
        const key = p.slug || p.name;
        if (!uniqueProductsMap.has(key)) {
          uniqueProductsMap.set(key, p);
        }
      });

      const uniqueProducts = Array.from(uniqueProductsMap.values()).slice(0, 15);
      setRecentProducts(uniqueProducts as unknown as Product[]);
    } else {
      setRecentProducts([]);
    }
    setIsLoadingProducts(false);
  };

  const handleMouseLeaveNav = () => {
    setActiveCategory(null);
  };

  const uniqueCategories = categories.filter((c, index, self) =>
    index === self.findIndex((t) => t.name.toLowerCase() === c.name.toLowerCase())
  );

  const mainCategories = uniqueCategories.filter(
    c => !c.name.toLowerCase().includes('per uni')
  );

  const spicesSubcategories = uniqueCategories.filter(
    c => c.name.toLowerCase().includes('per uni')
  );

  return (
    <header className="bg-white z-50 relative">
      {/* 1. Barra Superior */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center pt-2 pb-5">
          
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <Image 
                src="/Logo.png" 
                alt="Logo Tienda" 
                width={160} 
                height={55} 
                className="cursor-pointer w-auto h-auto" 
                priority
              />
            </Link>
          </div>

          {/* BUSCADOR */}
          <div className="flex-1 flex justify-center px-6 lg:px-16 relative" ref={searchContainerRef}>
            <div className="w-full max-w-2xl relative">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    window.location.href = `/shop?q=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                className="relative flex items-center w-full h-11 rounded-full bg-white border border-gray-300 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary overflow-hidden transition-all z-20"
              >
                <input
                  type="text"
                  placeholder="Search products, categories, SKU..."
                  className="w-full h-full px-5 outline-none text-sm text-brand-dark"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSearchDropdown(true);
                  }}
                />
                <button type="submit" className="h-full px-4 hover:bg-gray-50 text-brand-primary transition-colors">
                  <span className="text-gray-500 font-bold px-3">Q</span>
                </button>
              </form>

              {/* DROPDOWN BUSCADOR */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[500px]">
                  {isSearching ? (
                    <div className="p-6 text-center text-gray-400 text-sm animate-pulse flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-brand-primary rounded-full animate-spin mb-2"></div>
                      Searching catalogue...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-4 grid grid-cols-3 gap-3 overflow-y-auto custom-scrollbar">
                        {searchResults.map((product) => {
                          const imageUrl = product.product_images?.[0]?.url || 'https://placehold.co/400x400/eeeeee/999999?text=Sin+Foto';
                          const catName = product.product_categories?.[0]?.categories?.name || 'Uncategorized';
                          const productUrl = `/product/${product.slug || product.id}`;

                          return (
                            <Link 
                              href={productUrl} 
                              key={product.id}
                              className="group bg-white border border-gray-100 rounded-md p-2 flex flex-col hover:border-brand-primary hover:shadow-sm transition-all"
                            >
                              <div className="w-full aspect-square bg-[#f8f8f8] rounded p-1 mb-2 flex items-center justify-center overflow-hidden">
                                <img 
                                  src={imageUrl} 
                                  alt={product.name} 
                                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-0.5 line-clamp-1">
                                {catName}
                              </p>
                              <h4 className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-brand-primary">
                                {product.name}
                              </h4>
                              <p className="text-[#e50027] font-black text-xs mt-auto pt-1">
                                {product.regular_price ? `$${product.regular_price}` : 'View Options'}
                              </p>
                            </Link>
                          );
                        })}
                      </div>
                      <div className="bg-gray-50 p-3 border-t border-gray-100 text-center">
                        <Link href={`/shop?q=${encodeURIComponent(searchQuery.trim())}`} className="text-xs font-bold text-brand-primary hover:text-brand-dark hover:underline uppercase tracking-wider">
                          View all results for "{searchQuery}" &rarr;
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-900 font-bold text-sm mb-1">No products found</p>
                      <p className="text-gray-500 text-xs">Try searching for a different keyword or SKU.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-8">
            
            {/* LÓGICA DINÁMICA DE USUARIO / LOGIN */}
            {isCheckingAuth ? (
              <div className="flex flex-col items-center animate-pulse">
                <div className="w-6 h-6 bg-gray-200 rounded-full mb-1"></div>
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
              </div>
            ) : userProfile ? (
              <Link href="/account" className="flex flex-col items-center text-brand-dark hover:text-brand-primary transition-colors group">
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover mb-[2px] border border-gray-200 group-hover:border-brand-primary" />
                ) : (
                  <span className="text-gray-600 font-bold px-2">👤</span>
                )}
                <span className="text-[11px] font-semibold uppercase mt-1 tracking-wider">
                  {userProfile.first_name || 'Account'}
                </span>
              </Link>
            ) : (
              <Link href="/login" className="flex flex-col items-center text-brand-dark hover:text-brand-primary transition-colors">
                <span className="text-gray-600 font-bold px-2">👤</span>
                <span className="text-[11px] font-semibold uppercase mt-1 tracking-wider">Sign In</span>
              </Link>
            )}

            {/* CARRITO */}
            <button 
              onClick={openCart}
              className="flex flex-col items-center text-brand-dark hover:text-brand-primary transition-colors group relative bg-transparent border-none cursor-pointer"
            >
              <div className="relative">
                <span className="text-gray-600 font-bold px-2">🛒</span>
                <span className="absolute -top-1.5 -right-2 bg-brand-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="text-[11px] font-semibold uppercase mt-1 tracking-wider">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra Inferior (Menú de Categorías) */}
      <div 
        className="bg-brand-primary text-white relative"
        onMouseLeave={handleMouseLeaveNav}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap space-x-10">
            {mainCategories.map((category) => (
              <div 
                key={category.id}
                className="py-3.5 group cursor-pointer shrink-0"
                onMouseEnter={() => handleMouseEnterCategory(category.id)}
              >
                <Link href={`/${category.slug || category.id}`} className="text-xs font-semibold hover:text-gray-200 transition-colors uppercase tracking-widest flex items-center">
                  {category.name}
                </Link>

                {activeCategory === category.id && (
                  <div className="absolute top-full left-0 w-full bg-white shadow-2xl z-40 text-brand-dark cursor-default border-t border-gray-100 transition-all duration-300 pb-6">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        setActiveCategory(null);
                      }}
                      className="absolute top-4 right-6 p-2 text-gray-400 hover:text-brand-primary transition-colors z-50 rounded-full hover:bg-gray-100 bg-white border border-gray-200 shadow-sm flex items-center justify-center"
                      title="Close menu"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="pt-6 pb-2 grid grid-cols-6 gap-8">
                        
                        <div className="col-span-1 pr-4 border-r border-gray-100">
                          <h3 className="font-bold text-gray-900 uppercase text-[11px] tracking-widest mb-4">
                            Subcategories
                          </h3>

                          {category.name.toLowerCase().includes('spices') && spicesSubcategories.length > 0 ? (
                            <ul className="space-y-2 text-[13px] text-gray-600">
                              {spicesSubcategories.map(sub => (
                                <li key={sub.id}>
                                  <Link href={`/${sub.slug || sub.id}`} className="hover:text-brand-primary transition-colors block">
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="space-y-2 text-[13px] text-gray-600">
                              <li>
                                <Link href={`/${category.slug || category.id}`} className="hover:text-brand-primary transition-colors block font-medium">
                                  View all in {category.name}
                                </Link>
                              </li>
                            </ul>
                          )}
                        </div>

                        <div className="col-span-5">
                          <h3 className="font-bold text-gray-900 uppercase text-[11px] tracking-widest mb-4">
                            Featured
                          </h3>

                          {isLoadingProducts ? (
                            <div className="text-sm text-gray-400 py-10 animate-pulse">Loading catalog...</div>
                          ) : recentProducts.length > 0 ? (
                            <div className="grid grid-cols-5 gap-x-4 gap-y-6">
                              {recentProducts.map((product) => {
                                const imageUrl = product.product_images && product.product_images.length > 0
                                  ? product.product_images[0].url
                                  : 'https://placehold.co/400x400/eeeeee/999999?text=Sin+Foto';

                                const productUrl = `/product/${product.slug || product.id}`;

                                return (
                                  <Link href={productUrl} key={product.id} className="group block">
                                    <div className="bg-[#f8f8f8] rounded-md aspect-square overflow-hidden mb-2 relative flex items-center justify-center p-1.5 border border-transparent group-hover:border-gray-200 transition-colors">
                                      <img 
                                        src={imageUrl} 
                                        alt={product.name} 
                                        className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
                                      />
                                    </div>

                                    <div>
                                      <h4 className="text-[10px] font-medium text-gray-700 line-clamp-2 leading-tight transition-colors">
                                        {product.name}
                                      </h4>
                                      <p className="text-brand-primary font-bold mt-0.5 text-xs">
                                        {product.regular_price ? `$${product.regular_price}` : 'View Options'}
                                      </p>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 py-10">
                              No products found in this category.
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}