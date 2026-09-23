import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, CheckCircle2, Info, Save, Trophy, Users } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Page } from '../components/Layout';
import { Center, Empty, Stat } from '../components/ui';
import { useSeason } from '../hooks/useSeason';
import { useToast } from '../components/Toast';
import { date, isoDate } from '../lib/utils';

type Player = { id: string; first_name: string; last_name: string; position: string | null; status: string };
type Result = { id?: string; player_id: string; test_date: string; distance_m: number | null; final_level: string | null; notes: string | null };

type Band = { label: string; min: number; max: number | null; text: string };
const bands: Band[] = [
  { label: 'Sotto 900 m', min: 0, max: 899, text: 'Risultato molto basso rispetto alle fasce di riferimento pubblicate per il calcio ricreativo/amatoriale. Da interpretare considerando età, sesso, ruolo e condizioni del test.' },
  { label: '900–1.099 m', min: 900, max: 1099, text: 'Risultato nella fascia “active” riportata da una recente classificazione di giocatori ricreativi. Utile soprattutto come baseline individuale.' },
  { label: '1.100–1.499 m', min: 1100, max: 1499, text: 'Risultato nella fascia “recreational” della classificazione di riferimento. Il confronto più utile resta quello con i successivi test dello stesso giocatore.' },
  { label: '1.500–1.999 m', min: 1500, max: 1999, text: 'Risultato nella fascia “amateur” della classificazione di riferimento. Buon dato da confrontare con il livello e il contesto della squadra.' },
  { label: '2.000–2.799 m', min: 2000, max: 2799, text: 'Risultato nella fascia “semi-pro” della classificazione di riferimento. Valore elevato, da interpretare comunque nel contesto individuale.' },
  { label: '≥ 2.800 m', min: 2800, max: null, text: 'Risultato nella fascia “professional” della classificazione di riferimento. Non significa che il giocatore sia professionista: indica solo la fascia di prestazione del campione di riferimento.' },
];
function indication(value: number | null) {
  if (value == null || !Number.isFinite(value) || value < 0) return { label: 'Inserisci un risultato', text: 'Inserisci la distanza totale percorsa nel Yo-Yo IR1 per ottenere l’indicazione.', tone: 'neutral' };
  const b = bands.find(x => value >= x.min && (x.max == null || value <= x.max))!;
  return { label: b.label, text: b.text, tone: value >= 2000 ? 'good' : value >= 1500 ? 'base' : 'attention' };
}

