/* ============================================================
   DXLive — reactive store so ChemAssist chat actions ripple
   into the rest of the experience.
   ============================================================ */
import { useState, useEffect } from 'react';

const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const state: any = {
  poApproved: false,
  orderStage: null,
  invoiceStatus: null,
  extraOrderEvents: [],
  samples: [],
  evidence: {},
  events: {},
};

const subs = new Set<() => void>();
function emit() { subs.forEach(f => { try { f(); } catch (e) {} }); }
function pushEvent(cc: string, ev: any) {
  (state.events[cc] = state.events[cc] || []).push(ev);
}

const ACTIONS: Record<string, (p: any) => void> = {
  "po.approve": (p) => {
    const cc = p.caseCode || "CASE-02111";
    state.poApproved = true;
    state.orderStage = 5;
    state.invoiceStatus = "issued";
    state.extraOrderEvents.push({
      ts: now(), icon: "checkmark-filled", chan: "portal", tone: "ok",
      title: "PO approved in ChemAssist",
      detail: `${p.po || "PO-48261"} approved by you — routed to your Dow rep to place.`,
      chain: ["concierge", "deal", "credit"],
    });
    pushEvent(cc, {
      t: now(), date: "Today", stage: "PO", channel: "portal", actor: "you", icon: "checkmark-filled",
      title: "Approved the PO in ChemAssist", detail: `${p.po || "PO-48261"} approved — routed to Dow sales to place on your behalf.`,
      policy: "PAC: least-privilege — placement routed to Dow sales",
    });
  },
  "sample.evidence": (p) => {
    const cc = p.caseCode || "CASE-02111";
    (state.evidence[cc] = state.evidence[cc] || []).push({ round: p.round || 1, result: p.result || "Test data attached", ts: now() });
    pushEvent(cc, {
      t: now(), date: "Today", stage: "Test", channel: "portal", actor: "you", icon: "document-chart",
      title: "Added test evidence in ChemAssist", detail: p.result || "Test data attached to the sample experiment.",
    });
  },
  "sample.order": (p) => {
    const cc = p.caseCode || "CASE-02111";
    state.samples.push({ grade: p.grade || "INFUSE\u2122 9107", code: "SR-" + (20602 + state.samples.length), status: "Ordered", caseCode: cc });
    pushEvent(cc, {
      t: now(), date: "Today", stage: "Sample", channel: "portal", actor: "chemassist", icon: "lightbulb",
      title: "Next-round sample ordered", detail: `${p.grade || "INFUSE\u2122 9107"} — added to the experiment and tracked.`,
    });
  },
};

export const DXLive = {
  get() { return state; },
  subscribe(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; },
  dispatch(action: string, payload?: any) { const fn = ACTIONS[action]; if (fn) { fn(payload || {}); emit(); } },
  use() {
    const [, force] = useState(0);
    useEffect(() => DXLive.subscribe(() => force((n: number) => n + 1)), []);
    return state;
  },
};
