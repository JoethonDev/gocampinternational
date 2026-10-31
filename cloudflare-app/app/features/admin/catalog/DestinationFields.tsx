import { MediaSelector } from "../../../components/MediaSelector";
import { ProgramOrder } from "../../../components/ProgramOrder";
import { Repeater } from "../../../components/Repeater";
import { RichTextInput } from "../../../components/RichTextInput";
import { StringList } from "../../../components/StringList";
import { asString, asStringArray, type ProgramRecord } from "../../../lib/domain";

const SIMPLE_FIELDS = [
  { key: "tagline", label: "Tagline" },
  { key: "color", label: "Colour" }
] as const;

export function DestinationFields({
  item,
  programs,
  uploadedMedia
}: {
  item: Record<string, unknown>;
  programs: ProgramRecord[];
  uploadedMedia: string[];
}) {
  return (
    <>
      <div className="col-md-6">
        <MediaSelector
          id="banner"
          name="banner"
          label="banner"
          initial={asString(item.banner)}
          uploaded={uploadedMedia}
        />
      </div>
      <div className="col-md-6">
        <MediaSelector
          id="intro_image"
          name="intro_image"
          label="intro image"
          initial={asString(item.intro_image)}
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
            defaultValue={asString(item[field.key])}
          />
        </div>
      ))}
      <RichTextInput
        name="intro_text"
        label="Destination introduction"
        initial={asString(item.intro_text)}
      />
      <ProgramOrder
        initial={asStringArray(item.program_ids)}
        programs={programs.map((program) => ({
          slug: program.slug,
          name: program.name,
          status: program.status,
          id: program.id
        }))}
      />
      <Repeater
        name="highlights"
        title="Destination highlights"
        initial={
          Array.isArray(item.highlights) ? (item.highlights as Record<string, unknown>[]) : []
        }
        fields={[
          { key: "icon", label: "Icon" },
          { key: "text", label: "Highlight text" }
        ]}
      />
      <Repeater
        name="stats"
        title="Destination statistics"
        initial={Array.isArray(item.stats) ? (item.stats as Record<string, unknown>[]) : []}
        fields={[
          { key: "number", label: "Number" },
          { key: "suffix", label: "Suffix" },
          { key: "label", label: "Label" },
          { key: "icon", label: "Icon" }
        ]}
      />
      <Repeater
        name="faq"
        title="Destination FAQs"
        initial={Array.isArray(item.faq) ? (item.faq as Record<string, unknown>[]) : []}
        fields={[
          { key: "q", label: "Question" },
          { key: "a", label: "Answer", kind: "long" }
        ]}
      />
      <StringList
        name="gallery"
        title="Destination gallery"
        initial={asStringArray(item.gallery)}
        media
        uploaded={uploadedMedia}
        addLabel="Add image"
      />
    </>
  );
}
