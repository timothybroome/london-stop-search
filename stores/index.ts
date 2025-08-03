import { createContext, useContext } from "react";
import { enableStaticRendering } from "mobx-react-lite";
import { createStore, RootStoreType } from "./RootStore";

enableStaticRendering(typeof window === "undefined");

export const RootStoreContext = createContext<RootStoreType | null>(null);

export const useRootStore = (): RootStoreType => {
  const store = useContext(RootStoreContext);
  if (!store) {
    throw new Error("useRootStore must be used within a RootStoreProvider");
  }
  return store;
};

export { createStore };
export type { RootStoreType };
