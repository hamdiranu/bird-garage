/** A script that runs while the HTML is parsed (before first paint). On the client it renders as
    text/plain so React doesn't warn about script tags; suppressHydrationWarning covers the type change. */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
