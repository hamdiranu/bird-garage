import { useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useDismiss } from "@/hooks/useDismiss";
import { useI18n } from "@/i18n/I18nProvider";
import { LanguageToggle } from "./LanguageToggle";

interface HeaderMenuProps {
  light: boolean;
  onToggleTheme: () => void;
  focus: boolean;
  /** Focus view is only offered where the screen is wide enough for it. */
  canFocus: boolean;
  onToggleFocus: () => void;
  spin: boolean;
  onToggleSpin: () => void;
  showroom: boolean;
  onToggleShowroom: () => void;
  hotspots: boolean;
  onToggleHotspots: () => void;
  onOpenTimeline: () => void;
}

/** The ☰ button and its panel: display switches, language, the fleet timeline and the keyboard shortcuts. Closes
    on a click outside or Esc. */
export function HeaderMenu({
  light, onToggleTheme, focus, canFocus, onToggleFocus, spin, onToggleSpin, showroom, onToggleShowroom, hotspots, onToggleHotspots, onOpenTimeline,
}: HeaderMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useDismiss(open, () => ref.current, () => setOpen(false));

  const keys = t.menu.keys;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t.menu.open}
        className="grid h-10 w-10 place-items-center rounded-full text-soft transition-colors hover:text-ink 2xl:h-11 2xl:w-11"
      >
        <Icon name={open ? "x" : "menu"} className="h-6 w-6" />
      </button>
      {open && (
        <div className="menu-panel absolute right-0 top-[calc(100%+10px)] z-40 w-72 rounded-2xl p-2">
          <div className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
            <span className="flex items-center gap-2.5"><Icon name="globe" className="h-[18px] w-[18px] text-(--icon)" /> {t.language.label}</span>
            <LanguageToggle compact className="flex" />
          </div>
          <MenuSwitch icon="sun" label={t.menu.lightMode} on={light} onClick={onToggleTheme} />
          {canFocus && (
            <MenuSwitch icon="expand" label={t.menu.focusView} on={focus} onClick={() => { onToggleFocus(); setOpen(false); }} />
          )}
          <MenuSwitch icon="spin" label={t.menu.autoSpin} on={spin} onClick={onToggleSpin} />
          <MenuSwitch icon="spot" label={t.menu.hotspots} note={t.menu.hotspotsNote} on={hotspots} onClick={onToggleHotspots} />
          <MenuSwitch icon="play" label={t.menu.showroom} note={t.menu.showroomNote} on={showroom} onClick={onToggleShowroom} />
          <button
            onClick={() => { onOpenTimeline(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[rgba(47,139,255,.12)]"
          >
            <Icon name="history" className="h-[18px] w-[18px] flex-none text-(--icon)" /> {t.menu.timeline}
          </button>
          <div className="mx-3 my-2 border-t border-edge" />
          <div className="px-3 pb-1 text-xs text-dim">
            <p className="mb-2 flex items-center gap-2 font-semibold uppercase tracking-[.14em]"><Icon name="keyboard" className="h-4 w-4" /> {t.menu.shortcuts}</p>
            <ul className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
              <Shortcut keys="← →">{keys.changeCar}</Shortcut>
              <Shortcut keys="Enter">{keys.selectCar}</Shortcut>
              <Shortcut keys="C">{keys.compare}</Shortcut>
              <Shortcut keys="H">{keys.hotspots}</Shortcut>
              {canFocus && <Shortcut keys="F">{keys.focusView}</Shortcut>}
              <Shortcut keys="+ / −">{keys.zoom}</Shortcut>
              <Shortcut keys="0">{keys.fit}</Shortcut>
              <Shortcut keys="Esc">{keys.close}</Shortcut>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/** A menu row with an on/off switch, and an optional line of explanation under its label. */
function MenuSwitch({ icon, label, note, on, onClick }: { icon: IconName; label: string; note?: string; on: boolean; onClick: () => void }) {
  return (
    <button
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[rgba(47,139,255,.12)]"
      onClick={onClick}
      role="menuitemcheckbox"
      aria-checked={on}
    >
      <span className="flex items-start gap-2.5">
        <Icon name={icon} className="mt-px h-[18px] w-[18px] flex-none text-(--icon)" />
        <span>
          {label}
          {note && <span className="mt-0.5 block text-[11px] leading-snug text-dim">{note}</span>}
        </span>
      </span>
      <span className={`relative h-5 w-9 flex-none rounded-full transition-colors ${on ? "bg-brand" : "bg-(--track)"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/** One row of the shortcuts list: the key, then what it does. Both cells are list items of the two-column grid. */
function Shortcut({ keys, children }: { keys: string; children: ReactNode }) {
  return (
    <>
      <li className="list-none">
        <kbd className="rounded border border-edge px-1.5 py-0.5 text-[11px] font-semibold text-soft">{keys}</kbd>
      </li>
      <li>{children}</li>
    </>
  );
}
