// Hand and pegging scoring
import { val, byRank } from './cards.js';

export function scoreHand(hand,starter,isCrib){
 const all=[...hand,starter],items=[];
 for(let m=1;m<32;m++){let s=0,cs=[];for(let i=0;i<5;i++)if(m&(1<<i)){s+=val(all[i]);cs.push(all[i]);}if(s===15&&cs.length>1)items.push({label:'Fifteen',cards:cs,pts:2});}
 for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)if(all[i].r===all[j].r)items.push({label:'Pair',cards:[all[i],all[j]],pts:2});
 for(let L=5;L>=3;L--){let found=false;
  for(let m=1;m<32;m++){const cs=all.filter((_,i)=>m&(1<<i));if(cs.length!==L)continue;const rs=cs.map(c=>c.r).sort((a,b)=>a-b);let ok=true;for(let k=1;k<L;k++)if(rs[k]!==rs[k-1]+1){ok=false;break;}if(ok){found=true;items.push({label:'Run of '+L,cards:cs.sort(byRank),pts:L});}}
  if(found)break;}
 if(hand.every(c=>c.s===hand[0].s)){if(starter.s===hand[0].s)items.push({label:'Flush of 5',cards:all,pts:5});else if(!isCrib)items.push({label:'Flush of 4',cards:hand,pts:4});}
 const nob=hand.find(c=>c.r===11&&c.s===starter.s);if(nob)items.push({label:'His nobs',cards:[nob],pts:1});
 return{items,total:items.reduce((a,i)=>a+i.pts,0)};
}
export function pegScore(seq,count){
 const items=[];
 if(count===15)items.push({label:'Fifteen',pts:2});
 if(count===31)items.push({label:'31',pts:2});
 let k=1;while(k<seq.length&&seq[seq.length-1-k].r===seq[seq.length-1].r)k++;
 if(k===2)items.push({label:'Pair',pts:2});else if(k===3)items.push({label:'Pair royal',pts:6});else if(k===4)items.push({label:'Double pair royal',pts:12});
 for(let L=seq.length;L>=3;L--){const rs=seq.slice(-L).map(c=>c.r).sort((a,b)=>a-b);let ok=true;for(let i=1;i<L;i++)if(rs[i]!==rs[i-1]+1){ok=false;break;}if(ok){items.push({label:'Run of '+L,pts:L});break;}}
 return items;
}

