import { IAuthState, IPluginState } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { DynamicConstsManager, IEmployeeData } from "@/modules/dynamic-consts-manager.module";
import store from "@/store/page-overlay/index";
import { ReportsMutations, ReportType } from "@/store/page-overlay/modules/reports/consts";
import {
  IReportConfig,
  IReportData,
  IReportsState,
} from "@/store/page-overlay/modules/reports/interfaces";
import { ActionContext } from "vuex";
import { licenseFilterFactory } from "./reports-shared";

interface IEmployeePermissionsReportFormFilters {
  licenseOptions: string[];
  licenses: string[];
}

export const employeePermissionsFormFiltersFactory: () => IEmployeePermissionsReportFormFilters =
  () => ({
    ...licenseFilterFactory("all"),
  });

export function addEmployeePermissionsReport({
  reportConfig,
  employeePermissionsFormFilters,
}: {
  reportConfig: IReportConfig;
  employeePermissionsFormFilters: IEmployeePermissionsReportFormFilters;
}) {
  const licenses: string[] = employeePermissionsFormFilters.licenses;

  reportConfig[ReportType.EMPLOYEE_PERMISSIONS] = {
    licenses,
    fields: null,
  };
}

export async function maybeLoadEmployeePermissionsReportData({
  ctx,
  reportData,
  reportConfig,
}: {
  ctx: ActionContext<IReportsState, IPluginState>;
  reportData: IReportData;
  reportConfig: IReportConfig;
}) {
  const config = reportConfig[ReportType.EMPLOYEE_PERMISSIONS];

  if (config) {
    const licenseEmployeePairs: { license: string; employee: IEmployeeData }[] = [];

    const permissionsSet: Set<string> = new Set();

    const authState = await authManager.authStateOrError();

    for (const license of config.licenses) {
      ctx.commit(ReportsMutations.SET_STATUS, {
        statusMessage: { text: `Loading employees for ${license}`, level: "success" },
      });

      const spoofedAuthState: IAuthState = {
        ...authState,
        license,
      };

      const spoofedDynamicConstsManager = new DynamicConstsManager();
      await spoofedDynamicConstsManager.init(spoofedAuthState);

      try {
        (await spoofedDynamicConstsManager.employees()).map((employee) =>
          licenseEmployeePairs.push({ employee, license })
        );
      } catch {
        ctx.commit(ReportsMutations.SET_STATUS, {
          statusMessage: { text: `Unable to load employees for ${license}`, level: "warning" },
        });
      }
    }

    for (const { license, employee } of licenseEmployeePairs) {
      employee.Permissions.map((permission) => permissionsSet.add(permission));
    }

    const flattenedPermissionColumns = [...permissionsSet].sort();

    const employeePermissionsMatrix: any[][] = [
      ["License", "Employee ID", "Employee Name", "Employee Email", ...flattenedPermissionColumns],
    ];

    for (const { license, employee } of licenseEmployeePairs) {
      // eslint-disable-next-line no-confusing-arrow
      const permissionList: string[] = flattenedPermissionColumns.map((permission) =>
        employee.Permissions.includes(permission) ? "YES" : ""
      );

      employeePermissionsMatrix.push([
        license,
        employee.EmployeeId,
        employee.FullName,
        employee.Email,
        ...permissionList,
      ]);
    }

    reportData[ReportType.EMPLOYEE_PERMISSIONS] = {
      employeePermissionsMatrix,
    };
  }
}

export function extractEmployeePermissionsData({
  reportType,
  reportConfig,
  reportData,
}: {
  reportType: ReportType;
  reportConfig: IReportConfig;
  reportData: IReportData;
}): any[][] {
  return reportData[ReportType.EMPLOYEE_PERMISSIONS]!.employeePermissionsMatrix;
}

export async function createEmployeePermissionsReportOrError({
  reportData,
  reportConfig,
}: {
  reportData: IReportData;
  reportConfig: IReportConfig;
}): Promise<any> {
  if (!store.state.pluginAuth?.authState?.license) {
    throw new Error("Invalid authState");
  }

  if (!reportData[ReportType.EMPLOYEE_PERMISSIONS]) {
    throw new Error("Missing employee permissions data");
  }
}
