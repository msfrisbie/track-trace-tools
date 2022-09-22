import { IPackageData, IPluginState, ITagData } from "@/interfaces";
import { todayIsodate } from "@/utils/date";
import _ from "lodash";
import { ActionContext } from "vuex";
import { SplitPackageBuilderActions, SplitPackageBuilderMutations } from "./consts";
import { ISplitPackageBuilderState } from "./interfaces";

const inMemoryState = {
  sourcePackage: null,
  sourcePackageAdjustQuantity: null,
  packageTags: [],
  quantityList: [],
  note: "",
  packageIsodate: todayIsodate(),
  productionBatchNumber: "",
  remediationDate: "",
  remediationMethodId: "",
  remediationSteps: "",
  useSameItem: true,
  outputItem: null,
  location: null,
  isDonation: false,
  isTradeSample: false
};

const persistedState = {};

const defaultState: ISplitPackageBuilderState = {
  ...persistedState,
  ...inMemoryState
};

export const splitPackageBuilderModule = {
  state: () => defaultState,
  mutations: {
    [SplitPackageBuilderMutations.SET_SOURCE_PACKAGE](
      state: ISplitPackageBuilderState,
      { pkg }: { pkg: IPackageData | null }
    ) {
      state.sourcePackage = pkg;
    },
    [SplitPackageBuilderMutations.UPDATE_SPLIT_PACKAGE_DATA](
      state: ISplitPackageBuilderState,
      data: { packageTags?: ITagData[]; quantityList?: number[] }
    ) {
      for (const [key, value] of Object.entries(data)) {
        // @ts-ignore
        state[key] = value;
      }
    },
    [SplitPackageBuilderMutations.RESET_SPLIT_PACKAGE_DATA](state: ISplitPackageBuilderState) {
      Object.assign(state, _.cloneDeep(defaultState));
    }
  },
  getters: {},
  actions: {
    [SplitPackageBuilderActions.SET_SOURCE_PACKAGE]: async (
      ctx: ActionContext<ISplitPackageBuilderState, IPluginState>,
      { pkg }: { pkg: IPackageData }
    ) => {
      ctx.commit(SplitPackageBuilderMutations.SET_SOURCE_PACKAGE, { pkg });
    },
    [SplitPackageBuilderActions.UPDATE_SPLIT_PACKAGE_DATA]: async (
      ctx: ActionContext<ISplitPackageBuilderState, IPluginState>,
      data: { packageTags?: ITagData[]; quantityList?: number[] }
    ) => {
      ctx.commit(SplitPackageBuilderMutations.UPDATE_SPLIT_PACKAGE_DATA, data);
    },
    [SplitPackageBuilderActions.RESET_SPLIT_PACKAGE_DATA]: async (
      ctx: ActionContext<ISplitPackageBuilderState, IPluginState>
    ) => {
      ctx.commit(SplitPackageBuilderMutations.RESET_SPLIT_PACKAGE_DATA);
    }
  }
};

export const splitPackageBuilderReducer = (
  state: ISplitPackageBuilderState
): ISplitPackageBuilderState => {
  return {
    ...state,
    ...inMemoryState
  };
};
