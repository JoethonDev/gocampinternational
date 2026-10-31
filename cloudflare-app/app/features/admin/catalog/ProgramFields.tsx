import { AdminFormSection } from "../../../components/admin/AdminFormSection";
import { MediaSelector } from "../../../components/MediaSelector";
import { Repeater } from "../../../components/Repeater";
import { RichTextInput } from "../../../components/RichTextInput";
import { StringList } from "../../../components/StringList";
import { asNumber, asString, asStringArray, type CategoryRecord } from "../../../lib/domain";

const SIMPLE_FIELDS = [
  { key: "tagline", label: "Tagline" },
  { key: "price", label: "Price" },
  { key: "level", label: "Level" },
  { key: "color", label: "Colour" },
  { key: "duration", label: "Duration" },
  { key: "order", label: "Order" }
] as const;

export function ProgramFields({
  item,
  categories,
  uploadedMedia
}: {
  item: Record<string, unknown>;
  categories: CategoryRecord[];
  uploadedMedia: string[];
}) {
  return (
    <>
      <AdminFormSection
        title="Placement & card"
        description="Where the program appears and how its card is presented."
      >
        <div className="col-md-6">
          <label className="form-label" htmlFor="programCategory">
            Category
          </label>
          <select
            className="form-select"
            id="programCategory"
            name="category_slug"
            defaultValue={asString(item.category_slug)}
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option value={category.slug} key={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <MediaSelector
            id="image"
            name="image"
            label="card image"
            initial={asString(item.image)}
            uploaded={uploadedMedia}
          />
        </div>
        {SIMPLE_FIELDS.map((field) => (
          <div className="col-md-6" key={field.key}>
            <label className="form-label" htmlFor={field.key}>
              {field.label}
            </label>
            <input
              className="form-control"
              id={field.key}
              name={field.key}
              defaultValue={item[field.key] == null ? "" : String(item[field.key])}
            />
          </div>
        ))}
        {(["min", "max"] as const).map((key) => (
          <div className="col-md-6" key={key}>
            <label className="form-label" htmlFor={`age-${key}`}>
              Age {key}
            </label>
            <input
              type="number"
              min="0"
              max="120"
              className="form-control"
              id={`age-${key}`}
              name={`ages_${key}`}
              defaultValue={String(
                asNumber(item.ages && (item.ages as Record<string, unknown>)[key]) ?? ""
              )}
            />
          </div>
        ))}
      </AdminFormSection>
      <AdminFormSection
        title="Description"
        description="Rich text shown in the program detail content."
      >
        <RichTextInput
          name="description"
          label="Program description"
          initial={asString(item.description)}
        />
      </AdminFormSection>
      <AdminFormSection
        title="Lists & gallery"
        description="Card highlights and the program media set."
      >
        <StringList
          name="highlights"
          title="Highlights"
          initial={asStringArray(item.highlights)}
          placeholder="Short highlight shown on the program card"
        />
        <StringList
          name="includes"
          title="What is included"
          initial={asStringArray(item.includes)}
          addLabel="Add included item"
        />
        <StringList
          name="excludes"
          title="What is not included"
          initial={asStringArray(item.excludes)}
          addLabel="Add excluded item"
        />
        <StringList
          name="badges"
          title="Badges"
          initial={asStringArray(item.badges)}
          addLabel="Add badge"
        />
        <StringList
          name="gallery"
          title="Program gallery"
          initial={asStringArray(item.gallery)}
          media
          uploaded={uploadedMedia}
          addLabel="Add image"
        />
      </AdminFormSection>
      <AdminFormSection
        title="Daily schedule"
        description="Optional timetable entries shown in the editor preview."
      >
        <Repeater
          name="schedule"
          title="Daily schedule"
          initial={Object.entries((item.schedule as Record<string, unknown> | undefined) || {}).map(
            ([time, description]) => ({ time, description })
          )}
          fields={[
            { key: "time", label: "Time" },
            { key: "description", label: "Activity / description", kind: "long" }
          ]}
        />
      </AdminFormSection>
    </>
  );
}
