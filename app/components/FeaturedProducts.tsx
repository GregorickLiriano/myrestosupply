import { supabase } from '../../lib/supabase';
import Link from 'next/link';

// 🚀 1. Importamos el componente interactivo del botón y precio
import ProductCardActions from './ProductCardActions';

// Función para aleatorizar productos
function shuffleArray(array: any[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// NUEVA FUNCIÓN: Transforma "1/6 Black Bags Ty!" en "1-6-black-bags-ty"
function generateSlug(text: string) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Cambia cualquier cosa que no sea letra o número por un guion
    .replace(/^-+|-+$/g, '');    // Elimina guiones al principio o al final
}

export default async function FeaturedProducts() {
  let featuredProducts: any[] = [];
  let otherProducts: any[] = [];
  const TOTAL_SLOTS = 21;

  // 1. Buscar si existe la categoría "featured-products"
  const { data: catData } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'featured-products')
    .single();

  // 2. Si la categoría existe, traemos sus productos (prioridad #1)
  if (catData) {
    const { data: featuredData } = await supabase
      .from('products')
      .select(`
        id, slug, name, sku, regular_price,
        product_images ( url ),
        product_categories!inner ( category_id )
      `)
      .eq('product_categories.category_id', catData.id)
      .order('created_at', { ascending: false }) // Los más recientes que hayas marcado como destacados primero
      .limit(TOTAL_SLOTS);

    if (featuredData) {
      featuredProducts = featuredData;
    }
  }

  // 3. Calculamos cuántos espacios quedan vacíos
  const remainingSlots = TOTAL_SLOTS - featuredProducts.length;

  // 4. Si sobran espacios, traemos productos al azar para rellenar (prioridad #2)
  if (remainingSlots > 0) {
    const { data: rawProducts, error } = await supabase
      .from('products')
      .select(`
        id, slug, name, sku, regular_price,
        product_images ( url )
      `)
      .limit(50); // Traemos varios para poder mezclar

    if (!error && rawProducts) {
      // Guardamos los IDs de los que ya son destacados para no repetirlos
      const featuredIds = new Set(featuredProducts.map(p => p.id));
      
      // Filtramos los que no están en la lista de destacados
      const availableOthers = rawProducts.filter(p => !featuredIds.has(p.id));
      
      // Mezclamos y tomamos solo la cantidad exacta que nos falta
      otherProducts = shuffleArray(availableOthers).slice(0, remainingSlots);
    }
  }

  // 5. Unimos las dos listas: Destacados primero, Relleno aleatorio después
  const finalProducts = [...featuredProducts, ...otherProducts];

  // Si por alguna razón la tienda no tiene ningún producto, no renderizamos la sección
  if (finalProducts.length === 0) return null;

  return (
    <section className="w-full bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6 border-b border-gray-100 pb-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Featured Products
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-x-3 gap-y-6">
          {finalProducts.map((product) => {
            const imageUrl = product.product_images && product.product_images.length > 0
              ? product.product_images[0].url
              : 'https://placehold.co/400x400/eeeeee/999999?text=Sin+Foto';

            // Si no hay slug en la DB, lo genera a partir del nombre
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

                  <p className="text-[9px] text-gray-400 mb-2 font-medium uppercase">
                    Item #: {product.sku || 'N/A'}
                  </p>

                  {/* 🚀 Reemplazamos el precio estático y el botón inactivo por nuestro componente */}
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