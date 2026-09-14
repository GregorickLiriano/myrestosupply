import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import ProductCardActions from './ProductCardActions';

function generateSlug(text: string) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function DynamicGrid({ 
  gridId, 
  title, 
  categoryId, 
  maxProducts, 
  columns 
}: { 
  gridId: string, 
  title: string, 
  categoryId: string, 
  maxProducts: number | string, 
  columns: number | string 
}) {
  
  // 🚀 FORZAMOS QUE SEAN NÚMEROS REALES
  const limitNumber = Number(maxProducts) || 7;
  const colsNumber = Number(columns) || 7;

  // 1. Buscamos los productos
  const { data: productsData, error } = await supabase
    .from('products')
    .select(`
      id, slug, name, sku, regular_price, unit,
      product_images ( url ),
      product_categories!inner ( category_id )
    `)
    .eq('product_categories.category_id', categoryId)
    .order('created_at', { ascending: false })
    .limit(limitNumber);

  // 2. Manejo de Errores o Categoría Vacía
  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto py-10 px-4 text-center bg-red-50 text-red-600 rounded-lg border border-red-200 mt-4">
        <p className="font-bold">Error cargando el Grid "{title}":</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!productsData || productsData.length === 0) {
    return (
      <section className="w-full bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 border-b border-gray-100 pb-2">
            <h2 className="text-xl md:text-2xl font-bold text-gray-400 tracking-tight">
              {title}
            </h2>
          </div>
          <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
            <span className="text-3xl block mb-2">🪹</span>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">This category is currently empty.</p>
            <p className="text-gray-400 text-[10px] mt-1">(Only admins can see this placeholder box)</p>
          </div>
        </div>
      </section>
    );
  }

  // 3. Lógica de Columnas
  const gridColumnsClass = {
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    7: 'lg:grid-cols-7',
  }[colsNumber] || 'lg:grid-cols-7'; 

  return (
    <section className="w-full bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6 border-b border-gray-100 pb-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight flex items-baseline gap-3">
            {title}
            {/* Si estás como admin, te muestra cuántos cargó realmente vs tu límite */}
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-normal">
               (Showing {productsData.length} of {limitNumber} slots)
            </span>
          </h2>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${gridColumnsClass} gap-x-3 gap-y-6`}>
          {productsData.map((product) => {
            const imageUrl = product.product_images && product.product_images.length > 0
              ? product.product_images[0].url
              : 'https://placehold.co/400x400/eeeeee/999999?text=Sin+Foto';

            const finalSlug = product.slug || generateSlug(product.name);
            const productUrl = `/product/${finalSlug}`;

            return (
              <div 
                key={product.id} 
                className="bg-white group flex flex-col relative transition-all duration-200 hover:shadow-sm p-2 rounded-md border border-transparent hover:border-gray-100"
              >
                <Link href={productUrl} className="block w-full aspect-square mb-3 relative bg-white">
                  <img 
                    src={imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out p-1"
                  />
                </Link>

                <div className="flex flex-col flex-grow">
                  <Link 
                    href={productUrl} 
                    className="text-[11px] font-semibold text-gray-800 hover:text-[#0056b3] hover:underline line-clamp-2 leading-snug mb-1 transition-colors"
                    title={product.name}
                  >
                    {product.name}
                  </Link>

                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    Item #: {product.sku || 'N/A'} 
                    {product.unit && <span className="text-gray-800 ml-1 bg-gray-100 px-1 rounded border border-gray-200 shadow-sm font-bold">| {product.unit}</span>}
                  </p>

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
      </div>
    </section>
  );
}