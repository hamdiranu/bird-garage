import { Icon } from "@/components/ui/Icon";

/* Buttons floating over the stage. They follow --inset (how far the side cards reach in), set on the stage. */

/** Previous/next car: bottom corners on small screens, beside the car at mid-height on large ones. */
export function NavButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      aria-label={dir === "prev" ? "Previous car" : "Next car"}
      onClick={onClick}
      className={`absolute bottom-4 z-[3] grid h-11 w-11 place-items-center rounded-full border border-(--float-edge) bg-(--float) text-ink shadow-[0_0_18px_rgba(61,139,255,.3)] backdrop-blur-sm transition-[background,box-shadow,left,right] duration-500 hover:bg-brand hover:shadow-[0_0_26px_rgba(61,139,255,.7)] md:bottom-5 lg:bottom-auto lg:top-1/2 lg:h-14 lg:w-14 lg:-translate-y-1/2 ${dir === "prev" ? "left-3 md:left-5 lg:left-[calc(var(--inset)+20px)]" : "right-3 md:right-5 lg:right-[calc(var(--inset)+20px)]"}`}
    >
      <Icon name={dir === "prev" ? "left" : "right"} className="h-6 w-6" strokeWidth={2.2} />
    </button>
  );
}

/** Top-right toggle for focus view (large screens only). */
export function FocusButton({ focused, onClick }: { focused: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={focused}
      aria-label={focused ? "Show the info panels" : "Focus on the car"}
      title={focused ? "Show panels (F)" : "Focus view (F)"}
      className="absolute right-[calc(var(--inset)+16px)] top-5 z-[3] grid h-10 w-10 place-items-center rounded-full border border-edge bg-(--float) text-soft backdrop-blur-sm transition-[right,color,border-color] duration-500 hover:border-brand hover:text-ink"
    >
      <Icon name={focused ? "collapse" : "expand"} className="h-5 w-5" />
    </button>
  );
}

/** Tab on the screen edge that brings the cards back from focus view. */
export function EdgeHandle({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Show the info panels"
      className={`glass absolute top-1/2 z-[3] grid h-44 w-8 -translate-y-1/2 place-items-center text-soft transition-colors hover:text-ink ${side === "left" ? "left-0 rounded-r-2xl border-l-0" : "right-0 rounded-l-2xl border-r-0"}`}
    >
      <Icon name={side === "left" ? "right" : "left"} className="h-5 w-5" />
    </button>
  );
}
