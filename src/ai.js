// Winnie, the computer opponent
import { val, fullDeck } from './cards.js';
import { scoreHand, pegScore } from './scoring.js';

export function cribGuess(d){let v=0;if(d[0].r===d[1].r)v+=2;if(val(d[0])+val(d[1])===15)v+=2;d.forEach(c=>{if(c.r===5)v+=1.5;if(c.r===11)v+=.25;});if(Math.abs(d[0].r-d[1].r)===1)v+=.7;if(d[0].s===d[1].s)v+=.2;return v;}
export function compDiscard(hand,isDealer){
 const known=new Set(hand.map(c=>c.id)),rest=fullDeck().filter(c=>!known.has(c.id));
 let best=[0,1],bs=-1e9;
 for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){
  const keep=hand.filter((_,k)=>k!==i&&k!==j);let sum=0;
  for(const st of rest)sum+=scoreHand(keep,st,false).total;
  const ev=sum/rest.length+(isDealer?1:-1)*cribGuess([hand[i],hand[j]]);
  if(ev>bs){bs=ev;best=[i,j];}
 }
 return best;
}
export function compPeg(P){
 const opts=P.hand.c.filter(c=>P.count+val(c)<=31);let best=opts[0],bs=-1e9;
 for(const c of opts){const cnt=P.count+val(c);let s=pegScore([...P.seq,c],cnt).reduce((a,i)=>a+i.pts,0)*10;
  if(cnt===5||cnt===21)s-=4;if(P.count===0&&c.r===5)s-=4;if(P.count===0&&val(c)<5)s+=1.5;s+=val(c)*.05;
  if(s>bs){bs=s;best=c;}}
 return best;
}

