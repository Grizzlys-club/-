// Internal Supabase Edge Function. Requires secret bearer token.
// Called by a trusted backend after verified Stripe fulfilment, never by a browser.
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const siteUrl=Deno.env.get('PUBLIC_SITE_URL')!;
const apiKey=Deno.env.get('RESEND_API_KEY')!;
const sender=Deno.env.get('MAIL_FROM')!;
const internalSecret=Deno.env.get('INTERNAL_DELIVERY_SECRET')!;
const encoder=new TextEncoder();
const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const hash=async (token:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(token)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 if(req.headers.get('authorization')!==`Bearer ${internalSecret}`)return new Response('Forbidden',{status:403});
 let orderId:string;try{({orderId}=await req.json())}catch{return new Response('Invalid JSON',{status:400})}
 if(!/^[0-9a-f-]{36}$/i.test(orderId||''))return new Response('Invalid order',{status:400});
 const {data:order,error:oe}=await db.from('orders').select('id,owner_id,status,product_id').eq('id',orderId).single();
 if(oe||order?.status!=='paid')return new Response('Order not paid',{status:409});
 const {data:world,error:we}=await db.from('worlds').select('id,elf_name').eq('order_id',orderId).single();
 if(we||!world)return new Response('World missing',{status:409});
 const {data:authUser,error:ue}=await db.auth.admin.getUserById(order.owner_id);
 const email=authUser.user?.email;if(ue||!email)return new Response('Customer email missing',{status:409});
 const {data:prior}=await db.from('email_deliveries').select('status,attempts').eq('order_id',orderId).eq('kind','welcome').maybeSingle();
 if(prior?.status==='sent')return new Response('Already sent',{status:200});
 // The URL is a locator, not a login credential. The customer must authenticate
 // and RLS must verify ownership before loading private family information.
 const url=`${siteUrl.replace(/\/$/,'')}/welt/?world=${encodeURIComponent(world.id)}`;
 const plan=({basic:'Basic',magic:'Magic',ultimate:'Ultimate'} as Record<string,string>)[order.product_id]||'WichtelZauber';
 const html=`<!doctype html><html lang="de"><body style="margin:0;background:#f6f1e7;font-family:Arial,sans-serif;color:#17362c;padding:32px"><div style="max-width:600px;margin:auto;background:white;border-radius:20px;overflow:hidden"><div style="background:#173c30;color:#fff;text-align:center;padding:38px"><div style="font-size:44px">⭐🎄⭐</div><h1>Dein Weihnachtszauber beginnt!</h1><p>Deine persönliche Wichtelwelt ist bereit.</p></div><div style="padding:32px"><h2>Willkommen bei ${escapeHtml(world.elf_name)}!</h2><p>Dein ${escapeHtml(plan)}-Paket wartet auf dich: persönliche Geschichten, Weihnachtsmagie und viele Überraschungen.</p><p style="text-align:center;margin:36px 0"><a href="${escapeHtml(url)}" style="background:#173c30;color:white;padding:16px 26px;border-radius:10px;text-decoration:none;font-weight:bold">Meine Wichtelwelt öffnen</a></p><p style="font-size:13px;color:#65746d">Bitte melde dich mit deinem Kundenkonto an, um deine persönliche Wichtelwelt zu öffnen.</p></div></div></body></html>`;
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`welcome-${orderId}`},body:JSON.stringify({from:sender,to:[email],subject:`Deine WichtelZauber-Welt mit ${world.elf_name} ist bereit! ✨`,html})});
 const result=await response.json().catch(()=>({}));
 await db.from('email_deliveries').upsert({order_id:orderId,kind:'welcome',status:response.ok?'sent':'failed',provider_message_id:result.id||null,attempts:(prior?.attempts||0)+1,last_error:response.ok?null:JSON.stringify(result).slice(0,500),sent_at:response.ok?new Date().toISOString():null},{onConflict:'order_id,kind'});
 if(!response.ok)return new Response('Email provider failed',{status:502});

 return new Response('Sent',{status:200});
});
