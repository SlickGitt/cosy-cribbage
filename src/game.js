// Game flow and rendering (prototype UI)
import { SUITS, RL, RN, NAME, val, other, byRank, cardName, short, fullDeck, shuffled } from './cards.js';
import { scoreHand, pegScore } from './scoring.js';
import { compDiscard, compPeg } from './ai.js';
import { generateLane } from './lane.js';
import { createScene } from './scene.js';
import { initAudio, sfx, setMusic, setSound, settings } from './sound.js';

const scene = createScene({ canvas: document.getElementById('scene'), hud: document.getElementById('hud') });
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
window.addEventListener('resize', () => { scene.relayout(); placeUI(); if (S) render(); });

let S, gen = 0;
const later = (fn, ms) => { const g = gen; setTimeout(() => { if (g === gen) fn(); }, ms); };

function log(t){S.log.unshift(t);S.log=S.log.slice(0,9);}
function addPts(who,pts,reason){
 if(!pts)return false;
 S.score[who]=Math.min(121,S.score[who]+pts);
 log(`${NAME[who]}: ${reason} for ${pts}`);
 sfx('score',pts);
 scene.setBanked(S.score);scene.react(reason,who);
 if(S.score[who]>=121){S.phase='over';S.winner=who;S.finished=false;log(`${NAME[who]} ${who==='p'?'reach':'reaches'} home at 121`);render();
  later(()=>{document.body.classList.add('walking');scene.walk(S.score).then(()=>{if(S.phase!=='over')return;S.finished=true;document.body.classList.remove('walking');document.body.classList.add('finished');render();});},1300);
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
function newGame(){gen++;const seed=Math.floor(Math.random()*9000)+1000;lane=generateLane(seed);scene.reset(lane);document.body.classList.remove('walking','finished');document.getElementById('seed').textContent=`Lane ${seed}`;S={seed,seenForest:false,from:{p:0,c:0},score:{p:0,c:0},disp:{p:0,c:0},dealer:Math.random()<.5?'p':'c',log:[],round:0,phase:'',winner:null};log(`${NAME[S.dealer]} cut the lower card and ${S.dealer==='p'?'deal':'deals'} first`);startRound();}
function startRound(){
 S.round++;S.from={...S.score};S.biome=scene.setStop(S.score);const d=shuffled();
 later(()=>{if(S.phase==='discard')scene.say(['Hmm, let me think...','Now then...','Ooh, decisions.'][S.round%3]);},700);
 S.deck=d;S.hand={p:d.splice(0,6).sort(byRank),c:d.splice(0,6).sort(byRank)};
 S.crib=[];S.starter=null;S.sel=[];S.peg=null;S.show=null;S.phase='discard';
 log(`Round ${S.round}. ${S.dealer==='p'?'Your':"Winnie's"} crib`);
 const [i,j]=compDiscard(S.hand.c,S.dealer==='c');S.compDiscard=[S.hand.c[i],S.hand.c[j]];
 render();
}
function confirmDiscard(){
 if(S.sel.length!==2)return;
 const mine=S.hand.p.filter(c=>S.sel.includes(c.id));
 S.hand.p=S.hand.p.filter(c=>!S.sel.includes(c.id));
 S.hand.c=S.hand.c.filter(c=>!S.compDiscard.includes(c));
 S.crib=[...mine,...S.compDiscard];S.sel=[];sfx('card');
 S.kept={p:[...S.hand.p],c:[...S.hand.c]};
 S.starter=S.deck.pop();S.phase='cut';
 log(`Starter: ${cardName(S.starter)}`);
 if(S.starter.r===11){pop('+2 His heels','#starter',S.dealer,200);if(addPts(S.dealer,2,'His heels'))return;}
 render();
 later(()=>{S.phase='peg';S.peg={count:0,seq:[],pile:[],spent:0,hand:{p:[...S.hand.p],c:[...S.hand.c]},turn:other(S.dealer),go:{p:false,c:false},last:null};log(`${NAME[other(S.dealer)]} ${S.dealer==='c'?'lead':'leads'} the pegging`);advance();},1100);
}
const canPlay=w=>S.peg.hand[w].some(c=>S.peg.count+val(c)<=31);
function resetCount(){const P=S.peg;P.spent+=P.pile.length;P.pile=[];P.count=0;P.seq=[];P.go={p:false,c:false};}
function play(who,card){
 const P=S.peg;P.hand[who]=P.hand[who].filter(c=>c!==card);
 sfx('card');P.count+=val(card);P.seq.push(card);P.pile.push({card,who});P.last=who;P.fresh=card.id;
 log(`${NAME[who]} ${who==='p'?'play':'plays'} ${cardName(card)}. Count ${P.count}`);
 const items=pegScore(P.seq,P.count);
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
 const nxt=other(P.last);render();later(()=>{resetCount();P.turn=nxt;advance();},900);
}
function advance(){
 if(S.phase!=='peg')return;const P=S.peg;P.fresh=null;
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
function sayGo(){const P=S.peg;P.go.p=true;sfx('go');log('You say Go');render();later(()=>resolveStuck('p'),400);}
function startShow(){
 const nd=other(S.dealer),d=S.dealer;
 S.phase='show';S.show={step:-1,steps:[{who:nd,cards:S.kept[nd],crib:false},{who:d,cards:S.kept[d],crib:false},{who:d,cards:S.crib,crib:true}]};
 nextShow();
}
function nextShow(){
 const sh=S.show;sh.step++;
 if(sh.step>2){
  S.phase='walking';document.body.classList.add('walking');render();
  scene.walk(S.score).then(()=>{if(S.phase!=='walking')return;document.body.classList.remove('walking');S.dealer=other(S.dealer);startRound();});
  return;}
 const st=sh.steps[sh.step];st.res=scoreHand(st.cards,S.starter,st.crib);st.shown=0;st.run=0;st.done=false;
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
const backHTML=(st='')=>`<div class="back" style="${st}" aria-hidden="true"><svg viewBox="0 0 9 10"><use href="#s-leaf"></use></svg></div>`;
function render(){
 const P=S.peg,ph=S.phase;
 const sst=ph==='show'?S.show.steps[S.show.step]:null;
 const hlIds=sst&&sst.shown&&!sst.done?sst.res.items[sst.shown-1].cards.map(c=>c.id):[];
 const rowCards=w=>(sst&&sst.crib&&sst.who===w?S.crib:S.kept[w]);
 const active=w=>!sst||sst.who===w;
 // Winnie's cards, held beside her
 let opp;
 if(ph==='show'||(ph==='over'&&S.show&&S.kept))opp=`<div class="held small${active('c')?'':' faded'}">${rowCards('c').map(c=>cardHTML(c,{hl:hlIds.includes(c.id)})).join('')}</div>`;
 else{const n=ph==='discard'?6:ph==='cut'?4:P?P.hand.c.length:0;opp=`<div class="fan small">${Array.from({length:n},()=>backHTML()).join('')}</div>`;}
 const ou=$id('oppUI');ou.innerHTML=opp;
 {const L=scene.layout(),sf=L.surface,hw=ou.offsetWidth/2,m=14*L.u;ou.style.left=Math.max(sf.x+m+hw,Math.min(sf.x+sf.w-m-hw,L.seats[0].x))+'px';}
 // the surface: starter, pile and crib
 const cribName=S.dealer==='p'?'Your crib':"Winnie's crib";
 const starter=`<div class="spot"><span class="tag">${S.starter?'Starter':'Deck'}</span><div id="starter">${S.starter?cardHTML(S.starter,{hl:hlIds.includes(S.starter.id)}):`<div class="crib">${[0,3,6].map(o=>backHTML(`position:absolute;left:${o}px;top:${o}px`)).join('')}</div>`}</div></div>`;
 let cribVis;
 if(ph==='show'&&S.show.step===2)cribVis=`<div class="empty">Counting</div>`;
 else if(S.crib.length)cribVis=`<div class="crib">${[0,4,8,12].map(o=>backHTML(`position:absolute;left:${o}px;top:${o}px`)).join('')}</div>`;
 else cribVis=`<div class="slots"><div class="empty"></div><div class="empty"></div></div>`;
 const crib=`<div class="spot"><span class="tag">${cribName}</span>${cribVis}</div>`;
 let centre;
 if(ph==='show'){
  const st=sst,what=st.crib?`${st.who==='p'?'Your':"Winnie's"} crib`:`${st.who==='p'?'Your':"Winnie's"} hand`;
  const last=st.shown?st.res.items[st.shown-1]:null;
  const note=st.done?(st.res.total?`${st.res.total} ${st.res.total===1?'point':'points'}`:'Nothing to score'):last?`${last.label}: ${last.cards.map(short).join(' + ')}`:'Counting';
  centre=`<div class="centre"><div class="panel countbox" id="tally"><span class="label">${what}</span><b>${st.run}</b><span class="note">${note}</span></div></div>`;
 }else if(ph==='over'&&S.finished){
  const lose=other(S.winner),ls=S.score[lose];const sk=ls<61?' A double skunk!':ls<91?' A skunk!':'';
  centre=`<div class="centre"><div class="panel overlay"><span class="total">${S.winner==='p'?'You made it home first!':'Winnie made it home first'}</span><span class="label">${S.score.p} to ${S.score.c}.${sk} Lane ${S.seed}.</span><button class="btn" data-act="new">Play again</button></div></div>`;
 }else{
  const cur=P?P.pile:[],n=cur.length;
  const pile=cur.map((x,i)=>{const k=n-1-i,step=k<=2?k:2,dy=hashf(x.card.id,'y')*6,rt=hashf(x.card.id,'r')*(k<=2?5:10);
   const sp=scene.layout().portrait?.3:.5,left=`calc(50% + var(--cw)*${(sp-step*sp).toFixed(2)} - var(--cw)/2 - ${k>2?(k-2)*6:0}px)`;const t=`translateY(${dy.toFixed(0)}px) rotate(${rt.toFixed(1)}deg)`;
   return cardHTML(x.card,{cls:'pc'+(P.fresh===x.card.id?' new':''),extra:`left:${left};--t:${t};transform:${t};z-index:${i+1}`});}).join('');
  const spent=P&&P.spent?`<div class="spent"><div class="crib">${[0,3,6].map(o=>backHTML(`position:absolute;left:${o}px;top:${o}px`)).join('')}</div>${P.spent} played</div>`:'';
  centre=`<div class="centre"><div class="panel countbox"><span class="label">Count</span><b>${P?P.count:0}</b></div><div class="pilewrap">${spent}<div class="pile">${pile}</div></div></div>`;
 }
 $id('surfaceUI').innerHTML=ph==='over'&&S.finished?centre:`${starter}${centre}${crib}`;
 // your hand and the prompt
 let prompt='';
 if(ph==='discard')prompt=`Pick 2 for ${S.dealer==='p'?'your':"Winnie's"} crib`;
 else if(ph==='cut')prompt='Turning the starter';
  else if(ph==='peg'){if(P.turn==='p'){prompt=canPlay('p')?'Your turn, play a card':P.hand.p.length?(P.go.p?'Waiting for Winnie':"You can't play, say Go"):'Out of cards';}else prompt="Winnie's turn";}
 else if(ph==='walking')prompt='Walking on...';
 let cards=[],opt={};
 if(ph==='discard')cards=S.hand.p.map(c=>[c,{btn:true,sel:S.sel.includes(c.id)}]);
 else if(ph==='cut')cards=S.hand.p.map(c=>[c,{}]);
 else if(ph==='peg'){const mine=P.turn==='p';cards=P.hand.p.map(c=>{const ok=mine&&P.count+val(c)<=31;return [c,{btn:true,dis:!ok,dim:mine&&!ok}];});}
 else if(ph==='show'||ph==='over')cards=(S.kept?rowCards('p'):[]).map(c=>[c,{hl:hlIds.includes(c.id)}]);
 const n=cards.length;
 const fan=cards.map(([c,o],i)=>{const k=scene.layout().portrait?1.8:3,a=(i-(n-1)/2)*k,y=Math.abs(i-(n-1)/2)*Math.abs(i-(n-1)/2)*(k-.5);return cardHTML(c,{...o,extra:`--fan:translateY(${y.toFixed(0)}px) rotate(${a.toFixed(1)}deg)`});}).join('');
 let acts='';
 if(ph==='discard')acts=`<button class="btn" data-act="discard" ${S.sel.length===2?'':'disabled'}>Send to crib</button>`;
 if(ph==='show')acts=sst.done?`<button class="btn" data-act="next">${S.show.step<2?'Next':'Walk on'}</button>`:`<button class="btn ghost" data-act="skip">Skip</button>`;
 if(ph==='peg'&&P.turn==='p'&&!canPlay('p')&&P.hand.p.length&&!P.go.p)acts=`<button class="btn" data-act="go">Go</button>`;
 $id('barUI').innerHTML=`${prompt?`<span class="prompt">${prompt}</span>`:''}${acts}`;
 $id('handUI').innerHTML=`<div class="fanhand">${fan}</div>`;
 // header
 $id('roundInfo').textContent=`Round ${S.round}, ${S.dealer==='p'?'your':"Winnie's"} crib`;
 for(const w of ['p','c']){const gain=S.score[w]-S.from[w];$id('score-'+w).textContent=S.score[w];$id('gain-'+w).textContent=gain>0&&ph!=='walking'?`+${gain}`:'';}
 $id('log').innerHTML=S.log.map(t=>`<p>${t}</p>`).join('');
}
document.addEventListener('click',e=>{
 const b=e.target.closest('#surfaceUI button,#handUI button,#barUI button,#oppUI button');if(!b||b.disabled)return;
 const act=b.dataset.act;
 if(act==='discard')return confirmDiscard();
 if(act==='go')return sayGo();
 if(act==='next')return nextShow();
 if(act==='skip')return skipShow();
 if(act==='new')return newGame();
 const id=b.dataset.id;if(!id)return;
 if(S.phase==='discard'){S.sel=S.sel.includes(id)?S.sel.filter(x=>x!==id):S.sel.length<2?[...S.sel,id]:[S.sel[1],id];render();}
 else if(S.phase==='peg'&&S.peg.turn==='p'){const c=S.peg.hand.p.find(x=>x.id===id);if(c&&S.peg.count+val(c)<=31)play('p',c);}
});
document.getElementById('newGame').addEventListener('click',newGame);
document.getElementById('newGameIcon').addEventListener('click',newGame);
for(const [btn,dlg] of [['historyBtn','historyDlg'],['rulesBtn','rulesDlg']]){
 document.getElementById(btn).addEventListener('click',()=>{const d=document.getElementById(dlg);d.hidden=!d.hidden;});
}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{b.closest('.dialog').hidden=true;}));
document.addEventListener('pointerdown',()=>initAudio(),{once:true});
document.addEventListener('keydown',()=>initAudio(),{once:true});
for(const [id,fn,key] of [['musicBtn',setMusic,'music'],['soundBtn',setSound,'sound']]){
 const b=document.getElementById(id);
 b.addEventListener('click',()=>{initAudio();const on=!settings[key];fn(on);b.setAttribute('aria-pressed',on);b.classList.toggle('off',!on);});
}
window.__cc={scene,get S(){return S},get lane(){return lane},nextShow,confirmDiscard,play,sayGo,addPts};
placeUI();
newGame();
