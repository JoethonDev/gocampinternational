import { Link } from "react-router";

export function DashboardHero({
  username,
  newInquiries,
  catalogRecords,
  destinations
}: {
  username: string;
  newInquiries: number;
  catalogRecords: number;
  destinations: number;
}) {
  return (
    <section className="admin-hero">
      <div>
        <p className="admin-hero-eyebrow">GoCamp CMS</p>
        <h2 className="admin-hero-title">Good to see you, {username}.</h2>
        <p className="admin-hero-copy">
          You have{" "}
          <strong>
            {newInquiries} new {newInquiries === 1 ? "inquiry" : "inquiries"}
          </strong>{" "}
          and <strong>{catalogRecords} catalog records</strong> across {destinations} destinations.
        </p>
      </div>
      <div className="admin-hero-actions">
        <Link className="btn btn-light" to="/admin/catalog/program/new">
          <i className="bi bi-plus-lg me-1" /> Create program
        </Link>
        <Link className="btn btn-outline-light" to="/admin/inquiries">
          Review inbox <i className="bi bi-arrow-right ms-1" />
        </Link>
      </div>
    </section>
  );
}
