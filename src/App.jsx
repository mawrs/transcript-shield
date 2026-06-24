import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Pause, Check, ChevronRight, ChevronDown, Mic, ShieldAlert,
  ShieldCheck, Lock, BookText, Eraser, Sparkles,
} from "lucide-react";

const c = {
  bg: "#F7F7F8", surface: "#FFFFFF", sunken: "#F1F1F3",
  ink: "#1A1A1C", inkSoft: "#46464A", muted: "#8C8C92",
  line: "#E7E7EA", lineStrong: "#D6D6DA",
  peridot: "#DC2626", peridotDeep: "#B01818", peridotTint: "#FCE9E9", peridotGlow: "#F2A0A0",
  amber: "#DC2626", amberTint: "#FCE9E9",
  blue: "#45454B", blueTint: "#ECECEE",
  fillerInk: "#A2A2A8",
};
const F = {
  ui: "'Hanken Grotesque', system-ui, -apple-system, sans-serif",
  read: "'Newsreader', Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
};

const TURNS = [
  { id: "u1", sp: "S1", start: 4, segs: [
    { t: "txt", v: "Thanks for hopping on. To start, " },
    { t: "fill", id: "f1", v: "um, " },
    { t: "txt", v: "could you tell me your name and what you do at " },
    { t: "term", id: "tm1", term: "Clearwater", heard: "clear water", v: "Clearwater" },
    { t: "txt", v: "?" },
  ]},
  { id: "u2", sp: "S2", start: 11, segs: [
    { t: "txt", v: "Yeah, of course. So I'm " },
    { t: "pii", id: "p1", kind: "name", v: "Marcus Chen" },
    { t: "txt", v: " and I, " },
    { t: "fill", id: "f2", v: "uh, " },
    { t: "txt", v: "I run product for our mobile banking app. You can reach me at " },
    { t: "pii", id: "p2", kind: "email", v: "marcus.chen@clearwater.finance" },
    { t: "txt", v: " if anything comes up after." },
  ]},
  { id: "u3", sp: "S1", start: 24, segs: [
    { t: "txt", v: "Perfect. And, " },
    { t: "fill", id: "f3", v: "like, " },
    { t: "txt", v: "walk me through what happens when a new customer tries to link a bank account, " },
    { t: "fill", id: "f4", v: "you know, " },
    { t: "txt", v: "during onboarding?" },
  ]},
  { id: "u4", sp: "S2", start: 33, segs: [
    { t: "txt", v: "Honestly it's " },
    { t: "fill", id: "f5", v: "um, " },
    { t: "txt", v: "kind of brittle. " },
    { t: "fill", id: "f6", v: "We— " },
    { t: "txt", v: "we run KYC, then they hit the account-linking step and just " },
    { t: "fill", id: "f7", v: "sort of " },
    { t: "txt", v: "bounce. Nobody, " },
    { t: "fill", id: "f8", v: "I mean, " },
    { t: "txt", v: "nobody finishes if their bank isn't supported." },
  ]},
  { id: "u5", sp: "S1", start: 48, segs: [
    { t: "txt", v: "Got it. Are you using something like " },
    { t: "term", id: "tm2", term: "Plaid", heard: "played", v: "Plaid" },
    { t: "txt", v: " for that today?" },
  ]},
  { id: "u6", sp: "S2", start: 55, segs: [
    { t: "txt", v: "We use " },
    { t: "term", id: "tm3", term: "Plaid", heard: "played", v: "Plaid" },
    { t: "txt", v: " for linking, and " },
    { t: "term", id: "tm4", term: "Stripe", heard: "strip", v: "Stripe" },
    { t: "txt", v: " for payouts, but " },
    { t: "fill", id: "f9", v: "uh, " },
    { t: "txt", v: "compliance reviews were eating our team alive. What got me about " },
    { t: "term", id: "tm5", term: "Transcript", heard: "trans script", v: "Transcript" },
    { t: "txt", v: " was that every finding links back to the actual moment in the recording, so I can " },
    { t: "fill", id: "f10", v: "you know, " },
    { t: "txt", v: "trust the audit trail." },
  ]},
  { id: "u7", sp: "S2", start: 74, segs: [
    { t: "txt", v: "If you have follow-ups my cell is " },
    { t: "pii", id: "p3", kind: "phone", v: "415-555-0142" },
    { t: "txt", v: ", that's usually faster than email." },
  ]},
  { id: "u8", sp: "S1", start: 82, segs: [
    { t: "txt", v: "Amazing, that's super helpful. Thank you." },
  ]},
];
const DURATION = 90;
const DICT_TERMS = [
  { term: "Plaid", heard: "played" },
  { term: "Stripe", heard: "strip" },
  { term: "Clearwater", heard: "clear water" },
  { term: "Transcript", heard: "trans script" },
];
const PII_LABEL = { name: "Name", email: "Email address", phone: "Phone number" };

