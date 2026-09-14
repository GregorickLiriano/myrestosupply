import Link from 'next/link';

export default function Publicidad({ imageUrl, altText, linkUrl }: { imageUrl?: string, altText?: string, linkUrl?: string }) {
  
  // Este es el contenido visual del banner
  const content = imageUrl ? (
    <div className="w-full max-w-[1200px] min-h-[100px] flex items-center justify-center rounded-sm shadow-inner overflow-hidden bg-gray-100">
      <img 
        src={imageUrl} 
        alt={altText || 'Publicidad'} 
        className="w-full min-h-[100px] object-contain block" 
      />
    </div>
  ) : (
    <div className="w-full max-w-[1200px] min-h-[100px] bg-gray-400 border border-gray-200 flex items-center justify-center rounded-sm shadow-inner">
      <span className="text-white font-bold uppercase tracking-widest text-sm text-center px-4">
        {altText || 'Publicidad'}
      </span>
    </div>
  );

  return (
    <section className="w-full flex justify-center py-6 px-4 bg-white">
      {/* Si hay un link, envolvemos la imagen en un componente Link de Next.js */}
      {linkUrl ? (
        <Link href={linkUrl} className="w-full max-w-[1200px] min-h-[100px] hover:opacity-90 transition-opacity duration-200 block">
          {content}
        </Link>
      ) : (
        content
      )}
    </section>
  );
}