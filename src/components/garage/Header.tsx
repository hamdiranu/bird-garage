import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { twoDigits } from "@/lib/format";
import type { Theme } from "@/lib/theme";
import type { FilterKey } from "@/types/fleet";
import { FilterPills } from "./FilterPills";
import { HeaderMenu } from "./HeaderMenu";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  filter: FilterKey;
  onFilter: (f: FilterKey) => void;
  /** Position of the current car among the filtered ones (0-based), and how many there are. */
  position: number;
  count: number;
  theme: Theme;
  onToggleTheme: () => void;
  focus: boolean;
  canFocus: boolean;
  onToggleFocus: () => void;
  spin: boolean;
  onToggleSpin: () => void;
  showroom: boolean;
  onToggleShowroom: () => void;
  reduceMotion: boolean;
}

/** One row from tablet up: brand | filter pills (scrolling sideways if they run out of room) | counter,
    language, theme and menu. Phones put the pills on a row of their own, and keep language and theme in the menu. */
export function Header({
  filter, onFilter, position, count, theme, onToggleTheme, focus, canFocus, onToggleFocus, spin, onToggleSpin, showroom, onToggleShowroom, reduceMotion,
}: HeaderProps) {
  return (
    <header className="relative z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-edge bg-[linear-gradient(180deg,var(--hdr-a),var(--hdr-b))] px-gut shadow-[0_8px_30px_-12px_var(--drop)] backdrop-blur-md md:flex md:gap-x-2 2xl:gap-x-5">
      <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2.5 py-2.5 md:flex-none" aria-label="Bird Garage">
        <Image src="/icons/bluebird.png" alt="" width={44} height={44} loading="eager" className="h-9 w-9 drop-shadow-[0_2px_10px_rgba(61,139,255,.45)] 2xl:h-11 2xl:w-11" />
        {/* the caps of this face sit low in a leading-none box, so the title is lifted to centre on the badge */}
        <span className="whitespace-nowrap bg-gradient-to-b from-(--title-a) to-(--title-b) bg-clip-text pr-1 font-display text-[21px] font-extrabold italic uppercase leading-none tracking-[.02em] -translate-y-[.12em] text-transparent sm:text-[24px] xl:text-[28px] 2xl:text-[32px]">
          Bird Garage
        </span>
      </a>

      <div className="flex items-center gap-2 md:order-last md:flex-none">
        <div aria-live="polite" aria-atomic="true" className="flex h-10 items-center gap-2 rounded-full border border-edge bg-(--chip) px-3.5 tabular-nums 2xl:h-11 2xl:px-4">
          <Icon name="car" className="hidden h-5 w-5 text-soft xl:block" />
          <b className="font-display text-[22px] font-bold leading-none text-plate [text-shadow:0_0_12px_rgba(245,197,24,.45)] 2xl:text-[26px]">{twoDigits(position + 1)}</b>
          <span className="text-xs font-semibold text-dim">/ {twoDigits(count)}</span>
        </div>
        <LanguageToggle className="hidden sm:flex" />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} className="hidden sm:grid" />
        <HeaderMenu
          light={theme === "light"}
          onToggleTheme={onToggleTheme}
          focus={focus}
          canFocus={canFocus}
          onToggleFocus={onToggleFocus}
          spin={spin}
          onToggleSpin={onToggleSpin}
          showroom={showroom}
          onToggleShowroom={onToggleShowroom}
        />
      </div>

      <FilterPills filter={filter} onChange={onFilter} reduceMotion={reduceMotion} />
    </header>
  );
}
