// Public config is intentionally absent until Supabase is deployed.
// Create /welt/world-config.json with { "supabaseUrl": "...", "supabaseAnonKey": "..." }.
// Never place service-role keys in this file.
const worldId=new URLSearchParams(location.search).get('world');
if(worldId){
 const overlay=document.getElementById('world-auth');
 const message=document.getElementById('world-auth-message');
 overlay.classList.remove('hidden');
 const show=s=>message.textContent=s;
 const form=document.getElementById('world-login');
 const valid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(worldId);
 if(!valid){show('Dieser persönliche Link ist ungültig.');}
 else {
 try{
  const configResponse=await fetch('./world-config.json',{cache:'no-store'});
  if(!configResponse.ok)throw Error('Der E-Mail-Versand ist noch nicht mit Supabase verbunden. Bitte kontaktiere WichtelZauber; es wurde keine E-Mail verschickt.');
  const cfg=await configResponse.json();
  if(!/^https:\/\//.test(cfg.supabaseUrl)||!cfg.supabaseAnonKey)throw Error('Die Anmeldung ist noch nicht konfiguriert. Es wurde keine E-Mail verschickt.');
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
   window.__worldEntitlement=plan;
   const [progress,missions,letters]=await Promise.all([
     db.from('episode_progress').select('day').eq('world_id',worldId),
     db.from('world_missions').select('mission_id').eq('world_id',worldId),
     db.from('wichtel_messages').select('body').eq('world_id',worldId).order('created_at',{ascending:true})
   ]);
   if(progress.error||missions.error||letters.error)throw Error('Deine persönlichen Daten konnten nicht geladen werden.');
   const initial={opened:progress.data.map(x=>x.day),missions:missions.data.map(x=>x.mission_id),letters:letters.data.map(x=>x.body)};
   window.dispatchEvent(new CustomEvent('world:authenticated',{detail:{package:plan,elf_name:world.elf_name,...initial}}));
   const known={opened:new Set(initial.opened),missions:new Set(initial.missions),letters:initial.letters.length};
   if(!window.__worldSyncAttached){
     window.__worldSyncAttached=true;
     window.addEventListener('world:changed',async e=>{
       const d=e.detail;
       const newDays=d.opened.filter(x=>!known.opened.has(x));
       const newMissions=d.missions.filter(x=>!known.missions.has(x));
       const newLetters=d.letters.slice(known.letters);
       for(const day of newDays){const {error}=await db.from('episode_progress').upsert({world_id:worldId,day},{onConflict:'world_id,day'});if(!error)known.opened.add(day)}
       for(const mission_id of newMissions){const {error}=await db.from('world_missions').upsert({world_id:worldId,mission_id},{onConflict:'world_id,mission_id'});if(!error)known.missions.add(mission_id)}
       for(const body of newLetters){const {error}=await db.from('wichtel_messages').insert({world_id:worldId,body});if(!error)known.letters++}
     });
   }
   document.getElementById('hero-name').textContent=world.elf_name.endsWith('s')?world.elf_name+"'":world.elf_name+'s';
   document.getElementById('demo-notice').textContent='✨ Deine persönliche Wichtelwelt · '+plan.toUpperCase();
   overlay.classList.add('hidden');
   // Paid access is enforced by RLS and the authenticated owner lookup.
  };
  document.getElementById('world-login').addEventListener('submit',async e=>{
   e.preventDefault();
   const email=document.getElementById('world-email').value.trim();
   const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:location.href}});
   show(error?'E-Mail konnte nicht angefordert werden: '+error.message:'Anmeldelink angefordert. Bitte prüfe deinen Posteingang und Spamordner.');
  });
  await validate();
  db.auth.onAuthStateChange(()=>{void validate().catch(e=>show(e.message))});
 }catch(e){form.querySelector('button').disabled=true;show(e.message||'Die Anmeldung ist momentan nicht verfügbar. Es wurde keine E-Mail verschickt.')}
 }
}
