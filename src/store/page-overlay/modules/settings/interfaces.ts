import { LandingPage } from "@/consts";
import { DarkModeState, SnowflakeState } from "@/interfaces";

export interface ISettingsState {
  autoOpenActivePackages: boolean;
  autoOpenActiveSales: boolean;
  autoOpenAvailableTags: boolean;
  autoOpenFloweringPlants: boolean;
  autoOpenIncomingTransfers: boolean;
  darkModeState: DarkModeState;
  disablePopups: boolean;
  disableSnowAnimation: boolean;
  hideFacilityPicker: boolean;
  hideInlineTransferButtons: boolean;
  hidePackageSearch: boolean;
  hideQuickActionButtons: boolean;
  hideScreenshotButton: boolean;
  hideTransferSearch: boolean;
  landingPage: LandingPage;
  licenseKey: string;
  homeLicenses: { [key: string]: string | null };
  packageDefaultPageSize: number;
  plantDefaultPageSize: number;
  preventLogout: boolean;
  salesDefaultPageSize: number;
  snowflakeState: SnowflakeState;
  snowflakeCharacter: string;
  snowflakeSize: string;
  snowflakeImage: string;
  snowflakeImageCrop: "none" | "square" | "circle" | "rounded";
  snowflakeText: string;
  tagDefaultPageSize: number;
  transferDefaultPageSize: number;
  useLegacyScreenshot: boolean;
  enableManifestDocumentViewer: boolean;
  hideListingsButton: boolean;
  preventActiveProjectPageLeave: boolean;
  enableSearchOverMetrcModal: boolean;
}
