import { Geist } from "next/font/google";
import { DataScopedTitle } from "@/components/DataScopedTitle";
import DashboardCard from "@/components/DashboardCard";
import { DateRangeExplorer } from "@/components/DateRangeExplorer";
import Filters from "@/components/Filters";
import { TotalDisplay } from "@/components/TotalDisplay";
import { SearchTotals } from "@/components/SearchTotals";
import AgeRangeChart from "@/components/AgeRangeChart";
import EthnicityPieChart from "@/components/EthnicityPieChart";
import LocationMap from "@/components/LocationMap";
import { useEffect } from "react";
import { useRootStore } from "@/stores";

import { observer } from "mobx-react";
import { RootStoreType } from "@/stores/RootStore";
import { GetServerSideProps } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

type HomeProps = {
  initialData?: Partial<RootStoreType>;
};

const Home = observer(() => {
  const { dataStore, appLayoutStore } = useRootStore();

  // fetch borough totals whenever date range changes
  useEffect(() => {
    const { start, end } = appLayoutStore.dateRange || {};
    dataStore.fetchBoroughTotals(start, end);
  }, [dataStore, appLayoutStore.dateRange.start, appLayoutStore.dateRange.end, appLayoutStore.filtersKey()]);
  return (
    <div
      className={`${geistSans.className} font-sans min-h-screen bg-[var(--dashboard-bg)] text-[var(--text-primary)]`}
    >
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 max-w-7xl">
        <div className="flex flex-col gap-6 mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)]">
            Metropolitan Police Service - Stop and Search
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-4">
            <DataScopedTitle />
            <Filters />
          </div>
          <DateRangeExplorer />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard title="Total Records"><TotalDisplay /></DashboardCard>
          <DashboardCard title="Search Totals"><SearchTotals /></DashboardCard>
          <DashboardCard title="Age Range"><AgeRangeChart /></DashboardCard>
          <DashboardCard title="Ethnicity"><EthnicityPieChart /></DashboardCard>
          <div className="md:col-span-2">
            <DashboardCard title="By Borough"><LocationMap values={dataStore.boroughTotals} /></DashboardCard>
          </div>
        </div>

      </main>
    </div>
  );
});

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const initialData = {};

  return {
    props: {
      initialData,
    },
  };
};

export default Home;
