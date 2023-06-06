import { IPluginState, ITagData } from "@/interfaces";
import { todayIsodate } from "@/utils/date";
import _ from "lodash-es";
import { ActionContext } from "vuex";
import {
  PromoteImmaturePlantsBuilderActions,
  PromoteImmaturePlantsBuilderMutations,
} from "./consts";
import { IPromoteImmaturePlantsBuilderState } from "./interfaces";

const inMemoryState = {
  selectedPlantBatches: [],
  growthPhase: null,
  totalPlantCount: 0,
  promoteData: [],
  plantTags: [],
  patientLicenseNumber: "",
  showTagPicker: false,
  growthIsodate: todayIsodate(),
  plantLocation: null,
  showHiddenDetailFields: false,
};

const persistedState = {};

const defaultState: IPromoteImmaturePlantsBuilderState = {
  ...persistedState,
  ...inMemoryState,
};

export const promoteImmaturePlantsBuilderModule = {
  state: () => defaultState,
  mutations: {
    [PromoteImmaturePlantsBuilderMutations.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA](
      state: IPromoteImmaturePlantsBuilderState,
      data: { packageTags?: ITagData[]; quantityList?: number[] }
    ) {
      for (const [key, value] of Object.entries(data)) {
        // @ts-ignore
        state[key] = value;
      }
    },
    [PromoteImmaturePlantsBuilderMutations.RESET_PROMOTE_IMMATURE_PLANTS_DATA](
      state: IPromoteImmaturePlantsBuilderState
    ) {
      Object.assign(state, _.cloneDeep(defaultState));
    },
  },
  getters: {},
  actions: {
    [PromoteImmaturePlantsBuilderActions.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA]: async (
      ctx: ActionContext<IPromoteImmaturePlantsBuilderState, IPluginState>,
      data: { packageTags?: ITagData[]; quantityList?: number[] }
    ) => {
      ctx.commit(PromoteImmaturePlantsBuilderMutations.UPDATE_PROMOTE_IMMATURE_PLANTS_DATA, data);
    },
    [PromoteImmaturePlantsBuilderActions.RESET_PROMOTE_IMMATURE_PLANTS_DATA]: async (
      ctx: ActionContext<IPromoteImmaturePlantsBuilderState, IPluginState>
    ) => {
      ctx.commit(PromoteImmaturePlantsBuilderMutations.RESET_PROMOTE_IMMATURE_PLANTS_DATA);
    },
  },
};

export const promoteImmaturePlantsBuilderReducer = (
  state: IPromoteImmaturePlantsBuilderState
): IPromoteImmaturePlantsBuilderState => {
  return {
    ...state,
    ...inMemoryState,
  };
};
