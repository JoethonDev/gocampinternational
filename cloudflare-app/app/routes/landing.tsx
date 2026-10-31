import { useFetcher } from "react-router";
import type { Route } from "./+types/landing";
import { submitInquiry } from "../lib/inquiries.server";
import "../landing.css";

export function meta({}: Route.MetaArgs) {
  return [
    {title:"Transform Your Teen's Future - International Summer Programs | Go Camp"},
    {name:"description",content:"Elite international summer camps for ambitious teens. Sports academies, language immersion, leadership programs."},
    {name:"robots",content:"noindex,nofollow"}
  ];
}
export const links: Route.LinksFunction = () => [
  {rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap"}
];
export function action({request,context}: Route.ActionArgs) {
  return submitInquiry(request,context.cloudflare.env.DB,"lead",true);
}

const interests = [
  {value:"Sports",icon:"fa-futbol"},
  {value:"Language",icon:"fa-language"},
  {value:"Leadership",icon:"fa-users"},
  {value:"Academic",icon:"fa-graduation-cap"}
];
const benefits = [
  {icon:"fa-shield-alt",title:"Safety You Can Trust",description:"24/7 supervision by certified staff, comprehensive insurance, and real-time parent updates."},
  {icon:"fa-chart-line",title:"Proven Academic Results",description:"95% of students improve language skills by 2+ levels and report better academic performance."},
  {icon:"fa-globe-americas",title:"Global Network",description:"Build lifelong friendships with teens from 50+ countries and access top universities."}
];
export default function Landing() {
  const fetcher=useFetcher<{success?:boolean;error?:string;message?:string}>();
  return <div className="page-content landing-page">
    <section className="hero-landing"><div className="container"><div className="row align-items-center">
      <div className="col-lg-6 mb-5 mb-lg-0">
        <h1 className="hero-headline">Transform Your Teen's Future with <span className="highlight">Global Adventures</span></h1>
        <p className="hero-subheadline">Elite international programs combining language mastery, leadership skills, and lifelong friendships. Give your child the competitive edge.</p>
        <ul className="hero-usp-list">
          <li><i className="fas fa-check-circle"/><strong>Safe &amp; Supervised:</strong> 24/7 care with certified staff</li>
          <li><i className="fas fa-check-circle"/><strong>Proven Results:</strong> 95% boost in confidence &amp; language skills</li>
          <li><i className="fas fa-check-circle"/><strong>Premium Experience:</strong> Top facilities across 25+ countries</li>
        </ul>
        <div className="hero-stats"><div className="row">
          {[[ "20+","Years Experience"],["25+","Countries"],["98%","Satisfaction"]].map(([number,label])=>
            <div className="col-4 stat-item" key={label}><span className="stat-number">{number}</span><span className="stat-label">{label}</span></div>)}
        </div></div>
      </div>
      <div className="col-lg-6 form-container"><div className="lead-form-card">
        <div className="form-header"><h2 className="form-title"><i className="fas fa-gift"/> Get Your Free Consultation</h2><p className="form-subtitle">Discover the perfect program for your teen in 60 seconds</p></div>
        <div className="urgency-banner"><i className="fas fa-clock"/> <span>⚡ Limited Spots for Summer 2025!</span></div>
        <div role="status" aria-live="polite">
          {fetcher.data?.success&&<div className="alert alert-success">Your request was saved. Our team can review it in the inquiries inbox.</div>}
          {fetcher.data?.error&&<div className="alert alert-danger">{fetcher.data.error}</div>}
        </div>
        <fetcher.Form id="landingPageForm" method="post" action="/landing">
          <input type="hidden" name="source" value="Landing Page"/>
          <div className="hp-field" aria-hidden="true"><label>Leave empty<input type="text" name="website" tabIndex={-1} autoComplete="off"/></label></div>
          <div className="form-group"><label className="form-label" htmlFor="landing-name">Child's Full Name <span className="required">*</span></label><div className="input-icon"><i className="fas fa-user"/><input id="landing-name" type="text" name="name" className="form-control" placeholder="e.g., Ahmed Mohamed" required maxLength={100}/></div></div>
          <div className="row"><div className="col-md-6"><div className="form-group"><label htmlFor="landing-age" className="form-label">Child's Age <span className="required">*</span></label><select id="landing-age" name="age" className="form-select" defaultValue="" required><option value="">Select age</option>{Array.from({length:12},(_,i)=>i+7).map(age=><option key={age} value={age}>{age} years old</option>)}</select></div></div>
          <div className="col-md-6"><div className="form-group"><label htmlFor="landing-gender" className="form-label">Gender <span className="required">*</span></label><select id="landing-gender" name="gender" className="form-select" defaultValue="" required><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option></select></div></div></div>
          <div className="form-group"><p className="form-label">What interests your child? <small>(Select all that apply)</small></p><div className="interest-grid">{interests.map(opt=><div className="interest-option" key={opt.value}><input type="checkbox" id={"landing-"+opt.value.toLowerCase()} name="interests[]" value={opt.value}/><label className="interest-label" htmlFor={"landing-"+opt.value.toLowerCase()}><i className={"fas "+opt.icon}/><span>{opt.value}</span></label></div>)}</div></div>
          <div className="form-group"><label htmlFor="landing-email" className="form-label">Parent's Email <span className="required">*</span></label><div className="input-icon"><i className="fas fa-envelope"/><input id="landing-email" type="email" name="email" className="form-control" placeholder="parent@example.com" required maxLength={254}/></div></div>
          <div className="form-group"><label htmlFor="landing-phone" className="form-label">Parent's Phone (WhatsApp) <span className="required">*</span></label><div className="input-icon"><i className="fab fa-whatsapp"/><input id="landing-phone" type="tel" name="phone" className="form-control" placeholder="+20 123 456 7890" required maxLength={30}/></div></div>
          <div className="form-group"><div className="form-check"><input className="form-check-input" type="checkbox" id="landing-consent" name="privacyConsent" required/><label className="form-check-label" htmlFor="landing-consent">I agree to receive personalized program recommendations.</label></div></div>
          <div className="d-grid"><button type="submit" disabled={fetcher.state!=="idle"} className="btn btn-warning btn-lg btn-submit-landing"><i className="fas fa-rocket"/> {fetcher.state!=="idle"?"Submitting...":"Get My Free Consultation"}</button></div>
        </fetcher.Form>
        <div className="form-trust"><div className="trust-item"><i className="fas fa-shield-alt"/><span>100% Secure</span></div><div className="trust-item"><i className="fas fa-clock"/><span>Reply in 2 Hours</span></div></div>
      </div></div>
    </div></div></section>
    <section className="why-section"><div className="container"><div className="section-header"><h2 className="section-title">Why 10,000+ Parents Trust Us</h2><p className="section-subtitle">More than just a summer camp - it's a life-changing experience</p></div><div className="row g-4">{benefits.map(b=><div className="col-lg-4 col-md-6" key={b.title}><div className="benefit-card"><div className="benefit-icon"><i className={"fas "+b.icon}/></div><h3 className="benefit-title">{b.title}</h3><p className="benefit-text">{b.description}</p></div></div>)}</div></div></section>
    <section className="guarantee-section"><div className="container"><div className="guarantee-badge"><i className="fas fa-award"/></div><h2 className="guarantee-title">Our 100% Satisfaction Guarantee</h2><p className="guarantee-text">Your satisfaction and your child's safety are our top priorities. We stand by our programs with a comprehensive guarantee.</p></div></section>
  </div>;
}
