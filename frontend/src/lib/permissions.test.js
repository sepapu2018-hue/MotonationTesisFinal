import { can } from "./permissions";

describe("can", () => {
  it("deniega si permissions no es un array", () => {
    expect(can(undefined, "view_reports")).toBe(false);
    expect(can(null, "view_reports")).toBe(false);
    expect(can("view_reports", "view_reports")).toBe(false);
  });

  it("permite todo si el array incluye 'all'", () => {
    expect(can(["all"], "view_reports")).toBe(true);
    expect(can(["all"], "cualquier_cosa")).toBe(true);
  });

  it("permite solo la acción presente en el array", () => {
    expect(can(["view_products", "view_reports"], "view_reports")).toBe(true);
    expect(can(["view_products"], "view_reports")).toBe(false);
  });

  it("deniega si el array está vacío", () => {
    expect(can([], "view_reports")).toBe(false);
  });
});
