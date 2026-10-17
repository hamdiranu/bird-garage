import { vi } from "vitest";

/* A stand-in 2D canvas context for jsdom, which has none: every drawing call is a spy, so tests can check what
   was drawn without pixels. */

export function fakeContext2D() {
  const gradient = { addColorStop: vi.fn() };
  const ctx = new Proxy({ canvas: null, gradient } as Record<string, unknown>, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (prop === "createRadialGradient" || prop === "createLinearGradient") return (target[prop] = vi.fn(() => gradient));
      if (prop === "measureText") return (target[prop] = vi.fn(() => ({ width: 10 })));
      return (target[prop] = vi.fn());
    },
    set(target, prop: string, value) { target[prop] = value; return true; },
  });
  return ctx as unknown as CanvasRenderingContext2D & { gradient: typeof gradient };
}

/** Make every canvas hand out a fresh fake 2D context, and return the ones made. */
export function withFakeCanvas() {
  const made: ReturnType<typeof fakeContext2D>[] = [];
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(((type: string) => {
    if (type !== "2d") return null;
    const ctx = fakeContext2D();
    made.push(ctx);
    return ctx;
  }) as never);
  return made;
}
