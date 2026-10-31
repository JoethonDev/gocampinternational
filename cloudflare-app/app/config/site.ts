export const SITE = {
  name: "Go Camp International",
  shortName: "GoCamp",
  director: "Zeinab El Sokkary",
  directorTitle: "Managing Director",
  phone: "+20 122 171 9621",
  phoneHref: "tel:+201221719621",
  email: "Zeinab@gocampinternational.net",
  emailHref: "mailto:Zeinab@gocampinternational.net",
  social: {
    facebook: "https://www.facebook.com/GoCampGo",
    instagram: "https://www.instagram.com/gocampgo/",
    linkedin: "https://www.linkedin.com/in/zeinab-el-sokkary-97245a34/"
  },
  images: {
    logo: "/images/logo-transparent.webp",
    favicon: "/images/favi.png",
    contactBanner: "/images/contact_banner.webp",
    aboutBanner: "/images/about_banner.webp",
    faqBanner: "/images/faq_banner.webp",
    placeholder: "/images/placeholder.webp",
    profile: "/images/profile.webp",
    icef: "/images/icef_logo.webp",
    facebookIcon: "/images/facebook_icon.webp",
    instagramIcon: "/images/instagram_icon.webp",
    linkedinIcon: "/images/linkin_icon.webp"
  }
} as const;

export const FOOTER_LINKS = {
  about: [
    { label: "Home", to: "/" },
    { label: "About Us", to: "/about" },
    { label: "F.A.Q", to: "/faq" },
    { label: "Contact Us", to: "/contact" }
  ],
  programs: [
    { label: "Language & Activity", to: "/program/category?category=kids-camps" },
    { label: "Adult Academic", to: "/program/category?category=adult-academic" },
    { label: "Young Leader", to: "/program/category?category=young-leader-program" },
    { label: "Soccer Camps", to: "/program/category?category=soccer-camps" }
  ]
} as const;

export const HOME_HERO_SLIDES = [
  { image: "/images/banner.webp", title: "Unforgettable Summers Start Here" },
  { image: "/images/hero.webp", title: "Discover Your Passion Abroad" },
  { image: "/images/about_img_3.webp", title: "Build Lifelong Friendships" }
] as const;

export const HOME_COPY = {
  eyebrow: "Go Camp International",
  intro:
    "Summer Camp is more than just fun and games. It's an opportunity for your kids to develop critical skills, learn about the world, and build international connections that last a lifetime.",
  destinationsTitle: "Our Destinations",
  categoriesTitle: "Explore Our Program Categories",
  categoriesIntro: "Choose your adventure from our diverse range of international camp experiences."
} as const;

export type AboutSection = {
  title: string;
  image: string;
  reverse?: boolean;
  body: string[];
};

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    title: "About Us",
    image: "/images/about_1.webp",
    body: [
      "With over 15 years of experience in organizing international summer camps and short-term educational programs, we specialize in creating meaningful overseas experiences for children and young learners."
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
    image: "/images/about_3.webp",
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
