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

    </section>
  );
}
