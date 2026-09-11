import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  alt?: string;
  priority?: boolean;
}

export function BrandMark({ className, alt = "Quality Works Light", priority = false }: BrandMarkProps) {
  return (
    <Image
      alt={alt}
      className={cn("size-10 object-contain", className)}
      height={160}
      priority={priority}
      src="/logo.png"
      width={160}
    />
  );
}
