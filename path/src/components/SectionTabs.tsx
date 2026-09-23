import React from 'react';
export type SectionTab={id:string;label:string;count?:string|number};
export function SectionTabs({tabs,value,onChange}:{tabs:SectionTab[];value:string;onChange:(id:string)=>void}){
 return <div className="section-tabs" role="tablist">
  {tabs.map(t=><button key={t.id} role="tab" aria-selected={value===t.id} className={value===t.id?'active':''} onClick={()=>onChange(t.id)}>
   <span>{t.label}</span>{t.count!==undefined&&<small>{t.count}</small>}
  </button>)}
 </div>
}
