export const SITE = {
  name: "Go Camp International",
  shortName: "GoCamp",
  director: "Zeinab El Sokkary",
  directorTitle: "Managing Director",
  phone: "+20 122 171 9621",
  phoneHref: "tel:+201221719621",
  whatsappHref: "https://wa.me/201221719621",
  email: "Zeinab@gocampinternational.net",
  emailHref: "mailto:Zeinab@gocampinternational.net",
  social: {
    facebook: "https://www.facebook.com/GoCampGo",
    instagram: "https://www.instagram.com/gocampgo/",
    linkedin: "https://www.linkedin.com/in/zeinab-el-sokkary-97245a34/"
  },
  images: {
    logo: "/images/logo.webp?v=1d0bca89",
    favicon: "/images/favi.png",
    contactBanner: "/images/contact_banner.webp",
    aboutBanner: "/images/about_banner.webp",
    faqBanner: "/images/faq_banner.webp",
    placeholder: "/images/placeholder.webp",
    profile: "/media/910dd151-26f4-54f9-bc3d-c8cabc770e31",
    icef: "/images/icef_agency_status_0543.webp?v=3690130f",
    facebookIcon: "/images/facebook_icon.webp",
    instagramIcon: "/images/instagram_icon.webp",
    linkedinIcon: "/images/linkin_icon.webp"
  }
} as const;

export type AboutSection = {
  title: string;
  image: string;
  reverse?: boolean;
  visible?: boolean;
  body: string[];
  gallery?: { image: string; caption: string; alt: string }[];
};

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    title: "About Us",
    image: "/images/about_1.webp",
    body: [
      "With over 15 years of experience in organizing international summer camps and short-term educational programs, we specialize in creating meaningful overseas experiences for children and young learners.",
      "Our work extends beyond summer camps to international language learning, sports and leadership opportunities, school educational travel, and academic guidance where programs are available. We help students and parents understand the options and choose an experience that fits their individual goals."
    ]
  },
  {
    title: "Our Approach",
    image: "/images/about_2.webp",
    reverse: true,
    body: [
      "Our programs go beyond traditional language courses. We thoughtfully combine high-quality academic learning with sports, cultural exploration, and guided leisure activities—ensuring every student learns, grows, and enjoys every moment of their journey.",
      "We believe that exposure to new cultures, environments, and challenges at a young age plays a powerful role in shaping confident, independent, and globally minded individuals. That's why our philosophy centers on offering students the opportunity to discover their interests, develop real-world skills, and build lifelong memories in a safe and supportive international setting."
    ]
  },
  {
    title: "Beyond Camps: Schools, Parents & Global Collaboration",
    image: "/media/31f77667-fa6a-5bb6-a4eb-5b10404caec8",
    gallery: [
      {
        image: "/media/601023e8-2e95-592a-99da-055709bfbeb9",
        caption: "DEO School presentation",
        alt: "Students discussing an educational presentation at DEO School"
      },
      {
        image: "/media/a0db6d29-35fa-5d72-9f21-44963ef73da2",
        caption: "International educators workshop — Berlin",
        alt: "International education partners meeting at a Berlin workshop"
      },
      {
        image: "/media/838bbc52-d644-5cc7-a27d-1322fd84c263",
        caption: "Meeting global education partners",
        alt: "Go Camp representative speaking with education partners at a conference"
      }
    ],
    body: [
      "We also regularly host parent presentations, orientation sessions, and partner-led meetings—both independently and in cooperation with our international partners. These events allow parents and students to gain direct insight into programs, destinations, safety standards, and educational outcomes.",
      "Through these face-to-face interactions, parents can ask questions, meet representatives from overseas institutions, and feel confident about every step of their child's journey.\n\nOur long-standing partnerships and on-the-ground experience ensure that every program is delivered with transparency, care, and international best practices."
    ]
  },
  {
    title: "Safety and Welfare",
    image: "/images/about_img_3.webp",
    reverse: true,
    body: [
      "Go Camp International is committed to provide stimulating, challenging and safe learning environment for children and students with the highest quality product available worldwide. The safety and wellbeing of campers is the most essential part of the summer programs. They are cared for from the moment they arrive at the destination airport, until the summer camp is over."
    ]
  }
];

export type AboutPageContent = {
  profile: { name: string; title: string; body: string };
  sections: AboutSection[];
};

export const ABOUT_PAGE_DEFAULT: AboutPageContent = {
  profile: {
    name: SITE.director,
    title: SITE.directorTitle,
    body: "Zeinab El Sokkary is the Managing Director of GO Camp International. Her professional background spans education, travel and tourism, helping families explore suitable overseas learning experiences. Alongside international summer camps, her work includes advising students considering study abroad, helping parents assess boarding-school options, and supporting educational and cultural school travel. Families receive personal guidance when comparing programs and destinations, supported by parent presentations, orientation sessions, international partnerships and an educational-agent network that has included ICEF professional connections."
  },
  sections: ABOUT_SECTIONS
};
