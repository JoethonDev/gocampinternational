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
            <a className="nav-link dropdown-toggle" href="#" id="programsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Programs</a>
            <ul className="dropdown-menu" aria-labelledby="programsDropdown">{categories.map(c=><li key={c.slug}><Link className="dropdown-item" to={"/program/category?category="+encodeURIComponent(c.slug)}>{c.name}</Link></li>)}</ul>
          </li>
          <li className="nav-item dropdown">
            <a className="nav-link dropdown-toggle" href="#" id="destinationsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Destinations</a>
            <ul className="dropdown-menu" aria-labelledby="destinationsDropdown">{destinations.map(d=><li key={d.slug}><Link className="dropdown-item" to={"/destinations/"+encodeURIComponent(d.slug)}>{d.name}</Link></li>)}</ul>
          </li>
          <li className="nav-item"><Link className="nav-link" to="/faq">FAQ</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/contact">Contact</Link></li>
        </ul>
        <button type="button" className="btn btn-warning ms-xl-3" data-bs-toggle="modal" data-bs-target="#ctaModal">Book Now</button>
      </div>
    </div>
  </nav>;
}
export function SiteFooter() {
  return <footer className="footer text-white pt-5 pb-4"><div className="container">
    <div className="row gy-4">
      <div className="col-lg-3 col-md-6"><h5 className="fw-bold text-uppercase mb-3">About</h5><ul className="list-unstyled"><li className="mb-2"><Link to="/">Home</Link></li><li className="mb-2"><Link to="/about">About Us</Link></li><li className="mb-2"><Link to="/faq">F.A.Q</Link></li><li><Link to="/contact">Contact Us</Link></li></ul></div>
      <div className="col-lg-3 col-md-6"><h5 className="fw-bold text-uppercase mb-3">Programs</h5><ul className="list-unstyled"><li className="mb-2"><Link to="/program/category?category=kids-camps">Language & Activity</Link></li><li className="mb-2"><Link to="/program/category?category=adult-academic">Adult Academic</Link></li><li className="mb-2"><Link to="/program/category?category=young-leader-program">Young Leader</Link></li><li><Link to="/program/category?category=soccer-camps">Soccer Camps</Link></li></ul></div>
      <div className="col-lg-3 col-md-6"><h5 className="fw-bold text-uppercase mb-3">Get in Touch</h5><p className="mb-2"><strong>Zeinab El Sokkary</strong><br/><small>Managing Director</small></p><p className="mb-2"><i className="bi bi-telephone-fill me-2"/>+20 122 171 9621</p><p><a href="mailto:Zeinab@gocampinternational.net"><i className="bi bi-envelope-fill me-2"/>Email Us</a></p></div>
      <div className="col-lg-3 col-md-6 text-center text-md-start"><h5 className="fw-bold text-uppercase mb-3">Follow Us</h5><div className="social-icons mb-4"><a href="https://www.facebook.com/GoCampGo" target="_blank" rel="noopener noreferrer" className="me-2"><img src="/images/facebook_icon.webp" alt="Facebook"/></a> <a href="https://www.instagram.com/gocampgo/" target="_blank" rel="noopener noreferrer" className="me-2"><img src="/images/instagram_icon.webp" alt="Instagram"/></a> <a href="https://www.linkedin.com/in/zeinab-el-sokkary-97245a34/" target="_blank" rel="noopener noreferrer" className="me-2"><img src="/images/linkin_icon.webp" alt="LinkedIn"/></a></div><img src="/images/icef_logo.webp" alt="ICEF Accredited" style={{maxWidth:100}}/></div>
    </div>
  <hr className="my-4"/><div className="row"><div className="col-md-6 text-center text-md-start"><small>© {new Date().getFullYear()} GO CAMP International. All Rights Reserved.</small></div><div className="col-md-6 text-center text-md-end"><small>Powered by Graphicano</small></div></div></div></footer>;
}
