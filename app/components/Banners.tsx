'use client';

import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
// La importación está perfecta
import IMGdos from "@/public/bannerprincipal-2.jpeg";
import IMGtres from "@/public/bannerprincipal-3.jpeg";

export default function Banners() {
  const slides = [
    {
      id: 1,
      badge: "Sabor & Calidad",
      title: "Spices &\nSeasonings",
      subtitle: "Para una cocina más inteligente y deliciosa.",
      buttonText: "SHOP NOW",
      link: "/categoria/spices",
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=800&auto=format&fit=crop", 
      bgColor: "bg-brand-primary", 
      badgeBg: "bg-black text-white" 
    },
    {
      id: 2,
      badge: "Ventas al Mayor",
      title: "Plastic\nProducts",
      subtitle: "Soluciones de almacenamiento y servicio al mejor precio.",
      buttonText: "SHOP NOW",
      link: "/categoria/plastic",
      // SOLUCIÓN: Usamos .src para sacar la URL real de la imagen importada
      image: IMGdos.src, 
      bgColor: "bg-[#0369a1]", 
      badgeBg: "bg-black text-white"
    },
    {
      id: 3,
      badge: "Alta Resistencia",
      title: "Aluminum\nProducts",
      subtitle: "Bandejas y envases que soportan el ritmo de tu restaurante.",
      buttonText: "SHOP NOW",
      link: "/categoria/aluminum",
      image: IMGtres.src,
      bgColor: "bg-brand-dark", 
      badgeBg: "bg-brand-primary text-white" 
    }
  ];

  return (
    <section className="w-full bg-gray-50">
      <div className="mx-auto">
        
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0}
          loop={true}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={true}
          className="overflow-hidden shadow-xl h-[400px] md:h-[300px] w-full"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id} className="group">
              
              <div className={`w-full h-full ${slide.bgColor} flex flex-col md:flex-row overflow-hidden`}>
                
                <div className="w-full md:w-3/5 h-[180px] md:h-full relative overflow-hidden shrink-0">
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105" 
                    loading="eager"
                  />
                </div>

                <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col justify-center items-start h-full">
                  
                  <span className={`px-4 py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3 shadow-sm ${slide.badgeBg}`}>
                    {slide.badge}
                  </span>
                  
                  <h2 className="text-3xl md:text-4xl font-black text-white leading-[1.1] mb-2 whitespace-pre-line drop-shadow-sm">
                    {slide.title}
                  </h2>
                  
                  <p className="text-sm md:text-base text-white opacity-90 mb-5 font-medium drop-shadow-sm">
                    {slide.subtitle}
                  </p>
                  
                  <Link 
                    href={slide.link}
                    className="bg-white text-gray-900 px-6 py-2.5 md:py-3 rounded font-black text-xs md:text-sm uppercase tracking-widest hover:bg-gray-100 transition-all duration-300 shadow-lg inline-flex items-center active:scale-95"
                  >
                    {slide.buttonText}
                    <span className="ml-3 bg-brand-primary text-white text-[10px] md:text-xs px-2 py-0.5 md:py-1 rounded font-bold">
                      Plus
                    </span>
                  </Link>
                </div>

              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: white !important;
          transform: scale(0.6);
          z-index: 40;
        }
        .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          opacity: 1;
        }
      `}</style>
    </section>
  );
}