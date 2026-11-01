import "./flag-icon.css";
import type { ReactNode } from "react";

const FLAGS: Record<string, ReactNode> = {
  CH: (
    <>
      <rect width="24" height="24" fill="#d52b1e" />
      <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="#fff" />
    </>
  ),
  DE: (
    <>
      <rect width="24" height="8" fill="#111" />
      <rect y="8" width="24" height="8" fill="#dd0000" />
      <rect y="16" width="24" height="8" fill="#ffce00" />
    </>
  ),
  IT: (
    <>
      <rect width="8" height="24" fill="#009246" />
      <rect x="8" width="8" height="24" fill="#fff" />
      <rect x="16" width="8" height="24" fill="#ce2b37" />
    </>
  ),
  GB: (
    <>
      <rect width="24" height="24" fill="#012169" />
      <path d="m0 0 24 24M24 0 0 24" stroke="#fff" strokeWidth="5" />
      <path d="m0 0 24 24M24 0 0 24" stroke="#c8102e" strokeWidth="2" />
      <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="7" />
      <path d="M12 0v24M0 12h24" stroke="#c8102e" strokeWidth="4" />
    </>
  )
};

const FLAG_NAMES: Record<string, string> = {
  CH: "Switzerland",
  DE: "Germany",
  IT: "Italy",
  GB: "United Kingdom"
};

export function flagCode(value: string) {
  const points = Array.from(value.trim());
  if (
    points.length === 2 &&
    points.every((point) => point.codePointAt(0)! >= 0x1f1e6 && point.codePointAt(0)! <= 0x1f1ff)
  ) {
    return points
      .map((point) => String.fromCharCode(point.codePointAt(0)! - 0x1f1e6 + 65))
      .join("");
  }
  return /^[a-z]{2}$/i.test(value.trim()) ? value.trim().toUpperCase() : "";
}

export function FlagIcon({ value }: { value: string }) {
  const code = flagCode(value);
  if (code && FLAGS[code]) {
    return (
      <span className="gc-flag" role="img" aria-label={`${FLAG_NAMES[code] || code} flag`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {FLAGS[code]}
        </svg>
      </span>
    );
  }
  return value ? (
    <span className="gc-flag gc-flag-fallback" aria-hidden="true">
      {value}
    </span>
  ) : null;
}
