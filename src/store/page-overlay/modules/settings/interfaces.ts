import {
  LandingPage,
  PackageTabLabel,
  PlantsTabLabel,
  SalesTabLabel,
  TagsTabLabel,
  TransfersTabLabel,
} from "@/consts";
import { BackgroundState, DarkModeState, SnowflakeState } from "@/interfaces";

export interface ISettingsState {
  autoOpenActivePackages: boolean;
  autoOpenPackageTab: PackageTabLabel;
  autoOpenActiveSales: boolean;
  autoOpenSalesTab: SalesTabLabel;
  autoOpenAvailableTags: boolean;
  autoOpenTagsTab: TagsTabLabel;
  autoOpenFloweringPlants: boolean;
  autoOpenPlantsTab: PlantsTabLabel;
  autoOpenIncomingTransfers: boolean;
  autoOpenTransfersTab: TransfersTabLabel;
  darkModeState: DarkModeState;
  disablePopups: boolean;
  disableSnowAnimation: boolean;
  enableTransferTools: boolean;
  hideFacilityPicker: boolean;
  hideInlineTransferButtons: boolean;
  hidePackageSearch: boolean;
  hideQuickActionButtons: boolean;
  hideTransferSearch: boolean;
  landingPage: LandingPage;
  licenseKey: string;
  homeLicenses: { [key: string]: string | null };
  packageDefaultPageSize: number;
  plantDefaultPageSize: number;
  preventLogout: boolean;
  fixMetrcStyling: boolean;
  hideAiButton: boolean;
  efficientSpacing: boolean;
  modalExpand: boolean;
  autoDismissPopups: boolean;
  salesDefaultPageSize: number;
  backgroundState: BackgroundState;
  backgroundColor: string;
  backgroundGradientStartColor: string;
  backgroundGradientEndColor: string;
  backgroundImage: string;
  snowflakeState: SnowflakeState;
  snowflakeCharacter: string;
  snowflakeSize: string;
  snowflakeImage: string;
  snowflakeImageCrop: "none" | "square" | "circle" | "rounded";
  snowflakeText: string;
  tagDefaultPageSize: number;
  transferDefaultPageSize: number;
  enableManifestDocumentViewer: boolean;
  hideListingsButton: boolean;
  preventActiveProjectPageLeave: boolean;
  autoRefreshOnModalClose: boolean;
  disableAutoRefreshOnModalClose: boolean;
  useLegacyDateFormatForSubmit: boolean;
  writeSettingsToChromeStorage: boolean;
  enableSameItemPatch: boolean;
  enableLegacyTransferTools: boolean;
  loadDataInParallel: boolean;
  usePersistedCache: boolean;
  persistTimestamp: number;
  email: string;
}
