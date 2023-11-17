import { IPluginState } from '@/interfaces';
import { ActionContext } from 'vuex';
import { FlagsActions, FlagsMutations } from './consts';
import {
  IFlagsState,
  IMockDefaultPhoneNumberForQuestions,
  IMockDefaultPhoneNumberForQuestionsBehavior,
  IMockDesinationFacilities,
  IMockDesinationFacilitiesBehavior,
  IMockDrivers,
  IMockDriversBehavior,
  IMockFacilities,
  IMockFacilitiesBehavior,
  IMockFacilityUsesLocationForPackages,
  IMockFacilityUsesLocationForPackagesBehavior,
  IMockFlags,
  IMockHarvests,
  IMockHarvestsBehavior,
  IMockItems,
  IMockItemsBehavior,
  IMockLocations,
  IMockLocationsBehavior,
  IMockPackages,
  IMockPackagesBehavior,
  IMockPlantBatches,
  IMockPlantBatchesBehavior,
  IMockPlantBatchGrowthPhases,
  IMockPlantBatchGrowthPhasesBehavior,
  IMockPlantBatchTypes,
  IMockPlantBatchTypesBehavior,
  IMockPlants,
  IMockPlantsBehavior,
  IMockStrains,
  IMockStrainsBehavior,
  IMockTags,
  IMockTagsBehavior,
  IMockTransferTypes,
  IMockTransferTypesBehavior,
  IMockTransporterFacilities,
  IMockTransporterFacilitiesBehavior,
  IMockUnitsOfMeasure,
  IMockUnitsOfMeasureBehavior,
  IMockVehicles,
} from './interfaces';

const inMemoryState = {};

const persistedState = {
  featureFlags: {
  },
  mockedFlags: {
    mockPlants: {
      enabled: false,
      behavior: {
        plantCount: 250,
      } as IMockPlantsBehavior,
    } as IMockPlants,
    mockPlantBatches: {
      enabled: false,
      behavior: {
        plantBatchCount: 250,
      } as IMockPlantBatchesBehavior,
    } as IMockPlantBatches,
    mockHarvests: {
      enabled: false,
      behavior: {} as IMockHarvestsBehavior,
    } as IMockHarvests,
    mockPackages: {
      enabled: false,
      behavior: {
        packageCount: 250,
      } as IMockPackagesBehavior,
    } as IMockPackages,
    mockItems: {
      enabled: false,
      behavior: {} as IMockItemsBehavior,
    } as IMockItems,
    mockLocations: {
      enabled: false,
      behavior: {} as IMockLocationsBehavior,
    } as IMockLocations,
    mockStrains: {
      enabled: false,
      behavior: {} as IMockStrainsBehavior,
    } as IMockStrains,
    mockTags: {
      enabled: false,
      behavior: {} as IMockTagsBehavior,
    } as IMockTags,
    // mockItemCategories: {
    //     enabled: false,
    //     behavior: {} as IMockItemCategoriesBehavior,
    // } as IMockItemCategories,
    mockUnitsOfMeasure: {
      enabled: false,
      behavior: {} as IMockUnitsOfMeasureBehavior,
    } as IMockUnitsOfMeasure,
    // mockUnitsOfWeight: {
    //     enabled: false,
    //     behavior: {} as IMockUnitsOfWeightBehavior,
    // } as IMockUnitsOfWeight,
    // mockWasteReasons: {
    //     enabled: false,
    //     behavior: {} as IMockWasteReasonsBehavior,
    // } as IMockWasteReasons,
    // mockWasteMethods: {
    //     enabled: false,
    //     behavior: {} as IMockWasteMethodsBehavior,
    // } as IMockWasteMethods,
    // mockAdjustPackageReasons: {
    //     enabled: false,
    //     behavior: {} as IMockAdjustPackageReasonsBehavior,
    // } as IMockAdjustPackageReasons,
    // mockRemediatePackageMethods: {
    //     enabled: false,
    //     behavior: {} as IMockRemediatePackageMethodsBehavior,
    // } as IMockRemediatePackageMethods,
    mockPlantBatchTypes: {
      enabled: false,
      behavior: {} as IMockPlantBatchTypesBehavior,
    } as IMockPlantBatchTypes,
    mockPlantBatchGrowthPhases: {
      enabled: false,
      behavior: {} as IMockPlantBatchGrowthPhasesBehavior,
    } as IMockPlantBatchGrowthPhases,
    mockDefaultPhoneNumberForQuestions: {
      enabled: false,
      behavior: {} as IMockDefaultPhoneNumberForQuestionsBehavior,
    } as IMockDefaultPhoneNumberForQuestions,
    mockFacilities: {
      enabled: false,
      behavior: {} as IMockFacilitiesBehavior,
    } as IMockFacilities,
    mockFacilityUsesLocationForPackages: {
      enabled: false,
      behavior: {} as IMockFacilityUsesLocationForPackagesBehavior,
    } as IMockFacilityUsesLocationForPackages,
    mockDestinationFacilities: {
      enabled: false,
      behavior: {} as IMockDesinationFacilitiesBehavior,
    } as IMockDesinationFacilities,
    mockTransporterFacilities: {
      enabled: false,
      behavior: {} as IMockTransporterFacilitiesBehavior,
    } as IMockTransporterFacilities,
    mockTransferTypes: {
      enabled: false,
      behavior: {} as IMockTransferTypesBehavior,
    } as IMockTransferTypes,
    mockDrivers: {
      enabled: false,
      behavior: {} as IMockDriversBehavior,
    } as IMockDrivers,
    mockVehicles: {
      enabled: false,
      behavior: {} as IMockDriversBehavior,
    } as IMockVehicles,
  } as IMockFlags,
};

const defaultState: IFlagsState = {
  ...inMemoryState,
  ...persistedState,
};

export const flagsModule = {
  state: () => defaultState,
  mutations: {
    [FlagsMutations.SET_FLAGS](state: IFlagsState, flags: any) {
      for (const [key, value] of Object.entries(flags)) {
        // @ts-ignore
        state[key] = value;
      }
    },
    [FlagsMutations.RESET_FLAGS](state: IFlagsState) {
      for (const [key, value] of Object.entries(defaultState)) {
        // @ts-ignore
        state[key] = value;
      }
    },
  },
  getters: {},
  actions: {
    [FlagsActions.SET_FLAGS](ctx: ActionContext<IFlagsState, IPluginState>, flags: any) {
      ctx.commit(FlagsMutations.SET_FLAGS, flags);
    },
    [FlagsActions.RESET_FLAGS](ctx: ActionContext<IFlagsState, IPluginState>) {
      ctx.commit(FlagsMutations.RESET_FLAGS);
    },
  },
};

export const flagsReducer = (state: IFlagsState): IFlagsState => ({
  ...state,
  ...inMemoryState,
});
