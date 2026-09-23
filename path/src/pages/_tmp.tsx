import{useEffect,useMemo,useState}from'react';import{Activity,Check,ClipboardList,Download,Edit3,Goal,Plus,Save,ShieldAlert,Trash2,Trophy,Users,X}from'lucide-react';import{useParams}from'react-router-dom';import{supabase}from'../lib/supabase';import{Page}from'../components/Layout';import{Center,Confirm,Modal,Stat}from'../components/ui';import{useSeason}from'../hooks/useSeason';import{useToast}from'../components/Toast';import{date,clamp}from'../lib/utils';import{makePdf}from'../lib/pdf';import type{Player,Session,Match,CallupStatus}from'../types';
const callupLabels:Record<CallupStatus,string>={CALLED_UP:'Convocato',SUSPENDED:'Squalificato',INJURED:'Infortunato',TECHNICAL_CHOICE:'Scelta tecnica',OTHER:'Altro'};
const longDate=(value:string)=>new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`));
const getCallupLabel=(status:unknown):string=>{const key=typeof status==='string'&&status in callupLabels?status as CallupStatus:'OTHER';return callupLabels[key]};
const absenceLabels={INJURED:'Infortunato',OTHER:'Altro motivo',UNJUSTIFIED:'Ingiustificato'};
const attendanceOptions=[['INJURED','Infortunato'],['OTHER','Altro motivo'],['UNJUSTIFIED','Ingiustificato']] as const;
type GameTeamChoice='A'|'B'|'N';

export default function SessionDetail(){const{seasonId,sessionId}=useParams(),{season,loading}=useSeason(seasonId),toast=useToast();const[session,setSession]=useState<Session|null>(null),[match,setMatch]=useState<Match|null>(null),[players,setPlayers]=useState<Player[]>([]),[staff,setStaff]=useState<any[]>([]),[staffAttendance,setStaffAttendance]=useState<Record<string,any>>({}),[attendance,setAttendance]=useState<Record<string,any>>({}),[loads,setLoads]=useState<Record<string,any>>({}),[callups,setCallups]=useState<Record<string,any>>({}),[stats,setStats]=useState<Record<string,any>>({}),[events,setEvents]=useState<any[]>([]),[games,setGames]=useState<any[]>([]),[callupOptions,setCallupOptions]=useState<any[]>([]),[tab,setTab]=useState('main'),[busy,setBusy]=useState(false),[gameModal,setGameModal]=useState(false),[game,setGame]=useState<any>(null),[gameTeams,setGameTeams]=useState<Record<string,'A'|'B'>>({}),[gameGoals,setGameGoals]=useState<any[]>([]),[confirm,setConfirm]=useState<any>(null),[editingEvent,setEditingEvent]=useState<any>(null);
async function load(){if(!sessionId||!seasonId)return;const{data:s}=await supabase.from('sessions').select('*').eq('id',sessionId).single();if(!s){toast.push('Seduta non trovata.','error');return}setSession(s as Session);const{data:m}=await supabase.from('matches').select('*').eq('session_id',sessionId).maybeSingle();const matchId=m?.id||'00000000-0000-0000-0000-000000000000';const[{data:p},{data:ts},{data:a},{data:l},{data:cs},{data:st},{data:ev},{data:g},{data:co},{data:sa}]=await Promise.all([supabase.from('players').select('*').eq('season_id',seasonId).eq('status','ACTIVE').order('last_name'),supabase.from('technical_staff').select('*').eq('season_id',seasonId).eq('status','ACTIVE').order('last_name'),supabase.from('attendance_records').select('*').eq('session_id',sessionId),supabase.from('player_session_loads').select('*').eq('session_id',sessionId),supabase.from('match_callups').select('*').eq('match_id',matchId),supabase.from('match_player_stats').select('*').eq('match_id',matchId),supabase.from('match_events').select('*').eq('match_id',matchId).order('minute'),supabase.from('training_games').select('*').eq('session_id',sessionId).order('created_at',{ascending:false}),supabase.from('callup_status_options').select('*').eq('season_id',seasonId).eq('active',true).order('label'),supabase.from('staff_attendance').select('*').eq('session_id',sessionId)]);setPlayers((p||[]) as Player[]);setStaff(ts||[]);setMatch(m as any);setAttendance(Object.fromEntries((p||[]).map((pl:any)=>[pl.id,(a||[]).find((x:any)=>x.player_id===pl.id)||{status:'PRESENT',absence_reason:null}])));setLoads(Object.fromEntries((l||[]).map(x=>[x.player_id,x])));setCallups(Object.fromEntries((cs||[]).map(x=>[x.player_id,x])));setStats(Object.fromEntries((st||[]).map(x=>[x.player_id,x])));setEvents(ev||[]);setGames(g||[]);setCallupOptions(co||[]);setStaffAttendance(Object.fromEntries((ts||[]).map((x:any)=>[x.id,(sa||[]).find((r:any)=>r.staff_id===x.id)||{status:'PRESENT',absence_reason:null}])))}
useEffect(()=>{load()},[sessionId,seasonId]);
async function saveTraining(){if(!sessionId)return;setBusy(true);const att=players.map(p=>({session_id:sessionId,player_id:p.id,status:attendance[p.id]?.status||'ABSENT',absence_reason:attendance[p.id]?.status==='PRESENT'?null:(attendance[p.id]?.absence_reason||'OTHER')}));const ld=players.map(p=>{const a=attendance[p.id];const r=loads[p.id]||{};const present=a?.status==='PRESENT';return{session_id:sessionId,player_id:p.id,rpe:present&&r.rpe!==''&&r.rpe!=null?Number(r.rpe):null,duration_minutes:present?clamp(Number(r.duration_minutes??90)||90,0,300):0}});const staffAtt=(staff||[]).map((s:any)=>({session_id:sessionId,staff_id:s.id,status:staffAttendance[s.id]?.status||'PRESENT',absence_reason:staffAttendance[s.id]?.status==='PRESENT'?null:(staffAttendance[s.id]?.absence_reason||'OTHER')}));
const[a,b,c]=await Promise.all([supabase.from('attendance_records').upsert(att,{onConflict:'session_id,player_id'}),supabase.from('player_session_loads').upsert(ld,{onConflict:'session_id,player_id'}),supabase.from('staff_attendance').upsert(staffAtt,{onConflict:'session_id,staff_id'})]);if(a.error||b.error||c.error)toast.push(a.error?.message||b.error?.message||c.error?.message||'Errore nel salvataggio','error');else{toast.push('Presenze e carichi salvati');await load()}setBusy(false)}
async function saveMatch(){if(!match)return;setBusy(true);const call=players.map(p=>({match_id:match.id,player_id:p.id,status:(callups[p.id]?.status||'OTHER') as CallupStatus,custom_status:callups[p.id]?.custom_status||null,notes:callups[p.id]?.notes||null}));const st=players.map(p=>({match_id:match.id,player_id:p.id,started:Boolean(stats[p.id]?.started),minutes_played:clamp(Number(stats[p.id]?.minutes_played)||0,0,130),rpe:stats[p.id]?.rpe===''||stats[p.id]?.rpe==null?null:clamp(Number(stats[p.id]?.rpe),1,10)}));const{error}=await supabase.from('match_callups').upsert(call,{onConflict:'match_id,player_id'});if(error){toast.push(error.message,'error');setBusy(false);return}const{error:se}=await supabase.from('match_player_stats').upsert(st,{onConflict:'match_id,player_id'});if(se){toast.push(se.message,'error');setBusy(false);return}const loadsForMatch=players.map(p=>({session_id:sessionId,player_id:p.id,rpe:st.find(x=>x.player_id===p.id)?.rpe??null,duration_minutes:st.find(x=>x.player_id===p.id)?.minutes_played||0}));await supabase.from('player_session_loads').upsert(loadsForMatch,{onConflict:'session_id,player_id'});toast.push('Convocazioni e minutaggi salvati');await load();setBusy(false)}
async function saveMatchInfo(e:React.FormEvent){e.preventDefault();if(!match)return;setBusy(true);const{error}=await supabase.from('matches').update({opponent:match.opponent,venue:match.venue,home_score:match.home_score,away_score:match.away_score,notes:match.notes}).eq('id',match.id);if(error)toast.push(error.message,'error');else{toast.push('Dati partita aggiornati');await load()}setBusy(false)}
async function addEvent(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!match)return;const fd=new FormData(e.currentTarget);const player_id=String(fd.get('player_id')||'');const event_type=String(fd.get('event_type')||'GOAL');const minute=Number(fd.get('minute')||0);const payload={match_id:match.id,player_id:player_id||null,event_type,minute:minute||null,metadata:{}};const res=editingEvent?await supabase.from('match_events').update(payload).eq('id',editingEvent.id):await supabase.from('match_events').insert(payload);if(res.error)toast.push(res.error.message,'error');else{toast.push(editingEvent?'Evento modificato':'Evento aggiunto');e.currentTarget.reset();setEditingEvent(null);load()}}
async function deleteEvent(id:string){const{error}=await supabase.from('match_events').delete().eq('id',id);if(error)toast.push(error.message,'error');else load()}
async function openGame(g:any=null){
 setGame(g);
 const presentPlayers=players.filter(p=>attendance[p.id]?.status==='PRESENT');
 if(g){
  const[{data:gp},{data:gg}]=await Promise.all([
   supabase.from('training_game_players').select('*').eq('training_game_id',g.id),
   supabase.from('training_game_goals').select('*').eq('training_game_id',g.id).order('minute')
  ]);
  const saved=Object.fromEntries((gp||[]).map(x=>[x.player_id,x.team as GameTeamChoice]));
  setGameTeams(Object.fromEntries(presentPlayers.map(p=>[p.id,(saved[p.id]||'N') as GameTeamChoice])));
  setGameGoals(gg||[]);
 }else{
  // Start with the present players distributed across A/B; the coach can move
  // anyone or mark them as "Non ha giocato".
  setGameTeams(Object.fromEntries(presentPlayers.map((p,i)=>[p.id,(i%2===0?'A':'B') as GameTeamChoice])));
  setGameGoals([]);
 }
 setGameModal(true);
}
async function saveGame(){
 if(!sessionId)return;
 setBusy(true);
 const presentPlayers=players.filter(p=>attendance[p.id]?.status==='PRESENT');
 const unassigned=presentPlayers.filter(p=>!['A','B'].includes(gameTeams[p.id]||''));
 if(unassigned.length){
  toast.push(`Assegna una squadra o "Non ha giocato" a tutti i presenti. Mancano: ${unassigned.map(p=>p.first_name+' '+p.last_name).join(', ')}`,'error');
  setBusy(false);
  return;
 }
 const aScore=game?.team_a_score??0,bScore=game?.team_b_score??0;
 const{data:g,error}=game
  ?await supabase.from('training_games').update({name:game.name||'Partitella',team_a_score:aScore,team_b_score:bScore}).eq('id',game.id).select().single()
  :await supabase.from('training_games').insert({session_id:sessionId,name:'Partitella',team_a_score:aScore,team_b_score:bScore}).select().single();
 if(error||!g){toast.push(error?.message||'Errore partitella','error');setBusy(false);return}
 await supabase.from('training_game_players').delete().eq('training_game_id',g.id);
 const rows=presentPlayers.filter(p=>gameTeams[p.id]==='A'||gameTeams[p.id]==='B').map(p=>({training_game_id:g.id,player_id:p.id,team:gameTeams[p.id]}));
 const{error:pe}=rows.length?await supabase.from('training_game_players').insert(rows):{error:null};
 if(pe){toast.push(pe.message,'error');setBusy(false);return}
 await supabase.from('training_game_goals').delete().eq('training_game_id',g.id);
 const validGoalPlayers=new Set(rows.map((x:any)=>x.player_id));
 const validGoals=gameGoals.filter(x=>x.player_id&&validGoalPlayers.has(x.player_id));
 if(validGoals.length){
  const{error:ge}=await supabase.from('training_game_goals').insert(validGoals.map(x=>({training_game_id:g.id,player_id:x.player_id,team:x.team,minute:x.minute||null})));
  if(ge){toast.push(ge.message,'error');setBusy(false);return}
 }
 toast.push(game?'Partitella aggiornata':'Partitella creata');
 setGameModal(false);
 await load();
 setBusy(false);
}
async function removeGame(){if(!confirm)return;const{error}=await supabase.from('training_games').delete().eq('id',confirm.id);if(error)toast.push(error.message,'error');else{toast.push('Partitella eliminata');load()}setConfirm(null)}
function exportCallup(){if(!match||!season)return;const called=players.filter(p=>callups[p.id]?.status==='CALLED_UP');makePdf(`Convocazione · ${match.opponent}`,[{title:'Partita',lines:[`${date(session!.session_date)} · ${match.venue==='HOME'?'Casa':'Trasferta'}`,`Avversario: ${match.opponent}`,`Risultato: ${match.home_score??'—'}-${match.away_score??'—'}`]},{title:'Convocati',lines:called.map(p=>`${p.first_name} ${p.last_name}${p.shirt_number?` · #${p.shirt_number}`:''}`)},{title:'Stati',lines:players.filter(p=>callups[p.id]?.status!=='CALLED_UP').map(p=>`${p.first_name} ${p.last_name} — ${getCallupLabel(callups[p.id]?.status)}`)}],'convocazione.pdf',{team:season.team_name,season:season.sporting_year})}
import{useEffect,useMemo,useState}from'react';import{Activity,Check,ClipboardList,Download,Edit3,Goal,Plus,Save,ShieldAlert,Trash2,Trophy,Users,X}from'lucide-react';import{useParams}from'react-router-dom';import{supabase}from'../lib/supabase';import{Page}from'../components/Layout';import{Center,Confirm,Modal,Stat}from'../components/ui';import{useSeason}from'../hooks/useSeason';import{useToast}from'../components/Toast';import{date,clamp}from'../lib/utils';import{makePdf}from'../lib/pdf';import type{Player,Session,Match,CallupStatus}from'../types';
const callupLabels:Record<CallupStatus,string>={CALLED_UP:'Convocato',SUSPENDED:'Squalificato',INJURED:'Infortunato',TECHNICAL_CHOICE:'Scelta tecnica',OTHER:'Altro'};
const longDate=(value:string)=>new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`));
const getCallupLabel=(status:unknown):string=>{const key=typeof status==='string'&&status in callupLabels?status as CallupStatus:'OTHER';return callupLabels[key]};
const absenceLabels={INJURED:'Infortunato',OTHER:'Altro motivo',UNJUSTIFIED:'Ingiustificato'};
const attendanceOptions=[['INJURED','Infortunato'],['OTHER','Altro motivo'],['UNJUSTIFIED','Ingiustificato']] as const;
type GameTeamChoice='A'|'B'|'N';

