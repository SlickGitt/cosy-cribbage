// Game flow and rendering (prototype UI)
import { SUITS, RL, RN, NAME, val, other, byRank, cardName, short, fullDeck, shuffled } from './cards.js';
import { scoreHand, pegScore } from './scoring.js';
import { compDiscard, compPeg, setLevel } from './ai.js';
import { save, persist } from './save.js';
import { recordGame, isUnlocked, howTo, award, discover, REWARDS, RANKS } from './unlocks.js';
import { openCollection, applyGear, rewardIcon } from './collection.js';
import { WALKERS, setPlayerWalker, walkerCanvas } from './walkers.js';
import { generateLane } from './lane.js';
import { createScene } from './scene.js';
import { initAudio, sfx, setMusic, setSound, settings } from './sound.js';
import * as net from './online.js';

const scene = createScene({ canvas: document.getElementById('scene'), hud: document.getElementById('hud'), onFind: (k) => announce(discover(k)) });
let lane = null;
const $id = (id) => document.getElementById(id);

// Place the card areas over the scene and size the cards to fit.
function placeUI() {
  const L = scene.layout(), s = L.surface, u = L.u;
  const box = (id, r) => Object.assign($id(id).style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  document.documentElement.style.fontSize = (16 * u).toFixed(2) + 'px';
  document.body.classList.toggle('portrait', L.portrait);
  box('surfaceUI', { x: s.x, y: s.y + L.oppH, w: s.w, h: s.h - L.oppH });
  box('barUI', L.bar);
  box('handUI', L.hand);
  Object.assign($id('oppUI').style, { left: L.seats[0].x + 'px', top: (s.y + 18 * u) + 'px' });
  const root = document.body.style;
  root.setProperty('--cw', L.cw.toFixed(1) + 'px');
  root.setProperty('--ch', L.ch.toFixed(1) + 'px');
  root.setProperty('--co', (L.cw * 0.6).toFixed(1) + 'px');
}
let resizeQueued = false;
window.addEventListener('resize', () => {
  if (resizeQueued) return; resizeQueued = true;
  requestAnimationFrame(() => { resizeQueued = false; scene.relayout(); placeUI(); if (S) render(); });
});

let S, gen = 0, laneUnused = false;
let paused = false, held = [];
const later = (fn, ms) => { const g = gen; setTimeout(() => { if (g !== gen) return; if (paused) held.push(fn); else fn(); }, ms); };

function log(t){S.log.unshift(t);S.log=S.log.slice(0,9);}
function addPts(who,pts,reason){
 if(!pts)return false;
 S.score[who]=Math.min(121,S.score[who]+pts);
 log(`${NAME[who]}: ${reason} for ${pts}`);
 sfx('score',pts);
 scene.setBanked(S.score);scene.react(reason,who);
 if(S.score[who]>=121){S.phase='over';S.winner=who;S.finished=false;log(`${NAME[who]} ${who==='p'?'reach':'reaches'} home at 121`);render();
  later(()=>{document.body.classList.add('walking');scene.walk(S.score).then(()=>{if(S.phase!=='over')return;S.finished=true;finishGame();document.body.classList.remove('walking');document.body.classList.add('finished');render();});},1300);
  return true;}
 return false;
}
function pop(text,sel,who,delay=0){
 const g=gen;
 setTimeout(()=>{if(g!==gen)return;requestAnimationFrame(()=>{
  const st=document.querySelector('.stage'),els=[...document.querySelectorAll(sel)];if(!st||!els.length)return;
  const a=st.getBoundingClientRect(),rs=els.map(e=>e.getBoundingClientRect());
  const b={left:Math.min(...rs.map(r=>r.left)),top:Math.min(...rs.map(r=>r.top))};b.width=Math.max(...rs.map(r=>r.right))-b.left;b.height=Math.max(...rs.map(r=>r.bottom))-b.top;
  const d=document.createElement('div');d.className='pop'+(who==='c'?' c':'');d.textContent=text;
  d.style.left=(b.left-a.left+b.width/2)+'px';d.style.top=(b.top-a.top+(sel.includes('hl')?b.height*.42:-6))+'px';
  document.getElementById('fx').appendChild(d);setTimeout(()=>d.remove(),1700);
 });},delay);
}
function newGame(){gen++;let seed;if(laneUnused&&lane){seed=lane.seed;laneUnused=false;}else{seed=Math.floor(Math.random()*9000)+1000;lane=generateLane(seed);}scene.reset(lane);document.body.classList.remove('walking','finished');document.getElementById('seed').textContent=`Lane ${seed}`;S={seed,seenForest:false,from:{p:0,c:0},score:{p:0,c:0},disp:{p:0,c:0},dealer:null,log:[],round:0,phase:'',winner:null};startCut();}

// Cut for deal: you pick a card from the spread, Winnie cuts hers, low card deals (aces low).
function startCut(){
 S.phase='cutdeal';S.cut={deck:shuffled(),p:null,c:null,done:false,tie:false};S.biome=scene.setStop(S.score);render();
 later(()=>{if(S.phase==='cutdeal'&&!S.cut.p)scene.say('Cut for deal, dear. Low card deals.');},700);
}
function cutAt(i){
 const C=S.cut;if(S.phase!=='cutdeal'||C.p)return;
 C.p=C.deck.splice(i,1)[0];sfx('card');render();
 later(()=>{
  C.c=C.deck.splice(Math.floor(Math.random()*C.deck.length),1)[0];sfx('card');C.done=true;
  if(C.p.r===C.c.r){C.tie=true;render();scene.say('Snap! We cut again.');later(()=>{S.cut={deck:shuffled(),p:null,c:null,done:false,tie:false};render();},1800);return;}
  C.winner=C.p.r<C.c.r?'p':'c';S.dealer=C.winner;
  log(`You cut ${cardName(C.p)}, Winnie cut ${cardName(C.c)}. ${C.winner==='p'?'You deal':'Winnie deals'} first`);
  render();scene.say(C.winner==='c'?'Low card, so I deal.':'Your deal, dear.');
 },900);
}
function renderCut(){
 const C=S.cut;
 $id('oppUI').innerHTML='';
 const spot=(label,card,who)=>`<div class="spot"><span class="tag">${label}</span><div class="cutspot">${card?cardHTML(card,{hl:C.done&&!C.tie&&C.winner===who}):`<div class="empty cutslot"></div>`}</div></div>`;
 const show=Math.min(C.deck.length,20);
 const mid=!C.p?`<div class="spread" style="--n:${show}">${Array.from({length:show},(_,i)=>`<button class="cutbtn" data-cut="${i}" aria-label="Cut the deck here">${backHTML()}</button>`).join('')}</div>`
  :C.done?`<div class="panel countbox"><span class="label">${C.tie?'Same rank':'Low card deals'}</span><b>${C.tie?'Snap!':C.winner==='p'?'You':'Winnie'}</b><span class="note">${C.tie?'Cut again':C.winner==='p'?'You deal first':'Winnie deals first'}</span></div>`:'';
 $id('surfaceUI').innerHTML=`${spot("Winnie's cut",C.c,'c')}<div class="centre">${mid}</div>${spot('Your cut',C.p,'p')}`;
 const prompt=!C.p?'Cut the deck for first deal':!C.done?'Winnie is cutting':C.tie?'A tie, cutting again':C.winner==='p'?'Your card is lower, you deal':"Winnie's card is lower, she deals";
 $id('barUI').innerHTML=`<span class="prompt">${prompt}</span>${C.done&&!C.tie?'<button class="btn" data-act="deal">Deal</button>':''}`;
 $id('handUI').innerHTML='';
 $id('roundInfo').textContent='Cut for deal';
 for(const w of ['p','c']){$id('score-'+w).textContent=S.score[w];$id('gain-'+w).textContent='';}
}
function startRound(){
 S.round++;S.from={...S.score};S.biome=scene.setStop(S.score);const d=shuffled();
 later(()=>{if(S.phase==='discard')scene.say(['Hmm, let me think...','Now then...','Ooh, decisions.','Righto.','Let me see, dear.'][S.round%5]);},700);
 S.deck=d;S.hand={p:d.splice(0,6).sort(byRank),c:d.splice(0,6).sort(byRank)};
 S.crib=[];S.starter=null;S.sel=[];S.peg=null;S.show=null;S.phase='discard';
 log(`Round ${S.round}. ${S.dealer==='p'?'Your':"Winnie's"} crib`);
 const [i,j]=compDiscard(S.hand.c,S.dealer==='c');S.compDiscard=[S.hand.c[i],S.hand.c[j]];
 render();
}
function confirmDiscard(){
 if(S.sel.length!==2)return;
 if(ON)return discardOnline();
 const mine=S.hand.p.filter(c=>S.sel.includes(c.id));
 S.hand.p=S.hand.p.filter(c=>!S.sel.includes(c.id));
 S.hand.c=S.hand.c.filter(c=>!S.compDiscard.includes(c));
 S.crib=[...mine,...S.compDiscard];S.sel=[];sfx('card');
 S.kept={p:[...S.hand.p],c:[...S.hand.c]};
 S.starter=S.deck.pop();S.phase='cut';
 log(`Starter: ${cardName(S.starter)}`);
 if(S.starter.r===11){if(S.dealer==='p')feat('heels');pop('+2 His heels','#starter',S.dealer,200);if(addPts(S.dealer,2,'His heels'))return;}
 render();
 later(()=>{S.phase='peg';S.peg={count:0,seq:[],pile:[],spent:0,hand:{p:[...S.hand.p],c:[...S.hand.c]},turn:other(S.dealer),go:{p:false,c:false},last:null};log(`${NAME[other(S.dealer)]} ${S.dealer==='c'?'lead':'leads'} the pegging`);advance();},1100);
}
const canPlay=w=>S.peg.hand[w].some(c=>S.peg.count+val(c)<=31);
function resetCount(){const P=S.peg;P.spent+=P.pile.length;P.pile=[];P.count=0;P.seq=[];P.go={p:false,c:false};}
function play(who,card){
 const P=S.peg;P.busy=true;P.hand[who]=P.hand[who].filter(c=>c!==card);
 sfx('card');P.count+=val(card);P.seq.push(card);P.pile.push({card,who});P.last=who;P.fresh=card.id;
 log(`${NAME[who]} ${who==='p'?'play':'plays'} ${cardName(card)}. Count ${P.count}`);
 const items=pegScore(P.seq,P.count);
 if(who==='p')for(const it of items){if(it.label==='31')feat('thirtyone');if(it.label==='Pair royal')feat('pairroyal');if(it.label==='Double pair royal')feat('dpr');}
 P.turn=other(who);
 for(const it of items)if(addPts(who,it.pts,it.label)){items.forEach((x,k)=>pop(`+${x.pts} ${x.label}`,'.pile',who,k*450));return;}
 render();
 items.forEach((x,k)=>pop(`+${x.pts} ${x.label}`,'.pile',who,k*450));
 const wait=items.length?700+items.length*350:(who==='p'?300:500);
 if(P.count===31)later(()=>{resetCount();P.turn=other(who);advance();},wait+500);else later(advance,wait);
}
function resolveStuck(t){
 const P=S.peg,o=other(t);
 if(canPlay(o)){P.turn=o;return advance();}
 if(P.count!==31&&P.last){const lbl=(P.hand.p.length||P.hand.c.length)?'Go':'Last card';pop(`+1 ${lbl}`,'.pile',P.last);if(addPts(P.last,1,lbl))return;}
 const nxt=other(P.last);P.busy=true;render();later(()=>{resetCount();P.turn=nxt;advance();},900);
}
function advance(){
 if(S.phase!=='peg')return;const P=S.peg;P.fresh=null;P.busy=false;
 if(!P.hand.p.length&&!P.hand.c.length){
  if(P.count>0&&P.count!==31){pop('+1 Last card','.pile',P.last);if(addPts(P.last,1,'Last card'))return;}
  render();later(startShow,1400);return;
 }
 const t=P.turn;
 if(canPlay(t)){render();if(t==='c'&&!P.cpu){P.cpu=true;later(()=>{P.cpu=false;if(S.phase==='peg'&&S.peg===P&&P.turn==='c'&&canPlay('c'))play('c',compPeg(P));},900);}return;}
 if(P.hand[t].length&&!P.go[t]){
  if(t==='p'){render();return;}
  P.go.c=true;sfx('go');log('Winnie says Go');scene.say('Go, dear.');render();later(()=>resolveStuck('c'),900);return;
 }
 resolveStuck(t);
}
function sayGo(){const P=S.peg;if(P.busy||P.go.p)return;P.busy=true;P.go.p=true;sfx('go');log('You say Go');render();later(()=>resolveStuck('p'),400);}
function startShow(){
 const nd=other(S.dealer),d=S.dealer;
 S.phase='show';S.show={step:-1,steps:[{who:nd,cards:S.kept[nd],crib:false},{who:d,cards:S.kept[d],crib:false},{who:d,cards:S.crib,crib:true}]};
 nextShow();
}
function nextShow(){
 const sh=S.show;sh.step++;
 if(sh.step>2){
  S.phase='walking';document.body.classList.add('walking');render();
  scene.walk(S.score).then(()=>{if(S.phase!=='walking')return;document.body.classList.remove('walking');if(ON)return showDone();S.dealer=other(S.dealer);startRound();});
  return;}
 const st=sh.steps[sh.step];st.res=st.res||scoreHand(st.cards,S.starter,st.crib);st.shown=0;st.run=0;st.done=false;
 if(st.who==='p'){if(!st.crib)S.bestHand=Math.max(S.bestHand||0,st.res.total);const T=st.res.total;
  if(T>=20)feat('twenty');if(T===28)feat('twentyeight');if(T===29)feat('perfect');if(st.res.items.some(i=>i.label==='Flush of 5'))feat('flush5');}
 render();
 if(!st.res.items.length){st.done=true;log(`${NAME[st.who]}: nothing in ${st.crib?'the crib':'hand'}`);later(render,300);return;}
 later(()=>revealNext(st),700);
}
function revealNext(st){
 if(S.phase!=='show'||!S.show||S.show.steps[S.show.step]!==st||st.done)return;
 const it=st.res.items[st.shown];st.shown++;st.run+=it.pts;
 render();pop(`+${it.pts} ${it.label}`,'.card.hl',st.who);
 if(addPts(st.who,it.pts,(st.crib?'Crib: ':'')+it.label))return;
 if(st.shown>=st.res.items.length){st.done=true;later(render,700);}else later(()=>revealNext(st),950);
}
function skipShow(){
 const st=S.show.steps[S.show.step];gen++;
 const rest=st.res.items.slice(st.shown);st.shown=st.res.items.length;st.run=st.res.total;st.done=true;
 const pts=rest.reduce((a,i)=>a+i.pts,0);
 if(pts){pop(`+${pts}`,'#tally',st.who);if(addPts(st.who,pts,(st.crib?'Crib':'Hand')+' (rest)'))return;}
 render();
}

/* ---------- rendering ---------- */
function hashf(id,k){let h=0;for(const ch of id+k)h=(h*31+ch.charCodeAt(0))%9973;return h/9973-.5;}
function cardHTML(c,{btn=false,sel=false,dim=false,dis=false,hl=false,extra='',cls=''}={}){
 const su=SUITS[c.s];const tag=btn?'button':'div';
 const attrs=btn?`data-id="${c.id}" aria-label="${cardName(c)}" aria-pressed="${sel}" ${dis?'disabled':''}`:`role="img" aria-label="${cardName(c)}"`;
 return `<${tag} class="card${sel?' sel':''}${dim?' dim':''}${hl?' hl':''} ${cls}" style="color:${su.c};${extra}" ${attrs}><span class="rk"><b>${RL[c.r]}</b><svg viewBox="0 0 9 10" aria-hidden="true"><use href="#${su.id}"></use></svg></span><svg class="big" viewBox="0 0 9 10" aria-hidden="true"><use href="#${su.id}"></use></svg></${tag}>`;
}
const their=()=>NAME.c+"'s";
const backHTML=(st='')=>`<div class="back" style="${st}" aria-hidden="true"><svg viewBox="0 0 9 10"><use href="#s-leaf"></use></svg></div>`;
// render() rebuilds the card areas, which drops keyboard focus. Put it back on the
// same card or button, or on the next sensible control, so keyboard play keeps flowing.
const UI='#surfaceUI,#handUI,#barUI,#oppUI';
function render(){
 const f=document.activeElement,inUI=!!(f&&f.closest&&f.closest(UI));
 const key=inUI?(f.dataset.id?`[data-id="${f.dataset.id}"]`:f.dataset.act?`[data-act="${f.dataset.act}"]`:f.dataset.cut!==undefined?'[data-cut]':''):'';
 draw();
 if(!inUI||document.activeElement!==document.body)return;
 const q=s=>[...document.querySelectorAll(s)].find(e=>!e.disabled);
 (key&&q(`#handUI ${key},#barUI ${key},#surfaceUI ${key}`)||q('#barUI .btn')||q('#handUI button')||q('#surfaceUI button'))?.focus({preventScroll:true});
}
function draw(){
 if(S.phase==='cutdeal')return renderCut();
 if(S.phase==='waiting')return renderWaiting();
 const P=S.peg,ph=S.phase;
 const sst=ph==='show'?S.show.steps[S.show.step]:null;
 const hlIds=sst&&sst.shown&&!sst.done?sst.res.items[sst.shown-1].cards.map(c=>c.id):[];
 const rowCards=w=>(sst&&sst.crib&&sst.who===w?S.crib:S.kept[w]);
 const active=w=>!sst||sst.who===w;
 // Winnie's cards, held beside her
 let opp;
 if(ph==='show'||(ph==='over'&&S.show&&S.kept))opp=`<div class="held small${active('c')?'':' faded'}">${rowCards('c').map(c=>cardHTML(c,{hl:hlIds.includes(c.id)})).join('')}</div>`;
 else{const n=S.oppN!=null?S.oppN:ph==='discard'?6:ph==='cut'?4:P?P.hand.c.length:0;opp=`<div class="fan small">${Array.from({length:n},()=>backHTML()).join('')}</div>`;}
 const ou=$id('oppUI');ou.innerHTML=opp;
 {const L=scene.layout(),sf=L.surface,hw=ou.offsetWidth/2,m=14*L.u;ou.style.left=Math.max(sf.x+m+hw,Math.min(sf.x+sf.w-m-hw,L.seats[0].x))+'px';}
 // the surface: starter, pile and crib
 const cribName=S.dealer==='p'?'Your crib':their()+' crib';
 const starter=`<div class="spot"><span class="tag">${S.starter?'Starter':'Deck'}</span><div id="starter">${S.starter?cardHTML(S.starter,{hl:hlIds.includes(S.starter.id)}):`<div class="crib">${[0,3,6].map(o=>backHTML(`position:absolute;left:${o}px;top:${o}px`)).join('')}</div>`}</div></div>`;
 let cribVis;
 if(ph==='show'&&S.show.step===2)cribVis=`<div class="empty">Counting</div>`;
 else if(S.crib.length)cribVis=`<div class="crib">${[0,4,8,12].map(o=>backHTML(`position:absolute;left:${o}px;top:${o}px`)).join('')}</div>`;
 else cribVis=`<div class="slots"><div class="empty"></div><div class="empty"></div></div>`;
 const crib=`<div class="spot"><span class="tag">${cribName}</span>${cribVis}</div>`;
 let centre;
 if(ph==='show'){
  const st=sst,what=st.crib?`${st.who==='p'?'Your':their()} crib`:`${st.who==='p'?'Your':their()} hand`;
  const last=st.shown?st.res.items[st.shown-1]:null;
  const note=st.done?(st.res.total?`${st.res.total} ${st.res.total===1?'point':'points'}`:'Nothing to score'):last?`${last.label}: ${last.cards.map(short).join(' + ')}`:'Counting';
  centre=`<div class="centre"><div class="panel countbox" id="tally"><span class="label">${what}</span><b>${st.run}</b><span class="note">${note}</span></div></div>`;
 }else if(ph==='over'&&S.finished){
  const lose=other(S.winner),ls=S.score[lose];const sk=ls<61?' A double skunk!':ls<91?' A skunk!':'';
  centre=`<div class="centre"><div class="panel overlay"><span class="total">${S.winner==='p'?'You made it home first!':NAME.c+' made it home first'}</span><span class="label">${S.score.p} to ${S.score.c}.${sk} Lane ${S.seed}.</span>${(S.newUnlocks||[]).filter(u=>u.reward).map(u=>`<span class="unlock" data-reward="${u.reward}">${u.title}: ${REWARDS[u.reward].name}${REWARDS[u.reward].kind==='walker'?' walker':''}</span>`).join('')}<span class="row"><button class="btn" data-act="new">Play again</button><button class="btn ghost" data-act="menu">Menu</button></span></div></div>`;
 }else{
  const cur=P?P.pile:[],n=cur.length;
  const pile=cur.map((x,i)=>{const k=n-1-i,step=k<=2?k:2,dy=hashf(x.card.id,'y')*6,rt=hashf(x.card.id,'r')*(k<=2?5:10);
   const sp=scene.layout().portrait?.3:.5,left=`calc(50% + var(--cw)*${(sp-step*sp).toFixed(2)} - var(--cw)/2 - ${k>2?(k-2)*6:0}px)`;const t=`translateY(${dy.toFixed(0)}px) rotate(${rt.toFixed(1)}deg)`;
   return cardHTML(x.card,{cls:'pc'+(P.fresh===x.card.id?' new':''),extra:`left:${left};--t:${t};transform:${t};z-index:${i+1}`});}).join('');
  const spent=P&&P.spent?`<div class="spent"><div class="crib">${[0,3,6].map(o=>backHTML(`position:absolute;left:${o}px;top:${o}px`)).join('')}</div>${P.spent} played</div>`:'';
  centre=`<div class="centre"><div class="panel countbox"><span class="label">Count</span><b>${P?P.count:0}</b></div><div class="pilewrap">${spent}<div class="pile">${pile}</div></div></div>`;
 }
 $id('surfaceUI').innerHTML=ph==='over'&&S.finished?centre:`${starter}${centre}${crib}`;
 $id('surfaceUI').querySelectorAll('.unlock').forEach(e=>e.prepend(rewardIcon(e.dataset.reward)));
 // your hand and the prompt
 let prompt='';
 if(ph==='discard')prompt=`Pick 2 for ${S.dealer==='p'?'your':their()} crib`;
 else if(ph==='cut')prompt='Turning the starter';
  else if(ph==='peg'){if(P.turn==='p'&&P.busy)prompt='';else if(P.turn==='p'){prompt=canPlay('p')?'Your turn, play a card':P.hand.p.length?(P.go.p?'Waiting for '+NAME.c:"You can't play, say Go"):'Out of cards';}else prompt=their()+' turn';}
 else if(ph==='walking')prompt='Walking on...';
 if(S.prompt)prompt=S.prompt;
 let cards=[],opt={};
 if(ph==='discard')cards=S.hand.p.map(c=>[c,{btn:true,sel:S.sel.includes(c.id)}]);
 else if(ph==='cut')cards=S.hand.p.map(c=>[c,{}]);
 else if(ph==='peg'){const mine=P.turn==='p'&&!P.busy;cards=P.hand.p.map(c=>{const ok=mine&&P.count+val(c)<=31;return [c,{btn:true,dis:!ok,dim:mine&&!ok}];});}
 else if(ph==='show'||ph==='over')cards=(S.kept?rowCards('p'):[]).map(c=>[c,{hl:hlIds.includes(c.id)}]);
 const n=cards.length;
 const fan=cards.map(([c,o],i)=>{const k=scene.layout().portrait?1.8:3,a=(i-(n-1)/2)*k,y=Math.abs(i-(n-1)/2)*Math.abs(i-(n-1)/2)*(k-.5);return cardHTML(c,{...o,extra:`--fan:translateY(${y.toFixed(0)}px) rotate(${a.toFixed(1)}deg)`});}).join('');
 let acts='';
 if(ph==='discard')acts=`<button class="btn" data-act="discard" ${S.sel.length===2?'':'disabled'}>Send to crib</button>`;
 if(ph==='show')acts=sst.done?`<button class="btn" data-act="next">${S.show.step<2?'Next':'Walk on'}</button>`:`<button class="btn ghost" data-act="skip">Skip</button>`;
 if(ph==='peg'&&P.turn==='p'&&!P.busy&&!canPlay('p')&&P.hand.p.length&&!P.go.p)acts=`<button class="btn" data-act="go">Go</button>`;
 $id('barUI').innerHTML=`${prompt?`<span class="prompt">${prompt}</span>`:''}${acts}`;
 $id('handUI').innerHTML=`<div class="fanhand">${fan}</div>`;
 // header
 $id('roundInfo').textContent=`Round ${S.round}, ${S.dealer==='p'?'your':their()} crib · ${scene.weather()}`;
 for(const w of ['p','c']){const gain=S.score[w]-S.from[w];$id('score-'+w).textContent=S.score[w];$id('gain-'+w).textContent=gain>0&&ph!=='walking'?`+${gain}`:'';}
 $id('log').innerHTML=S.log.map(t=>`<p>${t}</p>`).join('');
}
document.addEventListener('click',e=>{
 const b=e.target.closest('#surfaceUI button,#handUI button,#barUI button,#oppUI button');if(!b||b.disabled)return;
 const act=b.dataset.act;
 if(b.dataset.cut!==undefined)return cutAt(+b.dataset.cut);
 if(act==='deal')return startRound();
 if(act==='discard')return confirmDiscard();
 if(act==='go')return sayGo();
 if(act==='next')return nextShow();
 if(act==='skip')return skipShow();
 if(act==='new')return ON?(closeOnline(),showTitle(),openFriend()):newGame();
 if(act==='copylink')return copyLink();
 if(act==='sharelink')return shareLink();
 if(act==='menu')return showTitle();
 const id=b.dataset.id;if(!id)return;
 if(S.phase==='discard'){S.sel=S.sel.includes(id)?S.sel.filter(x=>x!==id):S.sel.length<2?[...S.sel,id]:[S.sel[1],id];render();}
 else if(S.phase==='peg'&&S.peg.turn==='p'&&!S.peg.busy){const c=S.peg.hand.p.find(x=>x.id===id);if(c&&S.peg.count+val(c)<=31)ON?playOnline(c):play('p',c);}
});
$id('menuBtn').addEventListener('click',()=>showTitle());
$id('menuIcon').addEventListener('click',()=>showTitle());
for(const [btn,dlg] of [['historyBtn','historyDlg'],['rulesBtn','rulesDlg']]){
 document.getElementById(btn).addEventListener('click',()=>{const d=document.getElementById(dlg);d.hidden=!d.hidden;});
}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{b.closest('.dialog').hidden=true;}));
document.addEventListener('pointerdown',()=>initAudio(),{once:true});
document.addEventListener('keydown',()=>initAudio(),{once:true});
// sound settings live in the save; the top bar buttons and the settings sheet share them
function applySound(key,on){(key==='music'?setMusic:setSound)(on);save.settings[key]=on;persist();
 for(const id of key==='music'?['musicBtn','sMusic']:['soundBtn','sSound']){const b=$id(id);b.setAttribute('aria-pressed',on);b.classList.toggle('off',!on);}}