const WAVE = Array.from({ length: 72 }, (_, i) => {
  const a = Math.sin(i * 0.7) * 0.5 + Math.sin(i * 0.23) * 0.35 + Math.sin(i * 0.9) * 0.18;
  return 0.22 + Math.abs(a) * 0.72;
});
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function App() {
  const [view, setView] = useState("cleaned");
  const [speakers, setSpeakers] = useState({
    S1: { label: "You", role: "Moderator" },
    S2: { label: "Marcus Chen", role: "Participant" },
  });
  const [editingSp, setEditingSp] = useState(null);
  const [fillers, setFillers] = useState(() => Object.fromEntries(
    TURNS.flatMap(t => t.segs).filter(s => s.t === "fill").map(s => [s.id, true])));
  const [pii, setPii] = useState(() => Object.fromEntries(
    TURNS.flatMap(t => t.segs).filter(s => s.t === "pii").map(s => [s.id, true])));
  const [terms, setTerms] = useState(() => Object.fromEntries(
    TURNS.flatMap(t => t.segs).filter(s => s.t === "term").map(s => [s.id, true])));
  const [dict, setDict] = useState(() => Object.fromEntries(DICT_TERMS.map(d => [d.term, true])));
  const [pop, setPop] = useState(null);
  const [sent, setSent] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setT(p => {
      const n = p + 0.12;
      if (n >= DURATION) { setPlaying(false); return DURATION; }
      return n;
    }), 70);
    return () => clearInterval(iv);
  }, [playing]);
  const toggle = () => setPlaying(p => !p);
  const seekTo = (sec) => { setT(sec); setPlaying(true); };
  const activeTurn = [...TURNS].reverse().find(tr => tr.start <= t)?.id ?? null;

  const closePop = useCallback(() => setPop(null), []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { closePop(); setEditingSp(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePop]);

  const counts = {
    fill: Object.values(fillers).filter(Boolean).length,
    pii: Object.values(pii).filter(Boolean).length,
    term: Object.values(terms).filter(Boolean).length,
  };
  const totalFill = Object.keys(fillers).length;
  const totalPii = Object.keys(pii).length;
  const totalTerm = Object.keys(terms).length;
  const setAllFill = (val) => setFillers(Object.fromEntries(Object.keys(fillers).map(k => [k, val])));

  return (
    <div style={{ fontFamily: F.ui, background: c.bg, color: c.ink, height: "100vh", minHeight: 640, display: "flex", flexDirection: "column", WebkitFontSmoothing: "antialiased" }}>
      <GlobalStyle />

      <header style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 22px", height: 58, borderBottom: `1px solid ${c.line}`, background: c.surface, flexShrink: 0 }}>
        <img src="/logo.svg" alt="Peridot" style={{ height: 22, width: "auto", display: "block" }} />
        <div style={{ flex: 1 }} />
        <Segmented value={view} onChange={setView} options={[["cleaned", "Cleaned"], ["original", "Original"]]} />
        <button className="pd-btn" onClick={() => setSent(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, background: c.peridot, color: "#fff", border: "none", borderRadius: 9, padding: "9px 15px", fontFamily: F.ui, fontWeight: 600, fontSize: 13.5, cursor: "pointer", boxShadow: `0 1px 2px ${c.peridotDeep}55` }}
          onMouseEnter={e => e.currentTarget.style.background = c.peridotDeep}
          onMouseLeave={e => e.currentTarget.style.background = c.peridot}>
          Send to analysis <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <aside className="pd-scroll" style={{ width: 296, flexShrink: 0, borderRight: `1px solid ${c.line}`, background: c.surface, overflowY: "auto", padding: "20px 18px" }}>
          <RailHead icon={<Mic size={13} />}>Speakers</RailHead>
          <div style={{ marginBottom: 26 }}>
            {Object.entries(speakers).map(([id, sp]) => (
              <SpeakerRow key={id} id={id} sp={sp} editing={editingSp === id}
                onEdit={() => setEditingSp(id)}
                onSave={(label, role) => { setSpeakers(s => ({ ...s, [id]: { label, role } })); setEditingSp(null); }}
                onCancel={() => setEditingSp(null)} />
            ))}
          </div>

          <RailHead icon={<Sparkles size={13} />}>Ready to analyze</RailHead>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            <SummaryRow color={c.fillerInk} icon={<Eraser size={14} />} title="Filler words"
              detail={`${counts.fill} of ${totalFill} removed`}
              action={counts.fill === totalFill ? "Keep all" : "Remove all"} onAction={() => setAllFill(counts.fill !== totalFill)} />
            <SummaryRow color={c.amber} icon={<ShieldAlert size={14} />} title="Personal info"
              detail={`${counts.pii} of ${totalPii} redacted`} flag={counts.pii < totalPii ? `${totalPii - counts.pii} exposed` : null} />
            <SummaryRow color={c.blue} icon={<BookText size={14} />} title="Corrections" detail={`${counts.term} of ${totalTerm} applied`} />
          </div>
          <p style={{ fontSize: 11, color: c.muted, lineHeight: 1.5, margin: "0 0 26px", display: "flex", gap: 6 }}>
            <Lock size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Redaction covers the transcript, insights, and exports. The source recording stays whole so you can verify quotes.</span>
          </p>

          <RailHead icon={<BookText size={13} />}>Workspace dictionary</RailHead>
          <p style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.5, margin: "0 0 12px" }}>
            Terms here correct automatically in every interview this workspace runs.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {DICT_TERMS.map(d => (
              <DictRow key={d.term} d={d} on={dict[d.term]} toggle={() => setDict(s => ({ ...s, [d.term]: !s[d.term] }))} />
            ))}
          </div>
        </aside>

        <main className="pd-scroll" style={{ flex: 1, overflowY: "auto", padding: "30px 0 40px" }} onClick={closePop}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 40px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${c.line}` }}>
              <div>
                <h1 style={{ fontFamily: F.read, fontSize: 25, fontWeight: 500, margin: 0, letterSpacing: -0.3 }}>Clearwater · fintech onboarding research</h1>
                <p style={{ fontSize: 12.5, color: c.muted, margin: "5px 0 0", fontFamily: F.mono }}>recorded today · {fmt(DURATION)} · auto-transcribed</p>
              </div>
              <span style={{ fontSize: 11.5, color: view === "original" ? c.inkSoft : c.peridot, fontWeight: 600, background: view === "original" ? c.sunken : c.peridotTint, padding: "4px 10px", borderRadius: 99 }}>
                {view === "original" ? "Original — raw transcript" : "Cleaned copy"}
              </span>
            </div>

            {TURNS.map(turn => (
              <Turn key={turn.id} turn={turn} active={activeTurn === turn.id} speaker={speakers[turn.sp]}
                view={view} fillers={fillers} pii={pii} terms={terms}
                onSeek={() => seekTo(turn.start)}
                onItem={(kind, id, rect) => setPop({ kind, id, rect })} />
            ))}

            <p style={{ fontFamily: F.mono, fontSize: 11, color: c.muted, textAlign: "center", marginTop: 30 }}>— end of recording —</p>
          </div>
        </main>
      </div>

      <AudioBar playing={playing} toggle={toggle} t={t} onScrub={setT} />
      <SourceVideo playing={playing} t={t} toggle={toggle} name={speakers.S2.label} />

      {pop && (
        <Popover pop={pop} onClose={closePop}
          fillers={fillers} pii={pii} terms={terms} dict={dict}
          setFillers={setFillers} setPii={setPii} setTerms={setTerms} setDict={setDict} />
      )}
      {sent && <Sent counts={counts} onClose={() => setSent(false)} />}
    </div>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesque:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=JetBrains+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      ::selection { background: ${c.peridotTint}; }
      .pd-seg { cursor: pointer; border-radius: 4px; transition: background .12s ease, opacity .18s ease, color .15s ease; }
      .pd-btn { transition: background .14s ease, border-color .14s ease, transform .04s ease; }
      .pd-btn:active { transform: translateY(1px); }
      .pd-turn { transition: background .25s ease; }
      .pd-bar { transition: background .12s ease; }
      @keyframes pdRise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
      @keyframes pdToast { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
      .pd-scroll::-webkit-scrollbar { width: 9px; }
      .pd-scroll::-webkit-scrollbar-thumb { background: ${c.lineStrong}; border-radius: 99px; border: 3px solid ${c.bg}; }
      input.pd-input { font-family: ${F.ui}; }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
    `}</style>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", background: c.sunken, borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map(([val, label]) => (
        <button key={val} onClick={() => onChange(val)} className="pd-btn"
          style={{ fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: F.ui,
            background: value === val ? c.surface : "transparent", color: value === val ? c.ink : c.muted, boxShadow: value === val ? "0 1px 2px rgba(28,33,27,.1)" : "none" }}>{label}</button>
      ))}
    </div>
  );
}

