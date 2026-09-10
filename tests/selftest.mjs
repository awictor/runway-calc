// Regression self-test for Runway. Extracts the app's real <script>, evaluates it
// against a minimal browser stub, and asserts the pure metric functions.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');

function el(){ const e={value:'',textContent:'',innerHTML:'',className:'',style:{},
  addEventListener(){},setAttribute(){},getAttribute(){return null;},querySelectorAll(){return[];},onclick:null}; return e; }
const ids={};
globalThis.document={getElementById:id=>ids[id]||(ids[id]=el()),querySelectorAll:()=>[],documentElement:el()};
globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
globalThis.window={matchMedia:()=>({matches:false})};
globalThis.matchMedia=globalThis.window.matchMedia;

const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).sort((a,b)=>b.length-a.length)[0];
const wrapped=js+`\n;globalThis.__t={saasMetrics,projectMRR,verdicts};`;
eval(wrapped);
const t=globalThis.__t;

let n=0; const check=(name,fn)=>{fn();n++;console.log('  ok -',name);};
const base={mrr:20000,growth:8,churn:3,gm:80,arpa:50,cac:300,cash:500000,burn:40000};

check('saasMetrics: ARR, customers, lifetime',()=>{
  const m=t.saasMetrics(base);
  assert.equal(m.arr,240000);
  assert.equal(Math.round(m.customers),400);       // 20000/50
  assert.ok(Math.abs(m.lifetimeMonths-33.333)<0.01); // 1/0.03
});
check('saasMetrics: LTV, LTV:CAC, payback',()=>{
  const m=t.saasMetrics(base);
  // LTV = arpa*gm/churn = 50*0.8/0.03 = 1333.33
  assert.ok(Math.abs(m.ltv-1333.33)<0.5,'ltv '+m.ltv);
  assert.ok(Math.abs(m.ltvCac-4.444)<0.01,'ltvcac '+m.ltvCac);
  // payback = cac/(arpa*gm) = 300/40 = 7.5
  assert.ok(Math.abs(m.paybackMonths-7.5)<0.001);
});
check('saasMetrics: NRR, net growth, runway',()=>{
  const m=t.saasMetrics(base);
  assert.ok(Math.abs(m.nrr-105)<0.001);        // 1+0.08-0.03
  assert.ok(Math.abs(m.netGrowth-5)<0.001);
  assert.ok(Math.abs(m.runwayMonths-12.5)<0.001); // 500000/40000
  assert.equal(t.saasMetrics({...base,burn:0}).runwayMonths,Infinity);
});
check('projectMRR: compounds net rate over 12 months',()=>{
  const p=t.projectMRR(20000,8,3); // net +5%/mo
  assert.equal(p.length,13);
  assert.equal(p[0],20000);
  assert.ok(Math.abs(p[12]-20000*Math.pow(1.05,12))<0.01);
});
check('verdicts: flags weak LTV:CAC and short runway',()=>{
  const weak=t.verdicts(t.saasMetrics({...base,cac:2000,cash:60000}));
  assert.ok(weak.some(v=>v.level==='bad'));
});

console.log(`\n${n} checks passed.`);
