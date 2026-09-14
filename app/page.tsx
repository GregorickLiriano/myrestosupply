import { supabase } from '@/lib/supabase';
import Banners from './components/Banners';
import ProductsCode from "./components/ProductsCode";
import PlasticGrid from './components/PlasticGrid';
import BannerRequestaQuote from './components/BannerRequestaQuote';
import FeaturedProducts from "./components/FeaturedProducts";
import Publicidad from "./components/Publicidad";
import TopSelling from "./components/TopSelling";
import DynamicGrid from './components/DynamicGrid'; // 🚀 1. IMPORTAMOS EL NUEVO COMPONENTE

export const revalidate = 0; 

const componentMap: Record<string, React.ReactNode> = {
  'Banners': <Banners key="Banners" />,
  'ProductsCode': <ProductsCode key="ProductsCode" />,
  'PlasticGrid': <PlasticGrid key="PlasticGrid" />,
  'BannerRequestaQuote': <BannerRequestaQuote key="BannerRequestaQuote" />,
  'FeaturedProducts': <FeaturedProducts key="FeaturedProducts" />,
  'Publicidad': <Publicidad key="Publicidad" altText="Publicidad Clásica" />,
  'TopSelling': <TopSelling key="TopSelling" />
};

export default async function Home() {
  const { data: layoutData, error: layoutError } = await supabase
    .from('home_layout')
    .select('*')
    .order('position', { ascending: true });

  const { data: adsData } = await supabase.from('storefront_ads').select('*');
  
  // 🚀 2. BUSCAMOS LOS DATOS DE LOS GRIDS EN SUPABASE
  const { data: gridsData } = await supabase.from('storefront_grids').select('*');

  if (layoutError) console.error('❌ Error conectando a Supabase:', layoutError.message);

  const activeLayout = layoutData && layoutData.length > 0 ? layoutData : [
    { id: 'Banners', is_visible: true },
    { id: 'ProductsCode', is_visible: true },
    { id: 'PlasticGrid', is_visible: true },
    { id: 'BannerRequestaQuote', is_visible: true },
    { id: 'FeaturedProducts', is_visible: true },
    { id: 'Publicidad', is_visible: true },
    { id: 'TopSelling', is_visible: true }
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {activeLayout
        .filter((comp) => comp.is_visible)
        .map((comp) => {
          
          // LÓGICA PARA BANNERS PUBLICITARIOS
          if (comp.id.startsWith('Ad-')) {
            const adId = comp.id.replace('Ad-', '');
            const adData = adsData?.find((a: any) => a.id === adId);
            if (!adData) return null; 
            
            const linkUrl = adData.link_url || (adData.category_slug ? `/${adData.category_slug}` : '');
            
            return (
              <Publicidad 
                key={comp.id} 
                imageUrl={adData.image_url} 
                altText={adData.name} 
                linkUrl={linkUrl} 
              />
            );
          }

          // 🚀 3. LÓGICA PARA RENDERIZAR LOS GRIDS DE PRODUCTOS
          if (comp.id.startsWith('Grid-')) {
            const gridId = comp.id.replace('Grid-', '');
            const gridData = gridsData?.find((g: any) => g.id === gridId);
            if (!gridData) return null; 

            return (
              <DynamicGrid 
                key={comp.id}
                gridId={comp.id}
                title={gridData.name}
                categoryId={gridData.category_id}
                maxProducts={gridData.max_products}
                columns={gridData.columns}
              />
            );
          }

          // SI ES UN COMPONENTE ESTÁTICO DE LOS ORIGINALES
          return componentMap[comp.id] || null;
        })}
    </main>
  );
}