for(const [id,key] of [['musicBtn','music'],['soundBtn','sound'],['sMusic','music'],['sSound','sound']])
 $id(id).addEventListener('click',()=>{initAudio();applySound(key,!settings[key]);});

/* ---------- title screen ---------- */
const WALKER_ORDER=['bobble','flatcap','wellies','beret','fox','hedgehog','badger','winnie'];
const NOTES={gentle:'Relaxed. She makes the odd slip.',normal:'A fair game. Now and then she misjudges.',sharp:'She plays every card as well as she can.'};
function inGame(){return !!(S&&S.phase&&!(S.phase==='over'&&S.finished));}
function showTitle(){
 if(document.body.classList.contains('walking'))return;
 if(inGame())paused=true;
 if(!lane){lane=generateLane(Math.floor(Math.random()*9000)+1000);scene.reset(lane);laneUnused=true;}
 scene.title();document.body.classList.add('on-title');
 for(const d of document.querySelectorAll('.dialog'))d.hidden=true;
 showSheet(null);renderTitle();$id('title').hidden=false;
 (inGame()?$id('tContinue'):$id('tNew')).focus();
}
function hideTitle(){$id('title').hidden=true;document.body.classList.remove('on-title');}
function continueGame(){hideTitle();scene.resume();paused=false;const q=held;held=[];q.forEach(fn=>fn());render();}
function startNew(){closeOnline();hideTitle();paused=false;held=[];newGame();}
function showSheet(id){for(const sh of ['walkerSheet','settingsSheet','collectionSheet','friendSheet'])$id(sh).hidden=sh!==id;document.querySelector('.title-card').hidden=!!id;}
function rankName(){return RANKS.filter(r=>save.stats.holes>=r.holes).pop().name;}
function renderTitle(){
 $id('tContinue').hidden=!inGame();
 $id('tNew').classList.toggle('ghost',inGame());
 const art=$id('titleArt');art.replaceChildren(walkerCanvas(save.walker),walkerCanvas('winnie'));
 const st=save.stats;
 $id('tStats').textContent=st.games?`${rankName()} · ${st.wins} ${st.wins===1?'win':'wins'} · ${st.holes} holes walked`:'';
 // walker picker
 $id('walkerGrid').replaceChildren(...WALKER_ORDER.map(id=>{
  const open=isUnlocked(id),b=document.createElement('button');
  b.className='walker-tile'+(save.walker===id?' sel':'');b.disabled=!open;b.setAttribute('aria-pressed',save.walker===id);
  b.append(walkerCanvas(id,!open));
  const n=document.createElement('span');n.className='name';n.textContent=open?WALKERS[id].name:'Locked';b.append(n);
  if(!open){const h=document.createElement('span');h.className='how';h.textContent=howTo(id);b.append(h);}
  b.addEventListener('click',()=>{save.walker=id;persist();setPlayerWalker(id);renderTitle();});
  return b;
 }));
 // settings
 for(const b of $id('sWinnie').querySelectorAll('button'))b.setAttribute('aria-pressed',b.dataset.v===save.settings.winnie);
 $id('sWinnieNote').textContent=NOTES[save.settings.winnie];
}
$id('tContinue').addEventListener('click',continueGame);
$id('tNew').addEventListener('click',startNew);
$id('tWalker').addEventListener('click',()=>showSheet('walkerSheet'));
$id('tSettings').addEventListener('click',()=>showSheet('settingsSheet'));
$id('tRules').addEventListener('click',()=>{$id('rulesDlg').hidden=false;});
$id('tCollection').addEventListener('click',()=>{showSheet('collectionSheet');openCollection($id('collectionBody'),()=>{applyGear(scene);renderTitle();});});
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{showSheet(null);renderTitle();}));
$id('sWinnie').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;save.settings.winnie=b.dataset.v;persist();setLevel(b.dataset.v);renderTitle();});
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 const open=[...document.querySelectorAll('.dialog')].find(d=>!d.hidden);
 if(open){open.hidden=true;return;}
 if(!$id('title').hidden&&inGame())continueGame();
});

