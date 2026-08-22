import{useEffect,useState}from'react';import{useLocation,useNavigate}from'react-router-dom';import{Activity,ArrowLeft,BarChart3,CalendarDays,CircleDollarSign,ClipboardList,FileText,Home,Menu,Settings,ShieldCheck,Trophy,Users,LogOut,FlaskConical}from'lucide-react';import{Season}from'../types';import{logout}from'../lib/auth';import{useSeason}from'../hooks/useSeason';
const items=(sid:string)=>[
 [`/season/${sid}`,'Home',Home,null],
 [`/season/${sid}/players`,'Rosa',Users,'players'],
 [`/season/${sid}/sessions`,'Sedute',CalendarDays,'sessions'],
 [`/season/${sid}/attendance`,'Presenze',ClipboardList,'attendance'],
 [`/season/${sid}/workload`,'Carichi',Activity,'workload'],
 [`/season/${sid}/leaderboard`,'Classifica',Trophy,'leaderboard'],
 [`/season/${sid}/fines`,'Multe',CircleDollarSign,'fines'],
 [`/season/${sid}/reports`,'Report',FileText,'reports'],
 [`/season/${sid}/members`,'Staff',ShieldCheck,'members'],
 [`/season/${sid}/log`,'Log',BarChart3,null],
 [`/season/${sid}/settings`,'Impostazioni',Settings,null],
 [`/season/${sid}/tests`,'Test',FlaskConical,'tests']
] as const;
export function Layout({children,season}:{children:React.ReactNode;season?:Season|null}){
 const nav=useNavigate(),loc=useLocation(),[menu,setMenu]=useState(false),{access}=useSeason(season?.id);
 useEffect(()=>setMenu(false),[loc.pathname]);
 const list=season?items(season.id).filter(([,label,,perm])=>!perm||access.role==='OWNER'||Boolean(access.permissions[perm])):[];
 return <div className="app"><header className="top"><button className="brand" onClick={()=>nav(season?`/season/${season.id}`:'/dashboard')}><i>S</i><span>SOCCERMRGAMIFICATION</span></button>{season&&<span className="season-chip">{season.team_name} · {season.sporting_year}</span>}<div className="top-actions">{season&&<button className="top-code" onClick={()=>navigator.clipboard?.writeText(season.access_code)} title="Copia codice">{season.access_code}</button>}<button className="icon mobile" onClick={()=>setMenu(x=>!x)}><Menu/></button></div></header><div className="layout">{season&&<aside className={menu?'side open':'side'}>{list.map(([u,l,I])=><button key={u} className={loc.pathname===u||loc.pathname.startsWith(u+'/')?'nav active':'nav'} onClick={()=>nav(u)}><I size={17}/>{l}</button>)}<div className="grow"/><button className="nav" onClick={()=>nav('/dashboard')}><ArrowLeft size={17}/>Dashboard</button><button className="nav danger-nav" onClick={()=>logout()}><LogOut size={17}/>Esci</button></aside>}<main>{children}</main></div>{season&&<nav className="bottom">{list.slice(0,5).map(([u,l,I])=><button key={u} className={loc.pathname===u||loc.pathname.startsWith(u+'/')?'active':''} onClick={()=>nav(u)}><I size={18}/><span>{l}</span></button>)}</nav>}</div>}
export function Page({title,sub,season,actions,children,eyebrow='STAGIONE'}:{title:string;sub?:string;season:Season|null;actions?:React.ReactNode;children:React.ReactNode;eyebrow?:string}){return <Layout season={season}><div className="page"><div className="head"><div><small>{eyebrow}</small><h1>{title}</h1>{sub&&<p>{sub}</p>}</div>{actions&&<div className="head-actions">{actions}</div>}</div>{children}</div></Layout>}
