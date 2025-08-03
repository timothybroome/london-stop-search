import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { DataScopedTitle } from "@/components/DataScopedTitle";
import { observer } from "mobx-react";
import { initializeStore, RootStoreType } from "@/stores";
import { GetServerSideProps, GetServerSidePropsContext } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type HomeProps = {
  initialData: RootStoreType;
};

const Home = observer(({ initialData }: HomeProps) => {
  return (
    <div
      className={`${geistSans.className} ${geistMono.className} font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20`}
    >
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      
        <div className="flex flex-col gap-[32px]">
          <h1 className="text-4xl font-bold">Metropolitan Police Service - Stop and Search</h1>
        </div>

        <DataScopedTitle className="w-full max-w-4xl" />

        {/* <DateRangeExplorer></DateRangeExplorer>

        <Filters></Filters> */}

        <div className="grid grid-cols-2 gap-[32px]">

          {/* <NumberOfSearches></NumberOfSearches>
          <AgeRange></AgeRange>
          <Ethnicity></Ethnicity>
          <Gender></Gender>
          <Outcome></Outcome>
          <Location></Location>
          <ObjectOfSearch></ObjectOfSearch>
          <SearchType></SearchType>
          <RemovalOfMoreThanOuterClothing></RemovalOfMoreThanOuterClothing> */}

        </div>

      </main>


      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
    
      </footer>
    </div>
  );
});

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {

  const store = initializeStore();

  // Start with an empty jobs array.
  return {
      props: {
          initialData: store,
      },
  };
};


export default Home;