// A feat in play: remember it for the end screen and give a quiet nod now.
function feat(id){const a=award(id);if(!a)return;(S.earned=S.earned||[]).push(a);announce([a]);}
function announce(list){
 for(const a of list){
  const t=document.createElement('div');t.className='toast'+(a.tier==='legendary'?' legend':'');
  const txt=document.createElement('span');txt.textContent=a.reward?`${a.title} · ${REWARDS[a.reward].name} unlocked`:a.title;
  if(a.reward)t.append(rewardIcon(a.reward));t.append(txt);
  $id('toasts').append(t);sfx('chime');setTimeout(()=>t.remove(),4200);
 }
}

function finishGame(){
 if(S.recorded)return;S.recorded=true;
 if(ON){if(onlineDone(ON.id))return;markDone(ON.id);}
 S.newUnlocks=[...(S.earned||[]),...recordGame({won:S.winner==='p',myScore:S.score.p,theirScore:S.score.c,bestHand:S.bestHand||0,level:ON?'friend':save.settings.winnie})];
}

/* ---------- friend play ----------
 The server deals, checks every move and scores. This side shows the game: it turns each
 player's view of the server state into the same S the solo game draws, adds the little
 pops and sounds for what just happened, and replays each show so it can be counted along. */
let ON=null;
const cardOf=id=>{const [r,s]=id.split('-').map(Number);return {r,s,id};};
const store={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
const safeName=n=>String(n||'').replace(/[<>&"]/g,'').trim().slice(0,20);
const onlineDone=id=>store.get('ll-done-'+id)==='1';
function markDone(id){store.set('ll-done-'+id,'1');if(ON&&ON.g&&ON.g.show)markSeen(ON.g.show.round);}
function markSeen(r){if(!ON)return;ON.showSeen=Math.max(ON.showSeen,r);store.set('ll-seen-'+ON.id,String(ON.showSeen));}
function toast(text){const t=document.createElement('div');t.className='toast';t.textContent=text;$id('toasts').append(t);setTimeout(()=>t.remove(),4200);}
function closeOnline(){
 if(!ON)return;
 if(ON.unwatch)ON.unwatch();
 ON=null;NAME.c='Winnie';WALKERS.c=WALKERS.winnie;$id('name-c').textContent='Winnie';scene.setQuiet(false);document.body.classList.remove('online');
}
async function openOnline(id,first){
 closeOnline();gen++;paused=false;held=[];
 ON={id,me:null,ver:-1,g:null,busy:false,pending:null,replaying:false,unwatch:null,stopRound:null,showSeen:+(store.get('ll-seen-'+id)||0)};
 const mine=ON;
 hideTitle();document.body.classList.remove('walking','finished');document.body.classList.add('online');scene.setQuiet(true);WALKERS.c=WALKERS.bobble;
 try{
  const g=first||await net.getGame(id);
  if(!g)throw new Error("That game isn't available");
  if(ON!==mine)return;
  ON.me=g.me;
  lane=generateLane(g.seed);laneUnused=false;scene.reset(lane);
  $id('seed').textContent=`Lane ${g.seed}`;
  S={seed:g.seed,online:true,log:[],score:{p:0,c:0},from:{p:0,c:0},disp:{p:0,c:0},dealer:null,round:0,phase:'',winner:null,sel:[],crib:[]};
  applyServer(g,false);
  const un=await net.watch(id,refresh);
  if(ON===mine)ON.unwatch=un;else un();
 }catch(e){if(ON===mine){closeOnline();showTitle();}toast(e.message);}
}
async function refresh(){
 if(!ON)return;
 if(ON.fetching){ON.again=true;return;}
 const mine=ON;ON.fetching=true;
 try{const g=await net.getGame(mine.id);if(g&&ON===mine)applyServer(g,true);}catch(e){console.error(e);}
 finally{mine.fetching=false;if(mine.again&&ON===mine){mine.again=false;refresh();}}
}
function applyServer(g,animate){
 if(!ON||!g)return;
 if(ON.g&&g.version<=ON.ver)return;          // an older copy of what we already have
 if(ON.replaying){ON.pending=g;return;}       // finish counting the last round first
 const fresh=g.version===ON.ver+1;
 ON.ver=g.version;ON.g=g;
 const op=g.me==='a'?'b':'a';
 if(g['name_'+op]){NAME.c=safeName(g['name_'+op])||'Your friend';WALKERS.c=WALKERS[g['walker_'+op]]||WALKERS.bobble;}
 $id('name-c').textContent=g['name_'+op]?NAME.c:'Friend';
 if(g.show&&g.show.round>ON.showSeen&&(g.round>g.show.round||g.status==='over'))return replayShow(g,animate&&fresh);
 buildState(g,animate&&fresh);
}
const sideOf=w=>w===ON.me?'p':'c';
function buildState(g,anim){
 const me=g.me,op=me==='a'?'b':'a',L=sideOf;
 const newRound=S.round!==g.round;
 S.round=g.round;S.seed=g.seed;S.dealer=g.dealer?L(g.dealer):null;
 S.score={p:g['score_'+me],c:g['score_'+op]};S.from={p:g['from_'+me],c:g['from_'+op]};
 if(ON.stopRound!==g.round){S.biome=scene.setStop(S.from);ON.stopRound=g.round;}
 scene.setBanked(S.score);
 S.starter=g.starter?cardOf(g.starter):null;
 S.crib=Array.from({length:g.crib_n},()=>null);
 S.kept=null;S.show=null;S.prompt='';S.oppN=null;S.peg=null;
 if(newRound){S.sel=[];if(g.round>0)log(`Round ${g.round}. ${S.dealer==='p'?'Your':their()} crib`);}
 if(g.status==='waiting'){S.phase='waiting';S.hand={p:[]};}
 else if(g.status==='over')return endOnline(g,anim);
 else if(g.phase==='discard'){
  S.hand={p:g.hand.map(cardOf)};S.oppN=g.opp_n;
  if(!g.discarded[me]){S.phase='discard';S.sel=(S.sel||[]).filter(id=>g.hand.includes(id));}
  else{S.phase='cut';S.prompt=`Waiting for ${NAME.c} to choose`;}
 }else if(g.phase==='peg'){
  const pg=g.peg;S.phase='peg';
  S.peg={count:pg.count,pile:pg.pile.map(x=>({card:cardOf(x.c),who:L(x.w)})),seq:pg.pile.map(x=>cardOf(x.c)),spent:pg.spent,turn:L(pg.turn),
   go:{p:!!pg.go[me],c:!!pg.go[op]},hand:{p:g.hand.map(cardOf),c:Array.from({length:g.opp_n})},busy:false,last:pg.last?L(pg.last):null,fresh:null};
  S.hand={p:S.peg.hand.p};
  if(S.peg.turn==='c')S.prompt=`${their()} turn`;
 }
 if(g.round===1&&g.cut&&!S.cutLogged){S.cutLogged=true;const a=cardOf(g.cut[me]),b=cardOf(g.cut[op]);log(`You cut ${cardName(a)}, ${NAME.c} cut ${cardName(b)}. ${S.dealer==='p'?'You deal':NAME.c+' deals'} first`);}
 if(anim)playEvents(g.events,me);
 render();
}
// Little pops, sounds and log lines for what just happened.
function playEvents(evs,me){
 let k=0;
 for(const e of evs||[]){
  const w=e.who?sideOf(e.who):null;
  if(e.kind==='joined'){toast(`${NAME.c} has joined. Let's walk!`);sfx('chime');}
  else if(e.kind==='discard'&&w==='c')log(`${NAME.c} sent two cards to the crib`);
  else if(e.kind==='starter'){log(`Starter: ${cardName(cardOf(e.card))}`);sfx('card');}
  else if(e.kind==='play'){if(w==='c'){sfx('card');log(`${NAME.c} plays ${cardName(cardOf(e.card))}. Count ${e.count}`);}else log(`You play ${cardName(cardOf(e.card))}. Count ${e.count}`);
   if(S.peg&&S.peg.pile.some(x=>x.card.id===e.card))S.peg.fresh=e.card;}
  else if(e.kind==='go'){sfx('go');log(`${w==='p'?'You say':NAME.c+' says'} Go`);}
  else if(e.kind==='pts'){log(`${NAME[w]}: ${e.label} for ${e.pts}`);sfx('score',e.pts);pop(`+${e.pts} ${e.label}`,S.peg&&S.peg.pile.length?'.pile':'.countbox',w,k++*450);
   if(w==='p'){if(e.label==='31')feat('thirtyone');if(e.label==='Pair royal')feat('pairroyal');if(e.label==='Double pair royal')feat('dpr');if(e.label==='His heels'&&S.dealer==='p')feat('heels');}}
 }
}
// Count the hands and crib from the round that just finished, then walk on.
function replayShow(g,anim){
 const sh=g.show,me=g.me,op=me==='a'?'b':'a',L=sideOf;
 if(anim)playEvents(g.events.filter(e=>e.kind!=='show'),me);
 ON.replaying=true;ON.pending=null;ON.showRound=sh.round;
 S.round=sh.round;S.dealer=L(sh.dealer);S.starter=cardOf(sh.starter);
 const from=sh.from?{p:sh.from[me],c:sh.from[op]}:{p:sh.before[me],c:sh.before[op]};
 S.from=from;S.score={p:sh.before[me],c:sh.before[op]};
 if(ON.stopRound!==sh.round){S.biome=scene.setStop(from);ON.stopRound=sh.round;}
 scene.setBanked(S.score);
 const steps=sh.steps.map(st=>({who:L(st.who),cards:st.cards.map(cardOf),crib:st.crib,
  res:{items:st.items.map(i=>({label:i.label,pts:i.pts,cards:i.cards.map(cardOf)})),total:st.total}}));
 S.kept={[steps[0].who]:steps[0].cards,[steps[1].who]:steps[1].cards};S.crib=steps[2].cards;
 S.peg=null;S.prompt='';S.oppN=null;S.phase='show';S.show={step:-1,steps};
 nextShow();
}
function showDone(){
 markSeen(ON.showRound);ON.replaying=false;
 const g=ON.pending&&ON.pending.version>ON.g.version?ON.pending:ON.g;ON.pending=null;ON.g=g;ON.ver=g.version;
 buildState(g,false);
}
function endOnline(g,anim){
 const me=g.me;
 S.phase='over';S.winner=sideOf(g.winner);S.peg=null;S.prompt='';S.oppN=0;
 if(anim)playEvents(g.events,me);
 if(onlineDone(ON.id)){S.finished=true;S.recorded=true;document.body.classList.add('finished');render();return;}
 S.finished=false;log(`${S.winner==='p'?'You reach':NAME.c+' reaches'} home at 121`);render();
 later(()=>{document.body.classList.add('walking');scene.walk(S.score).then(()=>{if(S.phase!=='over')return;S.finished=true;finishGame();document.body.classList.remove('walking');document.body.classList.add('finished');render();});},1300);
}
function discardOnline(){
 if(ON.busy)return;ON.busy=true;const ids=[...S.sel],mine=ON;
 sfx('card');S.hand.p=S.hand.p.filter(c=>!ids.includes(c.id));S.sel=[];S.phase='cut';S.prompt='Sending to the crib';S.crib=[...S.crib,null,null];render();
 net.discard(mine.id,ids).then(g=>{if(ON===mine)applyServer(g,true);}).catch(e=>{console.error(e);toast(e.message);refresh();}).finally(()=>{mine.busy=false;});
}
function playOnline(c){
 if(ON.busy)return;ON.busy=true;const P=S.peg,mine=ON;
 P.busy=true;P.hand.p=P.hand.p.filter(x=>x!==c);P.pile.push({card:c,who:'p'});P.count+=val(c);P.fresh=c.id;sfx('card');render();
 net.playCard(mine.id,c.id).then(g=>{if(ON===mine)applyServer(g,true);}).catch(e=>{console.error(e);toast(e.message);refresh();}).finally(()=>{mine.busy=false;});
}
function renderWaiting(){
 const link=net.inviteLink(ON.g.code);
 $id('oppUI').innerHTML='';$id('handUI').innerHTML='';
 $id('surfaceUI').innerHTML=`<div class="centre"><div class="panel invite"><span class="label">Waiting for a friend. Send them this link</span><input class="invite-link" readonly value="${link}" aria-label="Invite link"><span class="row"><button class="btn" data-act="copylink">Copy link</button>${navigator.share?'<button class="btn ghost" data-act="sharelink">Share</button>':''}</span><span class="note">The game starts when they open it. Take your turns whenever suits you both.</span></div></div>`;
 $id('barUI').innerHTML='';
 $id('roundInfo').textContent='Friend game';
 for(const w of ['p','c']){$id('score-'+w).textContent=0;$id('gain-'+w).textContent='';}
}
function copyLink(code){
 const link=net.inviteLink(code||ON.g.code);
 (navigator.clipboard?navigator.clipboard.writeText(link):Promise.reject()).then(()=>toast('Link copied')).catch(()=>{const i=document.querySelector('.invite-link');if(i){i.select();toast('Select the link and copy it');}});
}
function shareLink(code){navigator.share({title:'Lantern Lane',text:"Come and play cribbage with me on Lantern Lane",url:net.inviteLink(code||ON.g.code)}).catch(()=>{});}

/* friend sheet on the title screen: start a game, join from a link, and your games */
let inviteCode=new URLSearchParams(location.search).get('g');
function openFriend(){showSheet('friendSheet');renderFriend();}
const nameField=()=>`<label class="setting col"><span>Your name</span><input id="fName" maxlength="20" autocomplete="nickname" placeholder="So your friend knows it's you" value="${safeName(save.name)}"></label>`;
function readName(){const n=safeName($id('fName')&&$id('fName').value);if(n){save.name=n;persist();}return n;}
async function renderFriend(){
 const body=$id('friendBody');
 body.innerHTML='<p class="fnote">Connecting</p>';
 try{
  if(inviteCode){
   const pv=await net.preview(inviteCode);
   if(pv&&pv.seat==='yours'){inviteCode=null;clearInvite();return openOnline(pv.id);}
   if(!pv||pv.seat!=='open'){inviteCode=null;clearInvite();
    body.innerHTML=`<p class="fnote">${!pv?"That game link doesn't work. Ask your friend to send it again.":'This game already has two players.'}</p>`;
    return renderGames(body,true).catch(()=>{});}
   body.innerHTML=`<p class="fnote big"><b>${safeName(pv.host)}</b> has invited you to walk Lantern Lane.</p>${nameField()}<div class="menu"><button class="btn" id="fJoin">Join the game</button></div>`;
   $id('fJoin').addEventListener('click',async()=>{
    const n=readName();if(!n){$id('fName').focus();return toast('Add your name first');}
    $id('fJoin').disabled=true;
    try{const g=await net.joinGame(inviteCode,n,save.walker);inviteCode=null;clearInvite();openOnline(g.id,g);}
    catch(e){toast(e.message);$id('fJoin').disabled=false;}
   });
   return;
  }
  body.innerHTML=`${nameField()}<div class="menu"><button class="btn" id="fNew">Start a game with a friend</button></div><p class="fnote">You'll get a link to send them. Take turns whenever suits you.</p>`;
  $id('fNew').addEventListener('click',async()=>{
   const n=readName();if(!n){$id('fName').focus();return toast('Add your name first');}
   $id('fNew').disabled=true;
   try{const r=await net.createGame(n,save.walker);openOnline(r.id);}catch(e){toast(e.message);$id('fNew').disabled=false;}
  });
  renderGames(body,false).catch(()=>{const n=document.createElement('p');n.className='fnote';n.textContent="Couldn't load your games just now.";body.append(n);});
 }catch(e){body.innerHTML=`<p class="fnote">Couldn't reach friend play. Check your connection and try again.</p><div class="menu"><button class="btn" id="fRetry">Try again</button></div>`;$id('fRetry').addEventListener('click',renderFriend);}
}
async function renderGames(body,withStart){
 const list=await net.myGames();
 const wrap=document.createElement('div');wrap.className='games';
 if(withStart){const b=document.createElement('div');b.className='menu';b.innerHTML='<button class="btn" id="fBack">Start your own game</button>';wrap.append(b);}
 if(list.length){const h=document.createElement('h3');h.textContent='Your games';wrap.append(h);}
 const LBL={you:'Your turn',them:'Their turn',join:'Waiting for them to join',over:'Finished'};
 for(const x of list){
  const row=document.createElement('div');row.className='game-row'+(x.turn==='you'?' yours':'');
  const b=document.createElement('button');b.className='game-open';
  const who=document.createElement('b');who.textContent=x.status==='waiting'?'Not joined yet':safeName(x.opp);
  const sc=document.createElement('span');sc.textContent=x.status==='waiting'?'':x.status==='over'?(x.winner===x.me?`You won, ${x.mine} to ${x.theirs}`:`${x.theirs} to ${x.mine}`):`You ${x.mine}, them ${x.theirs}`;
  const t=document.createElement('span');t.className='turn';t.textContent=LBL[x.turn]||'';
  b.append(who,sc,t);b.addEventListener('click',()=>openOnline(x.id));row.append(b);
  if(x.status==='waiting'){const c=document.createElement('button');c.className='btn ghost small';c.textContent='Copy link';c.addEventListener('click',()=>copyLink(x.code));row.append(c);}
  wrap.append(row);
 }
 body.append(wrap);
 if(withStart)$id('fBack').addEventListener('click',renderFriend);
}
function clearInvite(){const u=new URL(location.href);u.searchParams.delete('g');history.replaceState(null,'',u.pathname+u.search+u.hash);}
$id('tFriend').addEventListener('click',openFriend);

// apply saved choices
setPlayerWalker(save.walker);setLevel(save.settings.winnie);applyGear(scene);
applySound('music',save.settings.music);applySound('sound',save.settings.sound);
window.__cc={scene,get S(){return S},get lane(){return lane},nextShow,confirmDiscard,play,sayGo,addPts};
placeUI();
showTitle();
if(inviteCode)openFriend();
