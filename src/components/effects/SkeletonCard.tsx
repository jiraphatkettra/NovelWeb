"use client";

import React from "react";

interface SkeletonCardProps {
  count?: number;
}

function SingleSkeleton() {
  return (
    <div className="group">
      {/* Cover skeleton */}
      <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-kakao-card">
        <div className="absolute inset-0 animate-shimmer" />
      </div>
      {/* Text skeleton */}
      <div className="mt-2 space-y-1.5">
        <div className="h-3 bg-kakao-card rounded-md overflow-hidden w-3/4">
          <div className="h-full animate-shimmer" />
        </div>
        <div className="h-2.5 bg-kakao-card rounded-md overflow-hidden w-1/2">
          <div className="h-full animate-shimmer" style={{ animationDelay: "0.2s" }} />
        </div>
        <div className="flex gap-2">
          <div className="h-2 bg-kakao-card rounded-md overflow-hidden w-8">
            <div className="h-full animate-shimmer" style={{ animationDelay: "0.4s" }} />
          </div>
          <div className="h-2 bg-kakao-card rounded-md overflow-hidden w-10">
            <div className="h-full animate-shimmer" style={{ animationDelay: "0.5s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: SkeletonCardProps) {
  return (
    <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden bg-kakao-card">
      <div className="absolute inset-0 animate-shimmer" />
      <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-10 max-w-7xl mx-auto">
        <div className="max-w-lg space-y-3">
          <div className="h-4 bg-white/5 rounded w-20 animate-shimmer" />
          <div className="h-8 bg-white/5 rounded w-3/4 animate-shimmer" style={{ animationDelay: "0.1s" }} />
          <div className="h-4 bg-white/5 rounded w-full animate-shimmer" style={{ animationDelay: "0.2s" }} />
          <div className="flex gap-3 pt-2">
            <div className="h-10 bg-white/5 rounded-lg w-28 animate-shimmer" style={{ animationDelay: "0.3s" }} />
            <div className="h-10 bg-white/5 rounded-lg w-24 animate-shimmer" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonRanking() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-kakao-card border border-kakao-border">
          <div className="w-7 h-8 bg-white/5 rounded animate-shimmer" />
          <div className="w-11 h-14 bg-white/5 rounded-lg animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-white/5 rounded w-3/4 animate-shimmer" />
            <div className="h-2 bg-white/5 rounded w-1/2 animate-shimmer" style={{ animationDelay: "0.2s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