function Turn({ turn, active, speaker, view, fillers, pii, terms, onSeek, onItem }) {
  const isMod = speaker.role === "Moderator";
  return (
    <div className="pd-turn" style={{ display: "flex", gap: 18, padding: "12px 14px", marginBottom: 4, borderRadius: 12,
      background: active ? c.peridotTint + "99" : "transparent" }}>
      <button onClick={onSeek} className="pd-btn" title="Play from here"
        style={{ flexShrink: 0, width: 52, textAlign: "left", background: "none", border: "none", cursor: "pointer", paddingTop: 4 }}>
        <span style={{ fontFamily: F.mono, fontSize: 12, color: active ? c.peridotDeep : c.muted, fontWeight: 500 }}>{fmt(turn.start)}</span>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: isMod ? c.peridotDeep : c.ink }}>{speaker.label}</span>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: c.muted, textTransform: "uppercase", letterSpacing: 0.4, background: c.sunken, padding: "1px 6px", borderRadius: 4 }}>{speaker.role}</span>
        </div>
        <p style={{ fontFamily: F.read, fontSize: 17.5, lineHeight: 1.62, margin: 0, color: c.ink }}>
          {turn.segs.map((s, i) => <Segment key={i} s={s} view={view} fillers={fillers} pii={pii} terms={terms} onItem={onItem} />)}
        </p>
      </div>
    </div>
  );
}

