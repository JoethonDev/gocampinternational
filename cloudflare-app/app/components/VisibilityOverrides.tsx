import { useState } from "react";
import { AdminFormSection } from "./admin/AdminFormSection";

const FIELDS: Record<string, string[]> = {
  program: [
    "card_image",
    "card_tagline",
    "card_highlights",
    "modal_details",
    "modal_description",
    "modal_highlights",
    "modal_schedule",
    "modal_gallery",
    "modal_includes",
    "modal_excludes"
  ],
  destination: [
    "hero",
    "intro",
    "highlights",
    "stats",
    "programs",
    "gallery",
    "destination_gallery",
    "faq",
    "testimonials"
  ],
  category: ["hero", "intro", "sections", "programs", "gallery", "testimonials"]
};

type OverrideValue = "inherit" | "show" | "hide";

function overrideValue(values: Record<string, unknown>, key: string): OverrideValue {
  if (!Object.hasOwn(values, key)) return "inherit";
  return values[key] === true ? "show" : values[key] === false ? "hide" : "inherit";
}

export function VisibilityOverrides({
  kind,
  initial
}: {
  kind: "program" | "destination" | "category";
  initial: Record<string, unknown>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initial);

  const setValue = (key: string, value: OverrideValue) =>
    setValues((current) => {
      const next = { ...current };
      if (value === "inherit") delete next[key];
      else next[key] = value === "show";
      return next;
    });

  return (
    <AdminFormSection
      title="Page visibility overrides"
      description="Inherit uses the global setting. Use Show or Hide only for this particular record."
    >
      <input type="hidden" name="visibility_overrides" value={JSON.stringify(values)} />
      {FIELDS[kind].map((key) => {
        const policyDisabled =
          (kind === "destination" || kind === "category") && key.includes("gallery");
        return (
          <div key={key} className="col-sm-6 col-lg-4">
            <label className="admin-visibility-option">
              <span className="small text-capitalize d-block mb-1">{key.replaceAll("_", " ")}</span>
              <select
                className="form-select form-select-sm"
                value={policyDisabled ? "hide" : overrideValue(values, key)}
                disabled={policyDisabled}
                onChange={(event) => setValue(key, event.target.value as OverrideValue)}
              >
                <option value="inherit">Inherit global</option>
                <option value="show">Show</option>
                <option value="hide">Hide</option>
              </select>
              {policyDisabled && (
                <small className="text-secondary">Disabled by website policy</small>
              )}
            </label>
          </div>
        );
      })}
    </AdminFormSection>
  );
}
