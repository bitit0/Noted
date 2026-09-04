import { relativeTime } from "./components/utils/relativeTime";

describe("relativeTime", () => {
  test("returns 'just now' for very recent times", () => {
    expect(relativeTime(Date.now() - 5 * 1000)).toBe("just now");
  });

  test("formats minutes", () => {
    expect(relativeTime(Date.now() - 5 * 60 * 1000)).toBe("5m ago");
  });

  test("formats hours", () => {
    expect(relativeTime(Date.now() - 3 * 60 * 60 * 1000)).toBe("3h ago");
  });

  test("handles Firestore-style timestamps ({ seconds })", () => {
    const secondsAgo = Math.floor((Date.now() - 2 * 60 * 1000) / 1000);
    expect(relativeTime({ seconds: secondsAgo })).toBe("2m ago");
  });

  test("returns empty string for falsy input", () => {
    expect(relativeTime(null)).toBe("");
    expect(relativeTime(undefined)).toBe("");
  });
});
