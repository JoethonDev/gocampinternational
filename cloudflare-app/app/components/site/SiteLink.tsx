import { Link } from "react-router";

export function SiteLink({
  to,
  className,
  children
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (!to) return null;
  if (/^https:\/\//i.test(to)) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  if (/^(?:mailto:|tel:)/i.test(to)) {
    return (
      <a href={to} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}
