import { supabase } from '../../lib/supabase';
import Link from 'next/link';

// Función para desordenar el array (Aleatoriedad)
function shuffleArray(array: any[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Colores dinámicos para mantener el estilo original de los badges
const BADGE_COLORS = [
  { bg: "bg-[#e50027]", text: "text-white" },
  { bg: "bg-black", text: "text-white" },
  { bg: "bg-[#007b99]", text: "text-white" },
  { bg: "bg-[#8b0054]", text: "text-white" },
  { bg: "bg-green-700", text: "text-white" },
];

export default async function ProductsCode() {
  // 1. Buscamos los productos aleatorios
  const { data: rawProducts, error: productsError } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      slug,
      regular_price,
      product_images ( url )
    `)
    .limit(15);

  // 2. Buscamos TODOS los códigos de descuento ACTIVOS en la base de datos
  const { data: rawDiscounts, error: discountsError } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('is_active', true);

  if (productsError || discountsError) {
    console.error("🚨 Error cargando datos:", productsError?.message || discountsError?.message);
    return null;
  }

  // 3. Filtramos los descuentos para asegurarnos de que no hayan superado su límite de uso
  const validDiscounts = (rawDiscounts || []).filter(d => 
    d.usage_limit === null || d.times_used < d.usage_limit
  );

  // 🚀 REGLA: Si no hay descuentos activos o no hay productos, NO renderizamos esta sección
  if (!rawProducts || rawProducts.length === 0 || validDiscounts.length === 0) {
    return null;
  }

  // 4. Mezclamos aleatoriamente los productos y descuentos
  const randomProducts = shuffleArray(rawProducts).slice(0, 4);
  const shuffledDiscounts = shuffleArray(validDiscounts);

  return (
    <section className="w-full bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Grid de 4 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {randomProducts.map((product, index) => {
            const discount = shuffledDiscounts[index % shuffledDiscounts.length];
            const badgeColor = BADGE_COLORS[index % BADGE_COLORS.length];
            
            const formattedDiscount = discount.type === 'percentage' 
              ? `${discount.value}%\nOFF` 
              : `$${discount.value}\nOFF`;

            const imageUrl = product.product_images && product.product_images.length > 0
              ? product.product_images[0].url
              : 'https://placehold.co/400x400/eeeeee/999999?text=Sin+Foto';

            const productUrl = `/product/${product.slug || product.id}`;

            return (
              // 🚀 CAMBIO CLAVE: Ya no es un <Link>, ahora es un <div> principal
              <div 
                key={product.id} 
                className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow group relative"
              >
                {/* PARTE SUPERIOR: Contenedor de la Imagen y Badges */}
                <div className="relative h-[220px] w-full bg-gray-50 rounded-t-lg">
                  
                  {/* Link solo envuelve la imagen y los badges */}
                  <Link href={productUrl} className="block w-full h-full cursor-pointer">
                    <img 
                      src={imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-contain rounded-t-lg mix-blend-multiply"
                    />
                    
                    <div className={`absolute top-3 right-3 rounded-full w-[60px] h-[60px] flex items-center justify-center shadow-lg ${badgeColor.bg} ${badgeColor.text} transform group-hover:scale-110 transition-transform`}>
                      <span className="font-black text-center leading-none text-sm whitespace-pre-line">
                        {formattedDiscount}
                      </span>
                    </div>

                    <div className="absolute bottom-4 right-3 bg-[#00a3e0] text-white text-[10px] font-bold italic px-2 py-0.5 rounded-sm shadow">
                      plus
                    </div>
                  </Link>

                  {/* 🚀 Píldora del Código (INDEPENDIENTE DEL LINK) */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-20 w-[75%] max-w-[200px]">
                    {/* cursor-text pone el cursor de escritura, select-text permite sombrear */}
                    <div className="bg-white border border-gray-100 shadow-md py-2 px-3 flex items-center justify-center rounded-sm cursor-text select-text">
                      <span className="text-gray-800 text-sm font-bold mr-1">Use Code:</span>
                      {/* select-all hace que al dar 1 clic, se seleccione todo el código */}
                      <span className="text-green-700 text-sm font-black select-all" title="Click to select code">{discount.code}</span>
                    </div>
                  </div>
                </div>

                {/* PARTE INFERIOR: Textos del Producto */}
                <div className="pt-8 pb-6 px-4 text-center flex-1 flex flex-col justify-start">
                  <Link href={productUrl} className="inline-block cursor-pointer">
                    <h3 className="text-[17px] font-extrabold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-brand-primary transition-colors">
                      {formattedDiscount.replace('\n', ' ').replace('OFF', 'Off ')} {product.name}
                    </h3>
                  </Link>
                  
                  <p className="text-sm text-gray-600 font-medium">
                    Limited time offer, apply at checkout!
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}