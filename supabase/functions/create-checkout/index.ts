// Supabase Edge Function: POST /functions/v1/create-checkout
// Requires JWT; Stripe secret stays on the server. Deploy with JWT verification enabled.
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17.7.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const siteUrl = Deno.env.get('PUBLIC_SITE_URL')!;
const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });

const cors = { 'Access-Control-Allow-Origin': siteUrl, 'Access-Control-Allow-Headers': 'authorization, content-type, apikey', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' };
function reply(data: unknown, status=200) { return new Response(JSON.stringify(data), { status, headers: cors }); }

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' },405);
  if (req.headers.get('origin') !== siteUrl) return reply({error:'Origin not allowed'},403);
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
  if (!token) return reply({error:'Login required'},401);
  const userClient = createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:`Bearer ${token}`}}});
  const { data:{user}, error:userError } = await userClient.auth.getUser(token);
  if(userError || !user) return reply({error:'Invalid session'},401);
  let productId: string;
  try { const body=await req.json(); productId=body.productId; } catch { return reply({error:'Invalid JSON'},400); }
  if(!['basic','magic','ultimate'].includes(productId)) return reply({error:'Invalid product'},400);
  const admin=createClient(supabaseUrl,serviceKey);
  const {data:product,error:productError}=await admin.from('products').select('id,title,price_rappen,currency,active').eq('id',productId).single();
  if(productError || !product?.active) return reply({error:'Product unavailable'},404);
  const {data:order,error:orderError}=await admin.from('orders').insert({
    owner_id:user.id,product_id:product.id,amount_rappen:product.price_rappen,currency:product.currency,status:'pending',provider:'stripe'
  }).select('id').single();
  if(orderError || !order) return reply({error:'Could not create order'},500);
  try {
    const session=await stripe.checkout.sessions.create({
      mode:'payment',
      customer_email:user.email,
      client_reference_id:order.id,
      line_items:[{price_data:{currency:'chf',unit_amount:product.price_rappen,product_data:{name:`WichtelZauber ${product.title}`}},quantity:1}],
      success_url:`${siteUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${siteUrl}/?checkout=cancelled`,
      metadata:{order_id:order.id,user_id:user.id},
      payment_method_types:undefined
    });
    if(!session.url) throw new Error('Missing checkout URL');
    const {error:updateError}=await admin.from('orders').update({provider_session_id:session.id}).eq('id',order.id).eq('status','pending');
    if(updateError) throw updateError;
    return reply({url:session.url});
  } catch(e) {
    console.error('Checkout failed',e);
    await admin.from('orders').update({status:'cancelled'}).eq('id',order.id).eq('status','pending');
    return reply({error:'Checkout unavailable'},502);
  }
});
