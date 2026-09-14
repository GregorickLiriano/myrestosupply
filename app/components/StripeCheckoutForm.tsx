'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const isDummyKey = !pubKey || pubKey.includes('esperando') || pubKey.includes('test_key');
const stripePromise = !isDummyKey ? loadStripe(pubKey) : null;

function CheckoutForm({ amount, customerEmail, onSuccess }: { amount: number, customerEmail: string, onSuccess: (transactionId: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required', 
    });

    if (stripeError) {
      setError(stripeError.message || 'An unexpected error occurred.');
      setProcessing(false);
      
      if (customerEmail) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'error', customerEmail })
        });
      }
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      
      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm border border-red-200 font-bold">{error}</div>}
      
      <button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full bg-brand-primary text-white font-black uppercase tracking-widest py-4 rounded hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg flex justify-center items-center gap-3 cursor-pointer disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing Payment...</span>
          </>
        ) : (
          `Pay $${(amount / 100).toFixed(2)}`
        )}
      </button>
    </form>
  );
}

export default function StripeCheckoutForm({ amount, customerEmail, onPaymentSuccess }: { amount: number, customerEmail: string, onPaymentSuccess: (transactionId: string) => void }) {
  const [clientSecret, setClientSecret] = useState('');
  const [simulating, setSimulating] = useState(false);
  
  // 🚀 CANDADO PARA EVITAR QUE SE CREE MÁS DE UN PAYMENT INTENT EN MUNTURAS DOBLES (REACT STRICT MODE)
  const hasFetched = useRef(false);

  useEffect(() => {
    if (isDummyKey || hasFetched.current) return; 
    hasFetched.current = true;

    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(amount * 100) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      });
  }, [amount]);

  const handleSimulatedClick = () => {
    setSimulating(true);
    setTimeout(() => {
      onPaymentSuccess('pi_simulated_transaction_12345');
    }, 1000);
  };

  if (isDummyKey) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-8 rounded-lg text-center">
        <span className="text-3xl block mb-2">💳</span>
        <h3 className="font-black text-gray-900 uppercase tracking-widest mb-2">Stripe Pending Keys</h3>
        <p className="text-sm text-gray-500 mb-4">Please add your real Stripe keys to your .env.local file, or test the simulation below.</p>
        
        <button 
          onClick={handleSimulatedClick} 
          disabled={simulating}
          className="bg-gray-900 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
        >
          {simulating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Simulating...</span>
            </>
          ) : (
            'Simulate Payment (Bypass)'
          )}
        </button>
      </div>
    );
  }

  if (!clientSecret) return <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin"></div></div>;

  return (
    <Elements stripe={stripePromise as any} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <CheckoutForm amount={Math.round(amount * 100)} customerEmail={customerEmail} onSuccess={onPaymentSuccess} />
    </Elements>
  );
}