import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BannerRequestaQuote from '../components/BannerRequestaQuote';

// 🚀 1. Importamos el nuevo componente interactivo
import ProductCardActions from '../components/ProductCardActions';

const ITEMS_PER_PAGE = 20;

export default async function CategoryPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ categorySlug: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { categorySlug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const currentPage = Number(resolvedSearchParams.page) || 1;

  const { data: categoryData, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('slug', categorySlug)
    .single();

  if (catError || !categoryData) {
    notFound();
  }

  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data: productsData, count, error: prodError } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      slug, 
      sku, 
      regular_price, 
      product_images ( url ),
      product_categories!inner(category_id)
    `, { count: 'exact' }) 
    .eq('product_categories.category_id', categoryData.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  const uniqueProductsMap = new Map();
  if (productsData) {
    productsData.forEach(p => {
      const key = p.slug || p.name;
      if (!uniqueProductsMap.has(key)) {
        uniqueProductsMap.set(key, p);
      }
    });
  }
  const products = Array.from(uniqueProductsMap.values());
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="bg-white min-h-screen pb-0">
      
      <div className="bg-gray-50 border-b border-gray-200 py-6 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <nav className="flex text-xs font-medium text-gray-500 space-x-2 items-center mb-3">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-brand-primary transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-gray-900">{categoryData.name}</span>
          </nav>

          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            {categoryData.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {products.length} of {totalItems} products
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product: any) => {
                const imageUrl = product.product_images && product.product_images.length > 0
                  ? product.product_images[0].url
                  : 'https://placehold.co/400x400/eeeeee/999999?text=No+Image';

                const productUrl = `/product/${product.slug || product.id}`; 

                return (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-md border border-gray-200 p-3 flex flex-col hover:shadow-lg transition-shadow duration-300 group"
                  >
                    <Link href={productUrl} className="block relative w-full aspect-square mb-3 bg-[#f8f8f8] rounded p-2">
                      <img 
                        src={imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    <div className="flex flex-col flex-grow">
                      <Link href={productUrl}>
                        <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1 group-hover:text-brand-primary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                        Item #: {product.sku || 'N/A'}
                      </p>

                      {/* 🚀 2. Reemplazamos la parte inferior estática por el componente interactivo */}
                      <ProductCardActions 
                        product={product} 
                        productUrl={productUrl} 
                        imageUrl={imageUrl} 
                      />
                      
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-2 border-t border-gray-200 pt-8">
                
                {currentPage > 1 ? (
                  <Link 
                    href={`/${categorySlug}?page=${currentPage - 1}`}
                    className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-brand-primary hover:text-brand-primary transition-colors"
                  >
                    Prev
                  </Link>
                ) : (
                  <button disabled className="px-4 py-2 border border-gray-200 rounded text-sm font-bold text-gray-300 cursor-not-allowed">
                    Prev
                  </button>
                )}
                
                <span className="px-4 text-sm font-semibold text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link 
                    href={`/${categorySlug}?page=${currentPage + 1}`}
                    className="px-4 py-2 border border-gray-300 rounded text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-brand-primary hover:text-brand-primary transition-colors"
                  >
                    Next
                  </Link>
                ) : (
                  <button disabled className="px-4 py-2 border border-gray-200 rounded text-sm font-bold text-gray-300 cursor-not-allowed">
                    Next
                  </button>
                )}
                
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">We couldn't find any products for this category yet.</p>
            <Link 
              href="/shop"
              className="mt-6 inline-block bg-brand-primary text-white px-6 py-2 rounded text-sm font-bold hover:opacity-90"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </main>
      <BannerRequestaQuote />
    </div>
  );
}