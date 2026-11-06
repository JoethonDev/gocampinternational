import { existsSync, readFileSync } from "node:fs";
import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from "typescript";

// Compile dependency-free server helpers without starting Vite or a Worker.
const compiled = new Map();
export function loadTypeScript(relative) {
  function moduleUrl(url) {
    if (compiled.has(url.href)) return compiled.get(url.href);
    if (url.pathname.endsWith(".json")) {
      const source = "export default " + JSON.stringify(JSON.parse(readFileSync(url, "utf8")));
      const result = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
      compiled.set(url.href, result);
      return result;
    }
    const { outputText } = transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: {
        module: ModuleKind.ESNext,
        target: ScriptTarget.ES2022,
        jsx: JsxEmit.ReactJSX
      },
      fileName: url.pathname
    });
    const source = outputText
      .replace(/from "([^"]+)"/g, (_match, path) => {
        if (!path.startsWith(".")) return `from "${import.meta.resolve(path)}"`;
        const dependency = [path, path + ".ts", path + ".tsx"]
          .map((candidate) => new URL(candidate, url))
          .find((candidate) => existsSync(candidate));
        if (!dependency) throw new Error(`Missing test import: ${path}`);
        return `from "${moduleUrl(dependency)}"`;
      })
      .replace(/import "[^"]+\.css";/g, "");
    const result = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
    compiled.set(url.href, result);
    return result;
  }
  return import(moduleUrl(new URL(relative, import.meta.url)));
}