function Segment({ s, view, fillers, pii, terms, onItem }) {
  const orig = view === "original";
  if (s.t === "txt") return <span>{s.v}</span>;

  if (s.t === "fill") {
    const removed = fillers[s.id];
    if (orig) return <span>{s.v}</span>;
    if (removed) return <span className="pd-seg" onClick={e => { e.stopPropagation(); onItem("fill", s.id, e.currentTarget.getBoundingClientRect()); }}
      style={{ color: c.fillerInk, textDecoration: "line-through", textDecorationThickness: 1, opacity: 0.55, padding: "0 1px" }}>{s.v}</span>;
    return <span className="pd-seg" onClick={e => { e.stopPropagation(); onItem("fill", s.id, e.currentTarget.getBoundingClientRect()); }} style={{ background: c.sunken }}>{s.v}</span>;
  }

  if (s.t === "pii") {
    const redacted = pii[s.id];
    if (orig) return <span style={{ borderBottom: `1.5px dotted ${c.amber}` }}>{s.v}</span>;
    return (
      <span className="pd-seg" onClick={e => { e.stopPropagation(); onItem("pii", s.id, e.currentTarget.getBoundingClientRect()); }}
        style={redacted
          ? { background: c.ink, color: c.ink, borderRadius: 4, padding: "1px 6px", letterSpacing: 1, userSelect: "none" }
          : { background: c.amberTint, color: c.amber, borderBottom: `1.5px solid ${c.amber}`, padding: "0 2px", fontWeight: 500 }}>
        {redacted ? `[${PII_LABEL[s.kind].toLowerCase()}]` : s.v}
      </span>
    );
  }

  if (s.t === "term") {
    const corrected = terms[s.id];
    if (orig) return <span style={{ color: c.amber, fontStyle: "italic" }}>{s.heard}</span>;
    return (
      <span className="pd-seg" onClick={e => { e.stopPropagation(); onItem("term", s.id, e.currentTarget.getBoundingClientRect()); }}
        style={corrected
          ? { color: c.blue, borderBottom: `1.5px dotted ${c.blue}`, fontWeight: 500 }
          : { color: c.amber, fontStyle: "italic", borderBottom: `1.5px dotted ${c.amber}` }}>
        {corrected ? s.term : s.heard}
      </span>
    );
  }
  return null;
}

