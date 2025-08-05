"use client";
import React from "react";

interface Props {
  title: string;
  className?: string;
  children: React.ReactNode;
}

export default function DashboardCard({ title, className = "", children }: Props) {
  return (
    <div className={`bg-[var(--widget-bg)] rounded-lg shadow-lg border border-[var(--border-primary)] p-6 ${className}`}>
      <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}
