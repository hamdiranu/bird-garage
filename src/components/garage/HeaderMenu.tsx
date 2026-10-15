import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

interface HeaderMenuProps {
  light: boolean;
  onToggleTheme: () => void;
  focus: boolean;
  /** Focus view is only offered where the screen is wide enough for it. */
  canFocus: boolean;
  onToggleFocus: () => void;
  spin: boolean;
  onToggleSpin: () => void;
}

/** The ☰ button and its panel: display switches and the keyboard shortcuts. Closes on a click outside or Esc. */
export function HeaderMenu({ light, onToggleTheme, focus, canFocus, onToggleFocus, spin, onToggleSpin }: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Menu"
        className="grid h-10 w-10 place-items-center rounded-full text-soft transition-colors hover:text-ink 2xl:h-11 2xl:w-11"
      >
        <Icon name={open ? "x" : "menu"} className="h-6 w-6" />
      </button>
      {open && (
        <div className="glass absolute right-0 top-[calc(100%+10px)] z-40 w-72 rounded-2xl p-2">
          <MenuSwitch icon="sun" label="Light mode" on={light} onClick={onToggleTheme} />
          {canFocus && (
            <MenuSwitch icon="expand" label="Focus view" on={focus} onClick={() => { onToggleFocus(); setOpen(false); }} />
          )}
          <MenuSwitch icon="spin" label="Auto-spin" on={spin} onClick={onToggleSpin} />
          <div className="mx-3 my-2 border-t border-edge" />
          <div className="px-3 pb-1 text-xs text-dim">
            <p className="mb-2 flex items-center gap-2 font-semibold uppercase tracking-[.14em]"><Icon name="keyboard" className="h-4 w-4" /> Shortcuts</p>
            <ul className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
              <Shortcut keys="← →">Change car</Shortcut>
              <Shortcut keys="Enter">Select car</Shortcut>
              {canFocus && <Shortcut keys="F">Focus view</Shortcut>}
              <Shortcut keys="+ / −">Zoom in / out</Shortcut>
              <Shortcut keys="0">Fit the car</Shortcut>
              <Shortcut keys="Esc">Close / exit focus</Shortcut>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/** A menu row with an on/off switch. */
function MenuSwitch({ icon, label, on, onClick }: { icon: IconName; label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[rgba(47,139,255,.12)]"
      onClick={onClick}
      role="menuitemcheckbox"
      aria-checked={on}
    >
      <span className="flex items-center gap-2.5"><Icon name={icon} className="h-[18px] w-[18px] text-(--icon)" /> {label}</span>
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
