import { Icon, type IconName } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";
import { VIEWS, ZOOM, type ViewKey } from "./view";

const VIEW_ICON: Record<ViewKey, IconName> = { front: "front", side: "car", rear: "rear" };

export interface ToolbarProps {
  spin: boolean;
  zoom: number;
  onAim: (view: ViewKey) => void;
  onSpin: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  className?: string;
}

/** Camera presets, auto-spin and zoom in one pill. Labels show only where the stage is wide enough. */
export function Toolbar({ spin, zoom, onAim, onSpin, onZoomIn, onZoomOut, onZoomReset, className }: ToolbarProps) {
  const { t } = useI18n();
  const sep = <span aria-hidden="true" className="h-5 w-px bg-edge" />;
  const zoomBtn = "grid h-9 w-9 place-items-center rounded-full text-soft transition-colors hover:text-ink disabled:opacity-35 disabled:hover:text-soft md:h-10 md:w-10";
  const percent = Math.round(zoom * 100);
  return (
    <div className={`items-center rounded-full border border-edge bg-(--float) p-1 shadow-[0_10px_30px_-10px_var(--drop)] backdrop-blur-md ${className ?? ""}`}>
      {(Object.keys(VIEWS) as ViewKey[]).map((v) => (
        <span key={v} className="flex items-center">
          <ToolButton icon={VIEW_ICON[v]} label={t.toolbar.views[v]} onClick={() => onAim(v)} />
          {sep}
        </span>
      ))}
      <ToolButton icon="spin" label={t.toolbar.spin} pressed={spin} onClick={onSpin} />
      {sep}
      <span role="group" aria-label={t.toolbar.zoom} className="flex items-center">
        <button onClick={onZoomOut} disabled={zoom <= ZOOM.min + 1e-3} aria-label={t.toolbar.zoomOut} title={t.toolbar.zoomOutTitle} className={zoomBtn}>
          <Icon name="zoomOut" className="h-[18px] w-[18px]" />
        </button>
        <button
          onClick={onZoomReset}
          aria-label={t.toolbar.zoomLevel(percent)}
          title={t.toolbar.fitTitle}
          className="hidden h-9 w-12 rounded-full text-[11px] font-semibold tabular-nums text-soft transition-colors hover:text-ink sm:block md:h-10 xl:text-xs"
        >
          {percent}%
        </button>
        <button onClick={onZoomIn} disabled={zoom >= ZOOM.max - 1e-3} aria-label={t.toolbar.zoomIn} title={t.toolbar.zoomInTitle} className={zoomBtn}>
          <Icon name="zoomIn" className="h-[18px] w-[18px]" />
        </button>
      </span>
    </div>
  );
}

function ToolButton({ icon, label, pressed, onClick }: { icon: IconName; label: string; pressed?: boolean; onClick: () => void }) {
  return (
    <button
      aria-pressed={pressed}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[11px] font-semibold uppercase leading-none tracking-[.1em] transition-[background,color,border-color,box-shadow] md:h-10 xl:px-4 xl:text-xs ${pressed ? "brand-fill" : "border-transparent text-soft hover:text-ink"}`}
    >
      <Icon name={icon} className="h-[18px] w-[18px]" />
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}
