// Run with: node tests/master.test.cjs
// Deterministic DOM/clock simulation; this does not replace a visual browser check.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),R=require('../master-assets/rules.js'),events=require('../master-assets/events.js');
const html=fs.readFileSync(path.join(root,'tout-pile-master.html'),'utf8');
const js=fs.readFileSync(path.join(root,'master-assets/game.js'),'utf8');
assert.equal(events.length,256);assert.equal(new Set(events.map(e=>e.title)).size,256);
for(const e of events){assert(Number.isInteger(e.date[0]));assert.notEqual(e.date[0],0);assert(e.url);}
assert.equal(R.timePoints(0),20000);assert.equal(R.timePoints(5),20000);
assert.equal(R.timePoints(10),18500);assert.equal(R.timePoints(65),2000);
assert.equal(R.timePoints(-1),20000);assert.equal(R.timePoints(90),2000);
assert.deepEqual(R.score(1789,1789,4,0),{time:20000,penalty:0,gap:0,proximity:0,exact:6000,total:26000});
assert.equal(R.score(1788,1789,4,1).total,24000);
assert.equal(R.score(1780,1789,65,1).proximity,500);
assert.equal(R.score(1779,1789,65,1).proximity,0);
assert.equal(R.score(-53,-52,0,1).gap,1);
assert.equal(R.score(null,1789,65,0).total,0);
assert.equal(R.score(1000,1789,65,30).total,0);
assert.equal(R.parseNames('Alice\nalice'),null);assert.equal(R.parseNames(' '),null);
assert.equal(R.parseNames(Array(9).fill(0).map((_,i)=>i).join('\n')),null);
assert.deepEqual(R.parseNames(' Alice ; Bob\nChloé '),['Alice','Bob','Chloé']);

