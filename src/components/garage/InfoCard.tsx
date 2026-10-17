import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MAKER_LOGOS } from "@/data/makers";
import { useFitText } from "@/hooks/useFitText";
import { useI18n } from "@/i18n/I18nProvider";
import { carPath, shareLink } from "@/lib/share";
import type { Car, Service } from "@/types/fleet";

interface InfoCardProps {
  /** The card's element; the page measures it and slides it away for focus view. */
  cardRef: RefObject<HTMLElement | null>;
  car: Car;
  service: Service;
  reduceMotion: boolean;
}

/** Left card: the service, maker and model, the blurb, a spec grid, and the maker's emblem with the car's
    fleet note. Spacing (--gap) grows with the screen's height, so short laptop screens stay compact. */
export function InfoCard({ cardRef, car, service, reduceMotion }: InfoCardProps) {
  const { text } = useI18n();
  const modelRef = useRef<HTMLHeadingElement>(null);
  useFitText(modelRef, car);

  // The contents step in on every car change, the model name wiping in from the left.
  useGSAP(() => {
    if (reduceMotion) return;
    gsap.fromTo("[data-anim]", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.045, overwrite: true });
    gsap.fromTo(modelRef.current, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power4.out" });
  }, { scope: cardRef, dependencies: [car.id, reduceMotion] });

  return (
    <section
      ref={cardRef}
      aria-live="polite"
      className="glass relative z-10 mx-3 mt-3 flex max-md:order-4 md:col-start-1 md:mx-0 md:mt-0 min-w-0 flex-col overflow-hidden rounded-2xl p-3 [--gap:clamp(8px,calc(4vh_-_17px),24px)] sm:p-4 md:row-start-1 md:p-5 lg:p-4 xl:p-5 2xl:p-6"
    >
      {/* service pill, with its role beside it (the role drops below the pill if the card is too narrow), and the
          share button at the end */}
      <div data-anim className="mb-(--gap) flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="rounded-md bg-accent px-2.5 py-[5px] text-[10px] font-semibold uppercase leading-none tracking-[.1em] text-(--on-accent) shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-colors duration-300 md:text-[11px]">
            {service.name}
          </p>
          <p className="text-xs leading-none text-soft md:text-[13px]">{text(service.role)}</p>
        </div>
        <ShareButton car={car} />
      </div>
      <p data-anim className="text-sm font-medium uppercase leading-none tracking-[.1em] text-soft md:text-lg 2xl:text-[22px]">{car.maker}</p>
      <h2
        ref={modelRef}
        className="mb-(--gap) mt-1.5 font-hud text-[clamp(28px,8vw,52px)] font-semibold leading-[1.02] tracking-[-.01em] [text-wrap:balance] lg:text-[clamp(38px,3.6vw,64px)]"
      >
        {car.model}
      </h2>
      <p data-anim className="max-w-[42ch] pb-(--gap) text-[12.5px] leading-[1.55] text-soft md:text-[15px] lg:text-sm lg:leading-normal 2xl:text-base 2xl:leading-[1.6]">{text(car.blurb)}</p>

      <SpecGrid car={car} />
      <MakerFooter car={car} />
    </section>
  );
}

/** Two columns under a hairline, split by a short rule. On a tall card the grid centres in the spare room and
    the maker footer drops to the bottom. */
function SpecGrid({ car }: { car: Car }) {
  const { t, text, number } = useI18n();
  const specs: [label: string, value: string, icon: IconName][] = [
    [t.specs.body, text(car.body), "car"],
    [t.specs.seats, text(car.seats), "users"],
    [t.specs.power, t.power[car.power], "bolt"],
    [t.specs.length, `${number(car.profile.L, { max: 2 })} m`, "ruler"],
  ];
  return (
    <dl data-anim className="my-auto grid grid-cols-2 border-t border-edge">
      {specs.map(([label, value, icon], i) => (
        <div
          key={label}
          className={`relative min-w-0 py-[clamp(9px,1.35vh,16px)] ${i >= 2 ? "border-t border-edge" : ""} ${i % 2 ? "pl-4 before:absolute before:inset-y-3 before:left-0 before:w-px before:bg-edge" : "pr-3"}`}
        >
          {/* icon and label on the first line, the value on the full width under them */}
          <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase leading-none tracking-[.1em] text-dim md:text-[11px] 2xl:text-xs">
            <Icon name={icon} className="h-4 w-4 flex-none text-soft 2xl:h-[18px] 2xl:w-[18px]" />
            {label}
          </dt>
          <dd className="mt-1.5 text-[13px] leading-snug md:text-sm 2xl:text-[15px]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Shares the car's link (the share sheet on phones, the clipboard elsewhere), confirming a copy for a moment. */
function ShareButton({ car }: { car: Car }) {
  const { t } = useI18n();
  const [said, setSaid] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const share = async () => {
    const result = await shareLink(new URL(carPath(car.id), location.origin).href, t.share.text(car.maker, car.model));
    if (result !== "copied" && result !== "failed") return;
    setSaid(result === "copied" ? t.share.copied : t.share.failed);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaid(null), 2200);
  };

  return (
    <div className="relative flex-none">
      <button
        onClick={share}
        aria-label={t.share.label}
        title={t.share.label}
        className="-mr-1 -mt-1.5 grid h-8 w-8 place-items-center rounded-full text-soft transition-colors hover:bg-(--pill) hover:text-ink"
      >
        <Icon name={said === t.share.copied ? "check" : "share"} className="h-[18px] w-[18px]" />
      </button>
      <p
        role="status"
        className={`pointer-events-none absolute right-0 top-[calc(100%+4px)] z-10 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-night shadow-lg transition-opacity duration-200 ${said ? "opacity-100" : "opacity-0"}`}
      >
        {said}
      </p>
    </div>
  );
}

/** The maker's emblem (or initial), name, and the car's place in the fleet. The emblem's slot is a little wider
    than tall so round and wide emblems look about the same size; the dark version swaps in by theme. */
function MakerFooter({ car }: { car: Car }) {
  const { text } = useI18n();
  const logo = MAKER_LOGOS[car.maker];
  const emblem = "col-start-1 row-start-1 h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,.35)]";
  return (
    <div data-anim className="flex items-center gap-3 border-t border-edge pt-(--gap)">
      <span className="grid h-10 w-[52px] flex-none grid-cols-1 grid-rows-1 place-items-center 2xl:h-[52px] 2xl:w-16">
        {logo ? (
          <>
            {logo.dark && <Image src={logo.dark} alt="" width={64} height={52} unoptimized loading="eager" className={`${emblem} light:hidden`} />}
            <Image src={logo.src} alt="" width={64} height={52} unoptimized loading="eager" className={`${emblem} light:drop-shadow-none ${logo.dark ? "hidden light:block" : ""}`} />
          </>
        ) : (
          <span className="font-display text-3xl font-bold leading-none text-soft">{car.maker[0]}</span>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight 2xl:text-[15px]">{car.maker}</p>
        <p className="mt-0.5 text-xs leading-snug text-soft 2xl:text-[13px]">{text(car.note)}</p>
      </div>
    </div>
  );
}
