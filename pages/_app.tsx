import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { createStore, RootStoreType } from "@/stores/RootStore";
import { RootStoreContext } from "@/stores";
import { useEffect, useMemo, useState } from "react";

interface MyAppProps extends AppProps {
  pageProps: {
    initialData?: any;
  };
}

function App({ Component, pageProps }: MyAppProps) {
  const store = useMemo<RootStoreType>(() => {
    return createStore({
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        ...pageProps.initialData?.dateRange,
      },
    });
  }, [pageProps.initialData]);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;

  return (
    <RootStoreContext.Provider value={store}>
      <Component {...pageProps} />
    </RootStoreContext.Provider>
  );
}

export default App;
