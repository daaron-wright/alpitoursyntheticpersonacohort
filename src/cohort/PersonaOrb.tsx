/* ============================================================
   PersonaOrb — animated 3D particle orb + dot-grid field
   Animated Kyndryl Vital persona embodiment.

   Props:
     p       — Persona (for tone, orbMood, img)
     isLive  — true while the persona is "speaking" (chat busy)
   ============================================================ */
import React, { useRef, useEffect } from 'react';
import type { Persona } from '@/shared/types';

/* ---- palette ---- */
const ORB_PAL: Record<string, { hues: string[]; core: string; halo: string }> = {
  engaged: {
    hues: ['#E94B4B','#FF8766','#FFB46A','#E68A00','#46B7C7','#3E8AC2','#5C6A73','#29707A'],
    core: 'rgba(255,255,255,0.92)', halo: 'rgba(255,200,160,0.32)',
  },
  cautious: {
    hues: ['#2C6FA0','#3E8AC2','#29707A','#5BA2AE','#5C6A73','#3D8590','#FF6647'],
    core: 'rgba(255,255,255,0.94)', halo: 'rgba(91,162,174,0.28)',
  },
};
const GA = Math.PI * (3 - Math.sqrt(5));

function hexRgba(hex: string, a: number | string) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
}

function initials(n: string) {
  const w = n.trim().split(/\s+/);
  return (w[0][0] + (w[1] ? w[1][0] : '')).toUpperCase();
}

/* ---- orb component ---- */
interface Props {
  p: Persona;
  isLive: boolean;
}

