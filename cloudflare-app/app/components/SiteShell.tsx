import { Link } from "react-router";
import type { CatalogRecord } from "../lib/catalog.server";
export function SiteHeader({categories,destinations}:{categories:CatalogRecord[];destinations:CatalogRecord[]}) {
  return <nav className="navbar navbar-expand-xl navbar-dark fixed-top" style={{backgroundColor:"var(--brand-primary)"}} aria-label="Main navigation">
    <div className="container">
      <Link className="navbar-brand" to="/"><img src="/images/logo.webp" alt="Go Camp International Logo" style={{height:60}} /></Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation"><span className="navbar-toggler-icon"/></button>
      <div className="collapse navbar-collapse" id="mainNavbar">
        <ul className="navbar-nav ms-auto mb-2 mb-xl-0 align-items-xl-center">
          <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/about">About Us</Link></li>
          <li className="nav-item dropdown">
            <button className="nav-link dropdown-toggle btn btn-link" id="programsDropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">Programs</button>
            <ul className="dropdown-menu" aria-labelledby="programsDropdown">{categories.map(c=><li key={c.slug}><Link className="dropdown-item" to={"/program/category?category="+encodeURIComponent(c.slug)}>{c.name}</Link></li>)}</ul>
          </li>
          <li className="nav-item dropdown">
            <button className="nav-link dropdown-toggle btn btn-link" id="destinationsDropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">Destinations</button>
            <ul className="dropdown-menu" aria-labelledby="destinationsDropdown">{destinations.map(d=><li key={d.slug}><Link className="dropdown-item" to={"/destinations/"+encodeURIComponent(d.slug)}>{d.name}</Link></li>)}</ul>
          </li>
          <li className="nav-item"><Link className="nav-link" to="/faq">FAQ</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/contact">Contact</Link></li>
        </ul>
        <Link className="btn btn-warning ms-xl-3" to="/contact">Book Now</Link>
      </div>
    </div>
  </nav>;
}
export function SiteFooter() {
  return <footer className="footer text-white pt-5 pb-4"><div className="container">
    <div className="row gy-4">
      <div className="col-lg-3 col-md-6"><h5 className="fw-bold text-uppercase mb-3">About</h5><ul className="list-unstyled"><li className="mb-2"><Link to="/">Home</Link></li><li className="mb-2"><Link to="/about">About Us</Link></li><li className="mb-2"><Link to="/faq">F.A.Q</Link></li><li><Link to="/contact">Contact Us</Link></li></ul></div>
      <div className="col-lg-3 col-md-6"><h5 className="fw-bold text-uppercase mb-3">Programs</h5><ul className="list-unstyled"><li><Link to="/program/category?category=kids-camps">Language & Activity</Link></li><li><Link to="/program/category?category=adult-academic">Adult Academic</Link></li><li><Link to="/program/category?category=young-leader-program">Young Leader</Link></li><li><Link to="/program/category?category=soccer-camps">Soccer Camps</Link></li></ul></div>
      <div className="col-lg-3 col-md-6"><h5 className="fw-bold text-uppercase mb-3">Get in Touch</h5><p><strong>Zeinab El Sokkary</strong><small className="d-block">Managing Director</small></p><p>+20 122 171 9621</p><a href="mailto:Zeinab@gocampinternational.net">Email Us</a></div>
      <div className="col-lg-3 col-md-6"><h5 className="fw-bold text-uppercase mb-3">Follow Us</h5><div className="social-icons mb-4"><a href="https://www.facebook.com/GoCampGo" target="_blank" rel="noopener noreferrer"><img src="/images/facebook_icon.webp" alt="Facebook"/></a> <a href="https://www.instagram.com/gocampgo/" target="_blank" rel="noopener noreferrer"><img src="/images/instagram_icon.webp" alt="Instagram"/></a></div><img src="/images/icef_logo.webp" alt="ICEF Accredited" style={{maxWidth:100}}/></div>
    </div><hr className="my-4"/><p className="mb-0 text-center">Go Camp International</p>
  </div></footer>;
}
