import { useState } from "react";
import logoAsset from "@/assets/luxora-logo.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Fallback: show styled initials when the image can't load (e.g. outside Lovable cloud)
    const initials = "UL";
    return (
      <div
        className={cn(
          "rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-primary-foreground font-display font-bold shadow-lavender",
          className
        )}
        style={{ width: size, height: size, fontSize: Math.max(size * 0.38, 14) }}
        aria-label="Uma's Luxora"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={logoAsset.url}
      alt="Uma's Luxora — Permanent Hair Extensions"
      width={size}
      height={size}
      className={cn(
        "rounded-full object-cover bg-white ring-2 ring-accent/50 shadow-lavender",
        className
      )}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
