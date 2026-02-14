// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { readParamsFromURL, writeParamsToURL } from "./urlParams";

describe("readParamsFromURL", () => {
  beforeEach(() => {
    // Reset URL to no params
    history.replaceState(null, "", "/");
  });

  it("returns empty object when no params present", () => {
    expect(readParamsFromURL()).toEqual({});
  });

  it("reads seed, steps, stepLength from URL", () => {
    history.replaceState(null, "", "/?seed=100&steps=1000&stepLength=10");
    expect(readParamsFromURL()).toEqual({ seed: 100, steps: 1000, stepLength: 10 });
  });

  it("clamps values to valid ranges", () => {
    history.replaceState(null, "", "/?seed=99999&steps=0&stepLength=50");
    const params = readParamsFromURL();
    expect(params.seed).toBe(9999);
    expect(params.steps).toBe(10);
    expect(params.stepLength).toBe(20);
  });

  it("ignores non-numeric values", () => {
    history.replaceState(null, "", "/?seed=abc&steps=200");
    const params = readParamsFromURL();
    expect(params.seed).toBeUndefined();
    expect(params.steps).toBe(200);
  });

  it("rounds fractional values", () => {
    history.replaceState(null, "", "/?seed=42.7&steps=100.3");
    const params = readParamsFromURL();
    expect(params.seed).toBe(43);
    expect(params.steps).toBe(100);
  });

  it("reads walkType from URL", () => {
    history.replaceState(null, "", "/?walkType=levy");
    expect(readParamsFromURL()).toEqual({ walkType: "levy" });
  });

  it("ignores invalid walkType", () => {
    history.replaceState(null, "", "/?walkType=invalid");
    expect(readParamsFromURL().walkType).toBeUndefined();
  });

  it("reads levyAlpha from URL", () => {
    history.replaceState(null, "", "/?levyAlpha=2.0");
    expect(readParamsFromURL()).toEqual({ levyAlpha: 2.0 });
  });

  it("clamps levyAlpha to valid range", () => {
    history.replaceState(null, "", "/?levyAlpha=5.0");
    expect(readParamsFromURL().levyAlpha).toBe(3.0);
  });
});

describe("writeParamsToURL", () => {
  beforeEach(() => {
    history.replaceState(null, "", "/");
  });

  it("omits default values from URL", () => {
    writeParamsToURL({ seed: 42, steps: 500, stepLength: 5, walkType: "isotropic" });
    expect(window.location.search).toBe("");
  });

  it("writes non-default values to URL", () => {
    writeParamsToURL({ seed: 100, steps: 1000, stepLength: 10, walkType: "isotropic" });
    const sp = new URLSearchParams(window.location.search);
    expect(sp.get("seed")).toBe("100");
    expect(sp.get("steps")).toBe("1000");
    expect(sp.get("stepLength")).toBe("10");
  });

  it("only writes changed values", () => {
    writeParamsToURL({ seed: 42, steps: 1000, stepLength: 5, walkType: "isotropic" });
    const sp = new URLSearchParams(window.location.search);
    expect(sp.has("seed")).toBe(false);
    expect(sp.get("steps")).toBe("1000");
    expect(sp.has("stepLength")).toBe(false);
  });

  it("writes walkType when non-default", () => {
    writeParamsToURL({ seed: 42, steps: 500, stepLength: 5, walkType: "levy", levyAlpha: 2.0 });
    const sp = new URLSearchParams(window.location.search);
    expect(sp.get("walkType")).toBe("levy");
    expect(sp.get("levyAlpha")).toBe("2");
  });

  it("omits levyAlpha when it equals default 1.5", () => {
    writeParamsToURL({ seed: 42, steps: 500, stepLength: 5, walkType: "levy", levyAlpha: 1.5 });
    const sp = new URLSearchParams(window.location.search);
    expect(sp.get("walkType")).toBe("levy");
    expect(sp.has("levyAlpha")).toBe(false);
  });
});
