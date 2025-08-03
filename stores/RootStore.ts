import { types, Instance, SnapshotIn } from "mobx-state-tree";
import { AppLayoutStore, AppLayoutStoreType } from "./AppLayoutStore";

export const RootStore = types.model("RootStore", {
  appLayoutStore: AppLayoutStore,
});

export type RootStoreType = Instance<typeof RootStore>;
export type RootStoreSnapshot = SnapshotIn<typeof RootStore>;

export const createStore = (initialState: Partial<AppLayoutStoreType> = {}) => {
  return RootStore.create({
    appLayoutStore: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        ...initialState.dateRange,
      },
      ...initialState,
    },
  });
};

export default RootStore;
