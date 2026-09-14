import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  // En Next.js App Router, request.text() ya nos devuelve el body en crudo (raw)
  // necesario para verificar la firma de Stripe.
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    if (webhookSecret && !webhookSecret.includes('esperando')) {
      // Validamos que el webhook realmente venga de Stripe por seguridad
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Modo de desarrollo local (simulado sin CLI)
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Escuchamos cuando el pago se completa con éxito
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`💰 PaymentIntent succeeded: ${paymentIntent.id}`);

    // Aquí puedes actualizar el estado de la orden en Supabase si ya tienes su ID guardado,
    // o asegurarte de que quede registrada como pagada.
  }

  return NextResponse.json({ received: true });
}