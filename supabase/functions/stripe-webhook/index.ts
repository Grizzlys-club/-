// Supabase Edge Function: Stripe webhook. Deploy with verify_jwt = false.
// Only signed Stripe events are accepted; never call this from the browser.
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripe=new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!,{apiVersion:'2025-02-24.acacia'});
const secret=Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
Deno.serve(async req=>{
  if(req.method!=='POST')return new Response('Method not allowed',{status:405});
  const signature=req.headers.get('stripe-signature');
  if(!signature)return new Response('Missing signature',{status:400});
  let event:Stripe.Event;
  try {
    const raw=await req.text();
    event=await stripe.webhooks.constructEventAsync(raw,signature,secret);
  }catch(e){console.error('Invalid Stripe signature',e);return new Response('Invalid signature',{status:400});}
  if(event.type!=='checkout.session.completed' && event.type!=='checkout.session.async_payment_succeeded')return new Response('Ignored',{status:200});
  const session=event.data.object as Stripe.Checkout.Session;
  if(session.payment_status!=='paid')return new Response('Payment not completed',{status:200});
  const orderId=session.metadata?.order_id;
  if(!orderId || session.currency?.toUpperCase()!=='CHF' || !Number.isInteger(session.amount_total))
    return new Response('Invalid payment metadata',{status:400});
  const {error}=await admin.rpc('fulfil_paid_order',{
    p_order_id:orderId,
    p_provider_session_id:session.id,
    p_amount_rappen:session.amount_total,
    p_currency:session.currency
  });
  if(error){console.error('Fulfilment failed',error);return new Response('Retry later',{status:500});}
  return new Response('OK',{status:200});
});
