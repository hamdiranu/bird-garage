import type { SVGProps } from "react";

/* Line icons on a 24×24 grid, drawn with currentColor. */
const CAR = (
  <>
    <path d="M3 15v-3l2.2-4.4A2 2 0 0 1 7 6.5h10a2 2 0 0 1 1.8 1.1L21 12v3a1 1 0 0 1-1 1h-1.5M5.5 16H4a1 1 0 0 1-1-1M3 12h18M9.5 16h5" />
    <circle cx="7.5" cy="16" r="2" />
    <circle cx="16.5" cy="16" r="2" />
  </>
);
const NOSE = <path d="M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11M5.5 17v2M18.5 17v2" />;

const PATHS = {
  car: CAR,
  taxi: <>{CAR}<path d="M10 6.5v-2h4v2" /></>,
  front: <>{NOSE}<rect x="3.5" y="11" width="17" height="6" rx="1.5" /><circle cx="7.5" cy="14" r="1" /><circle cx="16.5" cy="14" r="1" /></>,
  rear: <>{NOSE}<rect x="3.5" y="11" width="17" height="6" rx="1.5" /><path d="M6 14h3M15 14h3M10.5 14h3" /></>,
  bus: <><rect x="4" y="3.5" width="16" height="14" rx="2" /><path d="M4 11h16M4 7.5h16M7 17.5V20M17 17.5V20" /><circle cx="7.5" cy="14.3" r=".9" /><circle cx="16.5" cy="14.3" r=".9" /></>,
  route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h6.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H16" /></>,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  crown: <path d="M3.5 8l4.5 4L12 5l4 7 4.5-4-2 10.5h-13zM5.5 20.5h13" />,
  key: <><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L19 4M16 7l2.5 2.5M14 9l2 2" /></>,
  clock: <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" /><path d="M3.5 4v4.5H8M12 7.5V12l3 2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  hand: <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11M12 10V4.5a1.5 1.5 0 0 1 3 0V11M15 10.5v-4a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.6a6 6 0 0 1-4.6-2.2l-2.3-3.4a1.5 1.5 0 0 1 2.3-1.9L9 16v-5" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  spin: <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2" />,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />,
  seat: <path d="M6 3.5l1.5 9.5a2 2 0 0 0 2 1.7H16a2 2 0 0 1 2 1.7l.5 3.6M9.5 14.7L8 20.5M8 9.5h4" />,
  bolt: <path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12z" />,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" /></>,
  sofa: <path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM6 19v1.5M18 19v1.5" />,
  leaf: <path d="M5 19c0-8 5-13.5 15-14-.4 9.6-6 15-14 14zM5 19l7-7" />,
  city: <path d="M3.5 20.5h17M5 20.5V10l5-2.5v13M10 20.5V4l6 2.5v14M16 20.5V11l3.5 1.5v8" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></>,
  check: <path d="M4.5 12.5l5 5L19.5 7" />,
  swap: <path d="M4 9.5h13l-3.5-3.5M20 14.5H7l3.5 3.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  collapse: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  keyboard: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9" /></>,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} {...rest}>
      {PATHS[name]}
    </svg>
  );
}

export function StarFill({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="currentColor" d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  );
}
