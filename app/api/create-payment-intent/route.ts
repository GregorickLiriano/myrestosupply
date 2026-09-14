import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount } = body; 

    // Obtenemos la llave de manera segura
    const secretKey = process.env.STRIPE_SECRET_KEY || '';

    // Si aún no tienes las llaves reales, devolvemos el secreto falso sin ejecutar Stripe
    if (!secretKey || secretKey.includes('esperando')) {
      return NextResponse.json({ clientSecret: 'dummy_secret_for_testing' });
    }

    // 🚀 AHORA INICIALIZAMOS STRIPE SOLO SI LA LLAVE ES REAL
    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20' as any, 
    });

    // Creamos el intento de pago real en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true, 
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    
  } catch (error: any) {
    console.error("Stripe Error:", error);
    // Devolvemos el error limpiamente para que el navegador no colapse
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}