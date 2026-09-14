import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BannerRequestaQuote from '@/app/components/BannerRequestaQuote';
import ProductGallery from '../../components/ProductGallery'; 
import ProductOptionsBox from './ProductOptionsBox';
import FrequentlyBoughtTogether from './FrequentlyBoughtTogether';

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);

  // 🚀 AÑADIMOS "unit" A LA CONSULTA PARA QUE LA PÁGINA LO RECIBA
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      sku,
      regular_price,
      description,
      related_products,
      unit, 
      product_images ( url ),
      product_categories (
        categories ( id, name, slug ) 
      )
    `);

  if (isUUID) {
    query = query.eq('id', decodedSlug);
  } else {
    query = query.ilike('slug', decodedSlug);
  }

  const { data: productsData, error } = await query.limit(1);
  const product = productsData?.[0];

  if (error || !product) {
    console.error("Error buscando el producto:", decodedSlug, error?.message);
    notFound();
  }

  const { data: variantsData } = await supabase
    .from('product_variants')
    .select('id, sku, price, stock_quantity, attributes')
    .eq('product_id', product.id);

  const safeVariants = variantsData || [];
  if (safeVariants.length > 0 && safeVariants[0].price !== null) {
    product.regular_price = safeVariants[0].price;
  }

  const categoryData = product.product_categories?.[0]?.categories;

  const mainImageUrl = product.product_images && product.product_images.length > 0 
    ? product.product_images[0].url 
    : 'https://placehold.co/400x400/eeeeee/999999?text=No+Image';

  // BUSCAMOS LOS PRODUCTOS COMPRADOS JUNTOS
  let frequentlyBoughtData: any[] = [];
  if (product.related_products && product.related_products.length > 0) {
    const productIds = product.related_products.map((rp: any) => rp.productId);
    
    const { data: fbtData } = await supabase
      .from('products')
      .select(`id, slug, product_images(url)`)
      .in('id', productIds);
    
    if (fbtData) {
      frequentlyBoughtData = product.related_products.map((rp: any) => {
        const dbProd = fbtData.find(p => p.id === rp.productId);
        return {
          id: rp.productId,
          variantId: rp.variantId || null,
          name: rp.name,
          price: rp.price,
          image: dbProd?.product_images?.[0]?.url || 'https://placehold.co/400x400/eeeeee/999999?text=No+Image',
          slug: dbProd?.slug || rp.productId
        };
      });
    }
  }

  let relatedProducts: any[] = [];
  if (categoryData?.id) {
    const { data: related } = await supabase
      .from('products')
      .select(`
        id, name, slug, sku, regular_price,
        product_categories!inner(category_id),
        product_images ( url )
      `)
      .eq('product_categories.category_id', categoryData.id)
      .neq('id', product.id)
      .limit(5);

    if (related) relatedProducts = related;
  }

  const formattedDescription = product.description 
    ? product.description.replace(/\\n/g, '<br />').replace(/\n/g, '<br />')
    : '';

  return (
    <div className="bg-white min-h-screen pb-0">
      
      {/* BREADCRUMBS */}
      <div className="bg-gray-50 border-b border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex text-xs font-medium text-gray-500 space-x-2 items-center">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-brand-primary transition-colors">Shop</Link>
            {categoryData && (
              <>
                <span>/</span>
                <Link href={`/shop?category=${categoryData.slug || categoryData.id}`} className="hover:text-brand-primary transition-colors">
                  {categoryData.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-900 truncate max-w-[150px] md:max-w-md">{product.name}</span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* LA CAJA PRINCIPAL DEL PRODUCTO (Galería y Opciones) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-16">
          <ProductGallery images={product.product_images} productName={product.name} />

          <div className="flex flex-col">
            <ProductOptionsBox product={{...product, imageUrl: mainImageUrl}} variants={safeVariants} />

            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Product Details</h2>
              {formattedDescription ? (
                <div 
                  className="text-sm text-gray-600 leading-relaxed 
                             [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 
                             [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 
                             [&_li]:mb-1 
                             [&_p]:mb-4 
                             [&_strong]:font-bold [&_b]:font-bold 
                             [&_em]:italic [&_i]:italic 
                             [&_a]:text-brand-primary [&_a]:underline
                             [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-gray-900
                             [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:text-gray-900
                             [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-gray-900"
                  dangerouslySetInnerHTML={{ __html: formattedDescription }}
                />
              ) : (
                <p className="text-gray-500 text-sm italic">No detailed description available for this item.</p>
              )}
            </div>
          </div>
        </div>

        {/* 🚀 FREQUENTLY BOUGHT TOGETHER (AHORA COMO COLUMNA COMPLETA) */}
        {frequentlyBoughtData.length > 0 && (
          <FrequentlyBoughtTogether 
            mainProduct={{
              id: product.id,
              variantId: null,
              name: product.name,
              price: product.regular_price || 0,
              image: mainImageUrl,
              slug: product.slug || product.id
            }}
            relatedProducts={frequentlyBoughtData}
          />
        )}

        {/* RECOMENDACIONES DE LA MISMA CATEGORÍA */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 mt-12 border-t border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-8">Customers Also Bought</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {relatedProducts.map((relProduct) => {
                const relImageUrl = relProduct.product_images && relProduct.product_images.length > 0
                  ? relProduct.product_images[0].url
                  : 'https://placehold.co/400x400/eeeeee/999999?text=Sin+Foto';
                const relUrl = `/product/${relProduct.slug || relProduct.id}`;

                return (
                  <Link href={relUrl} key={relProduct.id} className="bg-white rounded-md border border-gray-200 p-3 flex flex-col hover:shadow-lg transition-shadow duration-300 group">
                    <div className="block relative w-full aspect-square mb-3 bg-[#f8f8f8] rounded p-2">
                      <img src={relImageUrl} alt={relProduct.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1 group-hover:text-brand-primary transition-colors line-clamp-2">{relProduct.name}</h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">Item #: {relProduct.sku || 'N/A'}</p>
                      <div className="mt-auto">
                        <p className="text-[15px] font-black text-[#e50027] mb-3">{relProduct.regular_price ? `$${relProduct.regular_price}` : 'Log in'}</p>
                        <button className="w-full bg-transparent border border-gray-300 text-gray-600 group-hover:border-brand-primary group-hover:text-brand-primary group-hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest py-2 rounded-sm transition-all duration-200">View Details</button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
      <BannerRequestaQuote />
    </div>
  );
}