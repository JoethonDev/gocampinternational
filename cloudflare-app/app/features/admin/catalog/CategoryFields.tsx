import { AdminFormSection } from "../../../components/admin/AdminFormSection";
import { MediaSelector } from "../../../components/MediaSelector";
import { Repeater } from "../../../components/Repeater";
import { RichTextInput } from "../../../components/RichTextInput";
import { StringList } from "../../../components/StringList";
import { asString, asStringArray } from "../../../lib/domain";

export function CategoryFields({
  item,
  uploadedMedia
}: {
  item: Record<string, unknown>;
  uploadedMedia: string[];
}) {
  return (
    <>
      <AdminFormSection
        title="Hero & introduction"
        description="Category banner and introductory copy."
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
        <RichTextInput name="intro" label="Category introduction" initial={asString(item.intro)} />
      </AdminFormSection>
      <AdminFormSection
        title="Content sections"
        description="Optional editorial blocks below the category intro."
      >
        <Repeater
          name="sections"
          title="Category content sections"
          uploaded={uploadedMedia}
          initial={Array.isArray(item.sections) ? (item.sections as Record<string, unknown>[]) : []}
          fields={[
            { key: "title", label: "Section title" },
            { key: "image", label: "Image", kind: "media" },
            { key: "content", label: "Content", kind: "rich" },
            { key: "is_active", label: "Visible", kind: "flag" }
          ]}
        />
      </AdminFormSection>
      <AdminFormSection title="Gallery" description="Images available to this category.">
        <StringList
          name="gallery"
          title="Category gallery"
          initial={asStringArray(item.gallery)}
          media
          uploaded={uploadedMedia}
          addLabel="Add image"
        />
      </AdminFormSection>
    </>
  );
}
