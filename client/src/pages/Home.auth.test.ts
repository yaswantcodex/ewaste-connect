/* Regression guard: the full-stack Home page must keep its auth hook wiring defined. */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Home auth wiring", () => {
  it("imports useAuth and uses the scaffold auth actions", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

    expect(source).toContain('import { useAuth } from "@/_core/hooks/useAuth";');
    expect(source).toContain("const { isAuthenticated, logout } = useAuth();");
    expect(source).toContain("startLogin();");
  });
});
