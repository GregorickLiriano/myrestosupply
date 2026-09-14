import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../app/components/Header"; // o "./components/Header" dependiendo de tu estructura exacta
import Footer from "../app/components/Footer";

// 🚀 1. Importamos el Provider del carrito y el componente del Drawer
import { CartProvider } from "../context/CartContext"; 
import CartDrawer from "../app/components/CartDrawer"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Your Ecommerce Store", // Traducido al inglés
  description: "Online store",
};

export default function RootLayout({
  children,
}: Readonly<{ // Corregido: antes decía 'Readline'
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        
        {/* 🚀 2. Envolvemos TODA la aplicación en el CartProvider */}
        <CartProvider>
          <Header />
          
          {children}
          
          {/* 🚀 3. Colocamos el Carrito Lateral (Drawer) aquí para que sea global */}
          <CartDrawer />
          
          <Footer />
        </CartProvider>

      </body>
    </html>
  );
}