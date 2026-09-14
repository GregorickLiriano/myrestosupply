import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full flex flex-col font-sans mt-0">
      
      {/* =========================================
          1. BARRA SUPERIOR (GRIS CLARA)
          Boletín, Plus Promo y App Promo
          ========================================= */}
      <div className="bg-[#f4f4f4] border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 md:divide-x md:divide-gray-300">
            
            {/* Boletín (Newsletter) */}
            <div className="flex flex-col xl:flex-row items-center xl:justify-start px-4 gap-4">
              <h3 className="text-gray-800 font-bold text-sm xl:text-base text-center xl:text-left leading-tight">
                Enter your email to get<br className="hidden xl:block" /> latest deals & more!
              </h3>
              <div className="flex w-full max-w-sm">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-brand-primary"
                />
                <button className="bg-brand-dark hover:bg-gray-800 text-white px-4 py-2 text-sm font-bold transition-colors">
                  Sign Up
                </button>
              </div>
            </div>
            {/* Promo: App */}
            <div className="flex items-center justify-center px-6 gap-4">
              <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm">My Resto Supply App</p>
                <p className="text-gray-500 text-xs mb-0.5">It's faster & easier in the app.</p>
                <Link href="/app" className="text-brand-primary font-bold text-xs hover:underline">
                  Learn more about our App
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =========================================
          2. FOOTER PRINCIPAL (FONDO ROJO CORPORATIVO)
          ========================================= */}
      <div className="bg-brand-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            
            {/* COLUMNA 1: Logo, Descripción y Redes */}
            <div className="lg:col-span-1">
              <Link href="/">
                {/* Nota: Usamos brightness-0 invert para que tu logo original se vuelva completamente blanco sobre el fondo rojo */}
                <img src="/Logo.png" alt="My Resto Supply Logo" className="h-10 w-auto mb-6 brightness-0 invert" />
              </Link>
              <p className="text-sm text-white/90 leading-relaxed mb-6">
                As the largest online restaurant supply store, we offer the best selection, best prices, and fast shipping to keep your business functioning at its best.
              </p>
              
              {/* Redes Sociales */}
              <div className="flex space-x-3">
                {['instagram', 'youtube', 'facebook', 'tiktok', 'pinterest'].map((social) => (
                  <a key={social} href={`#${social}`} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8">
                    <span className="sr-only">{social}</span>
                    <div className="w-4 h-4 bg-white rounded-sm opacity-80" style={{ maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'12\'/%3E%3C/svg%3E")', WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'black\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'12\'/%3E%3C/svg%3E")', maskSize: 'contain', WebkitMaskSize: 'contain'}}></div>
                  </a>
                ))}
              </div>
            </div>

            {/* COLUMNA 2: Services */}
            <div>
              <h4 className="text-lg font-bold mb-4">Services</h4>
              <ul className="space-y-3 text-sm text-white/80">
                <li><Link href="/plus" className="hover:text-white hover:underline transition-colors">My Resto Plus</Link></li>
                <li><Link href="/rewards" className="hover:text-white hover:underline transition-colors">Rewards Program</Link></li>
                <li><Link href="/app" className="hover:text-white hover:underline transition-colors">My Resto Supply App</Link></li>
                <li><Link href="/custom" className="hover:text-white hover:underline transition-colors">Customize Your Supplies</Link></li>
                <li><Link href="/integrations" className="hover:text-white hover:underline transition-colors">Partners & Integrations</Link></li>
              </ul>
            </div>

            {/* COLUMNA 3: Resources */}
            <div>
              <h4 className="text-lg font-bold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-white/80">
                <li><Link href="/blog" className="hover:text-white hover:underline transition-colors">Blog</Link></li>
                <li><Link href="/outlet" className="hover:text-white hover:underline transition-colors">Scratch & Dent Outlet</Link></li>
                <li><Link href="/sales" className="hover:text-white hover:underline transition-colors">Weekly Sales</Link></li>
                <li><Link href="/coupons" className="hover:text-white hover:underline transition-colors">Coupons</Link></li>
                <li><Link href="/resources" className="hover:text-white hover:underline transition-colors">Food Service Resources</Link></li>
                <li><Link href="/reviews" className="hover:text-white hover:underline transition-colors">Store Reviews</Link></li>
              </ul>
            </div>

            {/* COLUMNA 4: About */}
            <div>
              <h4 className="text-lg font-bold mb-4">About</h4>
              <ul className="space-y-3 text-sm text-white/80">
                <li><Link href="/about" className="hover:text-white hover:underline transition-colors">About Us</Link></li>
                <li><Link href="/brands" className="hover:text-white hover:underline transition-colors">Our Brands</Link></li>
                <li><Link href="/careers" className="hover:text-white hover:underline transition-colors">Careers</Link></li>
                <li><Link href="/financing" className="hover:text-white hover:underline transition-colors">Financing & Payments</Link></li>
                <li><Link href="/sell" className="hover:text-white hover:underline transition-colors">Sell on My Resto Supply</Link></li>
                <li><Link href="/returns" className="hover:text-white hover:underline transition-colors">Return Policy</Link></li>
              </ul>
            </div>

            {/* COLUMNA 5: Get Quick Help */}
            <div>
              <h4 className="text-lg font-bold mb-4">Get Quick Help</h4>
              
              <div className="flex flex-col space-y-3 mb-6">
                <Link href="/help" className="bg-white text-brand-primary text-center font-bold text-sm py-2.5 rounded hover:bg-gray-100 transition-colors">
                  Help Center
                </Link>
                <Link href="/track-order" className="bg-transparent border border-white text-white text-center font-bold text-sm py-2.5 rounded hover:bg-white hover:text-brand-primary transition-colors">
                  Track my Order
                </Link>
              </div>

              <ul className="space-y-3 text-sm text-white/90">
                <li>
                  <Link href="/chat" className="flex items-center hover:text-white hover:underline transition-colors">
                    <span className="mr-2">💬</span> Chat Online
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="flex items-center hover:text-white hover:underline transition-colors">
                    <span className="mr-2">🚚</span> Shipping & Delivery
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* =========================================
            3. BARRA INFERIOR (COPYRIGHT & LEGAL)
            ========================================= */}
        <div className="border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-white/70 space-y-4 md:space-y-0">
            <p>© 2026 My Resto Supply, LLC - All Rights Reserved.</p>
            
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <Link href="/terms-of-sale" className="hover:text-white transition-colors">Terms of Sale</Link>
              <span className="hidden md:inline">|</span>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="hidden md:inline">|</span>
              <Link href="/terms-of-use" className="hover:text-white transition-colors">Terms of Use</Link>
              <span className="hidden md:inline">|</span>
              <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}