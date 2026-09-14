import Link from 'next/link';
import getQuoteImage from "@/public/getQuote_bigItems.jpeg";

export default function BannerRequestaQuote() {
  return (
    <section className="relative w-full py-14 md:py-16 bg-gray-100 overflow-hidden mt-12 mb-0">
      {/* Imagen de fondo con capa oscura (Overlay) */}
      <div className="absolute inset-0 z-0">
        <img
          // Usé una imagen de almacén para darle ese toque de inventario masivo.
          src={getQuoteImage.src}
          alt="Warehouse Inventory"
          className="w-full h-full object-cover object-center"
        />
        {/* El bg-black/70 oscurece la imagen para que el texto blanco sea 100% legible */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>
      </div>

      {/* Contenedor del Texto y Botones */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        <h2 className="text-3xl md:text-3xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
         Have a large list of item?
        </h2>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/quote"
            className="bg-brand-primary text-white px-8 py-3.5 rounded font-black text-sm uppercase tracking-widest hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg shadow-brand-primary/30"
          >
            Request A Quote
          </Link>
          
          <Link
            href="/contact"
            className="bg-transparent border-2 border-brand-primary text-white px-8 py-3.5 rounded font-black text-sm uppercase tracking-widest hover:bg-brand-primary hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Contact Us
          </Link>
        </div>

      </div>
    </section>
  );
}