export default function SessionDetail(){const{seasonId,sessionId}=useParams(),{season,loading}=useSeason(seasonId),toast=useToast();const[session,setSession]=useState<Session|null>(null),[match,setMatch]=useState<Match|null>(null),[players,setPlayers]=useState<Player[]>([]),[staff,setStaff]=useState<any[]>([]),[staffAttendance,setStaffAttendance]=useState<Record<string,any>>({}),[attendance,setAttendance]=useState<Record<string,any>>({}),[loads,setLoads]=useState<Record<string,any>>({}),[callups,setCallups]=useState<Record<string,any>>({}),[stats,setStats]=useState<Record<string,any>>({}),[events,setEvents]=useState<any[]>([]),[games,setGames]=useState<any[]>([]),[callupOptions,setCallupOptions]=useState<any[]>([]),[tab,setTab]=useState('main'),[busy,setBusy]=useState(false),[gameModal,setGameModal]=useState(false),[game,setGame]=useState<any>(null),[gameTeams,setGameTeams]=useState<Record<string,'A'|'B'>>({}),[gameGoals,setGameGoals]=useState<any[]>([]),[confirm,setConfirm]=useState<any>(null),[editingEvent,setEditingEvent]=useState<any>(null);
async function load(){if(!sessionId||!seasonId)return;const{data:s}=await supabase.from('sessions').select('*').eq('id',sessionId).single();if(!s){toast.push('Seduta non trovata.','error');return}setSession(s as Session);const{data:m}=await supabase.from('matches').select('*').eq('session_id',sessionId).maybeSingle();const matchId=m?.id||'00000000-0000-0000-0000-000000000000';const[{data:p},{data:ts},{data:a},{data:l},{data:cs},{data:st},{data:ev},{data:g},{data:co},{data:sa}]=await Promise.all([supabase.from('players').select('*').eq('season_id',seasonId).eq('status','ACTIVE').order('last_name'),supabase.from('technical_staff').select('*').eq('season_id',seasonId).eq('status','ACTIVE').order('last_name'),supabase.from('attendance_records').select('*').eq('session_id',sessionId),supabase.from('player_session_loads').select('*').eq('session_id',sessionId),supabase.from('match_callups').select('*').eq('match_id',matchId),supabase.from('match_player_stats').select('*').eq('match_id',matchId),supabase.from('match_events').select('*').eq('match_id',matchId).order('minute'),supabase.from('training_games').select('*').eq('session_id',sessionId).order('created_at',{ascending:false}),supabase.from('callup_status_options').select('*').eq('season_id',seasonId).eq('active',true).order('label'),supabase.from('staff_attendance').select('*').eq('session_id',sessionId)]);setPlayers((p||[]) as Player[]);setStaff(ts||[]);setMatch(m as any);setAttendance(Object.fromEntries((p||[]).map((pl:any)=>[pl.id,(a||[]).find((x:any)=>x.player_id===pl.id)||{status:'PRESENT',absence_reason:null}])));setLoads(Object.fromEntries((l||[]).map(x=>[x.player_id,x])));setCallups(Object.fromEntries((cs||[]).map(x=>[x.player_id,x])));setStats(Object.fromEntries((st||[]).map(x=>[x.player_id,x])));setEvents(ev||[]);setGames(g||[]);setCallupOptions(co||[]);setStaffAttendance(Object.fromEntries((ts||[]).map((x:any)=>[x.id,(sa||[]).find((r:any)=>r.staff_id===x.id)||{status:'PRESENT',absence_reason:null}])))}
useEffect(()=>{load()},[sessionId,seasonId]);
async function saveTraining(){if(!sessionId)return;setBusy(true);const att=players.map(p=>({session_id:sessionId,player_id:p.id,status:attendance[p.id]?.status||'ABSENT',absence_reason:attendance[p.id]?.status==='PRESENT'?null:(attendance[p.id]?.absence_reason||'OTHER')}));const ld=players.map(p=>{const a=attendance[p.id];const r=loads[p.id]||{};const present=a?.status==='PRESENT';return{session_id:sessionId,player_id:p.id,rpe:present&&r.rpe!==''&&r.rpe!=null?Number(r.rpe):null,duration_minutes:present?clamp(Number(r.duration_minutes??90)||90,0,300):0}});const staffAtt=(staff||[]).map((s:any)=>({session_id:sessionId,staff_id:s.id,status:staffAttendance[s.id]?.status||'PRESENT',absence_reason:staffAttendance[s.id]?.status==='PRESENT'?null:(staffAttendance[s.id]?.absence_reason||'OTHER')}));
const[a,b,c]=await Promise.all([supabase.from('attendance_records').upsert(att,{onConflict:'session_id,player_id'}),supabase.from('player_session_loads').upsert(ld,{onConflict:'session_id,player_id'}),supabase.from('staff_attendance').upsert(staffAtt,{onConflict:'session_id,staff_id'})]);if(a.error||b.error||c.error)toast.push(a.error?.message||b.error?.message||c.error?.message||'Errore nel salvataggio','error');else{toast.push('Presenze e carichi salvati');await load()}setBusy(false)}
async function saveMatch(){if(!match)return;setBusy(true);const call=players.map(p=>({match_id:match.id,player_id:p.id,status:(callups[p.id]?.status||'OTHER') as CallupStatus,custom_status:callups[p.id]?.custom_status||null,notes:callups[p.id]?.notes||null}));const st=players.map(p=>({match_id:match.id,player_id:p.id,started:Boolean(stats[p.id]?.started),minutes_played:clamp(Number(stats[p.id]?.minutes_played)||0,0,130),rpe:stats[p.id]?.rpe===''||stats[p.id]?.rpe==null?null:clamp(Number(stats[p.id]?.rpe),1,10)}));const{error}=await supabase.from('match_callups').upsert(call,{onConflict:'match_id,player_id'});if(error){toast.push(error.message,'error');setBusy(false);return}const{error:se}=await supabase.from('match_player_stats').upsert(st,{onConflict:'match_id,player_id'});if(se){toast.push(se.message,'error');setBusy(false);return}const loadsForMatch=players.map(p=>({session_id:sessionId,player_id:p.id,rpe:st.find(x=>x.player_id===p.id)?.rpe??null,duration_minutes:st.find(x=>x.player_id===p.id)?.minutes_played||0}));await supabase.from('player_session_loads').upsert(loadsForMatch,{onConflict:'session_id,player_id'});toast.push('Convocazioni e minutaggi salvati');await load();setBusy(false)}
async function saveMatchInfo(e:React.FormEvent){e.preventDefault();if(!match)return;setBusy(true);const{error}=await supabase.from('matches').update({opponent:match.opponent,venue:match.venue,home_score:match.home_score,away_score:match.away_score,notes:match.notes}).eq('id',match.id);if(error)toast.push(error.message,'error');else{toast.push('Dati partita aggiornati');await load()}setBusy(false)}
async function addEvent(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!match)return;const fd=new FormData(e.currentTarget);const player_id=String(fd.get('player_id')||'');const event_type=String(fd.get('event_type')||'GOAL');const minute=Number(fd.get('minute')||0);const payload={match_id:match.id,player_id:player_id||null,event_type,minute:minute||null,metadata:{}};const res=editingEvent?await supabase.from('match_events').update(payload).eq('id',editingEvent.id):await supabase.from('match_events').insert(payload);if(res.error)toast.push(res.error.message,'error');else{toast.push(editingEvent?'Evento modificato':'Evento aggiunto');e.currentTarget.reset();setEditingEvent(null);load()}}
async function deleteEvent(id:string){const{error}=await supabase.from('match_events').delete().eq('id',id);if(error)toast.push(error.message,'error');else load()}
async function openGame(g:any=null){
 setGame(g);
 const presentPlayers=players.filter(p=>attendance[p.id]?.status==='PRESENT');
 if(g){
  const[{data:gp},{data:gg}]=await Promise.all([
   supabase.from('training_game_players').select('*').eq('training_game_id',g.id),
   supabase.from('training_game_goals').select('*').eq('training_game_id',g.id).order('minute')
  ]);
  const saved=Object.fromEntries((gp||[]).map(x=>[x.player_id,x.team as GameTeamChoice]));
  setGameTeams(Object.fromEntries(presentPlayers.map(p=>[p.id,(saved[p.id]||'N') as GameTeamChoice])));
  setGameGoals(gg||[]);
 }else{
  // Start with the present players distributed across A/B; the coach can move
  // anyone or mark them as "Non ha giocato".
  setGameTeams(Object.fromEntries(presentPlayers.map((p,i)=>[p.id,(i%2===0?'A':'B') as GameTeamChoice])));
  setGameGoals([]);
 }
 setGameModal(true);
}
async function saveGame(){
 if(!sessionId)return;
 setBusy(true);
 const presentPlayers=players.filter(p=>attendance[p.id]?.status==='PRESENT');
 const unassigned=presentPlayers.filter(p=>!['A','B'].includes(gameTeams[p.id]||''));
 if(unassigned.length){
  toast.push(`Assegna una squadra o "Non ha giocato" a tutti i presenti. Mancano: ${unassigned.map(p=>p.first_name+' '+p.last_name).join(', ')}`,'error');
  setBusy(false);
  return;
 }
 const aScore=game?.team_a_score??0,bScore=game?.team_b_score??0;
 const{data:g,error}=game
  ?await supabase.from('training_games').update({name:game.name||'Partitella',team_a_score:aScore,team_b_score:bScore}).eq('id',game.id).select().single()
  :await supabase.from('training_games').insert({session_id:sessionId,name:'Partitella',team_a_score:aScore,team_b_score:bScore}).select().single();
 if(error||!g){toast.push(error?.message||'Errore partitella','error');setBusy(false);return}
 await supabase.from('training_game_players').delete().eq('training_game_id',g.id);
 const rows=presentPlayers.filter(p=>gameTeams[p.id]==='A'||gameTeams[p.id]==='B').map(p=>({training_game_id:g.id,player_id:p.id,team:gameTeams[p.id]}));
 const{error:pe}=rows.length?await supabase.from('training_game_players').insert(rows):{error:null};
 if(pe){toast.push(pe.message,'error');setBusy(false);return}
 await supabase.from('training_game_goals').delete().eq('training_game_id',g.id);
 const validGoalPlayers=new Set(rows.map((x:any)=>x.player_id));
 const validGoals=gameGoals.filter(x=>x.player_id&&validGoalPlayers.has(x.player_id));
 if(validGoals.length){
  const{error:ge}=await supabase.from('training_game_goals').insert(validGoals.map(x=>({training_game_id:g.id,player_id:x.player_id,team:x.team,minute:x.minute||null})));
  if(ge){toast.push(ge.message,'error');setBusy(false);return}
 }
 toast.push(game?'Partitella aggiornata':'Partitella creata');
 setGameModal(false);
 await load();
 setBusy(false);
}
async function removeGame(){if(!confirm)return;const{error}=await supabase.from('training_games').delete().eq('id',confirm.id);if(error)toast.push(error.message,'error');else{toast.push('Partitella eliminata');load()}setConfirm(null)}
function exportCallup(){if(!match||!season)return;const called=players.filter(p=>callups[p.id]?.status==='CALLED_UP');makePdf(`Convocazione · ${match.opponent}`,[{title:'Partita',lines:[`${date(session!.session_date)} · ${match.venue==='HOME'?'Casa':'Trasferta'}`,`Avversario: ${match.opponent}`,`Risultato: ${match.home_score??'—'}-${match.away_score??'—'}`]},{title:'Convocati',lines:called.map(p=>`${p.first_name} ${p.last_name}${p.shirt_number?` · #${p.shirt_number}`:''}`)},{title:'Stati',lines:players.filter(p=>callups[p.id]?.status!=='CALLED_UP').map(p=>`${p.first_name} ${p.last_name} — ${getCallupLabel(callups[p.id]?.status)}`)}],'convocazione.pdf',{team:season.team_name,season:season.sporting_year})}
if(loading||!season||!session)return <Center/>;const training=session.session_type==='TRAINING';const totalLoad=(Object.values(loads) as any[]).reduce((a:number,x:any)=>a+(Number(x.load)||0),0);const presentCount=players.filter(p=>attendance[p.id]?.status==='PRESENT').length;const staffPresentCount=staff.filter((s:any)=>staffAttendance[s.id]?.status==='PRESENT').length;return <Page season={season} title={session.title||'Seduta'} sub={`${longDate(session.session_date)} · ${training?'Allenamento':'Partita'}`} actions={training?<button className="primary" onClick={saveTraining} disabled={busy}><Save/>{busy?'Salvataggio…':'Salva seduta'}</button>:<button className="primary" onClick={saveMatch} disabled={busy}><Save/>{busy?'Salvataggio…':'Salva partita'}</button>}><div className="stats"><Stat label={training?'Presenti':'Convocati'} value={training?presentCount:players.filter(p=>callups[p.id]?.status==='CALLED_UP').length} icon={<Users/>}/><Stat label="Staff" value={training?`${staffPresentCount}/${staff.length}`:'—'} icon={<Users/>}/><Stat label={training?'Carico seduta':'Minuti totali'} value={training?`${Math.round(totalLoad)} AU`:(Object.values(stats) as any[]).reduce((a:number,x:any)=>a+(Number(x.minutes_played)||0),0)} icon={<Activity/>}/><Stat label="Rosa" value={players.length} icon={<ClipboardList/>}/><Stat label="Stato" value="Bozza salvabile" icon={<Check/>}/></div><div className="segmented tabs">
{training&&<><button className={tab==='main'?'active':''} onClick={()=>setTab('main')}>Presenze & carico</button><button className={tab==='game'?'active':''} onClick={()=>setTab('game')}>Partitelle</button></>}
{!training&&<><button className={tab==='main'?'active':''} onClick={()=>setTab('main')}>Partita</button><button className={tab==='callup'?'active':''} onClick={()=>setTab('callup')}>Convocazione</button><button className={tab==='stats'?'active':''} onClick={()=>setTab('stats')}>Minutaggio</button><button className={tab==='events'?'active':''} onClick={()=>setTab('events')}>Eventi</button></>}
</div>{training&&tab==='main'&&<section><div>Test</div></section>}</Page>}
