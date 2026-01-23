"use client";

/**
 * Plate list skeleton component with glass morphism
 * Shows loading placeholders for plate cards
 * @returns Skeleton loading state
 */
export function PlateListSkeleton() {
  console.log("[PlateListSkeleton] Rendering");

  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass rounded-2xl stroke-border p-4 animate-pulse">
          <div className="flex items-center justify-between">
            {/* Plate info skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100/50 to-amber-50/50" />
              <div className="space-y-2">
                <div className="h-5 w-24 rounded-full bg-muted/50" />
                <div className="h-3 w-32 rounded-full bg-muted/30" />
              </div>
            </div>

            {/* Status badge skeleton */}
            <div className="h-7 w-20 rounded-full bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
