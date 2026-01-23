"use client";

import { Circle } from "lucide-react";

/**
 * Mobile header component with clean design
 * Simple header bar with branding
 * @returns Header component
 */
export function MobileHeader() {
  console.log("[MobileHeader] Rendering header");

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border safe-top">
      <div className="flex items-center justify-center h-14 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Circle className="h-7 w-7 text-primary fill-primary/20" />
          <span className="text-xl font-bold text-primary">
            TireTrack
          </span>
        </div>
      </div>
    </header>
  );
}
