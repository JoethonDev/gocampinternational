-- Add the editable homepage family-testimonial document.
-- SQLite cannot widen a CHECK constraint in place, so rebuild site_documents.
DROP TABLE IF EXISTS site_documents_new;
CREATE TABLE site_documents_new (
  key TEXT PRIMARY KEY CHECK(key IN ('site_settings','camp_memories','faq','testimonials')),
  content_json TEXT NOT NULL CHECK(json_valid(content_json)),
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT INTO site_documents_new(key,content_json,revision,updated_at)
  SELECT key,content_json,revision,updated_at FROM site_documents;
DROP TABLE site_documents;
ALTER TABLE site_documents_new RENAME TO site_documents;

INSERT OR IGNORE INTO site_documents(key,content_json) VALUES (
  'testimonials',
  '{"title":"What Families Say","intro":"","items":[{"name":"Maria & Family","flag":"🇨🇭","quote":"<p>An experience that <strong>changed our perspective!</strong> The organization was flawless and the activities were both fun and educational.</p>","is_active":true},{"name":"Ahmed S.","flag":"🇩🇪","quote":"<p>The <strong>best summer</strong> of my life! I learned so much, not just about the language but about myself. The counselors were amazing.</p>","is_active":true},{"name":"Karen","flag":"🇮🇹","quote":"<p>I had so much fun with the Adventure Summer Program. Schedule was packed with activities. Great international mix from all over the world. Happy to keep <strong>lovely memories</strong> of this great summer.</p>","is_active":true},{"name":"Abdel Rahman","flag":"🇬🇧","quote":"<p>I am a fan of travelling in summer. My brother Joe joined Manchester United Soccer Camp, but I preferred to enhance my English language. As I booked very late, there was no place in campus, so I stayed with a British family. I <strong>loved this experience</strong> very much and I am still in touch with this family, so are my parents.</p>","is_active":true}]}'
);
