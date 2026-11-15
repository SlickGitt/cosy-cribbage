// Winnie, the computer opponent
import { val, fullDeck } from './cards.js';
import { scoreHand, pegScore } from './scoring.js';

export function cribGuess(d){let v=0;if(d[0].r===d[1].r)v+=2;if(val(d[0])+val(d[1])===15)v+=2;d.forEach(c=>{if(c.r===5)v+=1.5;if(c.r===11)v+=.25;});if(Math.abs(d[0].r-d[1].r)===1)v+=.7;if(d[0].s===d[1].s)v+=.2;return v;}
// How carefully Winnie plays: 'gentle', 'normal' or 'sharp'.
let level='normal';
export function setLevel(l){level=l;}
const SLIP={gentle:{discard:.6,peg:.5},normal:{discard:.2,peg:.15},sharp:{discard:0,peg:0}};
export function compDiscard(hand,isDealer){
 const known=new Set(hand.map(c=>c.id)),rest=fullDeck().filter(c=>!known.has(c.id));
 const all=[];
 for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
  const keep=hand.filter((_,k)=>k!==i&&k!==j);let sum=0;
  for(const st of rest)sum+=scoreHand(keep,st,false).total;
  all.push([sum/rest.length+(isDealer?1:-1)*cribGuess([hand[i],hand[j]]),[i,j]]);
 }
 all.sort((a,b)=>b[0]-a[0]);
 // a less careful Winnie sometimes keeps a slightly worse hand
 if(Math.random()<SLIP[level].discard)return all[Math.min(all.length-1,1+Math.floor(Math.random()*(level==='gentle'?6:2)))][1];
 return all[0][1];
}
export function compPeg(P){
 const opts=P.hand.c.filter(c=>P.count+val(c)<=31);let best=opts[0],bs=-1e9;
 if(Math.random()<SLIP[level].peg)return opts[Math.floor(Math.random()*opts.length)];
 for(const c of opts){const cnt=P.count+val(c);let s=pegScore([...P.seq,c],cnt).reduce((a,i)=>a+i.pts,0)*10;
  if(cnt===5||cnt===21)s-=4;if(P.count===0&&c.r===5)s-=4;if(P.count===0&&val(c)<5)s+=1.5;s+=val(c)*.05;
  if(s>bs){bs=s;best=c;}}
 return best;
}

