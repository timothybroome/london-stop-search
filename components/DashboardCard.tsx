"use client";
import React from "react";

interface Props {
  title: string;
  className?: string;
  children: React.ReactNode;
}

export default function DashboardCard({ title, className = "", children }: Props) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}
