import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Plus, Search, Trash2, Users, XCircle, Edit3 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Page } from '../components/Layout';
import { SectionTabs } from '../components/SectionTabs';
import { Center, Empty, Modal, Confirm, Stat } from '../components/ui';
import { useSeason } from '../hooks/useSeason';
import { date, isoDate, pct } from '../lib/utils';
import { useToast } from '../components/Toast';

const reasonLabels: Record<string, string> = { INJURED: 'Infortunio', OTHER: 'Altro motivo', UNJUSTIFIED: 'Non giustificata' };

type ProgrammedAbsence = { id: string; season_id: string; player_id: string; start_date: string; end_date: string; reason: string | null; notes: string | null };

export default function Attendance() {
  const { seasonId } = useParams();
  const { season, loading } = useSeason(seasonId);
  const toast = useToast();
  const [players, setPlayers] = useState<any[]>([]), [sessions, setSessions] = useState<any[]>([]), [records, setRecords] = useState<any[]>([]), [calls, setCalls] = useState<any[]>([]), [planned, setPlanned] = useState<ProgrammedAbsence[]>([]);
  const [player, setPlayer] = useState('ALL'), [type, setType] = useState('ALL'), [from, setFrom] = useState(''), [to, setTo] = useState(''), [q, setQ] = useState(''), [plannedDate, setPlannedDate] = useState(isoDate());
  const [modal, setModal] = useState(false), [editing, setEditing] = useState<ProgrammedAbsence | null>(null), [confirm, setConfirm] = useState<ProgrammedAbsence | null>(null), [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ player_id: '', start_date: isoDate(), end_date: isoDate(), reason: '', notes: '' });
  const [tab, setTab] = useState<'overview'|'planned'|'register'|'player'>('overview');

  async function load() {
    if (!seasonId) return;
    const [p, s, a, m, pa] = await Promise.all([
      supabase.from('players').select('*').eq('season_id', seasonId).order('last_name'),
      supabase.from('sessions').select('*').eq('season_id', seasonId).order('session_date', { ascending: false }),
      supabase.from('attendance_records').select('*'),
      supabase.from('matches').select('id,session_id'),
      supabase.from('programmed_absences').select('*').eq('season_id', seasonId).order('start_date')
    ]);
    if (p.error || s.error || a.error || pa.error) toast.push(p.error?.message || s.error?.message || a.error?.message || pa.error?.message || 'Errore caricamento', 'error');
    setPlayers(p.data || []); setSessions(s.data || []); setRecords(a.data || []); setPlanned(pa.data || []);
    const matchIds = (m.data || []).map(x => x.id);
    if (matchIds.length) {
      const { data: c } = await supabase.from('match_callups').select('*').in('match_id', matchIds);
      setCalls((c || []).map(x => ({ ...x, session_id: (m.data || []).find(mm => mm.id === x.match_id)?.session_id })));
    } else setCalls([]);
  }
  useEffect(() => { load(); }, [seasonId]);

  const filteredPlayers = players.filter(p => p.status === 'ACTIVE' && (`${p.first_name} ${p.last_name}`).toLowerCase().includes(q.toLowerCase()));
  const filteredSessions = sessions.filter(s => (type === 'ALL' || s.session_type === type) && (!from || s.session_date >= from) && (!to || s.session_date <= to));
  const matchSessions = filteredSessions.filter(s => s.session_type === 'MATCH');
  const matchIdsForSession = new Map<string, string>(calls.map((c: any) => [c.session_id, c.match_id]));
  const rows = filteredPlayers.map(p => {
    const rec = records.filter(r => r.player_id === p.id && filteredSessions.some(s => s.id === r.session_id));
    const call = calls.filter(c => c.player_id === p.id && matchSessions.some(s => matchIdsForSession.get(s.id) === c.match_id));
    const present = rec.filter(r => r.status === 'PRESENT').length + call.filter(c => c.status === 'CALLED_UP').length;
    const total = rec.length + call.length;
    return { ...p, present, total, percentage: pct(present, total) };
  });
  const detail = records.filter(r => (player === 'ALL' || r.player_id === player) && filteredSessions.some(s => s.id === r.session_id));
  const plannedOnDate = planned.filter(a => a.start_date <= plannedDate && a.end_date >= plannedDate && players.some(p => p.id === a.player_id && p.status === 'ACTIVE'));
  const expectedAvailable = Math.max(0, players.filter(p => p.status === 'ACTIVE').length - new Set(plannedOnDate.map(a => a.player_id)).size);
  const availabilityCalendar = Array.from({ length: 14 }, (_, i) => { const d = new Date(`${plannedDate}T12:00:00`); d.setDate(d.getDate() + i); const key = isoDate(d); const absent = new Set(planned.filter(a => a.start_date <= key && a.end_date >= key).map(a => a.player_id)); return { date: key, unavailable: absent.size, available: Math.max(0, players.filter(p => p.status === 'ACTIVE').length - absent.size) }; });
  const upcoming = planned.filter(a => a.end_date >= plannedDate).sort((a, b) => a.start_date.localeCompare(b.start_date));

  function openPlanned(a: ProgrammedAbsence | null = null) {
    setEditing(a);
    setForm(a ? { player_id: a.player_id, start_date: a.start_date, end_date: a.end_date, reason: a.reason || '', notes: a.notes || '' } : { player_id: '', start_date: plannedDate, end_date: plannedDate, reason: '', notes: '' });
    setModal(true);
  }
  async function savePlanned(e: React.FormEvent) {
    e.preventDefault(); if (!seasonId) return;
    if (form.end_date < form.start_date) { toast.push('La data di fine non può precedere quella di inizio.', 'error'); return; }
    setBusy(true);
    const payload = { season_id: seasonId, player_id: form.player_id, start_date: form.start_date, end_date: form.end_date, reason: form.reason.trim() || null, notes: form.notes.trim() || null };
    const res = editing ? await supabase.from('programmed_absences').update(payload).eq('id', editing.id) : await supabase.from('programmed_absences').insert(payload);
    if (res.error) toast.push(res.error.message, 'error'); else { toast.push(editing ? 'Assenza programmata aggiornata' : 'Assenza programmata aggiunta'); setModal(false); await load(); }
    setBusy(false);
  }
  async function removePlanned() {
    if (!confirm) return; setBusy(true);
    const { error } = await supabase.from('programmed_absences').delete().eq('id', confirm.id);
    if (error) toast.push(error.message, 'error'); else { toast.push('Assenza programmata eliminata'); await load(); }
    setBusy(false); setConfirm(null);
  }

  if (loading || !season) return <Center />;
  return (
    <Page season={season} title="Presenze" sub="Storico presenze e promemoria delle indisponibilità programmate"
      actions={<button className="primary" onClick={() => openPlanned()}><Plus />Assenza programmata</button>}>

      <SectionTabs value={tab} onChange={x => setTab(x as any)} tabs={[
        { id: 'overview', label: 'Riepilogo' },
        { id: 'planned', label: 'Assenze programmate', count: planned.length },
        { id: 'register', label: 'Registro', count: filteredSessions.length },
        { id: 'player', label: 'Dettaglio giocatore' }
      ]} />

      {tab === 'overview' && (
        <section>
          <div className="section-bar"><div>
            <h2>Riepilogo presenze</h2>
            <p>Panoramica della partecipazione della rosa nel periodo selezionato.</p>
          </div></div>
          <div className="filters">
            <div className="search"><Search size={17}/><input placeholder="Cerca giocatore…" value={q} onChange={e => setQ(e.target.value)} /></div>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="ALL">Tutte le sedute</option><option value="TRAINING">Allenamenti</option><option value="MATCH">Partite</option>
            </select>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}/>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}/>
          </div>
          {rows.length ? (
            <div className="table-card">
              <div className="table-head three"><span>Giocatore</span><span>Presenze</span><span>%</span></div>
              {rows.map(r => <div className="table-row three" key={r.id}>
                <b>{r.first_name} {r.last_name}</b><span>{r.present}/{r.total}</span><strong>{r.percentage}%</strong>
              </div>)}
            </div>
          ) : <Empty title="Nessun dato" text="Crea sedute e registra le presenze." />}
        </section>
      )}

      {tab === 'planned' && (
        <section>
          <div className="section-bar"><div>
            <h2>Assenze programmate</h2>
            <p>Promemoria: non modifica le presenze delle sedute. Le assenze reali si registrano sempre nella seduta.</p>
          </div></div>
          <div className="filters"><label className="filter-label">Data di riferimento
            <input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} />
          </label></div>
          <div className="stats">
            <Stat label="Rosa attiva" value={players.filter(p => p.status === 'ACTIVE').length} icon={<Users />} />
            <Stat label="Indisponibili programmati" value={new Set(plannedOnDate.map(a => a.player_id)).size} icon={<Clock3 />} />
            <Stat label="Presenti previsti" value={expectedAvailable} icon={<CheckCircle2 />} />
            <Stat label="Periodo selezionato" value={date(plannedDate)} icon={<CalendarDays />} />
          </div>
          <div className="section-bar"><div><h3>Calendario disponibilità · prossimi 14 giorni</h3><p>Stima basata esclusivamente sulle assenze già programmate.</p></div></div>
          <div className="cards">
            {availabilityCalendar.map(x => <div className="info" key={x.date}>
              <div><b>{date(x.date)}</b><small>{x.unavailable ? `${x.unavailable} indisponibili programmati` : 'Nessuna indisponibilità programmata'}</small></div>
              <strong>{x.available} presenti previsti</strong>
            </div>)}
          </div>
          <div className="section-bar"><div><h3>Indisponibilità inserite</h3></div></div>
          {upcoming.length ? <div className="cards">{upcoming.map(a => {
            const p = players.find(x => x.id === a.player_id);
            return <div className="info" key={a.id}>
              <div><b>{p ? `${p.first_name} ${p.last_name}` : 'Giocatore'}</b>
                <small>{date(a.start_date)} → {date(a.end_date)}{a.reason ? ` · ${a.reason}` : ''}{a.notes ? ` · ${a.notes}` : ''}</small>
              </div>
              <div className="row-actions">
                <button className="small" onClick={() => openPlanned(a)}><Edit3 size={14}/>Modifica</button>
                <button className="icon danger-icon" onClick={() => setConfirm(a)}><Trash2 size={16}/></button>
              </div>
            </div>
          })}</div> : <Empty title="Nessuna assenza programmata" text="Aggiungi qui le indisponibilità comunicate in anticipo." />}
        </section>
      )}

      {tab === 'register' && (
        <section>
          <div className="section-bar"><div><h2>Registro presenze</h2><p>Vista cronologica delle presenze effettive, comprese le partite tramite convocazione.</p></div></div>
          <div className="filters">
            <select value={player} onChange={e => setPlayer(e.target.value)}>
              <option value="ALL">Tutti i giocatori</option>{players.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)}>
              <option value="ALL">Tutte le sedute</option><option value="TRAINING">Allenamenti</option><option value="MATCH">Partite</option>
            </select>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}/>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}/>
          </div>
          {filteredSessions.length ? <div className="cards">
            {filteredSessions.slice(0, 60).map(s => {
              const recMap = new Map(records.filter(r => r.session_id === s.id).map(r => [r.player_id, r]));
              const matchId = matchIdsForSession.get(s.id);
              const callMap = new Map(calls.filter(c => c.match_id === matchId).map(c => [c.player_id, c]));
              const relevant = player === 'ALL' ? filteredPlayers : filteredPlayers.filter(p => p.id === player);
              return <div className="info attendance-day" key={s.id}>
                <div><b>{date(s.session_date)} · {s.session_type === 'TRAINING' ? 'Allenamento' : 'Partita'}</b>
                  <small>{s.title || 'Seduta'}{s.session_type === 'MATCH' ? ` · ${callMap.size} convocati` : ''}</small>
                </div>
                <div className="attendance-chips">{relevant.map(p => {
                  const r = recMap.get(p.id); const c = callMap.get(p.id);
                  const label = s.session_type === 'TRAINING'
                    ? (r ? (r.status === 'PRESENT' ? 'Presente' : `Assente · ${reasonLabels[r.absence_reason] || 'Altro'}`) : 'Non registrato')
                    : (c ? (c.status === 'CALLED_UP' ? 'Convocato' : (c.custom_status || reasonLabels[c.status] || c.status)) : 'Non convocato');
                  return <span className={`status ${label === 'Presente' || label === 'Convocato' ? 'good' : label === 'Non registrato' || label === 'Non convocato' ? '' : 'bad'}`} key={p.id}><b>{p.last_name}</b> · {label}</span>;
                })}</div>
              </div>
            })}
          </div> : <Empty title="Nessuna seduta nel periodo" text="Crea sedute per popolare il registro cronologico." />}
        </section>
      )}

      {tab === 'player' && (
        <section>
          <div className="section-bar"><div><h2>Dettaglio giocatore</h2><p>Seleziona un giocatore per visualizzare il suo storico.</p></div></div>
          <div className="filters"><select value={player} onChange={e => setPlayer(e.target.value)}>
            <option value="ALL">Seleziona giocatore</option>{players.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select></div>
          {player !== 'ALL' ? <div className="cards">{detail.map(r => {
            const s = sessions.find(x => x.id === r.session_id);
            return <div className="info" key={r.id}><div><b>{s?.session_date ? date(s.session_date) : '—'}</b>
              <small>{s?.session_type === 'TRAINING' ? 'Allenamento' : 'Partita'} · {r.status === 'PRESENT' ? 'Presente' : `Assente — ${reasonLabels[r.absence_reason] || 'Altro'}`}</small>
            </div>{r.status === 'PRESENT' ? <CheckCircle2 /> : <XCircle />}</div>
          })}{!detail.length && <div className="panel">Nessun record nel periodo.</div>}</div>
          : <Empty title="Seleziona un giocatore" text="Scegli un giocatore dal menu per aprire il dettaglio individuale." />}
        </section>
      )}

      {modal && <Modal title={editing ? 'Modifica assenza programmata' : 'Nuova assenza programmata'} close={() => setModal(false)}>
        <form className="form" onSubmit={savePlanned}>
          <label>Giocatore<select required value={form.player_id} onChange={e => setForm({ ...form, player_id: e.target.value })}>
            <option value="">Seleziona giocatore</option>{players.filter(p => p.status === 'ACTIVE').map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
          </select></label>
          <div className="form-grid"><label>Dal<input type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}/></label>
            <label>Al<input type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}/></label></div>
          <label>Motivo<input placeholder="Es. ferie, lavoro, viaggio…" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}/></label>
          <label>Note<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/></label>
          <button className="primary wide" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva assenza programmata'}</button>
        </form>
      </Modal>}

      {confirm && <Confirm title="Eliminare l'assenza programmata?" text="Il promemoria verrà eliminato. Non verranno modificate le presenze già registrate nelle sedute." confirmLabel="Elimina" danger onClose={() => setConfirm(null)} onConfirm={removePlanned} busy={busy} />}
    </Page>
  );
}
