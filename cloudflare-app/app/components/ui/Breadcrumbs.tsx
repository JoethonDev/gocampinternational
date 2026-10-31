import { Link } from "react-router";

export type BreadcrumbItem = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb">
        {items.map((item) => (
          <li
            key={item.label}
            className={"breadcrumb-item" + (item.to ? "" : " active")}
            aria-current={item.to ? undefined : "page"}
          >
            {item.to ? <Link to={item.to}>{item.label}</Link> : item.label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
