import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;

    if (customerEmail) {
      // 1. Verificar se o usuǭrio jǭ existe
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', customerEmail)
        .single();

      if (user) {
        // Atualiza para founder_pro
        await supabase
          .from('users')
          .update({ plan: 'founder_pro' })
          .eq('id', user.id);
      } else {
        // Cria usuǭrio como founder_pro
        await supabase
          .from('users')
          .insert([{ email: customerEmail, plan: 'founder_pro' }]);
      }
    }
  }

  res.json({ received: true });
}
