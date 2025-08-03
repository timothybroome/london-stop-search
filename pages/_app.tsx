import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { initializeStore, RootStoreContext } from "@/stores";
import { Provider } from "mobx-react";
import { useEffect, useMemo, useState } from "react";



interface MyAppProps extends AppProps {
  pageProps: {
    initialData?: any;
    messages?: Record<string, any>;
  };
}

function App({ Component, pageProps }: MyAppProps) {
  const store = useMemo(() => initializeStore(pageProps.initialData), [pageProps.initialData]);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  

  return (
  
    <RootStoreContext.Provider value={store}>
      <Provider store={store}>
        <Component {...pageProps} />
      </Provider>
    </RootStoreContext.Provider>


  )
}
