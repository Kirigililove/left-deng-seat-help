import type { ReactNode } from 'react';

export function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return <section className="panel"><div className="head"><div><h3>{title}</h3>{hint ? <span>{hint}</span> : null}</div></div><div className="body">{children}</div></section>;
}

export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void }) {
  return <div className="tabs">{options.map((item) => <button key={item.value} className={value === item.value ? 'active' : ''} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty"><h3>{title}</h3><p>{text}</p></div>;
}
