'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
// 🚀 1. Importamos el contexto del carrito
import { useCart } from '../../context/CartContext';

// Añadimos 'slug' al tipo Category
type Category = { id: string; name: string; slug: string; };
type Product = {
  id: string;
  name: string;
  slug: string; 
  sku: string;
  regular_price: number | null;
  product_images: { url: string }[];
};

const ITEMS_PER_PAGE = 16; 

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 🚀 2. Extraemos la función addToCart del contexto
  const { addToCart } = useCart();

  // Inicializamos los estados leyendo directamente la URL (ahora lee slugs)
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>(
    searchParams.getAll('category')
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  
  // ESTADO DEL BUSCADOR
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar Categorías del Sidebar
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_visible', true) // 🚀 AQUÍ SE FILTRAN LAS CATEGORÍAS ACTIVAS
        .order('name');
        
      if (data && !error) {
        const unique = data.filter((c, index, self) =>
          index === self.findIndex((t) => t.slug === c.slug)
        );
        setCategories(unique);
      }
    }
    fetchCategories();
  }, []);

  // Función maestra para actualizar la URL
  const updateURLParams = (newCatSlugs: string[], min: string, max: string, page: number, query: string) => {
    const params = new URLSearchParams();
    
    newCatSlugs.forEach(slug => params.append('category', slug));
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);
    if (page > 1) params.set('page', page.toString());
    
    if (query) params.set('q', query);

    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  // Cargar Productos
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);

      let query = supabase
        .from('products')
        .select(`
          id, name, slug, sku, regular_price, 
          product_images ( url ),
          product_categories!inner(category_id)
        `, { count: 'exact' });

      // Conversión de Slugs a IDs para la consulta de productos
      if (selectedCategorySlugs.length > 0) {
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .in('slug', selectedCategorySlugs);
          
        if (catData && catData.length > 0) {
          const categoryIds = catData.map(c => c.id);
          query = query.in('product_categories.category_id', categoryIds);
        } else {
          query = query.in('product_categories.category_id', ['no-match']);
        }
      }

      if (minPrice) query = query.gte('regular_price', parseFloat(minPrice));
      if (maxPrice) query = query.lte('regular_price', parseFloat(maxPrice));
      
      if (searchQuery.trim() !== '') {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Paginación
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, count, error } = await query;

      if (!error && data) {
        // Agrupación de variaciones
        const uniqueProductsMap = new Map();
        
        data.forEach(p => {
          const key = p.slug || p.name; 
          if (!uniqueProductsMap.has(key)) {
            uniqueProductsMap.set(key, p);
          }
        });

        setProducts(Array.from(uniqueProductsMap.values()) as unknown as Product[]);
        setTotalItems(count || 0);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedCategorySlugs, minPrice, maxPrice, currentPage, searchQuery]);

  // Manejadores
  const handleCategoryToggle = (categorySlug: string) => {
    const newSlugs = selectedCategorySlugs.includes(categorySlug)
      ? selectedCategorySlugs.filter(slug => slug !== categorySlug)
      : [...selectedCategorySlugs, categorySlug];
      
    setSelectedCategorySlugs(newSlugs);
    setCurrentPage(1);
    updateURLParams(newSlugs, minPrice, maxPrice, 1, searchQuery);
  };

  const handlePriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURLParams(selectedCategorySlugs, minPrice, maxPrice, 1, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    setCurrentPage(1); 
    updateURLParams(selectedCategorySlugs, minPrice, maxPrice, 1, newQuery);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateURLParams(selectedCategorySlugs, minPrice, maxPrice, newPage, searchQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSelectedCategorySlugs([]);
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
    setSearchQuery(''); 
    router.push('/shop');
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="bg-white min-h-screen pb-16">
      
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 py-6 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-gray-900">
            {searchQuery ? `Search results for "${searchQuery}"` : "Shop All Products"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">Showing {products.length} of {totalItems} results</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR (FILTROS) */}
        <aside className="w-full md:w-1/4 flex-shrink-0">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm sticky top-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <button onClick={clearFilters} className="text-xs text-brand-primary hover:underline font-semibold">
                Clear All
              </button>
            </div>

            {/* Filtro de Precio */}
            <div className="mb-8 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Price Range</h3>
              <form onSubmit={handlePriceFilter} className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="relative w-full">
                    <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    />
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="relative w-full">
                    <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2 rounded transition-colors">
                  Apply Price
                </button>
              </form>
            </div>

            {/* Filtro de Categorías */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Categories</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedCategorySlugs.includes(cat.slug)}
                      onChange={() => handleCategoryToggle(cat.slug)}
                      className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary cursor-pointer"
                    />
                    <span className="ml-3 text-sm text-gray-600 group-hover:text-brand-primary transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN (BUSCADOR Y GRID DE PRODUCTOS) */}
        <main className="w-full md:w-3/4 flex flex-col">
          
          <div className="w-full mb-6">
            <div className="relative flex items-center w-full h-12 rounded-lg bg-white border border-gray-300 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary overflow-hidden transition-all shadow-sm">
              <span className="pl-4 text-gray-400 font-bold text-lg">Q</span>
              <input
                type="text"
                placeholder="Search products in catalogue..."
                className="w-full h-full px-4 outline-none text-sm text-gray-700 bg-transparent"
                value={searchQuery}
                onChange={handleSearchChange} 
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                    updateURLParams(selectedCategorySlugs, minPrice, maxPrice, 1, '');
                  }} 
                  className="pr-4 text-gray-400 hover:text-brand-primary"
                >
                  ✖
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-lg aspect-[3/4] w-full"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => {
                  const imageUrl = product.product_images && product.product_images.length > 0
                    ? product.product_images[0].url
                    : 'https://placehold.co/400x400/eeeeee/999999?text=Sin+Foto';

                  const productUrl = `/product/${product.slug || product.id}`; 
                  
                  // 🚀 3. Lógica para saber si es un producto variable o simple basado en el precio
                  const isVariable = product.regular_price === null;

                  return (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-md border border-gray-200 p-4 flex flex-col hover:shadow-lg transition-shadow duration-300 group"
                    >
                      <Link href={productUrl} className="block relative w-full aspect-square mb-3">
                        <img 
                          src={imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      <div className="flex flex-col flex-grow">
                        <Link href={productUrl}>
                          <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1 hover:text-brand-primary transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                          Item #: {product.sku || 'N/A'}
                        </p>

                        <div className="mt-auto">
                          <p className="text-[17px] font-black text-[#e50027] mb-3">
                            {!isVariable ? `$${product.regular_price}` : 'View Options'}
                          </p>
                          
                          {/* 🚀 4. Botón Dinámico: Si es variable lo manda a ver detalles, si es simple lo agrega al carrito */}
                          {isVariable ? (
                            <Link href={productUrl} className="w-full block text-center bg-transparent border border-gray-300 text-gray-600 hover:border-brand-primary hover:text-brand-primary hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-sm transition-all duration-200">
                              View Options
                            </Link>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.preventDefault(); // Evita que recargue o salte de página
                                addToCart({
                                  cartItemId: product.id,
                                  productId: product.id,
                                  name: product.name,
                                  price: product.regular_price!,
                                  quantity: 1,
                                  image: imageUrl,
                                  sku: product.sku
                                });
                              }}
                              className="w-full flex items-center justify-center bg-transparent border border-gray-300 text-gray-600 hover:border-brand-primary hover:text-brand-primary hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-sm transition-all duration-200"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAGINACIÓN */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center space-x-2 border-t border-gray-200 pt-8">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  
                  <span className="px-4 text-sm font-semibold text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">We couldn't find any products for "{searchQuery}".</p>
              <button 
                onClick={clearFilters}
                className="mt-4 bg-brand-primary text-white px-6 py-2 rounded text-sm font-bold hover:opacity-90"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}