import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { twoDigits } from "@/lib/format";
import type { Theme } from "@/lib/theme";
import type { FilterKey, SortKey } from "@/types/fleet";
import { FilterPills } from "./FilterPills";
import { HeaderMenu } from "./HeaderMenu";
import { LanguageToggle } from "./LanguageToggle";
import { SortMenu } from "./SortMenu";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  filter: FilterKey;
  onFilter: (f: FilterKey) => void;
  sort: SortKey;
  onSort: (sort: SortKey) => void;
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
  hotspots: boolean;
  onToggleHotspots: () => void;
  onOpenTimeline: () => void;
  reduceMotion: boolean;
}

/** One row from tablet up: brand | filter pills (scrolling sideways if they run out of room) and the sort button |
    counter, language, theme and menu. Phones put the pills and sort on a row of their own, and keep language in the
    menu. */
export function Header({
  filter, onFilter, sort, onSort, position, count, theme, onToggleTheme, focus, canFocus, onToggleFocus, spin, onToggleSpin, showroom, onToggleShowroom,
  hotspots, onToggleHotspots, onOpenTimeline, reduceMotion,
}: HeaderProps) {
  return (
    <header className="relative z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-edge bg-[linear-gradient(180deg,var(--hdr-a),var(--hdr-b))] px-gut shadow-[0_8px_30px_-12px_var(--drop)] backdrop-blur-md sm:gap-x-4 md:flex md:gap-x-2 2xl:gap-x-5">
      <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2.5 py-2.5 md:flex-none" aria-label="Bird Garage">
        <Image src="/icons/bluebird.png" alt="" width={44} height={44} loading="eager" className="h-9 w-9 drop-shadow-[0_2px_10px_rgba(61,139,255,.45)] 2xl:h-11 2xl:w-11" />
        {/* the caps of this face sit low in a leading-none box, so the title is lifted to centre on the badge; it
            shrinks a little on the narrowest phones to make room for the counter, theme and menu buttons */}
        <span className="whitespace-nowrap bg-gradient-to-b from-(--title-a) to-(--title-b) bg-clip-text pr-1 font-display text-[21px] font-extrabold italic uppercase leading-none tracking-[.02em] -translate-y-[.12em] text-transparent max-[374px]:text-[19px] max-[359px]:text-[17px] sm:text-[24px] xl:text-[28px] 2xl:text-[32px]">
          Bird Garage
        </span>
      </a>

      <div className="flex items-center gap-1.5 sm:gap-2 md:order-last md:flex-none">
        <div aria-live="polite" aria-atomic="true" className="flex h-10 items-center gap-2 rounded-full border border-edge bg-(--chip) px-3 tabular-nums sm:px-3.5 2xl:h-11 2xl:px-4">
          <Icon name="car" className="hidden h-5 w-5 text-soft xl:block" />
          <b className="font-display text-[22px] font-bold leading-none text-plate [text-shadow:0_0_12px_rgba(245,197,24,.45)] 2xl:text-[26px]">{twoDigits(position + 1)}</b>
          <span className="text-xs font-semibold text-dim max-[359px]:hidden">/ {twoDigits(count)}</span>
        </div>
        <LanguageToggle className="hidden sm:flex" />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} className="grid" />
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
          hotspots={hotspots}
          onToggleHotspots={onToggleHotspots}
          onOpenTimeline={onOpenTimeline}
        />
      </div>

      {/* the pills scroll on their own; the sort button stays at their end, outside the scroller so its list isn't clipped */}
      <div className="col-span-2 flex min-w-0 items-center gap-1.5 pb-2.5 md:flex-1 md:py-2.5 2xl:gap-2.5">
        <FilterPills filter={filter} onChange={onFilter} reduceMotion={reduceMotion} />
        <SortMenu sort={sort} onChange={onSort} />
      </div>
    </header>
  );
}