function fixture(target=1789,reduced=false,withAudio=false){
  let now=0,next=0,tasks=new Map();
  class Element{
    constructor(id=''){this.id=id;this._text='';this.children=[];this.listeners={};this.attributes={};this.dataset={};this.disabled=false;this.hidden=false;this.open=false;this.value='';this._classes=new Set();this.style={setProperty(){}};this.offsetWidth=1;this.classList={add:(...a)=>a.forEach(x=>this._classes.add(x)),remove:(...a)=>a.forEach(x=>this._classes.delete(x)),toggle:(x,force)=>{const val=force??!this._classes.has(x);if(val)this._classes.add(x);else this._classes.delete(x);return val;},contains:x=>this._classes.has(x)};}
    set className(v){this._classes=new Set(v.split(/\s+/).filter(Boolean));}get className(){return [...this._classes].join(' ');}
    set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(x=>x.textContent).join('');}
    setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
    append(...items){this.children.push(...items);for(const x of items)x.parent=this;}
    replaceChildren(...items){this._text='';this.children=[];this.append(...items);}
    remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);}
    querySelectorAll(s){return this.children.filter(c=>c.classList.contains(s.slice(1)));}
    closest(){return this;}focus(){}showModal(){this.open=true;}close(){this.open=false;}
    click(){if(!this.disabled)for(const fn of this.listeners.click||[])fn({target:this});}
  }
  const els=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element(m[1])]));
  const keypadPanel=new Element(),body=new Element();
  const keys=[...'123456789','clear','0','back'].map(key=>{const e=new Element();e.dataset.key=key;return e;});
  const doc=new Element();doc.body=body;doc.hidden=false;
  doc.getElementById=id=>{assert(els[id],`Missing HTML id ${id}`);return els[id];};
  doc.createElement=()=>new Element();doc.querySelector=s=>{assert.equal(s,'.keypad-panel');return keypadPanel;};
  doc.querySelectorAll=s=>{assert.equal(s,'#keypad button, .era-picker button');return [...keys,els.ce,els.bce];};
  function schedule(fn,delay,interval=0){const id=++next;tasks.set(id,{fn,at:now+delay,interval});return id;}
  function advance(ms){const end=now+ms;let n=0;while(true){const choices=[...tasks].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at);if(!choices.length)break;const [id,t]=choices[0];now=t.at;if(t.interval)t.at+=t.interval;else tasks.delete(id);t.fn();assert(++n<100000,'Infinite timer loop');}now=end;}
  const win=new Element();win.matchMedia=()=>({matches:reduced});win.scrollTo=()=>{};
  const audioNodes=[];
  if(withAudio){
    class Param{constructor(){this.value=0;}setValueAtTime(v,t){assert(Number.isFinite(v)&&t>=0);this.value=v;}exponentialRampToValueAtTime(v,t){assert(v>0&&t>=0);this.value=v;}linearRampToValueAtTime(v,t){this.setValueAtTime(v,t);}setTargetAtTime(v,t){this.setValueAtTime(v,t);}}
    function node(type){const n={type,gain:new Param(),frequency:new Param(),Q:new Param(),connect(){},setPeriodicWave(){this.brass=true;},start(at){assert(at>=0);this.started=at;},stop(at){assert(at>=this.started);this.stopped=at;}};audioNodes.push(n);return n;}
    win.AudioContext=class{constructor(){this.destination={};this.sampleRate=44100;}get currentTime(){return now/1000;}resume(){return Promise.resolve();}createGain(){return node('gain');}createOscillator(){return node('oscillator');}createBiquadFilter(){return node('filter');}createPeriodicWave(r,i){assert.equal(r.length,i.length);return {};}createBuffer(c,n,sr){assert(c===1&&sr===44100&&n>0);return {getChannelData:()=>new Float32Array(n)};}createBufferSource(){return node('noise');}};
  }
  const ctx={document:doc,window:win,MasterRules:R,EVENTS:[0,1,2].map(i=>({title:'Événement '+i,date:[target,null,null],url:'sources.html'})),performance:{now:()=>now},setTimeout:(f,m)=>schedule(f,m),clearTimeout:id=>tasks.delete(id),setInterval:(f,m)=>schedule(f,m,m),clearInterval:id=>tasks.delete(id),console};
  vm.runInNewContext(js,ctx);
  const click=id=>els[id].click();
  const key=k=>{const event={key:k,preventDefault(){},ctrlKey:false,altKey:false,metaKey:false};for(const fn of doc.listeners.keydown||[])fn(event);};
  const enter=value=>{key('Escape');for(const d of String(Math.abs(value)))key(d);click(value<0?'bce':'ce');};
  const mouse=k=>{const e=keys.find(x=>x.dataset.key===k);assert(e);if(!e.disabled)for(const fn of els.keypad.listeners.click)fn({target:e});};
  const start=(names='Alice')=>{const multi=names.includes('\n');click(multi?'mode-multi':'mode-solo');els[multi?'players':'solo-name'].value=names;els['round-count'].value='3';click('begin');click('launch');};
  const shown=id=>!els[id].hidden;
  return {els,advance,click,key,enter,mouse,start,shown,audioNodes};
}
// Mode selection preserves both name fields; multiplayer requires at least two names.
{
  const f=fixture();assert.equal(f.els['mode-solo'].attributes['aria-pressed'],'true');assert(f.els['multi-fields'].hidden);
  f.els['solo-name'].value='Camille';f.click('mode-multi');assert(!f.els['multi-fields'].hidden);assert(f.els['solo-fields'].hidden);
  f.els.players.value='Alice';f.click('begin');assert(f.els['setup-error'].textContent.includes('2 à 8'));
  f.els.players.value='Alice\nBob';f.click('mode-solo');assert.equal(f.els['solo-name'].value,'Camille');assert.equal(f.els.players.value,'Alice\nBob');
  f.els['solo-name'].value='';f.els['round-count'].value='3';f.click('begin');assert(f.shown('ready'));assert.equal(f.els['ready-name'].textContent,'À toi, Joueur solo !');assert(!f.els['ready-instructions'].textContent.includes('autres'));
}
// Full solo game has one answer per round, personal total and no private handoff.
{
  const f=fixture(1789,true);f.start('Camille');
  for(let round=0;round<3;round++){
    if(round)f.click('launch');f.advance(150);f.enter(1789);f.click('submit');f.advance(1000);
    assert(f.shown('tally'));assert(f.els['tally-privacy'].hidden);f.click('tally-next');
    assert(f.shown('round-result'));assert.equal(f.els['round-body'].children.length,1);f.click('next-round');
  }
  assert(f.shown('final'));assert(f.els['final-title'].textContent.includes((78000).toLocaleString('fr-FR')));assert.equal(f.els.leaderboard.children.length,1);f.click('again');f.click('mode-multi');assert(!f.els['multi-fields'].hidden);
}
// Fanfare begins during the entrance; hammer adds a noise burst; mute is immediate.
{
  const f=fixture(1789,false,true);f.start();
  assert.equal(f.audioNodes.filter(n=>n.brass).length,8);
  assert(f.audioNodes.filter(n=>n.brass).every(n=>n.started<1.4&&n.stopped<1.4));
  f.advance(1400);f.enter(1700);f.click('submit');f.advance(810);
  assert.equal(f.audioNodes.filter(n=>n.type==='noise').length,1);
  f.click('sound');assert.equal(f.audioNodes[0].gain.value,0);const count=f.audioNodes.length;
  f.enter(1750);f.click('submit');f.advance(810);assert.equal(f.audioNodes.length,count);
  f.click('sound');assert.equal(f.audioNodes[0].gain.value,.45);assert(f.audioNodes.length>count);
}
// Intro is not charged; mouse and keyboard both work; exact answer stops the clock.
{
  const f=fixture();f.start();assert(f.els.submit.disabled);f.advance(1399);assert.equal(f.els.time.textContent,'65.0');f.advance(1);
  f.mouse('1');f.mouse('7');f.mouse('8');f.mouse('9');assert.equal(f.els.entry.textContent,'1789');f.advance(4000);f.click('submit');f.click('submit');f.advance(2200);
  assert(f.shown('tally'));f.advance(1600);assert.equal(f.els['tally-total'].textContent,(26000).toLocaleString('fr-FR'));assert.equal(f.els['tally-bricks'].textContent,'0');
}
// Wrong answers stack on the correct side; keep retains last submission time.
{
  const f=fixture();f.start();f.advance(1400+2000);f.enter(1700);f.click('submit');f.key('9');assert.equal(f.els.entry.textContent,'1700');f.advance(810);
  assert.equal(f.els['plus-bricks'].children.length,1);assert.equal(f.els.feedback.textContent,'C’EST PLUS !');
  f.enter(1800);f.click('submit');f.advance(810);assert.equal(f.els['minus-bricks'].children.length,1);
  f.advance(2000);f.click('keep');f.advance(1600);assert(f.shown('tally'));assert.equal(f.els['bricks-detail'].textContent,'2 × −500 pts');
  assert.equal(f.els['tally-total'].textContent,R.score(1800,1789,2.81,2).total.toLocaleString('fr-FR'));
}
// A wrong guess accepted before the deadline finishes its animation and is scored once.
{
  const f=fixture();f.start();f.advance(1400+64950);f.enter(1000);f.click('submit');f.advance(900);assert(f.shown('tally'));assert.equal(f.els['bricks-detail'].textContent,'1 × −500 pts');f.advance(1600);assert.equal(f.els['tally-total'].textContent,R.score(1000,1789,64.95,1).total.toLocaleString('fr-FR'));
}
// An exact answer just before zero still wins; an answer at/after zero is rejected.
{
  const f=fixture();f.start();f.advance(1400+64990);f.enter(1789);f.click('submit');f.advance(3800);assert(f.shown('tally'));assert.equal(f.els['tally-exact'].textContent,'+ '+(6000).toLocaleString('fr-FR'));
  const g=fixture();g.start();g.advance(1400+65000);g.enter(1789);g.click('submit');g.advance(1500);assert(g.shown('tally'));assert.equal(g.els['tally-total'].textContent,'0');
}
// BCE and reduced-motion mode. No year zero, duplicate guess has no extra penalty.
{
  const f=fixture(-52,true);f.start();f.advance(150);f.mouse('0');assert(f.els.submit.disabled);f.enter(-53);f.click('submit');f.advance(80);assert.equal(f.els.feedback.textContent,'C’EST PLUS !');f.enter(-53);f.click('submit');f.advance(100);assert.equal(f.els['plus-bricks'].children.length,1);f.enter(-52);f.click('submit');f.advance(1000);assert(f.shown('tally'));assert.equal(f.els['tally-exact'].textContent,'+ '+(6000).toLocaleString('fr-FR'));
}
// A complete 2-player, 3-round game: private handoffs, reveal, totals, shared win, restart.
{
  const f=fixture(1789,true);f.start('Alice\nBob');
  for(let round=0;round<3;round++){
    for(let player=0;player<2;player++){
      if(round||player)f.click('launch');f.advance(150);f.enter(1789);f.click('submit');f.advance(1000);assert(f.shown('tally'));f.click('tally-next');
      if(player===0)assert(f.shown('ready'));
    }
    assert(f.shown('round-result'));assert.equal(f.els['round-body'].children.length,2);f.click('next-round');
  }
  assert(f.shown('final'));assert.equal(f.els['final-title'].textContent,'Victoire partagée !');assert.equal(f.els.leaderboard.children.length,2);assert(f.els.leaderboard.children[0].textContent.includes((78000).toLocaleString('fr-FR')));f.click('again');assert(f.shown('setup'));
}
console.log('PASS: linear scoring and proximity boundaries, trumpet/impact audio scheduling and mute, 256 events, name validation, intro timing, mouse/keyboard, bricks, keep, timeout races, BCE, reduced motion, full multiplayer game, ties and restart.');

