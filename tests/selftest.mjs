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
globalThis.location={hash:'',origin:'',pathname:''};
globalThis.window={matchMedia:()=>({matches:false}),location:globalThis.location};
globalThis.matchMedia=globalThis.window.matchMedia;
try{Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:()=>Promise.resolve()}},configurable:true});}catch{}

const js=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).sort((a,b)=>b.length-a.length)[0];
const wrapped=js+`\n;globalThis.__t={saasMetrics,projectMRR,verdicts,growthEfficiency,effVerdicts,quickRatio,monthsToBreakeven,extraVerdicts,encodeInputs,decodeInputs,summaryText,scenarios,magicNumber,retentionCurve,halfLife,arrEta,burnSensitivity};`;
eval(wrapped);
const t=globalThis.__t;

let n=0; const check=(name,fn)=>{fn();n++;console.log('  ok -',name);};
const base={mrr:20000,growth:8,churn:3,gm:80,arpa:50,cac:300,cash:500000,burn:40000,expansion:2};

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
  assert.ok(Math.abs(m.nrr-99)<0.001);         // 1+expansion(2%)-churn(3%) = 99%
  assert.ok(Math.abs(m.grr-97)<0.001);         // 1-churn = 97%
  assert.ok(Math.abs(m.newLogoGrowth-6)<0.001);// growth 8 - expansion 2
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

check('growthEfficiency: Rule of 40 + burn multiple',()=>{
  // net monthly +5% -> annualized ~79.6%; profit margin = -40000/20000 = -200%; rule40 ~ -120
  const e=t.growthEfficiency(base);
  assert.ok(Math.abs(e.annualGrowth-79.586)<0.1,'annualGrowth '+e.annualGrowth);
  assert.ok(Math.abs(e.profitMargin-(-200))<0.001);
  assert.ok(Math.abs(e.ruleOf40-(-120.41))<0.2,'r40 '+e.ruleOf40);
  // netNewMRR = 20000*0.05 = 1000; burn 40000 -> 40x
  assert.ok(Math.abs(e.burnMultiple-40)<0.001,'bm '+e.burnMultiple);
  // profitable case: burn 0 -> burn multiple 0
  assert.equal(t.growthEfficiency({...base,burn:0}).burnMultiple,0);
});
check('effVerdicts: flags sub-40 and high burn multiple',()=>{
  const v=t.effVerdicts(t.growthEfficiency(base));
  assert.ok(v.some(x=>x.level==='warn'||x.level==='bad'));
});

check('quickRatio: growth vs churn',()=>{
  assert.ok(Math.abs(t.quickRatio(8,3)-2.667)<0.01);
  assert.equal(t.quickRatio(8,0),Infinity);
});
check('monthsToBreakeven: grows into profit; 0 if profitable; ∞ if flat',()=>{
  // base: gm .8, burn 40000, target MRR = 20000 + 40000/0.8 = 70000; r=.05
  // months = ln(70000/20000)/ln(1.05) = ln(3.5)/ln(1.05) ≈ 25.68
  assert.ok(Math.abs(t.monthsToBreakeven(base)-25.68)<0.2,'be '+t.monthsToBreakeven(base));
  assert.equal(t.monthsToBreakeven({...base,burn:0}),0);
  assert.equal(t.monthsToBreakeven({...base,growth:3,churn:3}),Infinity); // net 0 growth
});

check('share codec: round-trips inputs, rejects garbage',()=>{
  const enc=t.encodeInputs(base);
  assert.deepEqual(t.decodeInputs(enc),base);
  assert.equal(t.decodeInputs('!!!bad'),null);
});

check('summaryText: multiline snapshot with key metrics',()=>{
  const txt=t.summaryText(base);
  assert.ok(txt.split('\n').length>=6);
  assert.match(txt,/ARR \$240,000/);
  assert.match(txt,/LTV:CAC 4\.4×/);
  assert.match(txt,/Runway 12\.5 mo/);
});

check('scenarios: best beats base beats worst on growth',()=>{
  const sc=t.scenarios(base,2); // growth ±2, churn ∓1
  assert.ok(sc.best.netGrowth>sc.base.netGrowth);
  assert.ok(sc.base.netGrowth>sc.worst.netGrowth);
  assert.ok(sc.best.mrr12>sc.base.mrr12 && sc.base.mrr12>sc.worst.mrr12);
  assert.ok(Math.abs(sc.base.netGrowth-5)<0.001); // base unchanged
});

check('magicNumber: net new ARR / S&M',()=>{
  // sm = 300*(20000*.08)/50 = 9600; netNewARR = 20000*.05*12 = 12000; magic = 1.25
  assert.ok(Math.abs(t.magicNumber(base)-1.25)<0.001,'mn '+t.magicNumber(base));
  assert.equal(t.magicNumber({...base,growth:0}),Infinity); // no S&M
});

check('retentionCurve + halfLife',()=>{
  const rc=t.retentionCurve(3,24);
  assert.equal(rc.length,25);
  assert.equal(rc[0],100);
  assert.ok(Math.abs(rc[12]-Math.pow(0.97,12)*100)<0.001);
  assert.ok(Math.abs(t.halfLife(3)-22.756)<0.01,'hl '+t.halfLife(3));
  assert.equal(t.halfLife(0),Infinity);
});

check('arrEta: months to a target ARR; reached / never edges',()=>{
  // base MRR 20000, net 5%/mo. to $1M ARR (MRR 83333): ln(83333/20000)/ln(1.05) ≈ 29.25
  assert.ok(Math.abs(t.arrEta(20000,5,1e6)-29.25)<0.2,'eta '+t.arrEta(20000,5,1e6));
  assert.equal(t.arrEta(100000,5,1e6),0);   // already past ($1.2M ARR)
  assert.equal(t.arrEta(20000,0,1e6),Infinity);
});

check('burnSensitivity: runway scales inversely with burn',()=>{
  const rows=t.burnSensitivity(base,[-20,0,20]); // cash 500k, burn 40k
  assert.equal(rows.length,3);
  assert.ok(Math.abs(rows[1].runway-12.5)<0.001);        // base
  assert.ok(Math.abs(rows[0].runway-15.625)<0.001);      // burn 32k
  assert.ok(Math.abs(rows[2].runway-10.4167)<0.001);     // burn 48k
});

console.log(`\n${n} checks passed.`);
