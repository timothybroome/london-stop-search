import { createContext, useContext } from "react";
import { RootStore, RootStoreType } from "./RootStore";
import { enableStaticRendering } from "mobx-react-lite";

enableStaticRendering(typeof window === "undefined");

let store: RootStoreType | undefined;

export function initializeStore(initialData?: Partial<RootStoreType>): RootStoreType {
    const _store =
        store ??
        RootStore.create({
            appLayoutStore: {
                // user: initialData?.userStore?.user ?? null,
            }
        });


    if (typeof window === "undefined") return _store;

    if (!store) {
        store = _store;
        
        if (typeof window !== "undefined") {
            window.addEventListener("storage", (event) => {

            });
        }
    }

    return store;
}

export const RootStoreContext = createContext<RootStoreType | null>(null);

export const useRootStore = (): RootStoreType => {
    const store = useContext(RootStoreContext);
    if (!store) {
        throw new Error("useRootStore must be used within RootStoreProvider");
    }
    return store;
};
export type { RootStoreType };


