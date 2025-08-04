import { Geist } from "next/font/google";
import { DataScopedTitle } from "@/components/DataScopedTitle";
import { DateRangeExplorer } from "@/components/DateRangeExplorer";
import { TotalDisplay } from "@/components/TotalDisplay";
import { SearchTotals } from "@/components/SearchTotals";
import AgeRangeChart from "@/components/AgeRangeChart";
import LocationMap from "@/components/LocationMap";

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
  return (
    <div
      className={`${geistSans.className} font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20`}
    >
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex flex-col gap-[32px]">
          <h1 className="text-4xl font-bold">
            Metropolitan Police Service - Stop and Search
          </h1>
        </div>

        <div className="hidden sm:grid sm:grid-cols-[max-content_2fr] sm:gap-16">
          <DataScopedTitle />
          <DateRangeExplorer className="max-w-[630px]" />
        </div>

        {/* <Filters></Filters> */}

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-[32px]">
          <TotalDisplay />
          <SearchTotals />
          <AgeRangeChart />
          <LocationMap />
        </div>

        <div className="grid grid-cols-1 gap-[32px]">
          {/*
          
          <Ethnicity></Ethnicity>
          <Gender></Gender>
          <Outcome></Outcome>
          <LocationMap />
          <ObjectOfSearch></ObjectOfSearch>
          <SearchType></SearchType>
          <RemovalOfMoreThanOuterClothing></RemovalOfMoreThanOuterClothing> */}
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
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
