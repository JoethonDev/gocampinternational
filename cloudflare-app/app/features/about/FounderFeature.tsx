import { FounderPortrait } from "../../components/site/FounderPortrait";
import "./founder-feature.css";

type FounderProfile = { name: string; title: string; body: string };

export function FounderFeature({
  profile,
  image,
  eyebrow
}: {
  profile: FounderProfile;
  image: string;
  eyebrow: string;
}) {
  const paragraphs = profile.body.split(/\n\s*\n/).filter(Boolean);

  return (
    <section className="gc-founder-feature mt-5" aria-labelledby="about-founder-title">
      <div className="gc-founder-feature__inner">
        <div className="gc-founder-feature__portrait">
          <FounderPortrait
            src={image}
            name={profile.name}
            title={profile.title}
            headingId="about-director-title"
            editorial
          />
        </div>

        <div className="gc-founder-feature__story">
          <p className="gc-founder-feature__eyebrow">{eyebrow}</p>
          <h2 id="about-founder-title" className="gc-founder-feature__heading">
            Our Founder
          </h2>
          <div className="gc-founder-feature__rule" aria-hidden="true" />
          <div className="gc-founder-feature__copy">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <svg
        className="gc-founder-feature__travel"
        viewBox="0 0 700 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <clipPath id="gc-founder-globe-clip">
            <circle cx="565" cy="274" r="195" />
          </clipPath>
        </defs>
        <g clipPath="url(#gc-founder-globe-clip)">
          <circle cx="565" cy="274" r="195" fill="#ebeddf" opacity=".82" />
          <path
            d="M418 113l27-9 20 6 17 20-7 21 20 12 13-7 21 12 11 25 31 10 6 23-18 22-22-8-9 18-16 12-18-18-22-4-10-31-18-6-5-35-23-16-13-22z"
            fill="#d4dbc4"
            opacity=".65"
          />
          <path
            d="M576 99l18 14 20-4 31 14 23-8 21 19-13 27-27 7 4 15-22 14-3 28-31 15-17-9-4-30-24-8-13-21 20-25-13-29 26-19z"
            fill="#cfd8bc"
            opacity=".65"
          />
          <path
            d="M551 260l25-7 12 22 22 9 7 32-15 28-26 32-28-14-7-34-20-14 7-27z"
            fill="#d0d8bd"
            opacity=".65"
          />
          <path
            d="M417 249l22 7 18 29-13 39-23 29-16-10 2-43z"
            fill="#cfd7bc"
            opacity=".65"
          />
          <path d="M375 270h384M565 80v390" stroke="#fff" strokeOpacity=".35" />
          <ellipse cx="565" cy="274" rx="92" ry="195" stroke="#fff" strokeOpacity=".3" />
        </g>
        <path
          d="M54 313c48-35 112-25 145-64 31-38-14-69-43-47-30 23-5 63 44 65 67 3 156-39 224-119"
          stroke="#c68b25"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="9 11"
          opacity=".87"
        />
        <path
          d="M0-6l17 22 42-10c6-1 11 3 7 9L29 38l-2 23-12 4-7-23-29-7-16 12-9-3 16-22-12-19 8-7 31 12 26-16c7-4 12-3 11 2-1 2-15 12-34 19z"
          fill="#c88e2a"
          transform="translate(424 135) rotate(-14) scale(.76)"
        />
      </svg>
      <svg
        className="gc-founder-feature__waves"
        viewBox="0 0 1600 145"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M0 82C200 112 368 144 570 99S911 15 1084 83s342 45 516 8V145H0Z"
          fill="#f4f1e6"
          opacity=".9"
        />
        <path
          d="M0 131C263 140 439 150 639 120s318-89 494-63 343 80 467 69V145H0Z"
          fill="#dfe6d8"
          opacity=".69"
        />
      </svg>
    </section>
  );
}
