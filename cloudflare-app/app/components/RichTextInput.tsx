import { useEffect, useRef, useState } from "react";

type FormatAction = {
  label: string;
  icon: string;
  command: string;
  value?: string;
  divider?: boolean;
};

const ACTIONS: FormatAction[] = [
  { label: "Bold", icon: "bi-type-bold", command: "bold" },
  { label: "Italic", icon: "bi-type-italic", command: "italic" },
  { label: "Underline", icon: "bi-type-underline", command: "underline" },
  { label: "Heading 2", icon: "bi-type-h2", command: "formatBlock", value: "h2", divider: true },
  { label: "Heading 3", icon: "bi-type-h3", command: "formatBlock", value: "h3" },
  { label: "Paragraph", icon: "bi-paragraph", command: "formatBlock", value: "p" },
  {
    label: "Bulleted list",
    icon: "bi-list-ul",
    command: "insertUnorderedList",
    divider: true
  },
  { label: "Numbered list", icon: "bi-list-ol", command: "insertOrderedList" },
  { label: "Undo", icon: "bi-arrow-counterclockwise", command: "undo", divider: true },
  { label: "Redo", icon: "bi-arrow-clockwise", command: "redo" }
];

export function RichTextInput({
  name,
  label,
  initial,
  externalValue,
  onChange
}: {
  name?: string;
  label: string;
  initial?: string;
  externalValue?: string;
  onChange?: (value: string) => void;
}) {
  const [local, setLocal] = useState(initial || "");
  const editor = useRef<HTMLDivElement>(null);
  const selection = useRef<Range | null>(null);
  const html = externalValue ?? local;
  const fieldId = "rich-" + (name || label).replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();

  const setHtml = (next: string) => {
    if (externalValue === undefined) setLocal(next);
    onChange?.(next);
  };

  useEffect(() => {
    const element = editor.current;
    if (!element || document.activeElement === element) return;
    if (element.innerHTML !== html) element.innerHTML = html || "";
  }, [html]);

  const rememberSelection = () => {
    const current = window.getSelection();
    if (current?.rangeCount) selection.current = current.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    if (!selection.current) return;
    const current = window.getSelection();
    if (!current) return;
    current.removeAllRanges();
    current.addRange(selection.current);
  };

  const sync = () => {
    const element = editor.current;
    if (!element) return;
    const next = element.innerHTML === "<br>" ? "" : element.innerHTML;
    setHtml(next);
  };

  const run = (command: string, value?: string) => {
    const element = editor.current;
    if (!element) return;
    element.focus();
    restoreSelection();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, value);
    rememberSelection();
    sync();
  };

  const addLink = () => {
    const url = window.prompt("Link URL (https://…, mailto:… or /path)", "https://");
    if (!url) return;
    run("createLink", url);
  };

  const clearFormatting = () => {
    run("removeFormat");
    run("formatBlock", "p");
  };

  return (
    <div className="col-12">
      <label className="form-label fw-semibold" htmlFor={fieldId}>
        {label}
      </label>
      <div className="rich-editor">
        <div className="rich-editor-toolbar" role="toolbar" aria-label={`${label} formatting`}>
          {ACTIONS.map((action, index) => (
            <span className="rich-editor-tool-group" key={action.label}>
              {action.divider && index > 0 && <span className="rich-editor-divider" />}
              <button
                type="button"
                className="rich-editor-tool"
                title={action.label}
                aria-label={action.label}
                onMouseDown={(event) => {
                  event.preventDefault();
                  rememberSelection();
                }}
                onClick={() => run(action.command, action.value)}
              >
                <i className={`bi ${action.icon}`} />
              </button>
            </span>
          ))}
          <span className="rich-editor-tool-group">
            <span className="rich-editor-divider" />
            <button
              type="button"
              className="rich-editor-tool"
              title="Add link"
              aria-label="Add link"
              onMouseDown={(event) => {
                event.preventDefault();
                rememberSelection();
              }}
              onClick={addLink}
            >
              <i className="bi bi-link-45deg" />
            </button>
            <button
              type="button"
              className="rich-editor-tool"
              title="Clear formatting"
              aria-label="Clear formatting"
              onMouseDown={(event) => {
                event.preventDefault();
                rememberSelection();
              }}
              onClick={clearFormatting}
            >
              <i className="bi bi-eraser" />
            </button>
          </span>
        </div>
        <div
          ref={editor}
          id={fieldId}
          className="rich-editor-surface"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          data-placeholder={`Write ${label.toLowerCase()}…`}
          spellCheck
          onInput={sync}
          onBlur={sync}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
        />
      </div>
      {name && <input type="hidden" name={name} value={html} />}
      <p className="small text-secondary mt-1 mb-0">
        Type directly, select text and use the toolbar. The public page applies the same formatting.
      </p>
    </div>
  );
}