function Popover({ pop, onClose, fillers, pii, terms, dict, setFillers, setPii, setTerms, setDict }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0, ready: false });
  useEffect(() => {
    const W = 280, r = pop.rect;
    let left = Math.max(14, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 14));
    let top = r.bottom + 8;
    const h = ref.current?.offsetHeight ?? 150;
    if (top + h > window.innerHeight - 90) top = r.top - h - 8;
    setPos({ left, top, ready: true });
  }, [pop]);

  const seg = TURNS.flatMap(t => t.segs).find(s => s.id === pop.id);
  let body = null;
  if (pop.kind === "fill") {
    const removed = fillers[pop.id];
    body = <PopBody color={c.fillerInk} icon={<Eraser size={14} />} tag="Filler word" title={`"${seg.v.trim().replace(/,$/, "")}"`}
      desc="Trimmed from the reading copy. The audio still has every word, so playback never changes."
      primary={{ label: removed ? "Keep in text" : "Remove again", onClick: () => { setFillers(s => ({ ...s, [pop.id]: !removed })); onClose(); } }}
      state={removed ? "Removed" : "Kept"} />;
  }
  if (pop.kind === "pii") {
    const redacted = pii[pop.id];
    body = <PopBody color={c.amber} icon={<ShieldAlert size={14} />} tag={PII_LABEL[seg.kind]} title={redacted ? "Hidden from analysis & exports" : seg.v}
      desc="Cleared from the transcript, the insights, and anything you share. The source recording keeps it, so you can still verify what was said."
      primary={{ label: redacted ? "Reveal in text" : "Redact this", onClick: () => { setPii(s => ({ ...s, [pop.id]: !redacted })); onClose(); }, danger: !redacted }}
      state={redacted ? "Redacted" : "Exposed"} stateColor={redacted ? c.peridot : c.amber} />;
  }
  if (pop.kind === "term") {
    const corrected = terms[pop.id], inDict = dict[seg.term];
    body = <PopBody color={c.blue} icon={<BookText size={14} />} tag="Transcription fix"
      title={<span><span style={{ color: c.amber, fontStyle: "italic" }}>{seg.heard}</span> <ChevronRight size={13} style={{ display: "inline", verticalAlign: -1 }} /> <b style={{ color: c.blue }}>{seg.term}</b></span>}
      desc="The transcriber misheard this. Add it to the dictionary so it corrects on its own everywhere from now on."
      primary={{ label: corrected ? "Undo correction" : "Apply correction", onClick: () => { setTerms(s => ({ ...s, [pop.id]: !corrected })); onClose(); } }}
      toggle={{ label: "Add to workspace dictionary", on: inDict, onClick: () => setDict(s => ({ ...s, [seg.term]: !s[seg.term] })) }}
      state={corrected ? "Corrected" : "Original"} />;
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
      <div ref={ref} onClick={e => e.stopPropagation()} style={{ position: "fixed", left: pos.left, top: pos.top, width: 280, zIndex: 41,
        background: c.surface, border: `1px solid ${c.lineStrong}`, borderRadius: 13, boxShadow: "0 12px 34px rgba(28,33,27,.16), 0 2px 6px rgba(28,33,27,.08)",
        opacity: pos.ready ? 1 : 0, animation: pos.ready ? "pdRise .14s ease both" : "none", overflow: "hidden" }}>{body}</div>
    </>
  );
}

function PopBody({ color, icon, tag, title, desc, primary, toggle, state, stateColor }) {
  return (
    <div style={{ padding: 15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <span style={{ color, display: "grid", placeItems: "center" }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5 }}>{tag}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10.5, fontWeight: 600, color: stateColor || c.muted, background: c.sunken, padding: "2px 7px", borderRadius: 99 }}>{state}</span>
      </div>
      <div style={{ fontFamily: F.read, fontSize: 18, marginBottom: 7, lineHeight: 1.3 }}>{title}</div>
      <p style={{ fontSize: 12.5, color: c.inkSoft, lineHeight: 1.55, margin: "0 0 13px" }}>{desc}</p>
      {toggle && (
        <button className="pd-btn" onClick={toggle.onClick}
          style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", background: toggle.on ? c.blueTint : c.sunken, border: `1px solid ${toggle.on ? c.blue + "55" : c.line}`, borderRadius: 9, padding: "9px 11px", cursor: "pointer", marginBottom: 9, fontFamily: F.ui }}>
          <Switch on={toggle.on} color={c.blue} />
          <span style={{ fontSize: 12.5, fontWeight: 500, color: c.ink, textAlign: "left" }}>{toggle.label}</span>
        </button>
      )}
      <button className="pd-btn" onClick={primary.onClick}
        style={{ width: "100%", background: primary.danger ? c.amberTint : c.ink, color: primary.danger ? c.amber : "#fff", border: primary.danger ? `1px solid ${c.amber}55` : "none", borderRadius: 9, padding: "9px 12px", fontFamily: F.ui, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
        {primary.label}
      </button>
    </div>
  );
}

function RailHead({ icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13, color: c.inkSoft }}>
      <span style={{ color: c.muted, display: "grid", placeItems: "center" }}>{icon}</span>
      <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{children}</span>
    </div>
  );
}