export default function Tests() {
  const { seasonId } = useParams();
  const { season, loading } = useSeason(seasonId);
  const toast = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [dateValue, setDateValue] = useState(isoDate());
  const [history, setHistory] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!seasonId) return;
    const [p, r, h] = await Promise.all([
      supabase.from('players').select('id,first_name,last_name,position,status').eq('season_id', seasonId).eq('status', 'ACTIVE').order('last_name'),
      supabase.from('yoyo_ir1_results').select('*').eq('season_id', seasonId).eq('test_date', dateValue),
      supabase.from('yoyo_ir1_results').select('*,players(first_name,last_name)').eq('season_id', seasonId).order('test_date', { ascending: false }).order('distance_m', { ascending: false }).limit(200),
    ]);
    if (p.error || r.error || h.error) toast.push(p.error?.message || r.error?.message || h.error?.message || 'Errore caricamento test', 'error');
    setPlayers(p.data || []);
    const map: Record<string, Result> = {};
    (p.data || []).forEach(x => { map[x.id] = { player_id: x.id, test_date: dateValue, distance_m: null, final_level: null, notes: null }; });
    (r.data || []).forEach(x => { map[x.player_id] = x; });
    setResults(map);
    setHistory(h.data || []);
  }
  useEffect(() => { load(); }, [seasonId, dateValue]);

  const filled = Object.values(results).filter(x => x.distance_m != null && Number.isFinite(Number(x.distance_m)));
  const average = filled.length ? Math.round(filled.reduce((a, x) => a + Number(x.distance_m), 0) / filled.length) : 0;
  const best = filled.length ? Math.max(...filled.map(x => Number(x.distance_m))) : 0;
  const setResult = (id: string, patch: Partial<Result>) => setResults(x => ({ ...x, [id]: { ...(x[id] || { player_id: id, test_date: dateValue }), ...patch } }));
  async function saveAll() {
    if (!seasonId) return;
    setBusy(true);
    const payload = filled.map(x => ({ season_id: seasonId, player_id: x.player_id, test_date: dateValue, distance_m: Number(x.distance_m), final_level: x.final_level?.trim() || null, notes: x.notes?.trim() || null }));
    if (!payload.length) { toast.push('Inserisci almeno un risultato.', 'error'); setBusy(false); return; }
    const { error } = await supabase.from('yoyo_ir1_results').upsert(payload, { onConflict: 'season_id,player_id,test_date' });
    if (error) toast.push(error.message, 'error'); else { toast.push('Risultati Yo-Yo IR1 salvati'); await load(); }
    setBusy(false);
  }

  if (loading || !season) return <Center />;
  return <Page season={season} title="Test" sub="Valutazioni fisiche della rosa" actions={<button className="primary" onClick={saveAll} disabled={busy}><Save />{busy ? 'Salvataggio…' : 'Salva risultati'}</button>}>
    <section>
      <div className="section-bar"><div><h2><Activity /> Yo-Yo Test Livello 1</h2><p>Inserisci la distanza totale percorsa nel Yo-Yo Intermittent Recovery Test Level 1. L'indicazione è orientativa e non diagnostica.</p></div></div>
      <div className="filters"><label className="filter-label">Data del test<input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} /></label></div>
      <div className="stats"><Stat label="Giocatori testati" value={filled.length} icon={<Users />} /><Stat label="Media squadra" value={average ? `${average} m` : '—'} icon={<Activity />} /><Stat label="Miglior risultato" value={best ? `${best} m` : '—'} icon={<Trophy />} /><Stat label="Data" value={date(dateValue)} icon={<CalendarDays />} /></div>
      {players.length ? <div className="table-card"><div className="table-head test-row"><span>Giocatore</span><span>Risultato</span><span>Indicazione</span></div>{players.map(p => { const r = results[p.id] || { player_id: p.id, test_date: dateValue, distance_m: null, final_level: null, notes: null }; const i = indication(r.distance_m == null ? null : Number(r.distance_m)); return <div className="table-row test-row" key={p.id}><div><b>{p.first_name} {p.last_name}</b><small>{p.position || 'Ruolo non specificato'}</small></div><label><input type="number" min="0" step="10" inputMode="numeric" placeholder="Es. 1800" value={r.distance_m ?? ''} onChange={e => setResult(p.id, { distance_m: e.target.value === '' ? null : Number(e.target.value) })}/><small>metri</small></label><div><strong>{i.label}</strong><small>{i.text}</small></div></div> })}</div> : <Empty title="Rosa vuota" text="Aggiungi i giocatori alla rosa prima di registrare il test." />}
      <div className="panel methodology"><h3><Info /> Come leggere l'indicazione</h3><p>Le fasce mostrate sono un riferimento descrittivo tratto da una recente classificazione di prestazione Yo-Yo IR1 in soggetti di calcio ricreativo. Non sono soglie universali e non devono essere usate da sole per valutare idoneità, salute o rischio di infortunio.</p><p className="muted">Per il monitoraggio della squadra è preferibile ripetere il test nelle stesse condizioni e osservare soprattutto la variazione individuale nel tempo.</p></div>
    </section>
    <section><div className="section-bar"><div><h2>Storico test</h2><p>Confronta i risultati ottenuti nelle diverse date.</p></div></div>{history.length ? <div className="cards">{history.map(x => { const i = indication(Number(x.distance_m)); return <div className="info" key={x.id}><div><b>{x.players?.first_name} {x.players?.last_name}</b><small>{date(x.test_date)} · {x.distance_m} m{x.final_level ? ` · Livello ${x.final_level}` : ''}</small></div><span>{i.label}</span></div> })}</div> : <div className="panel">Nessun test registrato.</div>}</section>
  </Page>;
}
