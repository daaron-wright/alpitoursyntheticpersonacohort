/* ============================================================
   PersonaDock — floating Synthetic Persona Cohort reference
   Used in the AlpiGPT 2.0 Guided Demo (bottom-left FAB).

   Shows a collapsed FAB → expandable cohort list →
   compact chat popup → full Talk / Profile modal.
   ============================================================ */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PEOPLE, BY, TRY, askPersona, getHist, clearHist } from '@/cohort/personas';
import { PersonaOrb } from '@/cohort/PersonaOrb';
import type { Persona } from '@/shared/types';

/* ---- helpers ---- */
function initials(n: string) {
  const w = n.trim().split(/\s+/);
  return (w[0][0] + (w[1] ? w[1][0] : '')).toUpperCase();
}

function Avatar({
  p, size, style: extraStyle,
}: { p: Persona; size: number; style?: React.CSSProperties }) {
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    objectFit: 'cover', display: 'block', flexShrink: 0,
    boxShadow: `inset 0 0 0 2px ${p.tone}`,
    ...extraStyle,
  };
  if (p.img) return <img src={p.img + '?v=3'} alt="" style={base} />;
  return (
    <span style={{
      ...base,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: p.toneSoft, color: p.tone, fontWeight: 600,
      fontSize: Math.round(size * 0.38), fontFamily: 'var(--font-display,system-ui)',
    }}>
      {(p as any).init || initials(p.name)}
    </span>
  );
}

/* ---- chat panel (shared between popup and full modal) ---- */
type Msg = { role: 'user' | 'assistant'; content: string };