function SpeakerRow({ id, sp, editing, onEdit, onSave, onCancel }) {
  const [label, setLabel] = useState(sp.label);
  const [role, setRole] = useState(sp.role);
  useEffect(() => { setLabel(sp.label); setRole(sp.role); }, [sp, editing]);
  const isMod = sp.role === "Moderator";
  if (editing) {
    return (
      <div style={{ border: `1px solid ${c.peridot}66`, borderRadius: 10, padding: 11, marginBottom: 8, background: c.peridotTint + "55" }}>
        <input className="pd-input" autoFocus value={label} onChange={e => setLabel(e.target.value)}
          style={{ width: "100%", border: `1px solid ${c.lineStrong}`, borderRadius: 7, padding: "7px 9px", fontSize: 13, marginBottom: 7, outline: "none", color: c.ink }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
          {["Moderator", "Participant"].map(r => (
            <button key={r} className="pd-btn" onClick={() => setRole(r)}
              style={{ flex: 1, fontSize: 11.5, fontWeight: 600, padding: "6px 4px", borderRadius: 7, cursor: "pointer", border: `1px solid ${role === r ? c.peridot : c.line}`, background: role === r ? c.peridot : c.surface, color: role === r ? "#fff" : c.inkSoft }}>{r}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="pd-btn" onClick={() => onSave(label, role)} style={{ flex: 1, background: c.ink, color: "#fff", border: "none", borderRadius: 7, padding: "7px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F.ui }}>Save</button>
          <button className="pd-btn" onClick={onCancel} style={{ background: "none", border: `1px solid ${c.line}`, borderRadius: 7, padding: "7px 10px", fontSize: 12, color: c.muted, cursor: "pointer", fontFamily: F.ui }}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <button onClick={onEdit} className="pd-btn"
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: c.surface, border: `1px solid ${c.line}`, borderRadius: 10, padding: "9px 11px", marginBottom: 8, cursor: "pointer", fontFamily: F.ui }}
      onMouseEnter={e => e.currentTarget.style.borderColor = c.lineStrong}
      onMouseLeave={e => e.currentTarget.style.borderColor = c.line}>
      <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: isMod ? c.peridotDeep : c.inkSoft, background: isMod ? c.peridotTint : c.sunken }}>
        {sp.label.split(" ").map(w => w[0]).join("").slice(0, 2)}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: c.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sp.label}</span>
        <span style={{ display: "block", fontSize: 11, color: c.muted }}>{sp.role}</span>
      </span>
      <span style={{ fontSize: 11, color: c.peridot, fontWeight: 600 }}>Edit</span>
    </button>
  );
}

function SummaryRow({ color, icon, title, detail, action, onAction, flag }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10, background: c.surface, border: `1px solid ${c.line}` }}>
      <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", color, background: color + "18" }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600 }}>{title}</span>
        <span style={{ display: "block", fontSize: 11, color: flag ? c.amber : c.muted, fontWeight: flag ? 600 : 400 }}>{flag || detail}</span>
      </span>
      {action && <button className="pd-btn" onClick={onAction} style={{ fontSize: 11, fontWeight: 600, color: c.inkSoft, background: c.sunken, border: "none", borderRadius: 6, padding: "5px 9px", cursor: "pointer", fontFamily: F.ui, whiteSpace: "nowrap" }}>{action}</button>}
    </div>
  );
}

function DictRow({ d, on, toggle }) {
  return (
    <button onClick={toggle} className="pd-btn"
      style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 9, cursor: "pointer", fontFamily: F.ui, background: on ? c.surface : c.sunken, border: `1px solid ${c.line}`, opacity: on ? 1 : 0.65 }}>
      <Switch on={on} color={c.blue} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: c.ink }}>{d.term}</span>
        <span style={{ display: "block", fontSize: 11, color: c.muted, fontFamily: F.mono }}>heard "{d.heard}"</span>
      </span>
    </button>
  );
}

