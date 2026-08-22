export const date=(s:string)=>new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(s.includes('T')?s:s+'T12:00:00'));
export const dateTime=(s:string)=>new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s));
export const money=(n:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(n)||0);
export const rand=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
export async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
export const seasonCode=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',b=crypto.getRandomValues(new Uint8Array(8));return 'SMG-'+Array.from(b,x=>a[x%a.length]).join('')};
export const isoDate=(d= new Date())=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
export const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
export const pct=(a:number,b:number)=>b?Math.round(a/b*100):0;
export const initials=(a:string,b:string)=>`${a?.[0]||''}${b?.[0]||''}`.toUpperCase();
export const csv=(rows:any[][])=>rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
export const downloadText=(filename:string,text:string,type='text/csv')=>{const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)};
