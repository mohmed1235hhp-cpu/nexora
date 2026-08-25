import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getStorage, setStorage } from "../index";
import type { StorageDriver } from "../index";

describe("LocalDriver (default storage driver)", () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await mkdtemp(path.join(tmpdir(), "storage-test-"));
    vi.stubEnv("STORAGE_LOCAL_ROOT", tmpRoot);
    vi.stubEnv("STORAGE_PUBLIC_URL", "http://localhost:3000/storage");
    vi.stubEnv("STORAGE_DRIVER", "local");
    setStorage(undefined as unknown as StorageDriver);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(tmpRoot, { recursive: true, force: true });
  });

  it("selects the local driver by default", () => {
    const driver = getStorage();
    expect(driver.name).toBe("local");
  });

  it("writes and reads back a file", async () => {
    const driver = getStorage();
    const body = new TextEncoder().encode("hello world");
    await driver.put("greetings/hello.txt", body);

    const out = await driver.get("greetings/hello.txt");
    expect(new TextDecoder().decode(out)).toBe("hello world");
  });

  it("head() reports size for an existing object and null for a missing one", async () => {
    const driver = getStorage();
    await driver.put("a.bin", new Uint8Array([1, 2, 3, 4]));

    const info = await driver.head("a.bin");
    expect(info?.size).toBe(4);

    const missing = await driver.head("does-not-exist.bin");
    expect(missing).toBeNull();
  });

  it("delete() removes the object", async () => {
    const driver = getStorage();
    await driver.put("to-delete.txt", new Uint8Array([1]));
    await driver.delete("to-delete.txt");

    const info = await driver.head("to-delete.txt");
    expect(info).toBeNull();
  });

  it("publicUrl() builds a URL under the configured public base", () => {
    const driver = getStorage();
    expect(driver.publicUrl("images/x.png")).toBe(
      "http://localhost:3000/storage/images/x.png",
    );
  });

  it("signedGetUrl()/signedPutUrl() fall back to the public URL", async () => {
    const driver = getStorage();
    const getUrl = await driver.signedGetUrl("f.txt");
    const putUrl = await driver.signedPutUrl("f.txt");
    expect(getUrl).toBe("http://localhost:3000/storage/f.txt");
    expect(putUrl).toBe("http://localhost:3000/storage/f.txt");
  });

  it("rejects path traversal attempts", async () => {
    const driver = getStorage();
    await expect(driver.get("../../etc/passwd")).rejects.toThrow(/path traversal/);
  });
});

describe("getStorage() driver selection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    setStorage(undefined as unknown as StorageDriver);
  });

  it("defaults to local when STORAGE_DRIVER is unset", () => {
    vi.stubEnv("STORAGE_DRIVER", "");
    setStorage(undefined as unknown as StorageDriver);
    expect(getStorage().name).toBe("local");
  });

  it("selects the s3 driver for STORAGE_DRIVER=s3", () => {
    vi.stubEnv("STORAGE_DRIVER", "s3");
    vi.stubEnv("STORAGE_BUCKET", "my-bucket");
    setStorage(undefined as unknown as StorageDriver);
    expect(getStorage().name).toBe("s3");
  });

  it("selects the r2 driver for STORAGE_DRIVER=r2", () => {
    vi.stubEnv("STORAGE_DRIVER", "r2");
    vi.stubEnv("STORAGE_BUCKET", "my-bucket");
    setStorage(undefined as unknown as StorageDriver);
    expect(getStorage().name).toBe("r2");
  });

  it("selects the supabase driver for STORAGE_DRIVER=supabase", () => {
    vi.stubEnv("STORAGE_DRIVER", "supabase");
    setStorage(undefined as unknown as StorageDriver);
    expect(getStorage().name).toBe("supabase");
  });

  it("throws when the s3 driver is selected without a bucket", () => {
    vi.stubEnv("STORAGE_DRIVER", "s3");
    vi.stubEnv("STORAGE_BUCKET", "");
    setStorage(undefined as unknown as StorageDriver);
    expect(() => getStorage()).toThrow(/STORAGE_BUCKET is required/);
  });
});

describe("setStorage()", () => {
  afterEach(() => {
    setStorage(undefined as unknown as StorageDriver);
  });

  it("overrides the active driver with a test double", async () => {
    const calls: string[] = [];
    const fake: StorageDriver = {
      name: "fake",
      async put(key) {
        calls.push(key);
        return { key };
      },
      async get() {
        return new Uint8Array();
      },
      async head() {
        return null;
      },
      async delete() {},
      async signedGetUrl(key) {
        return `https://fake/${key}`;
      },
      async signedPutUrl(key) {
        return `https://fake/${key}`;
      },
      publicUrl(key) {
        return `https://fake/${key}`;
      },
    };
    setStorage(fake);

    await getStorage().put("x.txt", new Uint8Array());
    expect(calls).toEqual(["x.txt"]);
  });
});