function SourceVideo({ playing, t, toggle, name }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mode, setMode] = useState("source");
  const share = mode === "shareable";

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)} className="pd-btn"
        style={{ position: "fixed", right: 24, bottom: 94, zIndex: 30, display: "flex", alignItems: "center", gap: 9, background: c.ink, color: "#fff", border: "none", borderRadius: 99, padding: "8px 15px 8px 9px", cursor: "pointer", fontFamily: F.ui, fontWeight: 600, fontSize: 12.5, boxShadow: "0 8px 22px rgba(28,33,27,.28)" }}>
        <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: 99, background: c.peridot }}>
          {playing ? <Pause size={11} fill="#fff" color="#fff" /> : <Play size={11} fill="#fff" color="#fff" style={{ marginLeft: 1 }} />}
        </span>
        Source video <span style={{ fontFamily: F.mono, color: c.peridotGlow, fontWeight: 500 }}>{fmt(t)}</span>
      </button>
    );
  }
  return (
    <div style={{ position: "fixed", right: 24, bottom: 94, zIndex: 30, width: 300, background: c.surface, borderRadius: 14, border: `1px solid ${c.lineStrong}`, boxShadow: "0 14px 38px rgba(28,33,27,.22)", overflow: "hidden", animation: "pdRise .16s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 8px 9px 12px", borderBottom: `1px solid ${c.line}` }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: "#D5483B" }} />
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.2 }}>Source recording</span>
        <span style={{ fontSize: 10.5, color: c.muted, fontFamily: F.mono }}>interview.mp4</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setCollapsed(true)} className="pd-btn" title="Minimize" style={{ background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 3, display: "grid", placeItems: "center", borderRadius: 6 }}>
          <ChevronDown size={16} />
        </button>
      </div>
      <div style={{ padding: "10px 11px 0" }}>
        <div style={{ display: "flex", background: c.sunken, borderRadius: 8, padding: 3, gap: 2 }}>
          {[["source", "What you see"], ["shareable", "Shareable export"]].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v)} className="pd-btn"
              style={{ flex: 1, fontSize: 11.5, fontWeight: 600, padding: "5px 4px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: F.ui, background: mode === v ? c.surface : "transparent", color: mode === v ? c.ink : c.muted, boxShadow: mode === v ? "0 1px 2px rgba(28,33,27,.1)" : "none" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: 11 }}>
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "16 / 9", background: "#1a1a1d" }}>
          <VideoScene share={share} name={name} />
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 5, background: share ? "rgba(220,38,38,.94)" : "rgba(26,26,28,.72)", color: "#fff", borderRadius: 6, padding: "3px 7px", fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>
            {share ? <><Eraser size={10} /> Redacted for sharing</> : <><ShieldCheck size={10} /> Untouched source</>}
          </div>
          <div style={{ position: "absolute", bottom: 8, right: 8, fontFamily: F.mono, fontSize: 11, color: "#fff", background: "rgba(28,33,27,.6)", padding: "2px 6px", borderRadius: 5 }}>{fmt(t)}</div>
          <button onClick={toggle} title={playing ? "Pause" : "Play"} style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "transparent", border: "none", cursor: "pointer" }}>
            {!playing && <span style={{ width: 44, height: 44, borderRadius: 99, background: "rgba(255,255,255,.94)", display: "grid", placeItems: "center", boxShadow: "0 4px 14px rgba(0,0,0,.32)" }}><Play size={18} fill={c.ink} color={c.ink} style={{ marginLeft: 2 }} /></span>}
          </button>
        </div>
      </div>
      <div style={{ padding: "0 13px 13px", display: "flex", alignItems: "flex-start", gap: 7 }}>
        <span style={{ color: share ? c.amber : c.peridot, marginTop: 1, flexShrink: 0, display: "grid", placeItems: "center" }}>{share ? <Eraser size={13} /> : <Lock size={13} />}</span>
        <p style={{ fontSize: 11.5, color: c.inkSoft, lineHeight: 1.5, margin: 0 }}>
          {share ? "Faces blurred, names dropped. This is the copy teammates and exports get."
            : "The original, faces and voices intact. Only people you give access can open it."}
        </p>
      </div>
    </div>
  );
}

