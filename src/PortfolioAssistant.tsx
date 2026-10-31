import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Bot, LoaderCircle, MessageCircle, X } from "lucide-react";
import { profile } from "./data";

type Message = { role: "assistant" | "user"; text: string };
const suggestions = [
  "Tell me about your projects",
  "What technologies do you use?",
  "What are you studying?"
];

export default function PortfolioAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    text: `Hi! I can answer questions using the published portfolio information about ${profile.shortName}, projects, skills, education, and certifications.`
  }]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, pending]);

  const send = async (event?: FormEvent, suggested?: string) => {
    event?.preventDefault();
    const text = (suggested || question).trim();
    if (text.length < 2 || text.length > 500 || pending) return;
    setMessages(items => [...items, { role: "user", text }]);
    setQuestion("");
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The assistant could not answer right now.");
      if (typeof result.answer !== "string" || !result.answer.trim()) throw new Error("The assistant returned an empty answer. Please try again.");
      setMessages(items => [...items, { role: "assistant", text: result.answer }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The assistant could not answer right now.");
    } finally { setPending(false); }
  };

  return <>
    <button className={`assistant-launcher ${open ? "is-open" : ""}`} onClick={() => setOpen(value => !value)} aria-label={open ? "Close portfolio assistant" : "Ask the portfolio assistant"} aria-expanded={open}>
      {open ? <X size={20}/> : <MessageCircle size={20}/>}
    </button>
    {open && <section className="assistant-panel" role="dialog" aria-modal="false" aria-labelledby="assistant-title">
      <header className="assistant-header"><span className="assistant-avatar"><Bot size={19}/></span><div><h2 id="assistant-title">Portfolio assistant</h2><p>Answers from published portfolio content</p></div><button onClick={() => setOpen(false)} aria-label="Close assistant"><X size={17}/></button></header>
      <div className="assistant-messages" ref={listRef} aria-live="polite">
        {messages.map((message, index) => <div key={index} className={`assistant-message message-${message.role}`}><span>{message.text}</span></div>)}
        {pending && <div className="assistant-pending" role="status"><LoaderCircle size={15}/> Thinking…</div>}
        {error && <p className="assistant-error" role="alert">{error}</p>}
        {messages.length === 1 && <div className="assistant-suggestions">{suggestions.map(item => <button key={item} onClick={() => send(undefined, item)} disabled={pending}>{item}</button>)}</div>}
      </div>
      <form className="assistant-form" onSubmit={send}><label className="sr-only" htmlFor="assistant-question">Ask about this portfolio</label><input id="assistant-question" ref={inputRef} value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask about projects, skills…" maxLength={500} disabled={pending}/><button type="submit" disabled={pending || question.trim().length < 2} aria-label="Send question"><ArrowUp size={17}/></button></form>
      <p className="assistant-disclaimer">No experience details are listed. Answers may be inaccurate; verify important details.</p>
    </section>}
  </>;
}
