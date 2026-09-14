import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default async function TopSelling() {
  // 1. Buscamos primero el ID de la categoría de Plásticos (en este caso dice 'paper', puedes ajustarlo)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name');
    
  const plasticCategory = categories?.find(c => 
    c.name.toLowerCase().includes('paper')
  );

  let products: any[] = [];

  // 2. Si existe la categoría, traemos 10 productos de ella
  if (plasticCategory) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, 
        name,
        slug, 
        regular_price,
        product_categories!inner(category_id),
        product_images ( url )
      `)
      .eq('product_categories.category_id', plasticCategory.id)
      .limit(10);

    if (!error && data) {
      products = data;
    }
  }

  // Si por alguna razón no hay productos, ocultamos la sección
  if (products.length === 0) {
    return null; 
  }

  return (
    <section className="w-full bg-white border-gray-100 py-12">
      {/* Usamos un max-w muy amplio para que las 7 columnas respiren */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
       {/* Titular súper sutil y minimalista */}
        <div className="mb-6 pb-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Top Selling
          </h2>
       </div>

        {/* GRID MÁGICO DE COLUMNAS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            
            const imageUrl = product.product_images && product.product_images.length > 0
              ? product.product_images[0].url
              : 'https://placehold.co/400x400/eeeeee/999999?text=Sin+Foto';

            // 3. Construimos la URL amigable con SEO usando el slug
            const productUrl = `/product/${product.slug || product.id}`;

            return (
              <Link 
                href={productUrl} 
                key={product.id} 
                className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col hover:shadow-md hover:border-gray-300 transition-all group"
              >
                {/* CONTENEDOR IMAGEN */}
                <div className="relative h-[140px] w-full bg-[#f8f8f8] rounded-t-lg flex items-center justify-center p-2">
                  <img 
                    src={imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* CÍRCULO "TOP" DORADO */}
                  <div className="absolute top-2 right-2 rounded-full w-[40px] h-[40px] flex items-center justify-center shadow-md bg-[#ffc107] text-gray-900">
                    <span className="font-black text-center leading-tight text-[11px] tracking-wide">
                      TOP
                    </span>
                  </div>
                </div>

                {/* CONTENEDOR TEXTO */}
                <div className="pt-6 pb-4 px-3 text-center flex-1 flex flex-col justify-between items-center">
                  
                  <h3 className="text-[11px] font-bold text-gray-800 leading-snug line-clamp-3 mb-1.5 group-hover:text-brand-primary transition-colors">
                    {product.name}
                  </h3>
                  
                  {/* Fila de 5 Estrellas (Valoración) */}
                  <div className="flex justify-center items-center space-x-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 text-[#ffc107]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  <p className="text-brand-primary font-black text-lg">
                    {product.regular_price ? `$${product.regular_price}` : 'Ver opciones'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section> 
  );
}