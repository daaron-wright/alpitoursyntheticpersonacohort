/* ============================================================
   Entry point · Anonymous Synthetic Persona Cohort
   Full React implementation — grid + persona modal (Talk/Profile)
   ============================================================ */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { PEOPLE, BY, TRY, askPersona, getHist, pushHist } from '@/cohort/personas';
import { PersonaOrb } from '@/cohort/PersonaOrb';
import type { Persona } from '@/shared/types';
import { AiIcon, AiTile } from '@/shared/AiIcon';

function Avatar({ p, size, cls }: { p: Persona; size: number; cls?: string }) {
  if (p.img) return <img className={cls ?? ''} src={p.img + '?v=3'} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />;
  return <AiTile className={`scp-init ${cls ?? ''}`} size={size} />;
}

/* ---- chat panel ---- */
type Msg = { role: 'user' | 'assistant'; content: string };

function ChatPanel({ p, onStatusChange }: { p: Persona; onStatusChange?: (s: 'idle' | 'thinking') => void }) {
  const [messages, setMessages] = useState<Msg[]>(() => {
    const h = getHist(p.id);
    return h.length > 0 ? h : [{ role: 'assistant', content: p.greet }];
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [chipsHidden, setChipsHidden] = useState(getHist(p.id).length > 0);
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, busy]);

  const send = useCallback(async (q?: string) => {
    const text = (q ?? input).trim();
    if (!text || busy) return;
    setChipsHidden(true);
    setInput('');
    setBusy(true);
    onStatusChange?.('thinking');
    const userMsg: Msg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    try {
      const reply = await askPersona(p.id, text);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '(Couldn\'t reach me just now — try again in a moment.)' }]);
    }
    setBusy(false);
    onStatusChange?.('idle');
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [input, busy, p.id, onStatusChange]);

  const chips = TRY[p.id] || [];

  return (
    <div className="scp-talk" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="scp-msgs" ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} className={'scp-m ' + (m.role === 'assistant' ? 'p' : 'u')} style={{ display: 'flex', gap: 8, maxWidth: '90%', alignSelf: m.role === 'assistant' ? 'flex-start' : 'flex-end', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            {m.role === 'assistant' && <Avatar p={p} size={24} cls="ma" />}
            <div>
              <div className="scp-who" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4, color: m.role === 'assistant' ? p.tone : '#8DA0A7', textAlign: m.role === 'user' ? 'right' : undefined }}>
                {m.role === 'assistant' ? p.name.split(' ')[0].toUpperCase() : 'YOU'}
              </div>
              <div className="scp-bub" style={{ fontSize: 12.5, lineHeight: 1.55, color: m.role === 'assistant' ? '#DBE3E6' : '#fff', ...(m.role === 'user' ? { background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)', padding: '8px 11px', borderRadius: '12px 12px 4px 12px' } : {}) }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {busy && (
          <div className="scp-busy" style={{ alignSelf: 'flex-start', display: 'inline-flex', gap: 4, padding: '4px 2px' }}>
            <i style={{ width: 6, height: 6, borderRadius: '50%', background: p.tone, display: 'block', animation: 'scp-b 1.2s ease-in-out infinite' }} />
            <i style={{ width: 6, height: 6, borderRadius: '50%', background: p.tone, display: 'block', animation: 'scp-b 1.2s ease-in-out .15s infinite' }} />
            <i style={{ width: 6, height: 6, borderRadius: '50%', background: p.tone, display: 'block', animation: 'scp-b 1.2s ease-in-out .3s infinite' }} />
          </div>
        )}
      </div>

      {!chipsHidden && chips.length > 0 && (
        <div style={{ padding: '2px 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          <span style={{ flexBasis: '100%', fontSize: 8.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7C8A90', marginBottom: 2 }}>Try asking</span>
          {chips.map((c, i) => (
            <button key={i} className="scp-chip" onClick={() => send(c)} style={{ fontSize: 11, color: '#CDD6DA', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="scp-foot" style={{ padding: 11, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          className="scp-in"
          rows={1}
          placeholder={`Ask ${p.name.split(' ')[0]} anything…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ flex: 1, resize: 'none', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)', borderRadius: 11, padding: '9px 12px', fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.4, maxHeight: 96, color: '#fff', outline: 'none' }}
        />
        <button className="scp-send" onClick={() => send()} disabled={busy} style={{ flexShrink: 0, height: 36, padding: '0 16px', borderRadius: 9, border: 'none', background: p.tone, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, opacity: busy ? 0.45 : 1 }}>
          Ask
        </button>
      </div>
      <div style={{ fontSize: 9.5, color: '#6E7C82', padding: '0 14px 11px' }}>
        Answers are a synthetic stand-in grounded in the validation brief.
      </div>
    </div>
  );
}

/* ---- full persona modal ---- */
function PersonaModal({ id, initialView, onClose, onNav }: {
  id: string;
  initialView: 'talk' | 'profile';
  onClose: () => void;
  onNav: (id: string) => void;
}) {
  const [view, setView] = useState<'talk' | 'profile'>(initialView);
  const [status, setStatus] = useState<'idle' | 'thinking'>('idle');
  const p = BY[id];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!p) return null;

  const prevP = PEOPLE[(p.idx - 2 + PEOPLE.length) % PEOPLE.length];
  const nextP = PEOPLE[p.idx % PEOPLE.length];

  return (
    <div className="scp-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(8,10,12,.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans,system-ui,sans-serif)', animation: 'scp-fade .2s' }}>
      <div className="scp-modal" style={{ '--tone': p.tone, '--toneSoft': p.toneSoft, width: 'min(1280px,100%)', height: 'min(840px,100%)', background: '#14181B', color: '#E8EDEF', borderRadius: 20, boxShadow: '0 50px 120px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)' } as any}>

        {/* bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <button className="scp-back" onClick={onClose} style={{ border: '1px solid rgba(255,255,255,.16)', background: 'transparent', color: '#D4DCDF', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '7px 12px', borderRadius: 9, cursor: 'pointer' }}>
            ‹ Cohort
          </button>
          <AiTile size={30} />
          <span style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 21, fontWeight: 600 }}>{p.name}</span>
          <span style={{ fontSize: 12.5, color: '#9AA7AD' }}>{p.role}</span>
          <span style={{ fontSize: 11, color: '#6E7C82', letterSpacing: '.02em' }}>{p.code} · synthetic · {p.idx}/{PEOPLE.length}</span>

          <div style={{ marginLeft: 'auto', display: 'flex', background: 'rgba(255,255,255,.07)', borderRadius: 999, padding: 3 }}>
            {(['profile', 'talk'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ border: 'none', background: view === v ? '#fff' : 'transparent', color: view === v ? '#14181B' : '#AEB9BE', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '6px 16px', borderRadius: 999, cursor: 'pointer' }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onNav(prevP.id)} style={{ border: '1px solid rgba(255,255,255,.16)', background: 'transparent', color: '#D4DCDF', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 9, cursor: 'pointer' }}>← Prev</button>
            <button onClick={() => onNav(nextP.id)} style={{ border: '1px solid rgba(255,255,255,.16)', background: 'transparent', color: '#D4DCDF', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '7px 13px', borderRadius: 9, cursor: 'pointer' }}>Next →</button>
          </div>

          <button className="scp-close" onClick={onClose} style={{ border: 'none', background: p.tone, color: '#fff', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '8px 15px', borderRadius: 9, cursor: 'pointer' }}>
            Close ✕
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: view === 'talk' ? '1fr 1fr' : '1fr', gap: 16, padding: '0 20px 20px', minHeight: 0, overflowY: view === 'profile' ? 'auto' : undefined }}>

          {view === 'talk' && (
            /* embodiment panel */
            <div style={{ position: 'relative', background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#1F2A30' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <AiIcon size={14} />
                  {p.name.toUpperCase()} · SYNTHETIC EMBODIMENT
                </span>
                <span>MOOD · {p.moodLine}</span>
              </div>
              {/* ← animated orb */}
              <PersonaOrb p={p} isLive={status === 'thinking'} />
              <div style={{ padding: '14px 16px 16px', borderTop: '1px solid #EEF2F4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <AiTile size={38} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2A30' }}>{status === 'thinking' ? 'Speaking · live' : 'Listening'}</div>
                    <div style={{ fontSize: 10.5, color: '#64748B', letterSpacing: '.04em' }}>grounded in the brief · {p.tags.join(' · ')}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 13 }}>
                  {p.moods.map((m: any, i: number) => (
                    <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '7px 9px', ...(m[2] ? { borderColor: p.tone, background: p.toneSoft } : {}) }}>
                      <b style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#1F2A30' }}>{m[0]}</b>
                      <span style={{ fontSize: 9.5, color: '#64748B' }}>{m[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'talk' && (
            /* chat panel */
            <div style={{ background: '#14181B', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ChatPanel key={p.id} p={p} onStatusChange={setStatus} />
            </div>
          )}

          {view === 'profile' && (
            /* profile view */
            <div style={{ color: '#1F2A30', paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
                <span style={{ background: '#F1F5F9', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>People</span>
                {' '}Synthetic persona {String(p.idx).padStart(2, '0')} / {PEOPLE.length} · Composite, not a real person
              </div>
              <h2 style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 28, fontWeight: 500, margin: '0 0 20px', color: '#0F172A' }}>{p.name} — {p.role.split(' · ')[0]}</h2>

              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <Avatar p={p} size={96} cls="pimg" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, textAlign: 'center' }}>{p.name}</h3>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>{p.pron}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
                    {p.tags.map((t: string) => <span key={t} style={{ fontSize: 10.5, border: '1px solid #E2E8F0', borderRadius: 999, padding: '2px 8px', color: '#334155' }}>{t}</span>)}
                    <span style={{ fontSize: 10.5, border: '1px solid #E2E8F0', borderRadius: 999, padding: '2px 8px', color: '#334155' }}>{p.archetype}</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: '#94A3B8', fontFamily: 'var(--font-mono,monospace)' }}>{p.code} · v0.1 · synthetic</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display,system-ui)', fontStyle: 'italic', fontSize: 17, color: '#1F2A30', marginBottom: 12, lineHeight: 1.4 }}>
                    <span style={{ fontSize: 24, color: p.tone }}>"</span>{p.quote}
                  </div>
                  <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65 }}>{p.bio}</div>
                </div>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>Context</div>
                  {p.context.map((r: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12.5 }}>
                      <span style={{ color: '#94A3B8', flexShrink: 0, width: 80 }}>{r[0]}</span>
                      <span style={{ color: '#1F2A30', fontWeight: 500 }}>{r[1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}>Goals · ranked</div>
                  <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>What {p.name.split(' ')[0]} wants</h4>
                  {p.goals.map((g: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: p.tone, flexShrink: 0 }}>0{i + 1}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2A30', marginBottom: 2 }}>{g[0]}</div>
                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{g[1]}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}>Frustrations</div>
                  <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>What gets in the way</h4>
                  {p.frustrations.map((f: any, i: number) => {
                    const colors: any = { red: '#FF462D', amber: '#B45309', teal: '#29707A' };
                    return (
                      <div key={i} style={{ borderLeft: `3px solid ${colors[f[0]] ?? '#E2E8F0'}`, paddingLeft: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2A30', marginBottom: 2 }}>{f[1]}</div>
                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{f[2]}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}><AiIcon size={13} /> AI trust threshold</div>
                  <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Working with the agent</h4>
                  {p.trust.map((t: any, i: number) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#475569' }}>{t[0]}</span>
                        <span style={{ fontSize: 11, color: '#475569' }}>{t[1]}</span>
                      </div>
                      <div style={{ position: 'relative', height: 6, background: '#E2E8F0', borderRadius: 999 }}>
                        <span style={{ position: 'absolute', left: t[2] + '%', top: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: p.tone, display: 'block', boxShadow: '0 0 0 2px #fff' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{t[3]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: '8px 0 4px' }}>
                Anonymous composite for demo validation · Kyndryl Agentic Framework. Not a record of a real person or organization.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- cohort grid ---- */
function CohortApp() {
  const [mode, setMode] = useState<'talk' | 'profile'>('talk');
  const [modal, setModal] = useState<{ id: string; view: 'talk' | 'profile' } | null>(null);

  // Keep static HTML tab buttons in sync
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.ch-seg button');
    buttons.forEach(b => {
      b.addEventListener('click', () => {
        const m = b.getAttribute('data-mode') as 'talk' | 'profile';
        setMode(m);
        buttons.forEach(x => x.classList.toggle('on', x === b));
      });
    });
  }, []);

  return (
    <>
      {PEOPLE.map(p => (
        <div
          key={p.id}
          className="ch-tile"
          style={{ '--tone': p.tone } as any}
          onClick={() => setModal({ id: p.id, view: mode })}
        >
          <div className="ch-id">
            {p.img ? <img className="ava" src={p.img + '?v=3'} alt="" /> : <AiTile className="init" size={60} radius={12} />}
            <span>
              <span className="nm">{p.name}</span>
              <span className="rl">{p.role}</span>
            </span>
          </div>
          <div className="ch-q">&ldquo;{p.quote}&rdquo;</div>
          <div className="ch-tags">
            {p.tags.map((t: string) => <span key={t}>{t}</span>)}
            <span>{p.archetype}</span>
          </div>
          <div className="ch-foot">
            <code>{p.code}</code>
            <span className="talk"><AiIcon size={12} /> {mode === 'talk' ? 'Talk →' : 'Profile →'}</span>
          </div>
        </div>
      ))}

      {modal && (
        <PersonaModal
          id={modal.id}
          initialView={modal.view}
          onClose={() => setModal(null)}
          onNav={id => setModal(prev => prev ? { ...prev, id } : null)}
        />
      )}
    </>
  );
}

/* ---- keyframe styles ---- */
const style = document.createElement('style');
style.textContent = `
  @keyframes scp-fade { from { opacity:0 } to { opacity:1 } }
  @keyframes scp-b { 0%,100%{transform:translateY(0);opacity:.35} 50%{transform:translateY(-3px);opacity:1} }
  .scp-chip:hover { border-color: var(--tone); color:#fff; }
`;
document.head.appendChild(style);

/* ---- mount ---- */
const grid = document.getElementById('ch-grid');
if (grid) createRoot(grid).render(<CohortApp />);
