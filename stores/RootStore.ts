import {types, Instance, SnapshotIn, getSnapshot} from "mobx-state-tree";

import {AppLayoutStore} from "@/stores/AppLayoutStore";

export const RootStore = types.model("RootStore", {

    appLayoutStore: AppLayoutStore,

});


export type RootStoreType = Instance<typeof RootStore>;
