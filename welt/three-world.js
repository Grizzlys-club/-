// WichtelZauber 3D exploration - independent customer-world experience
// Three.js is loaded from a pinned CDN; network access is required for 3D.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const root=document.getElementById('three-world');
const stage=document.getElementById('three-stage');
const status=document.getElementById('three-status');
const hint=document.getElementById('three-hint');
const openBtn=document.getElementById('three-enter');
const closeBtn=document.getElementById('three-exit');
const interactBtn=document.getElementById('three-interact');
if(!root||!stage)throw Error('Missing 3D world host');
let renderer,scene,camera,player,active=false,clock,raf,near=null;
const obstacles=[{x:0,z:-11,r:5.6},{x:24,z:-10,r:4.6},{x:24,z:22,r:5.1}];
const canWalk=(x,z)=>!obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r);
const keys=new Set();
let snowfall=[];let worldTime=0;
const destinations=[
{name:'Wichtelhaus',x:0,z:-11,emoji:'🏡',text:'Willkommen in deinem Wichtelhaus! Hier beginnt jeden Tag eine neue Weihnachtsgeschichte.',view:'advent',tier:0},
{name:'Zauberwald',x:-24,z:-12,emoji:'🌲',text:'Zwischen den Tannen raschelt es. Vielleicht wartet hier ein neues Geheimnis.',view:'village',tier:1},
{name:'Wichteldorf',x:24,z:-10,emoji:'🏘️',text:'Im Wichteldorf werden Weihnachtswünsche gesammelt und kleine Wunder vorbereitet.',view:'village',tier:2},
{name:'Weihnachtswerkstatt',x:24,z:22,emoji:'🛠️',text:'Die Werkstatt funkelt im Schein unzähliger Lichter.',view:'village',tier:2},
{name:'Nordpol',x:-25,z:22,emoji:'⭐',text:'Am Nordpol strahlt der grosse Weihnachtsstern.',view:'village',tier:2}
];
const getTier=()=>({basic:0,magic:1,ultimate:2})[new URLSearchParams(location.search).has('world')?window.__worldEntitlement:new URLSearchParams(location.search).get('paket')]??2;
const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,...opts});
const snow=mat('#e5eef4',{roughness:0.95}),wood=mat('#9d6352'),roof=mat('#f1f5f5'),treeMat=mat('#1d6758'),trunk=mat('#71513e'),gold=mat('#f5c56c',{emissive:'#76531b',emissiveIntensity:.6}),stone=mat('#8ca4ae');
function addBox(x,y,z,w,h,d,m){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh}
function tree(x,z,s=1){const t=new THREE.Mesh(new THREE.CylinderGeometry(.25*s,.38*s,2*s,7),trunk);t.position.set(x,1*s,z);scene.add(t);for(let i=0;i<3;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry((2.7-i*.55)*s,3.2*s,8),treeMat);cone.position.set(x,(2.8+i*1.35)*s,z);cone.castShadow=true;scene.add(cone)}const tip=new THREE.Mesh(new THREE.SphereGeometry(.15*s,8,8),snow);tip.position.set(x,6.15*s,z);scene.add(tip)}
function cabin(x,z,scale=1){addBox(x,1.7*scale,z,5*scale,3.4*scale,4*scale,wood);const a=new THREE.Mesh(new THREE.ConeGeometry(4.4*scale,3.3*scale,4),roof);a.rotation.y=Math.PI/4;a.position.set(x,4.55*scale,z);a.castShadow=true;scene.add(a);addBox(x,1.15*scale,z+2.03*scale,1.25*scale,2.2*scale,.14*scale,mat('#5d4036'));for(const dx of [-1.5,1.5])addBox(x+dx*scale,2.2*scale,z+2.08*scale,.85*scale,.85*scale,.12*scale,gold)}
function sign(x,z,label){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#f5dfb5';ctx.fillRect(0,0,512,128);ctx.fillStyle='#233c36';ctx.font='bold 39px sans-serif';ctx.textAlign='center';ctx.fillText(label,256,77);const tex=new THREE.CanvasTexture(canvas);const plane=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));plane.position.set(x,3.3,z+4);scene.add(plane)}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color('#122a41');scene.fog=new THREE.Fog('#122a41',42,110);
 camera=new THREE.PerspectiveCamera(65,1,.1,180);renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'default'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;stage.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight('#e5f5ff','#415b5d',2.2));const moon=new THREE.DirectionalLight('#ffe9bf',2.3);moon.position.set(-18,30,-15);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);scene.add(moon);
 // Cinematic snowfall and an illuminated portal to each destination.
 const flakePositions=new Float32Array(1200*3);
 for(let i=0;i<1200;i++){flakePositions[i*3]=(Math.random()-.5)*135;flakePositions[i*3+1]=Math.random()*28;flakePositions[i*3+2]=(Math.random()-.5)*135}
 const flakes=new THREE.BufferGeometry();flakes.setAttribute('position',new THREE.BufferAttribute(flakePositions,3));
 const snowflakes=new THREE.Points(flakes,new THREE.PointsMaterial({color:'#f8fbff',size:.16,transparent:true,opacity:.78,depthWrite:false}));scene.add(snowflakes);snowfall=[snowflakes];
 for(const d of destinations){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.1,.16,12,48),new THREE.MeshStandardMaterial({color:'#f6d79c',emissive:'#e8b15c',emissiveIntensity:1.6,metalness:.5,roughness:.2}));ring.position.set(d.x,2.5,d.z+7);scene.add(ring);d.ring=ring;const glow=new THREE.PointLight('#ffc87e',7,13);glow.position.set(d.x,3,d.z+7);scene.add(glow)}
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),snow);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const path=new THREE.Mesh(new THREE.PlaneGeometry(8,75),mat('#d0d9d9'));path.rotation.x=-Math.PI/2;path.position.set(0,.02,0);scene.add(path);
 cabin(0,-11,1.4);cabin(24,-10,1.1);cabin(24,22,1.2);
 for(let i=0;i<105;i++){const a=i*2.399963,rad=17+Math.sqrt(i)*5.1,x=Math.cos(a)*rad,z=Math.sin(a)*rad;if(Math.abs(x)<7&&z>-30&&z<32)continue;tree(x,z,.45+(i%5)*.09)}
 for(let i=0;i<14;i++){const light=new THREE.Mesh(new THREE.SphereGeometry(.13,8,8),gold);light.position.set(Math.sin(i*2.2)*15,2+(i%3)*1.1,Math.cos(i*2.2)*15);scene.add(light)}
 const star=new THREE.Mesh(new THREE.IcosahedronGeometry(2.3,0),gold);star.position.set(-25,9,22);scene.add(star);
 for(const d of destinations)sign(d.x,d.z,d.name);
 player={x:0,z:7,yaw:0};clock=new THREE.Clock();
 const resize=()=>{const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};new ResizeObserver(resize).observe(stage);resize();
}
function step(){if(!active)return;const dt=Math.min(clock.getDelta(),.05);worldTime+=dt;for(const f of snowfall){const p=f.geometry.attributes.position;for(let i=0;i<p.count;i++){p.array[i*3+1]-=dt*(1.2+(i%7)*.18);if(p.array[i*3+1]<.2)p.array[i*3+1]=27}p.needsUpdate=true}for(const d of destinations){if(d.ring){d.ring.rotation.y=worldTime*.42;d.ring.position.y=2.5+Math.sin(worldTime*1.3+d.x)*.22}}const speed=(keys.has('shift')?12:7)*dt;const forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));const side=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));if(forward||side){const norm=Math.hypot(forward,side);const dx=((Math.sin(player.yaw)*forward+Math.cos(player.yaw)*side)/norm)*speed;const dz=((-Math.cos(player.yaw)*forward+Math.sin(player.yaw)*side)/norm)*speed;const nx=THREE.MathUtils.clamp(player.x+dx,-67,67),nz=THREE.MathUtils.clamp(player.z+dz,-67,67);if(canWalk(nx,player.z))player.x=nx;if(canWalk(player.x,nz))player.z=nz}
 camera.position.set(player.x,2.4,player.z);camera.rotation.order='YXZ';camera.rotation.y=player.yaw;camera.rotation.x=-.06;
 near=destinations.find(d=>Math.hypot(player.x-d.x,player.z-(d.z+5))<7)||null;
 hint.textContent=near?'✨ '+near.name+' · '+(getTier()>=near.tier?'Drücke E oder «Entdecken»':'In einem höheren Paket enthalten'):'Bewege dich mit WASD oder den Pfeiltasten. Ziehe zum Umschauen.';
 interactBtn.disabled=!near||getTier()<near.tier;
 renderer.render(scene,camera);raf=requestAnimationFrame(step)
}
function enter(){if(new URLSearchParams(location.search).has('world')&&!window.__worldEntitlement){status.textContent='Bitte zuerst mit deinem Kundenkonto anmelden.';return;}root.classList.remove('hidden');if(!renderer){try{init()}catch(e){status.textContent='3D konnte auf diesem Gerät nicht gestartet werden.';return}}active=true;clock.getDelta();step();root.scrollIntoView({behavior:'smooth'});}
function exit(){active=false;cancelAnimationFrame(raf);keys.clear();root.classList.add('hidden')}
function interact(){if(!near||getTier()<near.tier)return;status.textContent=near.text;window.dispatchEvent(new CustomEvent('world:place',{detail:{name:near.name,text:near.text,view:near.view}}));}
openBtn.addEventListener('click',enter);closeBtn.addEventListener('click',exit);interactBtn.addEventListener('click',interact);
document.getElementById('three-open-calendar').onclick=()=>{exit();document.querySelector('[data-view="advent"]').click()};
window.addEventListener('keydown',e=>{if(!active)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','shift'].includes(k)){e.preventDefault();keys.add(k)}if(k==='e')interact();if(k==='escape')exit()});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
let dragging=false,lastX=0;stage.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;stage.setPointerCapture(e.pointerId)});stage.addEventListener('pointermove',e=>{if(!dragging||!active)return;player.yaw-=(e.clientX-lastX)*.006;lastX=e.clientX});stage.addEventListener('pointerup',()=>dragging=false);
document.querySelectorAll('[data-move]').forEach(b=>{const k=b.dataset.move;b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(k);b.setPointerCapture(e.pointerId)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(k))});

window.addEventListener('world:teleport',e=>{const d=destinations.find(x=>x.name===e.detail);if(!d||getTier()<d.tier)return;enter();player.x=d.x;player.z=d.z+8;player.yaw=0;status.textContent='Du bist am '+d.name+' angekommen.'});