function VideoScene({ share, name }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id="vbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a40" /><stop offset="1" stopColor="#191919" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill="url(#vbg)" />
      <rect x="16" y="16" width="74" height="128" rx="6" fill="#ffffff" opacity="0.05" />
      <circle cx="262" cy="34" r="58" fill="#ffffff" opacity="0.045" />
      <g style={{ filter: share ? "blur(7px)" : "none" }}>
        <path d="M64 180 q96 -66 192 0 Z" fill="#6b7689" />
        <path d="M78 180 q82 -52 164 0 Z" fill="#7e899d" />
        <rect x="148" y="98" width="24" height="24" rx="9" fill="#c79f88" />
        <circle cx="160" cy="76" r="35" fill="#d9b094" />
        <path d="M125 72 q3 -43 35 -43 q32 0 35 43 q-9 -19 -35 -19 q-26 0 -35 19Z" fill="#3c2e26" />
        <ellipse cx="149" cy="74" rx="2.6" ry="3.3" fill="#3c2e26" />
        <ellipse cx="171" cy="74" rx="2.6" ry="3.3" fill="#3c2e26" />
        <path d="M151 88 q9 6 18 0" stroke="#b07d62" strokeWidth="2.3" fill="none" strokeLinecap="round" />
      </g>
      <g>
        <rect x="14" y="146" width="196" height="26" rx="6" fill="rgba(8,10,14,0.6)" />
        {share ? (
          <>
            <rect x="22" y="153" width="74" height="11" rx="3" fill="#aeb6c2" />
            <rect x="102" y="155" width="40" height="7" rx="3" fill="#7f8895" />
          </>
        ) : (
          <>
            <text x="22" y="160" fill="#fff" fontSize="13" fontWeight="700" style={{ fontFamily: F.ui }}>{name}</text>
            <text x="22" y="170" fill="#c2c8d2" fontSize="8.5" fontWeight="500" style={{ fontFamily: F.ui, letterSpacing: 0.3 }}>VP OF PRODUCT · CLEARWATER</text>
          </>
        )}
      </g>
    </svg>
  );
}

function AudioBar({ playing, toggle, t, onScrub }) {
  const ref = useRef(null);
  const scrub = (e) => {
    const r = ref.current.getBoundingClientRect();
    onScrub(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * DURATION);
  };
  const prog = t / DURATION;
  return (
    <footer style={{ height: 78, flexShrink: 0, borderTop: `1px solid ${c.line}`, background: c.surface, display: "flex", alignItems: "center", gap: 18, padding: "0 24px" }}>
      <button onClick={toggle} className="pd-btn" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 999, border: "none", background: c.ink, color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}>
        {playing ? <Pause size={17} fill="#fff" /> : <Play size={17} fill="#fff" style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
        <div ref={ref} onClick={scrub} style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 34, cursor: "pointer" }}>
          {WAVE.map((h, i) => {
            const played = i / WAVE.length <= prog;
            return <div key={i} className="pd-bar" style={{ flex: 1, height: `${h * 100}%`, minWidth: 2, borderRadius: 2, background: played ? c.peridot : c.lineStrong }} />;
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: 11, color: c.muted }}>
          <span style={{ color: c.peridotDeep, fontWeight: 500 }}>{fmt(t)}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: c.peridot, display: "inline-block" }} />
            source recording — the ground truth behind every citation
          </span>
          <span>{fmt(DURATION)}</span>
        </div>
      </div>
    </footer>
  );
}

function Sent({ counts, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(28,33,27,.34)", display: "grid", placeItems: "center", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 380, background: c.surface, borderRadius: 18, padding: 28, textAlign: "center", boxShadow: "0 24px 60px rgba(28,33,27,.3)", animation: "pdToast .2s ease both" }}>
        <div style={{ width: 50, height: 50, borderRadius: 999, background: c.peridotTint, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
          <Check size={24} color={c.peridotDeep} strokeWidth={2.6} />
        </div>
        <h2 style={{ fontFamily: F.read, fontSize: 23, fontWeight: 500, margin: "0 0 7px" }}>Transcript is clean</h2>
        <p style={{ fontSize: 13.5, color: c.inkSoft, lineHeight: 1.55, margin: "0 0 20px" }}>
          Redactions cover the transcript, the insights, and anything you export, while the source recording stays whole so every quote traces back to what was really said.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
          {[[`${counts.fill}`, "fillers trimmed"], [`${counts.pii}`, "items redacted"], [`${counts.term}`, "fixes applied"]].map(([n, l]) => (
            <div key={l} style={{ flex: 1, background: c.sunken, borderRadius: 11, padding: "12px 6px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 500, color: c.peridotDeep }}>{n}</div>
              <div style={{ fontSize: 10.5, color: c.muted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="pd-btn" style={{ width: "100%", background: c.ink, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontFamily: F.ui, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
          Back to transcript
        </button>
      </div>
    </div>
  );
}

function Switch({ on, color }) {
  return (
    <span style={{ width: 30, height: 18, borderRadius: 99, flexShrink: 0, background: on ? color : c.lineStrong, position: "relative", transition: "background .15s ease" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 14 : 2, width: 14, height: 14, borderRadius: 99, background: "#fff", transition: "left .15s ease", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
    </span>
  );
}
