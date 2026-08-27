import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guards the message catalog itself. `JSON.parse` silently keeps only the
 * last of a set of duplicate keys, so a catalog can carry two entries under
 * the same path and look fine to every runtime check -- while next-intl
 * resolves the surviving one and renders the raw key path in the UI.
 *
 * That is exactly what happened to `pages.orders.detail.hub.editIntake`: a
 * string label and a dialog namespace shared one key, the object won, and the
 * hub header rendered "pages.orders.detail.hub.editIntake" as its button.
 */

const CATALOG = join(process.cwd(), "messages", "he.json");

/** Duplicate key paths in the raw text, which a parsed object cannot reveal. */
function findDuplicateKeys(source: string): string[] {
  const duplicates: string[] = [];
  const path: string[] = [];
  const seenPerDepth: Record<string, boolean>[] = [{}];
  const token = /"((?:[^"\\]|\\.)*)"\s*:|([{}])/g;

  let match: RegExpExecArray | null;
  while ((match = token.exec(source)) !== null) {
    const [, key, brace] = match;
    if (brace === "{") {
      seenPerDepth.push({});
    } else if (brace === "}") {
      seenPerDepth.pop();
      path.pop();
    } else if (key !== undefined) {
      const depth = seenPerDepth.length - 1;
      const seen = seenPerDepth[depth];
      if (seen[key]) {
        duplicates.push(
          [...path.slice(0, depth), key].filter(Boolean).join("."),
        );
      }
      seen[key] = true;
      path[depth] = key;
    }
  }
  return duplicates;
}

describe("he.json message catalog", () => {
  it("declares no key twice inside the same object", () => {
    expect(findDuplicateKeys(readFileSync(CATALOG, "utf8"))).toEqual([]);
  });

  it("resolves the hub's edit-intake button label to a string", () => {
    const messages = JSON.parse(readFileSync(CATALOG, "utf8"));
    const hub = messages.pages.orders.detail.hub;

    expect(typeof hub.editIntake.button).toBe("string");
  });
});
