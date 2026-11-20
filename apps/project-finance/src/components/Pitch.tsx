import { useEffect, useRef, useState } from "react";
import { SLIDES, type Slide, type Stat } from "../pitch";

/**
 * The pitch deck as a slide viewer, like presenting in PowerPoint: one centred slide, arrows and keys to move,
 * thumbnails to jump, full screen to present. Same content and layout as the PowerPoint download (pitchDeck.ts).
 */
export function PitchView() {
  const [busy, setBusy] = useState(false);
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const last = SLIDES.length - 1;
  const go = (n: number) => setI(Math.max(0, Math.min(last, n)));

  const download = async () => {
    setBusy(true);
    try { await (await import("../pitchDeck")).buildPitch(); } finally { setBusy(false); }
  };
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
    else stage.current?.requestFullscreen?.().catch(() => undefined);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, select, textarea")) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); setI((x) => Math.min(last, x + 1)); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(last);
      else if (e.key.toLowerCase() === "f") toggleFull();
    };
    const fs = () => setFull(document.fullscreenElement === stage.current);
    window.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", fs);
    return () => { window.removeEventListener("keydown", key); document.removeEventListener("fullscreenchange", fs); };
  }, [last]);
  useEffect(() => {
    // Centre the active thumbnail inside the strip only; scrollIntoView would also scroll the page.
    const strip = thumbs.current, t = strip?.querySelector<HTMLElement>(`[data-n="${i}"]`);
    if (strip && t) strip.scrollTo({ left: t.offsetLeft - strip.clientWidth / 2 + t.clientWidth / 2, behavior: "smooth" });
  }, [i]);

  return (
    <>
      <div className={"viewer" + (full ? " is-full" : "")} ref={stage}>
        <div className="viewer-stage" aria-live="polite" aria-roledescription="slide viewer">
          <button className="viewer-nav prev" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous slide">
            <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          </button>
          <div className="viewer-slide" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); go(e.clientX - r.left > r.width / 2 ? i + 1 : i - 1); }}>
            <SlideView s={SLIDES[i]} n={i + 1} />
          </div>
          <button className="viewer-nav next" onClick={() => go(i + 1)} disabled={i === last} aria-label="Next slide">
            <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          </button>
        </div>
        <div className="viewer-bar">
          <span className="viewer-count">{i + 1} / {SLIDES.length}</span>
          <div className="viewer-progress" aria-hidden="true"><span style={{ width: `${((i + 1) / SLIDES.length) * 100}%` }} /></div>
          <button className="btn ghost" onClick={toggleFull} title="Or press F">{full ? "Exit full screen" : "Full screen"}</button>
          {!full && <>
            <button className="btn ghost" onClick={() => window.print()} title="Every slide, one per page">Print or PDF</button>
            <button className="btn primary" onClick={download} disabled={busy} title="Same slides, editable">{busy ? "Preparing…" : "Download PowerPoint"}</button>
          </>}
        </div>
        {!full && <p className="viewer-hint">Arrow keys or click either half of the slide to move · F for full screen · No figures from the real engagement</p>}
        {!full && (
          <div className="viewer-thumbs" ref={thumbs} role="tablist" aria-label="Slides">
            {SLIDES.map((s, k) => (
              <button key={k} data-n={k} role="tab" aria-selected={k === i} aria-label={`Slide ${k + 1}`} className="thumb" onClick={() => setI(k)}>
                <span className="thumb-n">{k + 1}</span>
                <span className="thumb-frame"><SlideView s={s} n={k + 1} /></span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="deck print-only">
        {SLIDES.map((s, k) => <SlideView key={k} s={s} n={k + 1} />)}
      </div>
    </>
  );
}

function Band({ stats, dark }: { stats: Stat[]; dark?: boolean }) {
  return (
    <div className={"sl-band" + (dark ? " on-dark" : "")}>
      {stats.map((s) => <div key={s.label}><span className="sl-big">{s.value}</span><span>{s.label}</span></div>)}
    </div>
  );
}

function Head({ s }: { s: Exclude<Slide, { kind: "title" }> }) {
  return (<><p className="sl-eyebrow">{s.eyebrow}</p><h3 className="sl-title">{s.title}</h3></>);
}

function SlideView({ s, n }: { s: Slide; n: number }) {
  if (s.kind === "title") {
    return (
      <section className="slide dark" aria-label={`Slide ${n}`}>
        <p className="sl-brand-dark">Project Finance Checks</p>
        <p className="sl-eyebrow light">{s.eyebrow}</p>
        <h3 className="sl-title big">{s.title}</h3>
        <p className="sl-lede light">{s.lede}</p>
        <Band stats={s.stats} dark />
      </section>
    );
  }
  return (
    <section className={"slide k-" + s.kind} aria-label={`Slide ${n}`}>
      <Head s={s} />
      {s.kind === "stats" ? (
        <div className="sl-split">
          <p className="sl-lede">{s.lede}</p>
          <div className="sl-stats">{s.stats.map((x) => <div key={x.label}><span className="sl-big">{x.value}</span><span>{x.label}</span></div>)}</div>
        </div>
      ) : <p className="sl-lede">{s.lede}</p>}
      {s.kind === "flow" && (
        <div className="sl-cols">
          {s.columns.map((c) => (
            <div key={c.n}>
              <p className="sl-colhead"><span>{c.n}</span>{c.head}</p>
              {c.items.map((it) => <div key={it.title} className="sl-item"><strong>{it.title}</strong><span>{it.text}</span></div>)}
            </div>
          ))}
        </div>
      )}
      {s.kind === "cards" && (
        <div className="sl-cards">{s.cards.map((c) => (
          <div key={c.title}><span className="sl-tag">{c.tag}</span><strong>{c.title}</strong><span>{c.text}</span></div>
        ))}</div>
      )}
      {s.kind === "chain" && (
        <ol className="sl-chain">{s.steps.map((st) => (
          <li key={st.title}>
            <span className="sl-chain-icons"><b className="sl-glyph">{st.glyph}</b></span>
            <span className="sl-tag">{st.tag}</span><strong>{st.title}</strong><span>{st.text}</span>
            {st.detail && <span className="sl-chain-detail">{st.detail.map((d) => <i key={d}>{d}</i>)}</span>}
          </li>
        ))}</ol>
      )}
      {s.kind === "rows" && (
        <div className="sl-rows">{s.rows.map((r) => (
          <div key={r.label}><i className={"sl-dot " + r.tone} /><strong>{r.label}</strong><span className="sl-big">{r.value}</span><span>{r.text}</span></div>
        ))}</div>
      )}
      {s.kind === "steps" && (
        <ol className="sl-steps">{s.steps.map((st) => (
          <li key={st.title} className={st.done ? "done" : ""}><i /><span className="sl-tag">{st.when}</span><strong>{st.title}</strong><span>{st.text}</span></li>
        ))}</ol>
      )}
      {s.kind === "close" && (
        <>
          <div className="sl-asks">{s.asks.map((a, i) => <div key={a.title}><span className="sl-tag">{String(i + 1).padStart(2, "0")}</span><strong>{a.title}</strong><span>{a.text}</span></div>)}</div>
          <Band stats={s.stats} />
        </>
      )}
      {"note" in s && s.note && <p className="sl-note">{s.note}</p>}
      <p className="sl-foot"><span>Project Finance Checks · synthetic data</span><span>{n}</span></p>
    </section>
  );
}
