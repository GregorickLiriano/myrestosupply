import { supabase } from '../../lib/supabase';
import Link from 'next/link';

// Promociones con colores de la marca (Rojo, Gris Oscuro, Gris Medio) - SIN VERDE
const PROMOS = [
  { discount: "10%\nOFF", code: "PLAST10", color: "bg-brand-primary", textColor: "text-white" },
  { discount: "15%\nOFF", code: "BULK15", color: "bg-brand-dark", textColor: "text-white" },
  { discount: "5%\nOFF",  code: "SAVE5",   color: "bg-gray-500", textColor: "text-white" },
  { discount: "20%\nOFF", code: "MEGA20",  color: "bg-brand-primary", textColor: "text-white" },
  { discount: "10%\nOFF", code: "PROMO10", color: "bg-brand-dark", textColor: "text-white" },
  { discount: "12%\nOFF", code: "DEAL12",  color: "bg-gray-500", textColor: "text-white" },
  { discount: "15%\nOFF", code: "FRESH",   color: "bg-brand-primary", textColor: "text-white" },
];

export default async function PlasticGrid() {
  // 1. Buscamos primero el ID de la categoría de Plásticos
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name');
    
  const plasticCategory = categories?.find(c => 
    c.name.toLowerCase().includes('plastic')
  );

  let products: any[] = [];

  // 2. Si existe la categoría, traemos 7 productos de ella
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
      .limit(7);

    if (!error && data) {
      products = data;
    }
  }

  // Si por alguna razón no hay 7, rellenamos o mostramos lo que haya
  if (products.length === 0) {
    return null; // Oculta la sección si no hay productos de plástico
  }

  return (
    <section className="w-full bg-white border-t border-gray-100">
      {/* Usamos un max-w muy amplio para que las 7 columnas respiren */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* GRID MÁGICO DE 7 COLUMNAS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {products.map((product, index) => {
            // Asignamos el estilo según la posición (0 al 6)
            const promo = PROMOS[index % PROMOS.length];
            
            const imageUrl = product.product_images && product.product_images.length > 0
              ? product.product_images[0].url
              : 'https://placehold.co/400x400/eeeeee/999999?text=Sin+Foto';

            // 3. Creamos la URL optimizada para SEO
            const productUrl = `/product/${product.slug || product.id}`;

            return (
              <Link 
                href={productUrl} 
                key={product.id} 
                className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col hover:shadow-md hover:border-gray-300 transition-all group"
              >
                {/* CONTENEDOR IMAGEN */}
                {/* Altura reducida a 140px porque las columnas son más angostas */}
                <div className="relative h-[140px] w-full bg-[#f8f8f8] rounded-t-lg flex items-center justify-center p-2">
                  <img 
                    src={imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* CÍRCULO DE DESCUENTO (Más pequeño) */}
                  <div className={`absolute top-2 right-2 rounded-full w-[40px] h-[40px] flex items-center justify-center shadow-md ${promo.color} ${promo.textColor}`}>
                    <span className="font-black text-center leading-tight text-[9px] whitespace-pre-line">
                      {promo.discount}
                    </span>
                  </div>
                </div>

                {/* CONTENEDOR TEXTO */}
                {/* Padding superior ajustado para la píldora */}
                <div className="pt-6 pb-4 px-3 text-center flex-1 flex flex-col justify-between">
                  <h3 className="text-[11px] font-bold text-gray-800 leading-snug line-clamp-3 mb-2 group-hover:text-brand-primary transition-colors">
                    {product.name}
                  </h3>
                  
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