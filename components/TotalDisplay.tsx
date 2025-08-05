"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRootStore } from "../stores";

interface TotalDisplayProps {
  className?: string;
}

export const TotalDisplay: React.FC<TotalDisplayProps> = observer(
  ({ className = "" }) => {
    const { appLayoutStore, dataStore } = useRootStore();
    const [total, setTotal] = useState<number>(0);
    const [isLoadingTotal, setIsLoadingTotal] = useState<boolean>(false);

    useEffect(() => {
      if (!dataStore.isInitialized && !dataStore.isLoading) {
        dataStore.loadStats();
      }
    }, [dataStore]);

    useEffect(() => {
      const fetchTotal = async () => {
        if (!dataStore.isInitialized) return;

        setIsLoadingTotal(true);
        try {
          const result = await dataStore.getTotal(
            appLayoutStore.dateRange.start || undefined,
            appLayoutStore.dateRange.end || undefined,
          );
          setTotal(result);
        } catch (error) {
          console.error("Error fetching total:", error);
        } finally {
          setIsLoadingTotal(false);
        }
      };

      fetchTotal();
    }, [
      appLayoutStore.dateRange.start,
      appLayoutStore.dateRange.end,
      appLayoutStore.filtersKey(),
      dataStore.isInitialized,
      dataStore,
    ]);

    if (dataStore.isLoading || isLoadingTotal) {
      return (
        <div className={`${className}`}>
          <div className="animate-pulse">
            <div className="h-4 bg-[var(--border-primary)] rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-[var(--border-primary)] rounded w-1/2"></div>
          </div>
        </div>
      );
    }

    if (dataStore.error) {
      return (
        <div
          className={`border-l-4 border-[var(--error)] ${className}`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-[var(--error)]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-[var(--error)]">
                Error loading data
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{dataStore.error}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`${className}`}>
        <p className="text-3xl font-bold text-[var(--text-primary)] mt-2">
          {total.toLocaleString()}
        </p>


      </div>
    );
  },
);

export default TotalDisplay;
