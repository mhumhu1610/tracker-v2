import { useEffect, useRef, useState } from "react";
import { formatPercent, parsePercentInput } from "../utils/capacity";

interface EditableCellProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  className?: string;
  align?: "left" | "center" | "right";
}

export function EditableCell({
  value,
  onChange,
  readOnly = false,
  className = "",
  align = "center",
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const alignClass =
    align === "left"
      ? "text-left"
      : align === "right"
        ? "text-right"
        : "text-center";

  if (readOnly) {
    return (
      <span
        className={`block px-2 py-1.5 text-sm font-medium text-accent-blue tabular-nums ${alignClass} ${className}`}
      >
        {formatPercent(value)}
      </span>
    );
  }

  const commit = () => {
    onChange(parsePercentInput(draft));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={`w-full rounded border border-accent-blue/40 bg-white px-2 py-1 text-center text-sm text-accent-blue outline-none ring-2 ring-accent-blue/20 ${className}`}
        aria-label="Allocation percentage"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value > 0 ? String(value) : "");
        setEditing(true);
      }}
      className={`w-full px-2 py-1.5 text-sm font-medium text-accent-blue tabular-nums transition-colors hover:bg-white/60 ${alignClass} ${className} ${value === 0 ? "text-slate-300 hover:text-accent-blue" : ""}`}
    >
      {formatPercent(value)}
    </button>
  );
}
