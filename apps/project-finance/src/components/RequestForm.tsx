import { useEffect, useRef, useState } from "react";
import type { ExceptionRow, Project } from "../types";
import { requestType } from "../requests";
import { formFields, prefill, type FormField } from "../requestForms";

/** Portfolio options come from the loaded snapshot (App calls setPortfolios when a viewer's data arrives). */
let PORTFOLIOS: string[] = [];
export const setPortfolios = (projects: Project[]) => { PORTFOLIOS = [...new Set(projects.map((p) => p.portfolio))].sort(); };

let seq = 0;

/**
 * A CTA's request button. It opens a mock of the request desk's form for that request type, filled in the way the
 * real platform filled it (project, portfolio, the check and its numbers in the description). Submitting validates
 * the required fields and shows a reference; nothing leaves the browser.
 */
export function RequestButton({ typeId, text, compact, project, exception }:
  { typeId: string; text?: string; compact?: boolean; project?: Project; exception?: ExceptionRow }) {
  const rt = requestType(typeId);
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const body = text ?? `Request type: ${rt.name}\n${rt.what}`;
  return (
    <>
      <button type="button" className={"req-btn" + (compact ? " compact" : "")}
        title={`Opens a "${rt.name}" request${text ? ", filled in with this project's details" : ""}`}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3 2.5h7l3 3v8H3z M5.5 8h5M5.5 10.5h5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
        <span>{compact ? "Raise request" : `Raise: ${rt.name}`}</span>
      </button>
      {open && <RequestDialog dialogRef={ref} typeId={typeId} body={body} project={project} exception={exception} onClose={() => setOpen(false)} />}
    </>
  );
}

function RequestDialog({ dialogRef, typeId, body, project, exception, onClose }:
  { dialogRef: React.RefObject<HTMLDialogElement>; typeId: string; body: string; project?: Project; exception?: ExceptionRow; onClose: () => void }) {
  const rt = requestType(typeId);
  const fields = formFields(typeId, PORTFOLIOS.length ? PORTFOLIOS : project ? [project.portfolio] : []);
  const filled = prefill(typeId, body, project, exception);
  const [values, setValues] = useState<Record<string, string>>(filled);
  const [missing, setMissing] = useState<string[]>([]);
  const [ref, setRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
    const close = () => onClose();
    d?.addEventListener("close", close);
    return () => d?.removeEventListener("close", close);
  }, [dialogRef, onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const miss = fields.filter((f) => f.required && f.kind !== "file" && !values[f.id]?.trim()).map((f) => f.label);
    setMissing(miss);
    if (!miss.length) setRef(`REQ-DEMO-${String(++seq).padStart(4, "0")}`);
  };

  return (
    <dialog ref={dialogRef} className="req-dialog" aria-labelledby="req-title" onClick={(e) => e.stopPropagation()}>
      <form method="dialog" className="req-form" onSubmit={submit} noValidate>
        <header className="req-head">
          <div>
            <p className="eyebrow">Request desk · mock form</p>
            <h2 id="req-title">{rt.name}</h2>
            <p className="desc">{rt.what}</p>
          </div>
          <button type="button" className="linkbtn" onClick={() => dialogRef.current?.close()} aria-label="Close">Close</button>
        </header>

        {ref ? (
          <div className="req-done" role="status">
            <p><strong>Request {ref} recorded in this mock.</strong> Nothing was sent: in the real platform this was the desk&apos;s own form,
              so the team got the project, the check and the numbers without retyping them.</p>
            <button type="button" className="req-btn" onClick={() => dialogRef.current?.close()}>Done</button>
          </div>
        ) : (
          <>
            <p className="muted small">Fields marked * are required. The platform filled the highlighted ones; the rest are left for you, as in the real form.</p>
            {fields.map((f) => <Field key={f.id} f={f} value={values[f.id] ?? ""} auto={f.id in filled}
              onChange={(v) => setValues((s) => ({ ...s, [f.id]: v }))} invalid={missing.includes(f.label)} />)}
            {missing.length > 0 && <p className="neg small" role="alert">Fill in: {missing.join(", ")}.</p>}
            <div className="req-actions">
              <button type="submit" className="req-btn primary">Submit request</button>
              <button type="button" className="req-btn" onClick={() => {
                navigator.clipboard?.writeText(values.description ?? body).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }).catch(() => undefined);
              }}><span aria-live="polite">{copied ? "Copied" : "Copy description"}</span></button>
            </div>
          </>
        )}
      </form>
    </dialog>
  );
}

function Field({ f, value, auto, invalid, onChange }: { f: FormField; value: string; auto: boolean; invalid: boolean; onChange: (v: string) => void }) {
  const id = `req-${f.id}`;
  const common = { id, "aria-invalid": invalid || undefined, className: "req-input" + (auto ? " auto" : "") };
  return (
    <div className="req-field">
      <label htmlFor={id}>{f.label}{f.required ? " *" : ""}{auto && <span className="req-auto">filled by the platform</span>}</label>
      {f.kind === "textarea" ? <textarea {...common} rows={7} value={value} onChange={(e) => onChange(e.target.value)} />
        : f.kind === "select" ? (
          <select {...common} value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">Choose…</option>
            {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : f.kind === "file" ? <input {...common} type="file" disabled title="Attachments are disabled in the mock" />
        : <input {...common} type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text"} value={value} onChange={(e) => onChange(e.target.value)} />}
      {f.hint && <p className="muted small">{f.hint}</p>}
    </div>
  );
}
