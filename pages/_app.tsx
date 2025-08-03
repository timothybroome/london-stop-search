import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { createStore, RootStoreType } from "@/stores/RootStore";
import { RootStoreContext } from "@/stores";
import { useEffect, useMemo, useState } from "react";

interface MyAppProps extends AppProps {
  pageProps: {
    initialData?: Partial<RootStoreType>;
  };
}

function App({ Component, pageProps }: MyAppProps) {
  const store = useMemo<RootStoreType>(() => {
    return createStore(pageProps.initialData || {});
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
