-- Special Interests Camps: approved November 1, 2026 staging category activation.
-- Apply AFTER pr39-approved-inactive.sql and pr39-email-20261030-staging.sql.
-- ONLY staging: gocamp-staging-db; does not touch Cloudflare production.
-- Keep unapproved legacy records, do not delete links or media; disable by status.
-- Idempotent. Earlier CMS edits are preserved: old category editorial copy is replaced
-- only when its known initial revision (0) and legacy first section match.
PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;

-- First hide all unrelated active programs from all category/destination public views.
UPDATE catalog_entities
SET status='inactive',
    content_json=json_set(content_json,'$.status','inactive'),
    revision=revision+1,updated_at=unixepoch()
WHERE kind='program' AND category_slug='special-interests-camps'
  AND status='active'
  AND slug NOT IN ('austria-adventure-camp','uk-creative-summer');

-- Only the two approved programs are active; do not restore items deliberately trashed.
UPDATE catalog_entities
SET status='active',
    content_json=json_set(content_json,'$.status','active'),
    revision=revision+1,updated_at=unixepoch()
WHERE kind='program' AND category_slug='special-interests-camps'
  AND status='inactive'
  AND slug IN ('austria-adventure-camp','uk-creative-summer');

-- Remove stale category copy advertising parent/child, standalone filmmaking,
-- and standalone fashion/art programs that are not in the approved plan.
UPDATE catalog_entities
SET content_json=json_set(content_json,
    '$.intro','<p>Discover focused experiences in creativity and adventure through two GoCamp programs. Adventure Camp in Austria offers three-hour morning sessions in a chosen area such as sports, languages, arts or adventure, followed by shared afternoon and evening activities with campers from different programs.</p><p>Creative Summer in Cambridge, UK, welcomes students aged 12–17 to explore seven creative disciplines, from 3D design and acting to film making and game design, using professional-style studio facilities. Choose the experience that matches your interests and explore each program for available details.</p>',
    '$.intro_image','/media/a91e66de-6fce-5e12-b63f-a919564ec653',
    '$.sections',json('[{"title":"Adventure Camp — Austria","content":"<p>Choose a focus across sports, language, arts or adventure. Three-hour specialized morning sessions are followed by shared afternoon and evening activities that encourage friendship and cultural exchange.</p>","image":"/media/a91e66de-6fce-5e12-b63f-a919564ec653","is_active":true},{"title":"Creative Summer — Cambridge, UK","content":"<p>For ages 12–17, Creative Summer offers 3D Design; Acting and Professional Performance; 3D Modelling, Sculpting, Animation and Rigging; Branding and Advertising; Fashion Styling; Film Making; and Game Design. Students learn and collaborate in professional-style studio facilities.</p>","image":"","is_active":true}]')),
    revision=revision+1,updated_at=unixepoch()
WHERE kind='category' AND slug='special-interests-camps'
  AND revision=0
  AND json_extract(content_json,'$.sections[0].title')='Parent & Child Camp';

-- Activate the category only after its unrelated live programs have been disabled.
UPDATE catalog_entities
SET status='active',
    content_json=json_set(content_json,'$.status','active'),
    revision=revision+1,updated_at=unixepoch()
WHERE kind='category' AND slug='special-interests-camps'
  AND status!='active';

COMMIT;
