import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('core shop views exist',()=>{for(const id of ['page-home','page-shop','page-config','page-cart','page-checkout','page-success','page-world','page-parents','page-account','page-faq'])assert.ok(html.includes('id="'+id+'"'),id)});
test('all 24 chapters are included',()=>{assert.ok(html.includes('Die Nacht der Entscheidung'));assert.ok(html.includes('Das Weihnachtswunder'));assert.ok(html.includes('titles.map((t,i)'))});
test('checkout clearly stays in demo mode',()=>{assert.match(html,/Keine Zahlung, keine echte E-Mail/);assert.match(html,/Demo-Bestellung abschliessen/)});
test('accessible controls and metadata exist',()=>{assert.match(html,/skip-link/);assert.match(html,/og:title/);assert.match(html,/aria-label/)});

test('customer dashboard and gift card exist',()=>{assert.match(html,/id="account-order"/);assert.match(html,/id="gift-card"/);assert.match(html,/id="print-card"/)});

const world=readFileSync(new URL('../welt/index.html',import.meta.url),'utf8');
const explorer=readFileSync(new URL('../welt/three-world.js',import.meta.url),'utf8');
test('personal world is independent from storefront',()=>{assert.match(world,/<title>Meine Wichtelwelt/);assert.doesNotMatch(world,/data-page="shop"/);assert.match(world,/id="view-missions"/)});
test('six quests, letters, memory and calendar are present',()=>{assert.match(world,/const missions=\[/);assert.match(world,/Die Weihnachtsmissionen/);assert.match(world,/id="letter-form"/);assert.match(world,/id="memory"/);assert.match(world,/id="calendar"/)});
test('3D explorer has mobile movement and keyboard controls',()=>{assert.match(world,/data-move="w"/);assert.match(explorer,/requestAnimationFrame/);assert.match(explorer,/keydown/);assert.match(explorer,/pointermove/)});
