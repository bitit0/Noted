import { u8ToB64, b64ToU8 } from "./base64";

describe("base64 binary helpers", () => {
  test("round-trips an arbitrary byte array", () => {
    const bytes = new Uint8Array([0, 1, 2, 254, 255, 128, 42, 7]);
    const restored = b64ToU8(u8ToB64(bytes));
    expect(Array.from(restored)).toEqual(Array.from(bytes));
  });

  test("round-trips an empty array", () => {
    expect(u8ToB64(new Uint8Array([]))).toBe("");
    expect(b64ToU8("").length).toBe(0);
  });

  test("round-trips a large array (exceeds the chunk size)", () => {
    const big = new Uint8Array(70000);
    for (let i = 0; i < big.length; i += 1) big[i] = i % 256;
    const restored = b64ToU8(u8ToB64(big));
    expect(restored.length).toBe(big.length);
    expect(restored[0]).toBe(big[0]);
    expect(restored[69999]).toBe(big[69999]);
  });
});
