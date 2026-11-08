export type ContentField = {
  kind: "text" | "image" | "link" | "external" | "visibility";
  value: string | boolean;
};

// Stable field IDs are shared by rendering, validation and the visual editor.
export const PUBLIC_CONTENT_FIELDS: Record<string, Record<string, ContentField>> = {
  home: {
    "destinations-will-be-listed-here-soon": {
      kind: "text",
      value: "Destinations will be listed here soon!"
    },
    "slides.0.image": {
      kind: "image",
      value: "/images/banner.webp"
    },
    "slides.0.title": {
      kind: "text",
      value: "Unforgettable Summers Start Here"
    },
    "slides.1.image": {
      kind: "image",
      value: "/images/hero.webp"
    },
    "slides.1.title": {
      kind: "text",
      value: "Discover Your Passion Abroad"
    },
    "slides.2.image": {
      kind: "image",
      value: "/images/about_img_3.webp"
    },
    "slides.2.title": {
      kind: "text",
      value: "Build Lifelong Friendships"
    },
    eyebrow: {
      kind: "text",
      value: "Go Camp International"
    },
    intro: {
      kind: "text",
      value:
        "GO Camp International helps families discover overseas educational experiences in language learning, sports, leadership and culture. Explore opportunities to learn, grow and build international connections."
    },
    destinationsTitle: {
      kind: "text",
      value: "Our Destinations"
    },
    categoriesTitle: {
      kind: "text",
      value: "Explore Our Program Categories"
    },
    categoriesIntro: {
      kind: "text",
      value: "Choose your adventure from our diverse range of international camp experiences."
    },
    "show-social": {
      kind: "visibility",
      value: true
    },
    "hero-subtitle": {
      kind: "text",
      value:
        "International camps are a life-changing opportunity to learn, grow, and make global friends."
    },
    "default-category-intro": {
      kind: "text",
      value: "Discover amazing programs in this category."
    }
  },
  testimonials: {
    "families-who-travelled-with-us": {
      kind: "text",
      value: "Families who travelled with us"
    },
    "what-families-say": {
      kind: "text",
      value: "What Families Say"
    }
  },
  about: {
    "alt-go-camp-international-students-on-an-educational-trip": {
      kind: "text",
      value: "Go Camp International students on an educational trip"
    },
    "alt-students-sitting-on-grass": {
      kind: "text",
      value: "Students sitting on grass"
    },
    "title-about-us": {
      kind: "text",
      value: "About Us"
    },
    "meet-our-founder": {
      kind: "text",
      value: "Meet Our Founder"
    },
    home: {
      kind: "text",
      value: "HOME"
    },
    "about-us": {
      kind: "text",
      value: "ABOUT US"
    },
    "show-banner": {
      kind: "visibility",
      value: true
    },
    "show-content": {
      kind: "visibility",
      value: true
    },
    "show-founder": {
      kind: "visibility",
      value: true
    }
  },
  contact: {
    "send-us-a-message": {
      kind: "text",
      value: "Send Us a Message"
    },
    name: {
      kind: "text",
      value: "Name *"
    },
    email: {
      kind: "text",
      value: "Email *"
    },
    phone: {
      kind: "text",
      value: "Phone"
    },
    country: {
      kind: "text",
      value: "Country"
    },
    subject: {
      kind: "text",
      value: "Subject"
    },
    message: {
      kind: "text",
      value: "Message *"
    },
    "chat-with-us-on-whatsapp": {
      kind: "text",
      value: "Chat with us on WhatsApp"
    },
    "alt-contact-us-banner": {
      kind: "text",
      value: "Contact Us Banner"
    },
    "title-contact-us": {
      kind: "text",
      value: "Contact Us"
    },
    "get-in-touch-we-d-love-to-hear-from-you": {
      kind: "text",
      value: "Get in touch! We'd love to hear from you."
    },
    home: {
      kind: "text",
      value: "HOME"
    },
    "contact-us": {
      kind: "text",
      value: "CONTACT US"
    },
    "show-banner": {
      kind: "visibility",
      value: true
    },
    "show-intro": {
      kind: "visibility",
      value: true
    },
    "show-form": {
      kind: "visibility",
      value: true
    },
    "show-contact-card": {
      kind: "visibility",
      value: true
    },
    sending: {
      kind: "text",
      value: "Sending..."
    },
    "send-message": {
      kind: "text",
      value: "Send Message"
    }
  },
  faq: {
    "alt-faq-banner": {
      kind: "text",
      value: "FAQ Banner"
    },
    "title-faq": {
      kind: "text",
      value: "FAQ"
    },
    "title-frequently-asked-questions": {
      kind: "text",
      value: "Frequently Asked Questions"
    },
    "no-faqs-available-at-the-moment-please-check-back-later": {
      kind: "text",
      value: "No FAQs available at the moment. Please check back later."
    },
    home: {
      kind: "text",
      value: "HOME"
    },
    faq: {
      kind: "text",
      value: "FAQ"
    },
    "show-banner": {
      kind: "visibility",
      value: true
    },
    "show-questions": {
      kind: "visibility",
      value: true
    }
  },
  landing: {
    "get-your-free-consultation": {
      kind: "text",
      value: "Get Your Free Consultation"
    },
    "discover-the-perfect-program-for-your-teen-in-60-seconds": {
      kind: "text",
      value: "Discover the perfect program for your teen in 60 seconds"
    },
    "limited-spots-for-summer-2025": {
      kind: "text",
      value: "⚡ Limited Spots for Summer 2025!"
    },
    "your-request-was-saved-our-team-can-review-it-in-the-inquiries-inbox": {
      kind: "text",
      value: "Your request was saved. Our team can review it in the inquiries inbox."
    },
    "child-s-full-name": {
      kind: "text",
      value: "Child's Full Name "
    },
    "placeholder-e-g-ahmed-mohamed": {
      kind: "text",
      value: "e.g., Ahmed Mohamed"
    },
    "child-s-age": {
      kind: "text",
      value: "Child's Age "
    },
    "select-age": {
      kind: "text",
      value: "Select age"
    },
    "years-old": {
      kind: "text",
      value: "years old"
    },
    gender: {
      kind: "text",
      value: "Gender "
    },
    "select-gender": {
      kind: "text",
      value: "Select gender"
    },
    male: {
      kind: "text",
      value: "Male"
    },
    female: {
      kind: "text",
      value: "Female"
    },
    "what-interests-your-child": {
      kind: "text",
      value: "What interests your child? "
    },
    "select-all-that-apply": {
      kind: "text",
      value: "(Select all that apply)"
    },
    "parent-s-email": {
      kind: "text",
      value: "Parent's Email "
    },
    "placeholder-parent-example-com": {
      kind: "text",
      value: "parent@example.com"
    },
    "parent-s-phone-whatsapp": {
      kind: "text",
      value: "Parent's Phone (WhatsApp) "
    },
    "placeholder-20-123-456-7890": {
      kind: "text",
      value: "+20 123 456 7890"
    },
    "i-agree-to-receive-personalized-program-recommendations": {
      kind: "text",
      value: "I agree to receive personalized program recommendations."
    },
    "100-secure": {
      kind: "text",
      value: "100% Secure"
    },
    "reply-in-2-hours": {
      kind: "text",
      value: "Reply in 2 Hours"
    },
    "transform-your-teen-s-future-with": {
      kind: "text",
      value: "Transform Your Teen's Future with"
    },
    "global-adventures": {
      kind: "text",
      value: "Global Adventures"
    },
    "elite-international-programs-combining-language-mastery-leadership-ski": {
      kind: "text",
      value:
        "Elite international programs combining language mastery, leadership skills, and lifelong friendships. Give your child the competitive edge."
    },
    "why-10-000-parents-trust-us": {
      kind: "text",
      value: "Why 10,000+ Parents Trust Us"
    },
    "more-than-just-a-summer-camp-it-s-a-life-changing-experience": {
      kind: "text",
      value: "More than just a summer camp - it's a life-changing experience"
    },
    "our-100-satisfaction-guarantee": {
      kind: "text",
      value: "Our 100% Satisfaction Guarantee"
    },
    "your-satisfaction-and-your-child-s-safety-are-our-top-priorities-we-st": {
      kind: "text",
      value:
        "Your satisfaction and your child's safety are our top priorities. We stand by our programs with a comprehensive guarantee."
    },
    "benefits.safety-you-can-trust": {
      kind: "text",
      value: "Safety You Can Trust"
    },
    "benefits.proven-academic-results": {
      kind: "text",
      value: "Proven Academic Results"
    },
    "benefits.global-network": {
      kind: "text",
      value: "Global Network"
    },
    "stats.20": {
      kind: "text",
      value: "20+"
    },
    "stats.years-experience": {
      kind: "text",
      value: "Years Experience"
    },
    "stats.25": {
      kind: "text",
      value: "25+"
    },
    "stats.countries": {
      kind: "text",
      value: "Countries"
    },
    "stats.98": {
      kind: "text",
      value: "98%"
    },
    "stats.satisfaction": {
      kind: "text",
      value: "Satisfaction"
    },
    "usps.safe-supervised": {
      kind: "text",
      value: "Safe & Supervised:"
    },
    "usps.24-7-care-with-certified-staff": {
      kind: "text",
      value: " 24/7 care with certified staff"
    },
    "usps.proven-results": {
      kind: "text",
      value: "Proven Results:"
    },
    "usps.95-boost-in-confidence-language-skills": {
      kind: "text",
      value: " 95% boost in confidence & language skills"
    },
    "usps.premium-experience": {
      kind: "text",
      value: "Premium Experience:"
    },
    "usps.top-facilities-across-25-countries": {
      kind: "text",
      value: " Top facilities across 25+ countries"
    },
    "get-my-free-consultation": {
      kind: "text",
      value: "Get My Free Consultation"
    },
    "show-hero": {
      kind: "visibility",
      value: true
    },
    "show-form": {
      kind: "visibility",
      value: true
    },
    "show-benefits": {
      kind: "visibility",
      value: true
    },
    "show-guarantee": {
      kind: "visibility",
      value: true
    },
    "show-stats": {
      kind: "visibility",
      value: true
    },
    "show-urgency": {
      kind: "visibility",
      value: true
    },
    "benefits.safety-description": {
      kind: "text",
      value:
        "24/7 supervision by certified staff, comprehensive insurance, and real-time parent updates."
    },
    "benefits.results-description": {
      kind: "text",
      value:
        "95% of students improve language skills by 2+ levels and report better academic performance."
    },
    "benefits.network-description": {
      kind: "text",
      value: "Build lifelong friendships with teens from 50+ countries and access top universities."
    },
    submitting: {
      kind: "text",
      value: "Submitting..."
    },
    "interest-sports": {
      kind: "text",
      value: "Sports"
    },
    "interest-language": {
      kind: "text",
      value: "Language"
    },
    "interest-leadership": {
      kind: "text",
      value: "Leadership"
    },
    "interest-academic": {
      kind: "text",
      value: "Academic"
    }
  },
  category: {
    discover: {
      kind: "text",
      value: "Discover "
    },
    home: {
      kind: "text",
      value: "HOME"
    }
  },
  destination: {
    "coming-soon": {
      kind: "text",
      value: "Coming Soon"
    },
    "is-not-available-yet": {
      kind: "text",
      value: "is not available yet."
    },
    "please-check-back-later-for-updates-on-this-destination": {
      kind: "text",
      value: "Please check back later for updates on this destination."
    },
    "to-": {
      kind: "link",
      value: "/"
    },
    "go-to-homepage": {
      kind: "text",
      value: "Go to Homepage"
    },
    "by-the-numbers": {
      kind: "text",
      value: "By The Numbers"
    },
    discover: {
      kind: "text",
      value: "Discover "
    },
    "no-programs-are-currently-available-for-this-destination-please-check-": {
      kind: "text",
      value: "No programs are currently available for this destination. Please check back soon!"
    }
  },
  header: {
    "to-": {
      kind: "link",
      value: "/"
    },
    home: {
      kind: "text",
      value: "Home"
    },
    "to-about": {
      kind: "link",
      value: "/about"
    },
    "about-us": {
      kind: "text",
      value: "About Us"
    },
    "label-programs": {
      kind: "text",
      value: "Programs"
    },
    "label-destinations": {
      kind: "text",
      value: "Destinations"
    },
    "to-faq": {
      kind: "link",
      value: "/faq"
    },
    faq: {
      kind: "text",
      value: "FAQ"
    },
    "to-contact": {
      kind: "link",
      value: "/contact"
    },
    contact: {
      kind: "text",
      value: "Contact"
    },
    "book-now": {
      kind: "text",
      value: "Book Now"
    },
    "show-navigation": {
      kind: "visibility",
      value: true
    }
  },
  footer: {
    "title-about": {
      kind: "text",
      value: "About"
    },
    "title-programs": {
      kind: "text",
      value: "Programs"
    },
    "title-destinations": {
      kind: "text",
      value: "Destinations"
    },
    "get-in-touch": {
      kind: "text",
      value: "Get in Touch"
    },
    "email-us": {
      kind: "text",
      value: "Email Us"
    },
    "follow-us": {
      kind: "text",
      value: "Follow Us"
    },
    "alt-icef-accredited": {
      kind: "text",
      value: "ICEF Agency Status #0543 — scan QR to verify"
    },
    "go-camp-international-all-rights-reserved": {
      kind: "text",
      value: "GO CAMP International. All Rights Reserved."
    },
    "powered-by-joethondev": {
      kind: "text",
      value: "Powered by JoethonDev"
    },
    "about.0.label": {
      kind: "text",
      value: "Home"
    },
    "about.0.to": {
      kind: "link",
      value: "/"
    },
    "about.1.label": {
      kind: "text",
      value: "About Us"
    },
    "about.1.to": {
      kind: "link",
      value: "/about"
    },
    "about.2.label": {
      kind: "text",
      value: "F.A.Q"
    },
    "about.2.to": {
      kind: "link",
      value: "/faq"
    },
    "about.3.label": {
      kind: "text",
      value: "Contact Us"
    },
    "about.3.to": {
      kind: "link",
      value: "/contact"
    },
    "show-footer": {
      kind: "visibility",
      value: true
    }
  },
  booking: {
    "full-name": {
      kind: "text",
      value: "Full Name"
    },
    "placeholder-e-g-ahmed-hassan": {
      kind: "text",
      value: "e.g., Ahmed Hassan"
    },
    "email-address": {
      kind: "text",
      value: "Email Address"
    },
    "placeholder-you-example-com": {
      kind: "text",
      value: "you@example.com"
    },
    "phone-number": {
      kind: "text",
      value: "Phone Number"
    },
    "placeholder-20-123-456-7890": {
      kind: "text",
      value: "+20 123 456 7890"
    },
    "i-m-interested-in": {
      kind: "text",
      value: "I'm interested in..."
    },
    "choose-a-program-type": {
      kind: "text",
      value: "Choose a program type"
    },
    "ready-for-an-adventure": {
      kind: "text",
      value: "Ready for an Adventure?"
    },
    "leave-your-details-below-and-one-of-our-camp-experts-will-contact-you-": {
      kind: "text",
      value: "Leave your details below, and one of our camp experts will contact you shortly."
    },
    call: {
      kind: "text",
      value: "Call"
    },
    "book-a-free-call": {
      kind: "text",
      value: "Book a Free Call"
    },
    "show-booking": {
      kind: "visibility",
      value: true
    },
    sending: {
      kind: "text",
      value: "Sending..."
    },
    "program-language-camps": {
      kind: "text",
      value: "Language & Activity Camps"
    },
    "program-adult-academic": {
      kind: "text",
      value: "Adult Academic Programs"
    },
    "program-young-leader": {
      kind: "text",
      value: "Young Leader Programs"
    },
    "program-soccer": {
      kind: "text",
      value: "Soccer Camps"
    },
    "program-special-interests": {
      kind: "text",
      value: "Special Interests Camps"
    }
  },
  social: {
    "see-our-latest-camp-adventures-on": {
      kind: "text",
      value: "See our latest camp adventures on"
    },
    facebook: {
      kind: "text",
      value: "Facebook"
    },
    "news-and-updates-from-go-camp": {
      kind: "text",
      value: "News and updates from Go Camp"
    },
    "title-go-camp-international-facebook-timeline": {
      kind: "text",
      value: "Go Camp International Facebook timeline"
    },
    "visit-our-facebook-page": {
      kind: "text",
      value: "Visit our Facebook page"
    },
    instagram: {
      kind: "text",
      value: "Instagram"
    },
    "photos-and-moments-from-our-adventures": {
      kind: "text",
      value: "Photos and moments from our adventures"
    },
    "see-the-latest-posts-gocampgo": {
      kind: "text",
      value: "See the latest posts @gocampgo"
    },
    "follow-our-adventures": {
      kind: "text",
      value: "Follow Our Adventures"
    },
    "explore-our-camp-highlights-and-follow-go-camp-international-for-new-p": {
      kind: "text",
      value: "Explore our camp highlights and follow Go Camp International for new posts."
    },
    "go-camp": {
      kind: "text",
      value: "Go Camp"
    },
    "go-camp-camp-memory": {
      kind: "text",
      value: "Go Camp camp memory"
    },
    "show-facebook": {
      kind: "visibility",
      value: true
    },
    "show-instagram": {
      kind: "visibility",
      value: true
    },
    "show-social-feed": {
      kind: "visibility",
      value: true
    }
  },
  program: {
    ages: {
      kind: "text",
      value: "Ages "
    }
  },
  site: {
    name: {
      kind: "text",
      value: "Go Camp International"
    },
    shortName: {
      kind: "text",
      value: "GoCamp"
    },
    director: {
      kind: "text",
      value: "Zeinab El Sokkary"
    },
    directorTitle: {
      kind: "text",
      value: "Managing Director"
    },
    phone: {
      kind: "text",
      value: "+20 122 171 9621"
    },
    phoneHref: {
      kind: "link",
      value: "tel:+201221719621"
    },
    whatsappHref: {
      kind: "link",
      value: "https://wa.me/201221719621"
    },
    email: {
      kind: "text",
      value: "Zeinab@gocampinternational.net"
    },
    emailHref: {
      kind: "link",
      value: "mailto:Zeinab@gocampinternational.net"
    },
    "social.facebook": {
      kind: "external",
      value: "https://www.facebook.com/GoCampGo"
    },
    "social.instagram": {
      kind: "external",
      value: "https://www.instagram.com/gocampgo/"
    },
    "social.linkedin": {
      kind: "external",
      value: "https://www.linkedin.com/in/zeinab-el-sokkary-97245a34/"
    },
    "images.logo": {
      kind: "image",
      value: "/images/logo.webp?v=1d0bca89"
    },
    "images.favicon": {
      kind: "image",
      value: "/images/favi.png"
    },
    "images.contactBanner": {
      kind: "image",
      value: "/images/contact_banner.webp"
    },
    "images.aboutBanner": {
      kind: "image",
      value: "/images/about_banner.webp"
    },
    "images.faqBanner": {
      kind: "image",
      value: "/images/faq_banner.webp"
    },
    "images.placeholder": {
      kind: "image",
      value: "/images/placeholder.webp"
    },
    "images.profile": {
      kind: "image",
      value: "/media/db67b319-afd4-5cb6-9f57-1d098e311223"
    },
    "images.icef": {
      kind: "image",
      value: "/images/icef_agency_status_0543.webp?v=3690130f"
    },
    "images.facebookIcon": {
      kind: "image",
      value: "/images/facebook_icon.webp"
    },
    "images.instagramIcon": {
      kind: "image",
      value: "/images/instagram_icon.webp"
    },
    "images.linkedinIcon": {
      kind: "image",
      value: "/images/linkin_icon.webp"
    }
  },
  memories: {
    "go-campers-memories": {
      kind: "text",
      value: "Go Campers Memories"
    }
  },
  seo: {
    "home-title": {
      kind: "text",
      value: "Go Camp International | Unforgettable Summer Experiences"
    },
    "home-description": {
      kind: "text",
      value:
        "Explore international educational experiences with GO Camp International, including language learning, sports academies, cultural travel, leadership and academic programs."
    },
    "home-image": {
      kind: "image",
      value: "/images/banner.webp"
    },
    "about-title": {
      kind: "text",
      value: "Go Camp :: About Us"
    },
    "about-description": {
      kind: "text",
      value:
        "With 15 years of experience, Go Camp International combines excellent language education with a wide range of leisure, sport, and sightseeing activities."
    },
    "about-image": {
      kind: "image",
      value: "/images/about_banner.webp"
    },
    "contact-title": {
      kind: "text",
      value: "Go Camp :: Contact Us"
    },
    "contact-description": {
      kind: "text",
      value:
        "Get in touch with Go Camp. Contact us via phone, email, or our online form for any inquiries about our programs."
    },
    "contact-image": {
      kind: "image",
      value: "/images/contact_banner.webp"
    },
    "faq-title": {
      kind: "text",
      value: "Go Camp :: Frequently Asked Questions"
    },
    "faq-description": {
      kind: "text",
      value:
        "Find answers to common questions about our summer camps, including safety, preparation, and program details."
    },
    "faq-image": {
      kind: "image",
      value: "/images/faq_banner.webp"
    },
    "landing-title": {
      kind: "text",
      value: "Transform Your Teen's Future - International Summer Programs | Go Camp"
    },
    "landing-description": {
      kind: "text",
      value:
        "Elite international summer camps for ambitious teens. Sports academies, language immersion, leadership programs."
    },
    "landing-image": {
      kind: "image",
      value: "/images/banner.webp"
    }
  },
  errors: {
    "not-found-title": {
      kind: "text",
      value: "Page Not Found (404)"
    },
    "page-not-found": {
      kind: "text",
      value: "Page Not Found"
    },
    "not-found-description": {
      kind: "text",
      value: "Sorry, the page you are looking for does not exist or has been moved."
    },
    "service-error-title": {
      kind: "text",
      value: "Page unavailable | GoCamp"
    },
    "page-unavailable": {
      kind: "text",
      value: "Page unavailable"
    },
    "service-error-description": {
      kind: "text",
      value: "The page could not be loaded. Please try again."
    },
    "go-to-homepage": {
      kind: "text",
      value: "Go to Homepage"
    }
  }
};
