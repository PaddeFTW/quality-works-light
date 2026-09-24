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
      <img
        alt={wordmark ? "" : alt}
        className={cn("size-10 shrink-0 object-contain", markClassName)}
        src="/logo-mark.png"
      />
      {wordmark ? (
        <span className="text-[1.65rem] font-medium leading-none tracking-tight text-foreground">
          quality works
        </span>
      ) : null}
      <span className="sr-only">{alt}</span>
    </span>
  );
}
