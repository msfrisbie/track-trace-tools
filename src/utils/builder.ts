import { IBuilderProject } from "@/modules/builder-manager.module";
import store from "@/store/page-overlay";

export const HOST_WILDCARD = "*";

const DEVELOPMENT_HOSTNAMES = ["localhost:5000"];

export function isCurrentHostAllowed(allowedHosts: string[]) {
  if (allowedHosts.includes(HOST_WILDCARD)) {
    return true;
  }

  if (store.state.debugMode && DEVELOPMENT_HOSTNAMES.includes(window.location.host)) {
    return true;
  }

  return allowedHosts.includes(window.location.host);
}

export function pendingOrInflightRowCount(project: IBuilderProject) {
  return project.pendingRows.length + (project.inflightRows?.length || 0);
}
export function failedRowCount(project: IBuilderProject) {
  return project.failedRows.length;
}
export function successRowCount(project: IBuilderProject) {
  return project.successRows.length;
}
export function totalRowCount(project: IBuilderProject) {
  return pendingOrInflightRowCount(project) + failedRowCount(project) + successRowCount(project);
}
