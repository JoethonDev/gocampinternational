import { AdminFormSection } from "../../../components/admin/AdminFormSection";
import { MediaSelector } from "../../../components/MediaSelector";
import { ProgramOrder } from "../../../components/ProgramOrder";
import { Repeater } from "../../../components/Repeater";
import { RichTextInput } from "../../../components/RichTextInput";
import { StringList } from "../../../components/StringList";
import { asString, asStringArray, type ProgramRecord } from "../../../lib/domain";

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
      <AdminFormSection
        title="Hero & introduction"
        description="The destination banner, tagline and introductory copy."
      >
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
        <div className="col-md-6">
          <label className="form-label" htmlFor="tagline">
            Tagline
          </label>
          <input
            className="form-control"
            id="tagline"
            name="tagline"
            defaultValue={asString(item.tagline)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="color">
            Colour
          </label>
          <input
            className="form-control"
            id="color"
            name="color"
            defaultValue={asString(item.color)}
          />
        </div>
        <RichTextInput
          name="intro_text"
          label="Destination introduction"
          initial={asString(item.intro_text)}
        />
      </AdminFormSection>
      <AdminFormSection
        title="Linked programs"
        description="Choose and order the programs shown on this destination."
      >
        <ProgramOrder
          initial={asStringArray(item.program_ids)}
          programs={programs.map((program) => ({
            slug: program.slug,
            name: program.name,
            status: program.status,
            id: program.id
          }))}
        />
      </AdminFormSection>
      <AdminFormSection
        title="Highlights & statistics"
        description="Supporting content blocks under the hero."
      >
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
      </AdminFormSection>
      <AdminFormSection
        title="FAQ & gallery"
        description="Destination-specific questions and media."
      >
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
      </AdminFormSection>
    </>
  );
}
