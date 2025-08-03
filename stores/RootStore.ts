import { types, Instance, SnapshotIn } from "mobx-state-tree";
import { AppLayoutStore, AppLayoutStoreType } from "./AppLayoutStore";
import { DataStore } from "./DataStore";

export const RootStore = types.model("RootStore", {
  appLayoutStore: AppLayoutStore,
  dataStore: DataStore,
});

export type RootStoreType = Instance<typeof RootStore>;
export type RootStoreSnapshot = SnapshotIn<typeof RootStore>;

export const createStore = (initialState: Partial<AppLayoutStoreType> = {}) => {
  return RootStore.create({
    appLayoutStore: {
      ...initialState,
    },
    dataStore: {},
  });
};

export default RootStore;