export function ChatPanel({
  p, onStatusChange,
}: { p: Persona; onStatusChange?: (s: 'idle' | 'thinking') => void }) {
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
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    try {
      const reply = await askPersona(p.id, text);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "(Couldn't reach me just now — try again.)" }]);
    }
    setBusy(false);
    onStatusChange?.('idle');
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [input, busy, p.id, onStatusChange]);

  const chips = TRY[p.id] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'thin' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, maxWidth: '90%', alignSelf: m.role === 'assistant' ? 'flex-start' : 'flex-end', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            {m.role === 'assistant' && <Avatar p={p} size={24} style={{ alignSelf: 'flex-end' }} />}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4, color: m.role === 'assistant' ? p.tone : '#8DA0A7', textAlign: m.role === 'user' ? 'right' : 'left' }}>
                {m.role === 'assistant' ? p.name.split(' ')[0].toUpperCase() : 'YOU'}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: m.role === 'assistant' ? '#DBE3E6' : '#fff', ...(m.role === 'user' ? { background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)', padding: '8px 11px', borderRadius: '12px 12px 4px 12px' } : {}) }}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ alignSelf: 'flex-start', display: 'inline-flex', gap: 4, padding: '4px 2px' }}>
            {[0, 150, 300].map(d => (
              <i key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: p.tone, display: 'block', animation: `scp-b 1.2s ease-in-out ${d}ms infinite` }} />
            ))}
          </div>
        )}
      </div>

      {!chipsHidden && chips.length > 0 && (
        <div style={{ padding: '2px 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          <span style={{ flexBasis: '100%', fontSize: 8.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#7C8A90', marginBottom: 2 }}>Try asking</span>
          {chips.map((c, i) => (
            <button key={i} onClick={() => send(c)} style={{ fontSize: 11, color: '#CDD6DA', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: 11, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          rows={1}
          placeholder={`Ask ${p.name.split(' ')[0]} anything…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 96) + 'px';
          }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          style={{ flex: 1, resize: 'none', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)', borderRadius: 11, padding: '9px 12px', fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.4, maxHeight: 96, color: '#fff', outline: 'none' }}
        />
        <button onClick={() => send()} disabled={busy} style={{ flexShrink: 0, height: 36, padding: '0 16px', borderRadius: 9, border: 'none', background: p.tone, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, opacity: busy ? 0.45 : 1 }}>
          Ask
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 11px' }}>
        <span style={{ fontSize: 9.5, color: '#6E7C82' }}>Synthetic stand-in · not a real person</span>
        <button
          onClick={() => {
            clearHist(p.id);
            setMessages([{ role: 'assistant', content: p.greet }]);
            setChipsHidden(false);
          }}
          style={{ fontSize: 10, color: '#6E7C82', background: 'transparent', border: '1px solid rgba(255,255,255,.10)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Clear chat
        </button>
      </div>
    </div>
  );
}

/* ---- compact popup ---- */
function Popup({ id, onClose, onExpand, onBackToCohort }: {
  id: string;
  onClose: () => void;
  onExpand: () => void;
  onBackToCohort: () => void;
}) {
  const p = BY[id];
  if (!p) return null;
  return (
    <div style={{ position: 'fixed', left: 16, bottom: 130, zIndex: 461, width: 'min(384px,calc(100vw - 32px))', height: 'min(560px,calc(100vh - 160px))', background: '#14181B', color: '#E8EDEF', border: '1px solid rgba(255,255,255,.10)', borderRadius: 18, boxShadow: '0 36px 80px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'scp-rise .22s cubic-bezier(.4,0,.2,1)', fontFamily: 'var(--font-sans,system-ui,sans-serif)', ['--tone' as any]: p.tone }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ position: 'relative', width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: `inset 0 0 0 2px ${p.tone}` }}>
          <Avatar p={p} size={42} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 15.5, fontWeight: 500, lineHeight: 1.1 }}>{p.name}</div>
          <div style={{ fontSize: 11, color: '#9AA7AD' }}>{p.role}</div>
          <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: p.tone, marginTop: 3 }}>Synthetic — not a real person</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
          <button onClick={onBackToCohort} title="Back to cohort" style={icoStyle}>‹</button>
          <button onClick={onExpand} title="Expand" style={icoStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/></svg>
          </button>
          <button onClick={onClose} title="Close" style={icoStyle}>✕</button>
        </div>
      </div>
      <ChatPanel key={id} p={p} />
    </div>
  );
}

const icoStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,.14)',
  background: 'transparent', cursor: 'pointer', color: '#C7D0D4',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  fontSize: 14,
};

/* ---- full modal ---- */
function Modal({ id, initialView = 'talk', onClose, onNav }: {
  id: string;
  initialView?: 'talk' | 'profile';
  onClose: () => void;
  onNav: (id: string) => void;
}) {
  const [view, setView] = useState<'talk' | 'profile'>(initialView);
  const [status, setStatus] = useState<'idle' | 'thinking'>('idle');
  const p = BY[id];

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!p) return null;
  const prevP = PEOPLE[(p.idx - 2 + PEOPLE.length) % PEOPLE.length];
  const nextP = PEOPLE[p.idx % PEOPLE.length];

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(8,10,12,.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-sans,system-ui,sans-serif)', animation: 'scp-fade .2s' }}>
      <div style={{ ['--tone' as any]: p.tone, ['--toneSoft' as any]: p.toneSoft, width: 'min(1280px,100%)', height: 'min(840px,100%)', background: '#14181B', color: '#E8EDEF', borderRadius: 20, boxShadow: '0 50px 120px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)' }}>

        {/* top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <button onClick={onClose} style={{ border: '1px solid rgba(255,255,255,.16)', background: 'transparent', color: '#D4DCDF', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '7px 12px', borderRadius: 9, cursor: 'pointer' }}>‹ Cohort</button>
          <span style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 21, fontWeight: 600 }}>{p.name}</span>
          <span style={{ fontSize: 12.5, color: '#9AA7AD' }}>{p.role}</span>
          <span style={{ fontSize: 11, color: '#6E7C82' }}>{p.code} · synthetic · {p.idx}/{PEOPLE.length}</span>
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
          <button onClick={onClose} style={{ border: 'none', background: p.tone, color: '#fff', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '8px 15px', borderRadius: 9, cursor: 'pointer' }}>Close ✕</button>
        </div>

        {/* body */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: view === 'talk' ? '1fr 1fr' : '1fr', gap: 16, padding: '0 20px 20px', minHeight: 0, overflowY: view === 'profile' ? 'auto' : 'hidden' }}>

          {view === 'talk' && (
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#1F2A30' }}>
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', flexShrink: 0 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <b style={{ width: 7, height: 7, borderRadius: '50%', background: p.tone, display: 'block' }} />
                  {p.name.toUpperCase()} · SYNTHETIC EMBODIMENT
                </span>
                <span>MOOD · {p.moodLine}</span>
              </div>

              {/* ← animated orb field */}
              <PersonaOrb p={p} isLive={status === 'thinking'} />

              {/* footer */}
              <div style={{ padding: '14px 16px 16px', borderTop: '1px solid #EEF2F4', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', border: `2px solid ${p.tone}`, background: p.toneSoft, color: p.tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{status === 'thinking' ? 'Speaking · live' : 'Listening'}</div>
                    <div style={{ fontSize: 10.5, color: '#64748B' }}>grounded in the brief · {p.tags.join(' · ')}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 13 }}>
                  {p.moods.map((m: any, i: number) => (
                    <div key={i} style={{ border: `1px solid ${m[2] ? p.tone : '#E2E8F0'}`, background: m[2] ? p.toneSoft : 'transparent', borderRadius: 10, padding: '7px 9px' }}>
                      <b style={{ display: 'block', fontSize: 11, fontWeight: 600 }}>{m[0]}</b>
                      <span style={{ fontSize: 9.5, color: '#64748B' }}>{m[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'talk' && (
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ChatPanel key={id + '-modal'} p={p} onStatusChange={setStatus} />
            </div>
          )}

          {view === 'profile' && <ProfileView p={p} />}
        </div>
      </div>
    </div>
  );
}

function ProfileView({ p }: { p: Persona }) {
  return (
    <div style={{ color: '#E8EDEF', paddingTop: 20 }}>
      <div style={{ fontSize: 11, color: '#6E7C82', marginBottom: 8 }}>
        <span style={{ background: 'rgba(255,255,255,.08)', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>People</span>
        {' '}Synthetic persona {String(p.idx).padStart(2, '0')} / {PEOPLE.length} · Composite, not a real person
      </div>
      <h2 style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 28, fontWeight: 500, margin: '0 0 20px', color: '#fff' }}>{p.name} — {p.role.split(' · ')[0]}</h2>

      <div style={{ background: '#1F2A30', border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '20px 24px', display: 'grid', gridTemplateColumns: '180px 1fr 220px', gap: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 96, height: 96, borderRadius: 16, overflow: 'hidden', boxShadow: `inset 0 0 0 2px ${p.tone}` }}><Avatar p={p} size={96} style={{ borderRadius: 16 }} /></div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: '#6E7C82' }}>{p.pron}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
            {p.tags.map((t: string) => <span key={t} style={{ fontSize: 10.5, border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, padding: '2px 8px', color: '#AEB9BE' }}>{t}</span>)}
          </div>
          <div style={{ fontSize: 9.5, color: '#6E7C82', fontFamily: 'var(--font-mono,monospace)' }}>{p.code} · synthetic</div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display,system-ui)', fontStyle: 'italic', fontSize: 17, color: '#E8EDEF', marginBottom: 12, lineHeight: 1.4 }}>
            <span style={{ fontSize: 24, color: p.tone }}>"</span>{p.quote}
          </div>
          <div style={{ fontSize: 13.5, color: '#8C99A0', lineHeight: 1.65 }}>{p.bio}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6E7C82', marginBottom: 10 }}>Context</div>
          {p.context.map((r: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12 }}>
              <span style={{ color: '#6E7C82', width: 80, flexShrink: 0 }}>{r[0]}</span>
              <span style={{ color: '#E8EDEF', fontWeight: 500 }}>{r[1]}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Goals · ranked', sub: `What ${p.name.split(' ')[0]} wants`, items: p.goals.map((g: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: p.tone, flexShrink: 0 }}>0{i + 1}</span>
              <div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{g[0]}</div><div style={{ fontSize: 12, color: '#8C99A0', lineHeight: 1.5 }}>{g[1]}</div></div>
            </div>
          )) },
          { label: 'Frustrations', sub: 'What gets in the way', items: p.frustrations.map((f: any, i: number) => {
            const c: any = { red: '#D7373F', amber: '#E6A100', teal: '#29707A' };
            return <div key={i} style={{ borderLeft: `3px solid ${c[f[0]] ?? '#rgba(255,255,255,.2)'}`, paddingLeft: 10, marginBottom: 10 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{f[1]}</div><div style={{ fontSize: 12, color: '#8C99A0', lineHeight: 1.5 }}>{f[2]}</div></div>;
          }) },
          { label: 'AI trust threshold', sub: 'Working with the agent', items: p.trust.map((t: any, i: number) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: '#8C99A0' }}><span>{t[0]}</span><span>{t[1]}</span></div>
              <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 999 }}>
                <span style={{ position: 'absolute', left: t[2] + '%', top: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: p.tone, display: 'block', boxShadow: '0 0 0 2px #14181B' }} />
              </div>
              <div style={{ fontSize: 11, color: '#6E7C82', marginTop: 4, fontStyle: 'italic' }}>{t[3]}</div>
            </div>
          )) },
        ].map(col => (
          <div key={col.label} style={{ background: '#1F2A30', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6E7C82', marginBottom: 4 }}>{col.label}</div>
            <h4 style={{ fontFamily: 'var(--font-display,system-ui)', margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>{col.sub}</h4>
            {col.items}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PersonaDock — the main floating dock component
   Mount this anywhere; it renders fixed to the viewport.
   ============================================================ */
type DockState =
  | { kind: 'closed' }
  | { kind: 'list' }
  | { kind: 'popup'; id: string }
  | { kind: 'modal'; id: string; view: 'talk' | 'profile' };

export function PersonaDock() {
  const [state, setState] = useState<DockState>({ kind: 'closed' });

  const close = useCallback(() => setState({ kind: 'closed' }), []);
  const openList = useCallback(() => setState({ kind: 'list' }), []);
  const openPopup = useCallback((id: string) => setState({ kind: 'popup', id }), []);
  const openModal = useCallback((id: string, view: 'talk' | 'profile' = 'talk') => setState({ kind: 'modal', id, view }), []);
  const backToList = useCallback(() => setState({ kind: 'list' }), []);

  // Stacked avatars for the FAB (first 3 personas)
  const fabPeople = PEOPLE.slice(0, 3);

  return (
    <>
      {/* cohort list panel — anchored above the pill */}
      {state.kind === 'list' && (
        <div style={{ position: 'fixed', left: 16, bottom: 130, zIndex: 460, width: 300, background: '#14181B', color: '#E8EDEF', border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,.5)', overflow: 'hidden', animation: 'scp-rise .2s cubic-bezier(.4,0,.2,1)', fontFamily: 'var(--font-sans,system-ui,sans-serif)', maxHeight: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,.08)', flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 15, fontWeight: 500 }}>Synthetic Persona Cohort</div>
              <div style={{ fontSize: 10.5, color: '#8C99A0', marginTop: 2 }}>Validate the demo · AI stand-ins, not real people</div>
            </div>
            <button onClick={close} style={{ marginLeft: 'auto', width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: '#C7D0D4', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>✕</button>
          </div>
          <div style={{ padding: 8, overflowY: 'auto' }}>
            {PEOPLE.map(p => (
              <button key={p.id} onClick={() => openPopup(p.id)} style={{ ['--tone' as any]: p.tone, display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: 11, padding: '9px 10px', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: `inset 0 0 0 2px ${p.tone}` }}>
                  <Avatar p={p} size={40} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b style={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: 1.15 }}>{p.name}</b>
                  <i style={{ display: 'block', fontStyle: 'normal', fontSize: 11, color: '#8C99A0' }}>{p.role}</i>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: p.tone, flexShrink: 0 }}>Talk →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAB pill — always visible at bottom-left */}
      {state.kind !== 'modal' && (
        <button onClick={state.kind === 'list' ? close : openList} style={{ position: 'fixed', left: 16, bottom: 76, zIndex: 461, display: 'inline-flex', alignItems: 'center', gap: 9, background: '#14181B', color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: 999, padding: '6px 14px 6px 7px', cursor: 'pointer', boxShadow: '0 8px 22px rgba(15,23,42,.28)', fontFamily: 'var(--font-sans,system-ui,sans-serif)' }}>
          <span style={{ display: 'inline-flex' }}>
            {fabPeople.map((p, i) => (
              <span key={p.id} style={{ display: 'inline-block', width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', border: '2px solid #14181B', marginLeft: i === 0 ? 0 : -10, position: 'relative', zIndex: fabPeople.length - i }}>
                <Avatar p={p} size={30} style={{ borderRadius: '50%', boxShadow: 'none' }} />
              </span>
            ))}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.02em' }}>Synthetic Persona Cohort</span>
        </button>
      )}

      {/* compact popup */}
      {state.kind === 'popup' && (
        <Popup
          id={state.id}
          onClose={close}
          onExpand={() => openModal(state.id, 'talk')}
          onBackToCohort={backToList}
        />
      )}

      {/* full modal */}
      {state.kind === 'modal' && (
        <Modal
          id={state.id}
          initialView={state.view}
          onClose={close}
          onNav={id => setState({ kind: 'modal', id, view: 'talk' })}
        />
      )}

      {/* shared keyframes */}
      <style>{`
        @keyframes scp-rise { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes scp-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes scp-b { 0%,100%{transform:translateY(0);opacity:.35} 50%{transform:translateY(-3px);opacity:1} }
      `}</style>
    </>
  );
}
