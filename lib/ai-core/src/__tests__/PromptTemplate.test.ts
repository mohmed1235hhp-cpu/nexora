import { describe, it, expect } from "vitest";
import { PromptTemplate } from "../prompt/PromptTemplate";
import { PromptValidator } from "../prompt/PromptValidator";

describe("PromptTemplate", () => {
  it("renders variables", () => {
    const t = new PromptTemplate({
      id: "x",
      version: "1",
      role: "user",
      template: "Hello {{name}}!",
      variables: ["name"],
    });
    expect(t.render({ name: "World" })).toBe("Hello World!");
  });

  it("flags undeclared variables", () => {
    const errs = new PromptValidator().validate({
      id: "x",
      version: "1",
      role: "user",
      template: "Hi {{oops}}",
      variables: [],
    });
    expect(errs.length).toBeGreaterThan(0);
  });
});