// Proximity pauses accumulate once per threshold, without jumping the clock back.
{
 const f=fixture(1789,true);f.start();f.advance(150+10000);
 f.enter(1700);f.click('submit');f.advance(80);
 assert.equal(f.els.time.textContent,'55.0');assert(f.els['bonus-status'].textContent.includes('+3 s'));
 f.advance(3200);assert(Number(f.els.time.textContent)<55);
 f.enter(1770);f.click('submit');f.advance(80);
 assert(f.els['bonus-status'].textContent.includes('+4 s'));
 assert.equal(f.els['plus-bricks'].children.length,1);assert.equal(f.els['plus-count'].textContent,'+ : 2');
 f.enter(1785);f.click('submit');f.advance(80);assert(f.els['bonus-status'].textContent.includes('+5 s'));
 f.enter(1786);f.click('submit');f.advance(80);assert.equal(f.els['plus-count'].textContent,'+ : 4');
 f.advance(9000);assert(f.els['pause-status'].textContent.includes('−300'));
}
// Direct entry into the closest zone grants all twelve seconds; a new turn resets them.
{
 const f=fixture(1789,true);f.start();f.advance(150+64950);f.enter(1788);f.click('submit');f.advance(80);
 assert(f.shown('game'));assert(f.els['bonus-status'].textContent.includes('+12 s'));
 f.advance(11900);assert(f.shown('game'));f.advance(120);assert(f.shown('tally'));
 f.click('tally-next');f.click('next-round');f.click('launch');f.advance(150);
 assert.equal(f.els['plus-count'].textContent,'+ : 0');assert.equal(f.els.time.textContent,'65.0');
}
