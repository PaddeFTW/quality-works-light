import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  markClassName?: string;
  alt?: string;
  wordmark?: boolean;
}

export function BrandMark({
  className,
  markClassName,
  alt = "Quality Works",
  wordmark = false,
}: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        aria-hidden={wordmark ? true : undefined}
        aria-label={wordmark ? undefined : alt}
        className={cn("size-10 shrink-0", markClassName)}
        fill="none"
        role={wordmark ? "presentation" : "img"}
        viewBox="0 0 48 48"
      >
        <circle cx="13" cy="13" fill="#00C6F2" r="7.5" />
        <g transform="rotate(-40 28 26)">
          <rect fill="#00C6F2" height="36" rx="6" width="12" x="22" y="8" />
        </g>
      </svg>
      {wordmark ? (
        <span className="text-[1.65rem] font-medium leading-none tracking-tight text-foreground">
          quality works
        </span>
      ) : null}
      <span className="sr-only">{alt}</span>
    </span>
  );
}
