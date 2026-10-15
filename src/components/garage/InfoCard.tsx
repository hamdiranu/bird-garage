import { useRef, type RefObject } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MAKER_LOGOS } from "@/data/makers";
import { useFitText } from "@/hooks/useFitText";
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
      className="glass relative z-10 col-start-1 row-start-1 flex min-w-0 flex-col overflow-hidden rounded-2xl p-3 [--gap:clamp(8px,calc(4vh_-_17px),24px)] sm:p-4 md:p-5 lg:p-4 xl:p-5 2xl:p-6"
    >
      {/* service pill, with its role beside it (the role drops below the pill if the card is too narrow) */}
      <div data-anim className="mb-(--gap) flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className="rounded-md bg-accent px-2.5 py-[5px] text-[10px] font-semibold uppercase leading-none tracking-[.1em] text-(--on-accent) shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_30%,transparent)] transition-colors duration-300 md:text-[11px]">
          {service.name}
        </p>
        <p className="hidden text-xs leading-none text-soft sm:block md:text-[13px]">{service.role}</p>
      </div>
      <p data-anim className="text-sm font-medium uppercase leading-none tracking-[.1em] text-soft md:text-lg 2xl:text-[22px]">{car.maker}</p>
      <h2
        ref={modelRef}
        className="mb-(--gap) mt-1.5 font-hud text-[clamp(28px,8vw,52px)] font-semibold leading-[1.02] tracking-[-.01em] [text-wrap:balance] lg:text-[clamp(38px,3.6vw,64px)]"
      >
        {car.model}
      </h2>
      <p data-anim className="max-w-[42ch] pb-(--gap) text-[12.5px] leading-[1.55] text-soft md:text-[15px] lg:text-sm lg:leading-normal 2xl:text-base 2xl:leading-[1.6]">{car.blurb}</p>

      <SpecGrid car={car} />
      <MakerFooter car={car} />
    </section>
  );
}

/** Two columns under a hairline, split by a short rule (phones stack them). On a tall card the grid centres in
    the spare room and the maker footer drops to the bottom. */
function SpecGrid({ car }: { car: Car }) {
  const specs: [label: string, value: string, icon: IconName][] = [
    ["Body", car.body, "car"],
    ["Seats", car.seats, "users"],
    ["Power", car.power, "bolt"],
    ["Length", `${+car.profile.L.toFixed(2)} m`, "ruler"],
  ];
  return (
    <dl data-anim className="my-auto grid grid-cols-1 border-t border-edge sm:grid-cols-2">
      {specs.map(([label, value, icon], i) => (
        <div
          key={label}
          className={`relative min-w-0 py-[clamp(9px,1.35vh,16px)] ${i ? "border-t border-edge" : ""} ${i === 1 ? "sm:border-t-0" : ""} ${i % 2 ? "sm:pl-4 sm:before:absolute sm:before:inset-y-3 sm:before:left-0 sm:before:w-px sm:before:bg-edge" : "sm:pr-3"}`}
        >
          {/* icon and label on the first line, the value on the full width under them */}
          <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase leading-none tracking-[.1em] text-dim md:text-[11px] 2xl:text-xs">
            <Icon name={icon} className="hidden h-4 w-4 flex-none text-soft sm:block 2xl:h-[18px] 2xl:w-[18px]" />
            {label}
          </dt>
          <dd className="mt-1.5 text-[13px] leading-snug md:text-sm 2xl:text-[15px]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The maker's emblem (or initial), name, and the car's place in the fleet. The emblem's slot is a little wider
    than tall so round and wide emblems look about the same size; the dark version swaps in by theme. */
function MakerFooter({ car }: { car: Car }) {
  const logo = MAKER_LOGOS[car.maker];
  const emblem = "col-start-1 row-start-1 h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,.35)]";
  return (
    <div data-anim className="flex items-center gap-3 border-t border-edge pt-(--gap)">
      <span className="hidden h-10 w-[52px] flex-none grid-cols-1 grid-rows-1 place-items-center sm:grid 2xl:h-[52px] 2xl:w-16">
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
        <p className="mt-0.5 text-xs leading-snug text-soft 2xl:text-[13px]">{car.note}</p>
      </div>
    </div>
  );
}
