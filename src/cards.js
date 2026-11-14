// Cards, suits and helpers

export const SUITS=[{n:'apples',id:'s-apple',c:'#A81C2A'},{n:'pumpkins',id:'s-pumpkin',c:'#D2640A'},{n:'leaves',id:'s-leaf',c:'#2E6B34'},{n:'acorns',id:'s-acorn',c:'#4A2E1C'}];
export const RL=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export const RN=['','ace','2','3','4','5','6','7','8','9','10','jack','queen','king'];
export const NAME={p:'You',c:'Winnie'};
export const val=c=>Math.min(c.r,10);
export const other=w=>w==='p'?'c':'p';
export const byRank=(a,b)=>a.r-b.r||a.s-b.s;
export const cardName=c=>`${RN[c.r]} of ${SUITS[c.s].n}`;
export const short=c=>RL[c.r];

export function fullDeck(){const d=[];for(let s=0;s<4;s++)for(let r=1;r<=13;r++)d.push({r,s,id:r+'-'+s});return d;}
export function shuffled(){const d=fullDeck();for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}

