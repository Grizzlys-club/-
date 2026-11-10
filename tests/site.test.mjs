import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('core shop views exist',()=>{for(const id of ['page-home','page-shop','page-config','page-cart','page-checkout','page-success','page-world','page-parents','page-account','page-faq'])assert.ok(html.includes('id="'+id+'"'),id)});
test('all 24 chapters are included',()=>{assert.ok(html.includes('Die Nacht der Entscheidung'));assert.ok(html.includes('Das Weihnachtswunder'));assert.ok(html.includes('titles.map((t,i)'))});
test('checkout clearly stays in demo mode',()=>{assert.match(html,/Keine Zahlung, keine echte E-Mail/);assert.match(html,/Demo-Bestellung abschliessen/)});
test('accessible controls and metadata exist',()=>{assert.match(html,/skip-link/);assert.match(html,/og:title/);assert.match(html,/aria-label/)});

test('customer dashboard and gift card exist',()=>{assert.match(html,/id="account-order"/);assert.match(html,/id="gift-card"/);assert.match(html,/id="print-card"/)});
