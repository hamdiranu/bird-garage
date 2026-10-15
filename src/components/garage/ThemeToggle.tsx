import { Icon } from "@/components/ui/Icon";
import type { Theme } from "@/lib/theme";

/** Sun in light mode, moon in dark; the two swap with a quarter turn. */
export function ThemeToggle({ theme, onToggle, className }: { theme: Theme; onToggle: () => void; className?: string }) {
  const light = theme === "light";
  const icon = "absolute h-5 w-5 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.4,0,.2,1)]";
  return (
    <button
      onClick={onToggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Dark mode" : "Light mode"}
      className={`relative h-10 w-10 place-items-center overflow-hidden rounded-full border border-edge bg-(--chip) text-soft transition-colors hover:border-brand hover:text-ink 2xl:h-11 2xl:w-11 ${className ?? ""}`}
    >
      <Icon name="moon" className={`${icon} rotate-0 scale-100 opacity-100 light:rotate-90 light:scale-50 light:opacity-0`} />
      <Icon name="sun" className={`${icon} -rotate-90 scale-50 text-[#f2a516] opacity-0 light:rotate-0 light:scale-100 light:opacity-100`} />
    </button>
  );
}