export function PersonaOrb({ p, isLive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveRef   = useRef(isLive);
  const rafRef    = useRef<number>(0);
  const mountedRef = useRef(true);

  // Keep liveRef in sync without restarting the animation
  useEffect(() => { liveRef.current = isLive; }, [isLive]);

  useEffect(() => {
    mountedRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pal = ORB_PAL[p.orbMood] || ORB_PAL.engaged;
    const accent = p.tone;

    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    let parts: any[] = [];
    const DENSITY = 2600;
    let rotY = 0, rotX = -0.25, amp = 0, t0 = 0;
    const mouse = { x: 0, y: 0, inside: false, hold: false };
    const pulses: { t: number }[] = [];

    function size() {
      const rect = canvas!.getBoundingClientRect();
      if (!rect.width) return;
      W = rect.width; H = rect.height;
      canvas!.width  = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H / 2;
      R  = Math.min(W, H) * 0.5 * 0.62;
      if (parts.length !== DENSITY) build();
    }

    function build() {
      parts = [];
      const NS = Math.floor(DENSITY * 0.70);
      const NA = Math.floor(DENSITY * 0.22);
      const ND = DENSITY - NS - NA;

      for (let i = 0; i < NS; i++) {
        const f = (i + 0.5) / NS, phi = Math.acos(1 - 2 * f), th = i * GA;
        const boost = Math.pow(Math.max(0, Math.cos(th - phi * 4)), 3);
        const rad = 0.86 + boost * 0.18;
        const hi = Math.floor((((th % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI)) / (2*Math.PI / pal.hues.length));
        parts.push({ x: Math.sin(phi)*Math.cos(th)*rad, y: Math.cos(phi)*rad, z: Math.sin(phi)*Math.sin(th)*rad, kind:0, hi, color:pal.hues[hi], size:0.7+Math.random()*0.9, ph:Math.random()*6.28, mx:0, my:0 });
      }
      for (let i = 0; i < NA; i++) {
        const phiA = Math.PI/2 + (Math.random()-0.5)*1.7, thA = i*GA*1.7 + Math.random()*0.4;
        const bA = Math.pow(Math.max(0, Math.cos((thA - phiA*6)*0.6)), 2);
        const radA = 1.0 + bA*0.55 + Math.random()*0.05;
        const hi = Math.floor((((thA % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI)) / (2*Math.PI / pal.hues.length));
        parts.push({ x: Math.sin(phiA)*Math.cos(thA)*radA, y: Math.cos(phiA)*radA, z: Math.sin(phiA)*Math.sin(thA)*radA, kind:1, hi, color:pal.hues[hi], size:0.55+Math.random()*0.7, ph:Math.random()*6.28, mx:0, my:0 });
      }
      for (let i = 0; i < ND; i++) {
        const a = Math.random()*6.28, rd = 1.3 + Math.pow(Math.random(),2)*0.9;
        const hi = Math.floor(Math.random() * pal.hues.length);
        parts.push({ x: Math.cos(a)*rd, y: (Math.random()-0.5)*1.6, z: Math.sin(a)*rd, kind:2, hi, color:pal.hues[hi], size:0.5+Math.random()*0.7, ph:Math.random()*6.28, mx:0, my:0 });
      }
    }

    function sampleAmp(t: number, live: boolean) {
      if (!live) return 0.06 + Math.sin(t * 0.5) * 0.03;
      const lfo  = Math.sin(t*0.8)*0.5 + 0.5;
      const syll = Math.max(0, Math.sin(t*5 + Math.sin(t*1.4)*2));
      const burst = Math.pow(Math.max(0, Math.sin(t*3.2)), 6) * 0.6;
      return Math.min(1, 0.20 + lfo*0.18 + syll*0.38 + burst + (Math.random()-0.5)*0.05);
    }

    function drawCore(a: number) {
      const hR = R * (0.62 + a * 0.06);
      const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, hR);
      g.addColorStop(0,   pal.halo);
      g.addColorStop(0.5, pal.halo.replace(/[\d.]+\)$/, '0.10)'));
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, hR, 0, 6.2832); ctx.fill();

      const cR = R * (0.16 + a * 0.03);
      const c  = ctx.createRadialGradient(cx, cy, 0, cx, cy, cR);
      c.addColorStop(0,    pal.core);
      c.addColorStop(0.55, 'rgba(255,255,255,0.55)');
      c.addColorStop(0.85, 'rgba(255,255,255,0.18)');
      c.addColorStop(1,    'rgba(255,255,255,0)');
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, cR, 0, 6.2832); ctx.fill();
    }

    size();

    function frame(now: number) {
      if (!mountedRef.current) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      const live = liveRef.current;

      amp += (sampleAmp(t, live) - amp) * 0.15;
      rotY += (1/60) * (0.12 + amp * 0.10);

      ctx.clearRect(0, 0, W, H);
      drawCore(amp);

      // click pulse rings
      let pr = 0;
      for (let k = pulses.length - 1; k >= 0; k--) {
        pulses[k].t += 1/60;
        if (pulses[k].t > 1.6) { pulses.splice(k, 1); continue; }
        const r0 = R * (0.5 + pulses[k].t * 1.4);
        const aL = Math.max(0, 0.4 - pulses[k].t * 0.3);
        ctx.strokeStyle = hexRgba(accent, aL.toFixed(3));
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(cx, cy, r0, 0, 6.2832); ctx.stroke();
        pr += Math.exp(-Math.pow((pulses[k].t - 0.5) / 0.3, 2)) * 0.18;
      }

      const cY = Math.cos(rotY), sY = Math.sin(rotY);
      const cX = Math.cos(rotX), sX = Math.sin(rotX);
      const focal = 2.4, camZ = 2.6;

      for (let i = 0; i < parts.length; i++) {
        const pt = parts[i];
        const br = 1 + amp*0.05 + Math.sin(t*1.2 + pt.ph)*0.01 + pr;
        const px = pt.x*br, py = pt.y*br, pz = pt.z*br;
        const rx1 =  px*cY + pz*sY, rz1 = -px*sY + pz*cY;
        const ry2 =  py*cX - rz1*sX, rz2 = py*sX + rz1*cX;
        const scale = focal / (camZ - rz2);
        let sx = cx + rx1*R*scale, sy = cy + ry2*R*scale;

        if (mouse.inside) {
          const ddx = sx + pt.mx - mouse.x, ddy = sy + pt.my - mouse.y;
          const dd = Math.hypot(ddx, ddy), range = mouse.hold ? 220 : 130;
          if (dd < range && dd > 1) {
            const kk = 1 - dd/range;
            if (mouse.hold) { pt.mx -= (ddx/dd)*kk*1.6; pt.my -= (ddy/dd)*kk*1.6; }
            else             { pt.mx += (ddx/dd)*kk*1.2; pt.my += (ddy/dd)*kk*1.2; }
          }
        }
        pt.mx *= 0.92; pt.my *= 0.92;
        sx += pt.mx; sy += pt.my;

        if (sx < -10 || sx > W+10 || sy < -10 || sy > H+10) continue;

        const depth = (rz2 + 1.4) / 2.8, dot = Math.max(0.06, depth);
        const sz = pt.size * (0.5 + dot * 1.1);
        const df = Math.hypot(sx - cx, sy - cy);
        const cf = Math.min(1, Math.max(0.55, (df - R*0.12) / (R*0.18)));
        const base = pt.kind === 2 ? 0.42 : pt.kind === 1 ? 0.78 : 0.92;
        ctx.fillStyle = hexRgba(pt.color, Math.min(0.95, base*dot*cf*(0.65 + amp*0.25)).toFixed(3));
        ctx.beginPath(); ctx.arc(sx, sy, sz, 0, 6.2832); ctx.fill();
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    // ResizeObserver
    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(size) : null;
    ro?.observe(canvas);

    // Mouse / pointer handlers
    const pmove  = (e: PointerEvent) => { const r = canvas!.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.inside = true; };
    const pleave = () => { mouse.inside = false; };
    const pdown  = (e: PointerEvent) => { mouse.hold = true; pulses.push({ t: 0 }); pmove(e); };
    const pup    = () => { mouse.hold = false; };

    canvas.style.cursor = 'crosshair';
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointermove',  pmove);
    canvas.addEventListener('pointerleave', pleave);
    canvas.addEventListener('pointerdown',  pdown);
    window.addEventListener('pointerup',    pup);

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro?.disconnect();
      canvas.removeEventListener('pointermove',  pmove);
      canvas.removeEventListener('pointerleave', pleave);
      canvas.removeEventListener('pointerdown',  pdown);
      window.removeEventListener('pointerup',    pup);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]); // restart only when persona changes

  const img  = p.img;
  const init = (p as any).init || initials(p.name);

  return (
    <>
      {/* inject keyframes + CSS custom properties once */}
      <style>{`
        @property --bx { syntax: '<percentage>'; inherits: false; initial-value: 38%; }
        @property --by { syntax: '<percentage>'; inherits: false; initial-value: 42%; }
        @property --sx { syntax: '<percentage>'; inherits: false; initial-value: 66%; }
        @property --sy { syntax: '<percentage>'; inherits: false; initial-value: 62%; }
        @keyframes scp-drift  { to { background-position: 15px 15px; } }
        @keyframes scp-blob   { 0%{--bx:38%;--by:42%} 33%{--bx:60%;--by:30%} 66%{--bx:30%;--by:60%} 100%{--bx:38%;--by:42%} }
        @keyframes scp-blob2  { 0%{--sx:66%;--sy:62%} 40%{--sx:38%;--sy:72%} 70%{--sx:72%;--sy:40%} 100%{--sx:66%;--sy:62%} }
        @keyframes scp-ring   { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.7);opacity:0} }
        @keyframes scp-pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.035)} }
        .orb-ring { position:absolute; width:190px; height:190px; border-radius:50%; border:1.5px solid var(--orb-tone); opacity:0; animation:scp-ring 3.2s ease-out infinite; }
        .orb-ring.r2 { animation-delay:1.05s; }
        .orb-ring.r3 { animation-delay:2.1s; }
        .orb-live .orb-ring { animation-duration:1.5s; }
        .orb-live .orb-photo { animation:scp-pulse 1.5s ease-in-out infinite; }
        .orb-layer { position:absolute; inset:-15%; background-image:radial-gradient(circle,#94A3B8 1.1px,transparent 1.7px); background-size:15px 15px; opacity:.5; mask:radial-gradient(circle at 50% 50%,#000 18%,transparent 62%); -webkit-mask:radial-gradient(circle at 50% 50%,#000 18%,transparent 62%); animation:scp-drift 7s linear infinite; pointer-events:none; }
        .orb-layer.t { background-image:radial-gradient(circle,var(--orb-tone) 1.3px,transparent 1.8px); opacity:.4; mask:radial-gradient(circle at var(--bx,38%) var(--by,42%),#000 0,transparent 30%); -webkit-mask:radial-gradient(circle at var(--bx,38%) var(--by,42%),#000 0,transparent 30%); mix-blend-mode:multiply; animation:scp-drift 7s linear infinite, scp-blob 9s ease-in-out infinite; }
        .orb-layer.s { background-image:radial-gradient(circle,#29707A 1.3px,transparent 1.8px); opacity:.32; mask:radial-gradient(circle at var(--sx,66%) var(--sy,62%),#000 0,transparent 26%); -webkit-mask:radial-gradient(circle at var(--sx,66%) var(--sy,62%),#000 0,transparent 26%); mix-blend-mode:multiply; animation:scp-drift 7s linear infinite -3s, scp-blob2 11s ease-in-out infinite; }
      `}</style>

      {/* field — canvas + dot layers + orb */}
      <div style={{
        position: 'relative', flex: 1, display: 'grid', placeItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg,#F2F0EB 0%,#F6F8F9 48%,#FBFAF6 100%)',
        ['--orb-tone' as any]: p.tone,
      }}>
        {/* particle canvas */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

        {/* dot grid layers */}
        <div className="orb-layer" />
        <div className="orb-layer t" />
        <div className="orb-layer s" />

        {/* orb wrapper — rings + photo */}
        <div
          className={`orb-orbwrap${isLive ? ' orb-live' : ''}`}
          style={{ position: 'relative', display: 'grid', placeItems: 'center', zIndex: 2, pointerEvents: 'none' }}
        >
          <div className="orb-ring" />
          <div className="orb-ring r2" />
          <div className="orb-ring r3" />

          <div
            className="orb-photo"
            style={{
              position: 'relative', width: 150, height: 150, borderRadius: '50%',
              overflow: 'hidden', zIndex: 2,
              boxShadow: `0 0 0 2px ${p.tone}, 0 0 0 8px rgba(0,0,0,.45), 0 0 56px ${p.toneSoft}`,
            }}
          >
            {img
              ? <img src={img + '?v=3'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <span style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: p.toneSoft, color: p.tone, fontSize: 52, fontWeight: 600,
                  fontFamily: 'var(--font-display,system-ui)',
                }}>{init}</span>
            }
          </div>
        </div>
      </div>
    </>
  );
}
