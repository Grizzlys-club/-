// Public config is intentionally absent until Supabase is deployed.
// Create /welt/world-config.json with { "supabaseUrl": "...", "supabaseAnonKey": "..." }.
// Never place service-role keys in this file.
const worldId=new URLSearchParams(location.search).get('world');
if(worldId){
 const overlay=document.getElementById('world-auth');
 const message=document.getElementById('world-auth-message');
 overlay.classList.remove('hidden');
 const show=s=>message.textContent=s;
 const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(worldId);
 if(!valid){show('Dieser persönliche Link ist ungültig.');}
 else {
 try{
  const configResponse=await fetch('./world-config.json',{cache:'no-store'});
  if(!configResponse.ok)throw Error('Die Anmeldung wird gerade eingerichtet. Bitte versuche es später erneut.');
  const cfg=await configResponse.json();
  if(!/^https:\/\//.test(cfg.supabaseUrl)||!cfg.supabaseAnonKey)throw Error('Die Anmeldung ist noch nicht konfiguriert.');
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm');
  const db=createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
  const validate=async()=>{
   const {data:{user}}=await db.auth.getUser();
   if(!user){show('Bitte melde dich an, um deine Wichtelwelt zu öffnen.');return}
   const {data,error}=await db.rpc('my_worlds');
   if(error)throw Error('Deine Wichtelwelt konnte nicht geladen werden.');
   const world=data?.find(w=>w.world_id===worldId);
   if(!world){show('Diese Wichtelwelt gehört nicht zu deinem Konto oder wurde noch nicht freigeschaltet.');return}
   // Only server-confirmed package entitlements are trusted for a paid world.
   const plan=world.package;
   const url=new URL(location.href);url.searchParams.set('paket',plan);
   document.getElementById('hero-name').textContent=world.elf_name.endsWith('s')?world.elf_name+"'":world.elf_name+'s';
   document.getElementById('demo-notice').textContent='✨ Deine persönliche Wichtelwelt · '+plan.toUpperCase();
   overlay.classList.add('hidden');
   // NOTE: story progress and messages remain browser-local until persistence integration.
   // The URL package is only for demo display; paid access must be enforced in the database.
  };
  document.getElementById('world-login').addEventListener('submit',async e=>{
   e.preventDefault();
   const email=document.getElementById('world-email').value.trim();
   const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:location.href}});
   show(error?'Anmeldelink konnte nicht gesendet werden.':'Bitte prüfe deine E-Mails und öffne den Anmeldelink.');
  });
  await validate();
  db.auth.onAuthStateChange(()=>{void validate().catch(e=>show(e.message))});
 }catch(e){show(e.message||'Die Anmeldung ist momentan nicht verfügbar.')}
 }
}
