<template>
  <div>
    <div class="grid grid-cols-3 gap-8 w-full">
      <!-- First Column -->
      <div
        class="flex flex-col gap-2 items-stretch"
        v-bind:class="{ 'opacity-50': reportStatus !== ReportStatus.INITIAL }"
      >
        <div class="text-start text-gray-600 pb-2" v-if="!clientValues['ENABLE_T3PLUS'] && !t3plus">
          Get access to advanced reports with
          <a class="text-purple-500 underline" href="#" @click="$router.push('/plus')">T3+</a>
        </div>

        <b-form-group>
          <b-form-checkbox-group v-model="selectedReports" class="flex flex-col gap-1">
            <report-checkbox-section
              title="CUSTOM"
              :reportOptions="reportOptions.filter((x) => x.isCustom)"
            ></report-checkbox-section>
            <report-checkbox-section
              title="QUICKVIEW"
              :reportOptions="reportOptions.filter((x) => x.isQuickview)"
            ></report-checkbox-section>
            <report-checkbox-section
              title="CATALOG"
              :reportOptions="reportOptions.filter((x) => x.isCatalog)"
            ></report-checkbox-section>
            <report-checkbox-section
              title="ADVANCED"
              :reportOptions="reportOptions.filter((x) => x.isSpecialty)"
            ></report-checkbox-section>
          </b-form-checkbox-group>
        </b-form-group>
      </div>

      <!-- Middle Column -->
      <div
        v-bind:class="{ invisible: reportStatus !== ReportStatus.INITIAL }"
        class="flex flex-col items-stretch gap-4"
      >
        <template v-if="selectedReports.length > 0">
          <div class="pb-2 flex flex-col items-stretch gap-2 text-xl font-semibold ttt-purple">
            {{ selectedReports.length }} REPORT{{ selectedReports.length > 1 ? "S" : "" }}
            SELECTED:
          </div>
          <!-- <div class="ttt-purple text-center">
              Configure your report below. <br />Defaults to active data and all fields.
            </div> -->
        </template>
        <template v-else>
          <div class="text-center flex flex-col gap-2 border rounded-xl p-4">
            <div class="text-base">
              Track &amp; Trace Tools can generate reports as CSVs or in Google Sheets.
            </div>

            <a
              class="underline text-purple-600"
              href="https://docs.google.com/spreadsheets/d/1fxBfjBUhFt6Gj7PpbQO8DlT1e76DIDtTwiq_2A5tHCU/edit?usp=sharing"
              target="_blank"
              >Example report</a
            >
            <a class="underline text-purple-600" href="https://youtu.be/JBR21XSKK3I" target="_blank"
              >How do I make a report?</a
            >
          </div>
        </template>

        <!-- COGS -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.COGS)">
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">COGS</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="flex flex-col items-start gap-1">
                <b-form-datepicker
                  :required="true"
                  initial-date
                  size="sm"
                  v-model="cogsFormFilters.cogsDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-datepicker
                  :required="true"
                  initial-date
                  size="sm"
                  v-model="cogsFormFilters.cogsDateLt"
                />
              </div>
            </div>
            <hr />
            <archive-widget ref="archive"></archive-widget>
          </div>
        </template>

        <!-- COGS V2 -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.COGS_V2)">
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">COGS</div>

            <div>
              <span class="font-semibold text-red-500"
                >Note: This can take up to 10 minutes to finish. Do not close the tab before it
                finishes.</span
              >
            </div>

            <b-button
              size="sm"
              variant="link"
              class="text-purple-500 underline"
              :href="clientValues['COGS_YOUTUBE_URL']"
              target="_blank"
              >How to use this tool</b-button
            >

            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="flex flex-col items-start gap-1">
                <span>Start date:</span>
                <b-form-datepicker
                  :required="true"
                  initial-date
                  size="sm"
                  v-model="cogsV2FormFilters.cogsDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <span>End date:</span>
                <b-form-datepicker
                  :required="true"
                  initial-date
                  size="sm"
                  v-model="cogsV2FormFilters.cogsDateLt"
                />
              </div>

              <hr />

              <b-button size="sm" variant="primary" @click="updateMasterPbCostSheet()"
                >UPDATE MASTER PB COST SHEET</b-button
              >
              <a
                size="sm"
                variant="link"
                class="text-purple-500 underline"
                :href="clientValues['MASTER_PB_COST_SHEET_URL']"
                target="_blank"
                >Master PB Cost Sheet</a
              >

              <hr />

              <simple-drawer toggleText="ADVANCED">
                <report-license-picker :formFilters="cogsV2FormFilters"></report-license-picker>
              </simple-drawer>
            </div>
          </div>
        </template>

        <!-- COGS Tracker -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.COGS_TRACKER)">
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">COGS Tracker</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="flex flex-col items-start gap-1">
                <div class="text-gray-500">Start date</div>
                <b-form-datepicker
                  :required="true"
                  initial-date
                  size="sm"
                  v-model="cogsTrackerFormFilters.cogsTrackerDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <div class="text-gray-500">End date</div>
                <b-form-datepicker
                  :required="true"
                  initial-date
                  size="sm"
                  v-model="cogsTrackerFormFilters.cogsTrackerDateLt"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Employee Samples -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.EMPLOYEE_SAMPLES)"
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Employee Samples</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="flex flex-col items-start gap-1">
                <div class="text-gray-500">Start date</div>
                <b-form-datepicker
                  :required="true"
                  initial-date
                  size="sm"
                  v-model="employeeSamplesFormFilters.employeeSamplesDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <div class="text-gray-500">End date</div>
                <b-input-group>
                  <b-form-datepicker
                    :required="true"
                    initial-date
                    size="sm"
                    v-model="employeeSamplesFormFilters.employeeSamplesDateLt"
                  />

                  <template #append>
                    <b-button
                      variant="outline-primary"
                      size="sm"
                      @click="
                        employeeSamplesFormFilters.employeeSamplesDateLt = getIsoDateFromOffset(
                          29,
                          employeeSamplesFormFilters.employeeSamplesDateGt
                        ).split('T')[0]
                      "
                    >
                      START + 30
                    </b-button>
                  </template>
                </b-input-group>
              </div>
            </div>
          </div>
        </template>

        <!-- Harvest Packages -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.HARVEST_PACKAGES)"
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Harvest Packages</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="harvestPackagesFormFilters.shouldFilterHarvestDateGt">
                  <span class="leading-6">Harvested on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="harvestPackagesFormFilters.shouldFilterHarvestDateGt"
                  :disabled="!harvestPackagesFormFilters.shouldFilterHarvestDateGt"
                  initial-date
                  size="sm"
                  v-model="harvestPackagesFormFilters.harvestDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="harvestPackagesFormFilters.shouldFilterHarvestDateLt">
                  <span class="leading-6">Harvested on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="harvestPackagesFormFilters.shouldFilterHarvestDateLt"
                  :disabled="!harvestPackagesFormFilters.shouldFilterHarvestDateLt"
                  initial-date
                  size="sm"
                  v-model="harvestPackagesFormFilters.harvestDateLt"
                />
              </div>

              <b-form-checkbox v-model="harvestPackagesFormFilters.removeFloorNugs">
                <span class="leading-6">Remove "Floor Nugs" harvests</span>
              </b-form-checkbox>

              <hr />

              <simple-drawer toggleText="ADVANCED">
                <b-form-checkbox v-model="harvestPackagesFormFilters.debug">
                  <span class="leading-6">Debug</span>
                </b-form-checkbox>
                <b-form-checkbox v-model="harvestPackagesFormFilters.displayChecksum">
                  <span class="leading-6">Display checksum</span>
                </b-form-checkbox>
                <b-form-checkbox v-model="harvestPackagesFormFilters.displayFullTags">
                  <span class="leading-6">Display full package tags</span>
                </b-form-checkbox>
                <b-form-checkbox v-model="harvestPackagesFormFilters.addSpacing">
                  <span class="leading-6">Add spacing</span>
                </b-form-checkbox>
                <b-form-checkbox v-model="harvestPackagesFormFilters.enableHarvestMatchFilter">
                  <span class="leading-6">Use harvest match filter</span>
                </b-form-checkbox>
                <b-form-group
                  v-if="harvestPackagesFormFilters.enableHarvestMatchFilter"
                  label="Only include harvest names matching:"
                >
                  <b-form-input
                    placeholder="Full or partial harvest name"
                    v-model="harvestPackagesFormFilters.harvestMatchFilter"
                  >
                  </b-form-input>
                </b-form-group>
                <report-license-picker
                  :formFilters="harvestPackagesFormFilters"
                ></report-license-picker>
              </simple-drawer>
            </div>
          </div>
        </template>

        <!-- Point In Time Inventory -->
        <template
          v-if="
            selectedReports.find((report) => report.value === ReportType.POINT_IN_TIME_INVENTORY)
          "
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">
              Point In Time Inventory
            </div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <div class="flex flex-col items-start gap-1">
                <span class="leading-6">Point in time:</span>
                <b-form-datepicker
                  initial-date
                  size="sm"
                  v-model="pointInTimeInventoryFormFilters.targetDate"
                />
              </div>
              <b-form-group label="Longest amount of time a package is held at this facility:">
                <b-form-select
                  :disabled="!pointInTimeInventoryFormFilters.useRestrictedWindowOptimization"
                  v-model="pointInTimeInventoryFormFilters.restrictedWindowDays"
                  :options="pointInTimeInventoryFormFilters.restrictedWindowDaysOptions"
                ></b-form-select>
              </b-form-group>
              <hr />

              <simple-drawer toggleText="ADVANCED">
                <report-license-picker
                  :formFilters="pointInTimeInventoryFormFilters"
                ></report-license-picker>

                <b-form-checkbox
                  v-model="pointInTimeInventoryFormFilters.useRestrictedWindowOptimization"
                >
                  <span class="leading-6">Restrict package window (recommended)</span>
                </b-form-checkbox>

                <span
                  v-if="!pointInTimeInventoryFormFilters.useRestrictedWindowOptimization"
                  class="mb-4 text-xs text-red-500"
                  >Disabling this will include packages held for any length of time, but report
                  generation will be significantly slower.</span
                >

                <b-form-checkbox v-model="pointInTimeInventoryFormFilters.showDebugColumns">
                  <span class="leading-6">Show debug columns</span>
                </b-form-checkbox>
              </simple-drawer>
            </div>
          </div>
        </template>

        <!-- Packages -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.PACKAGES)">
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Packages</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <b-form-checkbox v-model="packagesFormFilters.includeActive">
                <span class="leading-6">Include active packages</span>
              </b-form-checkbox>

              <b-form-checkbox v-model="packagesFormFilters.includeInactive">
                <span class="leading-6">Include inactive packages</span>
              </b-form-checkbox>

              <b-form-checkbox v-model="packagesFormFilters.includeIntransit">
                <span class="leading-6">Include in-transit packages</span>
              </b-form-checkbox>

              <!-- <b-form-checkbox v-model="packagesFormFilters.includeTransferHub">
                    <span class="leading-6">Include transfer hub packages</span>
                  </b-form-checkbox> -->

              <!-- <b-form-checkbox :disabled="!clientValues['ENABLE_T3PLUS'] && !t3plus">
                    <div class="flex flex-col items-start">
                      <span class="leading-6"
                        >Include packages transferred out of this facility</span
                      >
                      <span
                        v-if="!clientValues['ENABLE_T3PLUS'] && !t3plus"
                        class="text-xs text-gray-300"
                        >Enable this with
                        <a href="https://trackandtrace.tools/plus" target="_blank">T3+</a></span
                      >
                    </div>
                  </b-form-checkbox> -->

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="packagesFormFilters.shouldFilterPackagedDateGt">
                  <span class="leading-6">Packaged on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="packagesFormFilters.shouldFilterPackagedDateGt"
                  :disabled="!packagesFormFilters.shouldFilterPackagedDateGt"
                  initial-date
                  size="sm"
                  v-model="packagesFormFilters.packagedDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="packagesFormFilters.shouldFilterPackagedDateLt">
                  <span class="leading-6">Packaged on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="packagesFormFilters.shouldFilterPackagedDateLt"
                  :disabled="!packagesFormFilters.shouldFilterPackagedDateLt"
                  initial-date
                  size="sm"
                  v-model="packagesFormFilters.packagedDateLt"
                />
              </div>

              <b-form-checkbox v-model="packagesFormFilters.onlyProductionBatches">
                <span class="leading-6">ONLY include production batches</span>
              </b-form-checkbox>

              <simple-drawer toggleText="ADVANCED">
                <report-license-picker :formFilters="packagesFormFilters"></report-license-picker>
              </simple-drawer>

              <hr />

              <div class="font-semibold text-gray-700">Columns:</div>

              <b-form-checkbox-group
                v-model="fields[ReportType.PACKAGES]"
                class="flex flex-col items-start gap-1"
              >
                <div
                  v-for="fieldData of SHEET_FIELDS[ReportType.PACKAGES]"
                  v-bind:key="fieldData.value"
                  class="flex flex-col gap-1 items-start"
                >
                  <b-form-checkbox :value="fieldData" :disabled="fieldData.required">
                    <span class="leading-6">{{ fieldData.readableName }}</span>
                  </b-form-checkbox>
                  <template
                    v-if="
                      fieldData.checkedMessage && fields[ReportType.PACKAGES].includes(fieldData)
                    "
                  >
                    <span class="text-red-500 text-xs">{{ fieldData.checkedMessage }}</span>
                  </template>
                </div>
              </b-form-checkbox-group>

              <div class="grid grid-cols-2 gap-2">
                <b-button variant="outline-dark" size="sm" @click="checkAll(ReportType.PACKAGES)"
                  >CHECK ALL</b-button
                >
                <b-button variant="outline-dark" size="sm" @click="uncheckAll(ReportType.PACKAGES)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Harvests -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.HARVESTS)">
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Harvests</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <b-form-checkbox v-model="harvestsFormFilters.includeActive">
                <span class="leading-6">Include active harvests</span>
              </b-form-checkbox>

              <b-form-checkbox v-model="harvestsFormFilters.includeInactive">
                <span class="leading-6">Include inactive harvests</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="harvestsFormFilters.shouldFilterHarvestDateGt">
                  <span class="leading-6">Harvested on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="harvestsFormFilters.shouldFilterHarvestDateGt"
                  :disabled="!harvestsFormFilters.shouldFilterHarvestDateGt"
                  initial-date
                  size="sm"
                  v-model="harvestsFormFilters.harvestDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="harvestsFormFilters.shouldFilterHarvestDateLt">
                  <span class="leading-6">Harvested on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="harvestsFormFilters.shouldFilterHarvestDateLt"
                  :disabled="!harvestsFormFilters.shouldFilterHarvestDateLt"
                  initial-date
                  size="sm"
                  v-model="harvestsFormFilters.harvestDateLt"
                />
              </div>

              <hr />

              <div class="font-semibold text-gray-700">Columns:</div>

              <b-form-checkbox-group
                v-model="fields[ReportType.HARVESTS]"
                class="flex flex-col items-start gap-1"
              >
                <b-form-checkbox
                  v-for="fieldData of SHEET_FIELDS[ReportType.HARVESTS]"
                  v-bind:key="fieldData.value"
                  :value="fieldData"
                  :disabled="fieldData.required"
                >
                  <span class="leading-6">{{ fieldData.readableName }}</span>
                </b-form-checkbox>
              </b-form-checkbox-group>

              <div class="grid grid-cols-2 gap-2">
                <b-button variant="outline-dark" size="sm" @click="checkAll(ReportType.HARVESTS)"
                  >CHECK ALL</b-button
                >
                <b-button variant="outline-dark" size="sm" @click="uncheckAll(ReportType.HARVESTS)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Mature Plants -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.MATURE_PLANTS)"
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Mature Plants</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <b-form-checkbox v-model="maturePlantsFormFilters.includeVegetative">
                <span class="leading-6">Include Vegetative</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="maturePlantsFormFilters.includeFlowering">
                <span class="leading-6">Include Flowering</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="maturePlantsFormFilters.includeInactive">
                <span class="leading-6">Include Inactive</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="maturePlantsFormFilters.shouldFilterPlantedDateGt">
                  <span class="leading-6">Planted on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="maturePlantsFormFilters.shouldFilterPlantedDateGt"
                  :disabled="!maturePlantsFormFilters.shouldFilterPlantedDateGt"
                  initial-date
                  size="sm"
                  v-model="maturePlantsFormFilters.plantedDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="maturePlantsFormFilters.shouldFilterPlantedDateLt">
                  <span class="leading-6">Planted on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="maturePlantsFormFilters.shouldFilterPlantedDateLt"
                  :disabled="!maturePlantsFormFilters.shouldFilterPlantedDateLt"
                  initial-date
                  size="sm"
                  v-model="maturePlantsFormFilters.plantedDateLt"
                />
              </div>

              <simple-drawer toggleText="ADVANCED">
                <report-license-picker
                  :formFilters="maturePlantsFormFilters"
                ></report-license-picker>
              </simple-drawer>

              <hr />

              <div class="font-semibold text-gray-700">Columns:</div>
              <b-form-checkbox-group
                v-model="fields[ReportType.MATURE_PLANTS]"
                class="flex flex-col items-start gap-1"
              >
                <b-form-checkbox
                  v-for="fieldData of SHEET_FIELDS[ReportType.MATURE_PLANTS]"
                  v-bind:key="fieldData.value"
                  :value="fieldData"
                  :disabled="fieldData.required"
                >
                  <span class="leading-6">{{ fieldData.readableName }}</span>
                </b-form-checkbox>
              </b-form-checkbox-group>

              <div class="grid grid-cols-2 gap-2">
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="checkAll(ReportType.MATURE_PLANTS)"
                  >CHECK ALL</b-button
                >
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="uncheckAll(ReportType.MATURE_PLANTS)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Immature Plants -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.IMMATURE_PLANTS)"
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Immature Plants</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <b-form-checkbox v-model="immaturePlantsFormFilters.includeActive">
                <span class="leading-6">Include Active</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="immaturePlantsFormFilters.includeInactive">
                <span class="leading-6">Include Inactive</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="immaturePlantsFormFilters.shouldFilterPlantedDateGt">
                  <span class="leading-6">Planted on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="immaturePlantsFormFilters.shouldFilterPlantedDateGt"
                  :disabled="!immaturePlantsFormFilters.shouldFilterPlantedDateGt"
                  initial-date
                  size="sm"
                  v-model="immaturePlantsFormFilters.plantedDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="immaturePlantsFormFilters.shouldFilterPlantedDateLt">
                  <span class="leading-6">Planted on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="immaturePlantsFormFilters.shouldFilterPlantedDateLt"
                  :disabled="!immaturePlantsFormFilters.shouldFilterPlantedDateLt"
                  initial-date
                  size="sm"
                  v-model="immaturePlantsFormFilters.plantedDateLt"
                />
              </div>

              <simple-drawer toggleText="ADVANCED">
                <report-license-picker
                  :formFilters="immaturePlantsFormFilters"
                ></report-license-picker>
              </simple-drawer>

              <hr />

              <div class="font-semibold text-gray-700">Columns:</div>

              <b-form-checkbox-group
                v-model="fields[ReportType.IMMATURE_PLANTS]"
                class="flex flex-col items-start gap-1"
              >
                <b-form-checkbox
                  v-for="fieldData of SHEET_FIELDS[ReportType.IMMATURE_PLANTS]"
                  v-bind:key="fieldData.value"
                  :value="fieldData"
                  :disabled="fieldData.required"
                >
                  <span class="leading-6">{{ fieldData.readableName }}</span>
                </b-form-checkbox>
              </b-form-checkbox-group>

              <div class="grid grid-cols-2 gap-2">
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="checkAll(ReportType.IMMATURE_PLANTS)"
                  >CHECK ALL</b-button
                >
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="uncheckAll(ReportType.IMMATURE_PLANTS)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Outgoing Transfers -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.OUTGOING_TRANSFERS)"
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Outgoing Transfers</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <b-form-checkbox v-model="outgoingTransfersFormFilters.includeOutgoing">
                <span class="leading-6">Include Active Outgoing</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="outgoingTransfersFormFilters.includeRejected">
                <span class="leading-6">Include Rejected</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="outgoingTransfersFormFilters.includeOutgoingInactive">
                <span class="leading-6">Include Inactive Outgoing</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="outgoingTransfersFormFilters.onlyWholesale">
                <span class="leading-6">Only Wholesale</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateGt"
                >
                  <span class="leading-6">ETD on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateGt"
                  :disabled="!outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateGt"
                  initial-date
                  size="sm"
                  v-model="outgoingTransfersFormFilters.estimatedDepartureDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateLt"
                >
                  <span class="leading-6">ETD on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateLt"
                  :disabled="!outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateLt"
                  initial-date
                  size="sm"
                  v-model="outgoingTransfersFormFilters.estimatedDepartureDateLt"
                />
              </div>
              <hr />
              <div class="font-semibold text-gray-700">Columns:</div>

              <b-form-checkbox-group
                v-model="fields[ReportType.OUTGOING_TRANSFERS]"
                class="flex flex-col items-start gap-1"
              >
                <b-form-checkbox
                  v-for="fieldData of SHEET_FIELDS[ReportType.OUTGOING_TRANSFERS]"
                  v-bind:key="fieldData.value"
                  :value="fieldData"
                  :disabled="fieldData.required"
                >
                  <span class="leading-6">{{ fieldData.readableName }}</span>
                </b-form-checkbox>
              </b-form-checkbox-group>
              <div class="grid grid-cols-2 gap-2">
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="checkAll(ReportType.OUTGOING_TRANSFERS)"
                  >CHECK ALL</b-button
                >
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="uncheckAll(ReportType.OUTGOING_TRANSFERS)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Transfer Hub Transfers -->
        <template
          v-if="
            selectedReports.find((report) => report.value === ReportType.TRANSFER_HUB_TRANSFERS)
          "
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Hub Transfers</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>
              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateGt"
                >
                  <span class="leading-6">ETD on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateGt"
                  :disabled="!transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateGt"
                  initial-date
                  size="sm"
                  v-model="transferHubTransfersFormFilters.estimatedDepartureDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateLt"
                >
                  <span class="leading-6">ETD on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateLt"
                  :disabled="!transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateLt"
                  initial-date
                  size="sm"
                  v-model="transferHubTransfersFormFilters.estimatedDepartureDateLt"
                />
              </div>

              <hr />

              <div class="font-semibold text-gray-700">Columns:</div>

              <b-form-checkbox-group
                v-model="fields[ReportType.TRANSFER_HUB_TRANSFERS]"
                class="flex flex-col items-start gap-1"
              >
                <b-form-checkbox
                  v-for="fieldData of SHEET_FIELDS[ReportType.TRANSFER_HUB_TRANSFERS]"
                  v-bind:key="fieldData.value"
                  :value="fieldData"
                  :disabled="fieldData.required"
                >
                  <span class="leading-6">{{ fieldData.readableName }}</span>
                </b-form-checkbox>
              </b-form-checkbox-group>
              <div class="grid grid-cols-2 gap-2">
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="checkAll(ReportType.TRANSFER_HUB_TRANSFERS)"
                  >CHECK ALL</b-button
                >
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="uncheckAll(ReportType.TRANSFER_HUB_TRANSFERS)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Incoming Transfers -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.INCOMING_TRANSFERS)"
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Incoming Transfers</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>
              <b-form-checkbox v-model="incomingTransfersFormFilters.includeIncoming">
                <span class="leading-6">Include Active Incoming</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="incomingTransfersFormFilters.includeIncomingInactive">
                <span class="leading-6">Include Inactive Incoming</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="incomingTransfersFormFilters.onlyWholesale">
                <span class="leading-6">Only Wholesale</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateGt"
                >
                  <span class="leading-6">ETA on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateGt"
                  :disabled="!incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateGt"
                  initial-date
                  size="sm"
                  v-model="incomingTransfersFormFilters.estimatedArrivalDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateLt"
                >
                  <span class="leading-6">ETA on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateLt"
                  :disabled="!incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateLt"
                  initial-date
                  size="sm"
                  v-model="incomingTransfersFormFilters.estimatedArrivalDateLt"
                />
              </div>

              <hr />

              <div class="font-semibold text-gray-700">Columns:</div>

              <b-form-checkbox-group
                v-model="fields[ReportType.INCOMING_TRANSFERS]"
                class="flex flex-col items-start gap-1"
              >
                <b-form-checkbox
                  v-for="fieldData of SHEET_FIELDS[ReportType.INCOMING_TRANSFERS]"
                  v-bind:key="fieldData.value"
                  :value="fieldData"
                  :disabled="fieldData.required"
                >
                  <span class="leading-6">{{ fieldData.readableName }}</span>
                </b-form-checkbox>
              </b-form-checkbox-group>

              <div class="grid grid-cols-2 gap-2">
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="checkAll(ReportType.INCOMING_TRANSFERS)"
                  >CHECK ALL</b-button
                >
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="uncheckAll(ReportType.INCOMING_TRANSFERS)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Tags -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.TAGS)">
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Tags</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>
              <b-form-checkbox v-model="tagsFormFilters.includePlant">
                <span class="leading-6">Include Plant Tags</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="tagsFormFilters.includePackage">
                <span class="leading-6">Include Package Tags</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="tagsFormFilters.includeAvailable">
                <span class="leading-6">Include Available</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="tagsFormFilters.includeUsed">
                <span class="leading-6">Include Used</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="tagsFormFilters.includeVoided">
                <span class="leading-6">Include Voided</span>
              </b-form-checkbox>
              <hr />

              <div class="font-semibold text-gray-700">Columns:</div>

              <b-form-checkbox-group
                v-model="fields[ReportType.TAGS]"
                class="flex flex-col items-start gap-1"
              >
                <b-form-checkbox
                  v-for="fieldData of SHEET_FIELDS[ReportType.TAGS]"
                  v-bind:key="fieldData.value"
                  :value="fieldData"
                  :disabled="fieldData.required"
                >
                  <span class="leading-6">{{ fieldData.readableName }}</span>
                </b-form-checkbox>
              </b-form-checkbox-group>
              <div class="grid grid-cols-2 gap-2">
                <b-button variant="outline-dark" size="sm" @click="checkAll(ReportType.TAGS)"
                  >CHECK ALL</b-button
                >
                <b-button variant="outline-dark" size="sm" @click="uncheckAll(ReportType.TAGS)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Outgoing Transfer Manifests -->
        <template
          v-if="
            selectedReports.find(
              (report) => report.value === ReportType.OUTGOING_TRANSFER_MANIFESTS
            )
          "
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">
              Outgoing Transfer Manifests
            </div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>
              <b-form-checkbox v-model="outgoingTransferManifestsFormFilters.includeOutgoing">
                <span class="leading-6">Include Active Outgoing</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="outgoingTransferManifestsFormFilters.includeRejected">
                <span class="leading-6">Include Rejected</span>
              </b-form-checkbox>
              <b-form-checkbox
                v-model="outgoingTransferManifestsFormFilters.includeOutgoingInactive"
              >
                <span class="leading-6">Include Inactive Outgoing</span>
              </b-form-checkbox>
              <b-form-checkbox
                :disabled="!clientValues['ENABLE_T3PLUS'] && !t3plus"
                v-model="outgoingTransferManifestsFormFilters.onlyWholesale"
              >
                <span class="leading-6">Only Wholesale</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="
                    outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateGt
                  "
                >
                  <span class="leading-6">ETD on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateGt"
                  :disabled="
                    !outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateGt
                  "
                  initial-date
                  size="sm"
                  v-model="outgoingTransferManifestsFormFilters.estimatedDepartureDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="
                    outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateLt
                  "
                >
                  <span class="leading-6">ETD on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateLt"
                  :disabled="
                    !outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateLt
                  "
                  initial-date
                  size="sm"
                  v-model="outgoingTransferManifestsFormFilters.estimatedDepartureDateLt"
                />
              </div>

              <hr />

              <div class="font-semibold text-gray-700">Columns:</div>

              <b-form-checkbox-group
                v-model="fields[ReportType.OUTGOING_TRANSFER_MANIFESTS]"
                class="flex flex-col items-start gap-1"
              >
                <b-form-checkbox
                  v-for="fieldData of SHEET_FIELDS[ReportType.OUTGOING_TRANSFER_MANIFESTS]"
                  v-bind:key="fieldData.value"
                  :value="fieldData"
                  :disabled="fieldData.required"
                >
                  <span class="leading-6">{{ fieldData.readableName }}</span>
                </b-form-checkbox>
              </b-form-checkbox-group>
              <div class="grid grid-cols-2 gap-2">
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="checkAll(ReportType.OUTGOING_TRANSFER_MANIFESTS)"
                  >CHECK ALL</b-button
                >
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="uncheckAll(ReportType.OUTGOING_TRANSFER_MANIFESTS)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Straggler Packages -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.STRAGGLER_PACKAGES)"
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Straggler Packages</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="stragglerPackagesFormFilters.includeNearlyEmpty">
                  <span class="leading-6">Quantity less than:</span>
                </b-form-checkbox>

                <template v-if="stragglerPackagesFormFilters.includeNearlyEmpty">
                  <b-form-select
                    size="sm"
                    :options="[20, 10, 5, 3, 2, 1]"
                    v-model="stragglerPackagesFormFilters.quantityLt"
                  />
                </template>
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="stragglerPackagesFormFilters.shouldFilterLastModifiedDateGt"
                >
                  <span class="leading-6">Last modified on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="stragglerPackagesFormFilters.shouldFilterLastModifiedDateGt"
                  :disabled="!stragglerPackagesFormFilters.shouldFilterLastModifiedDateGt"
                  initial-date
                  size="sm"
                  v-model="stragglerPackagesFormFilters.lastModifiedDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="stragglerPackagesFormFilters.shouldFilterLastModifiedDateLt"
                >
                  <span class="leading-6">Last modified on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="stragglerPackagesFormFilters.shouldFilterLastModifiedDateLt"
                  :disabled="!stragglerPackagesFormFilters.shouldFilterLastModifiedDateLt"
                  initial-date
                  size="sm"
                  v-model="stragglerPackagesFormFilters.lastModifiedDateLt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="stragglerPackagesFormFilters.shouldFilterPackagedDateGt">
                  <span class="leading-6">Packaged on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="stragglerPackagesFormFilters.shouldFilterPackagedDateGt"
                  :disabled="!stragglerPackagesFormFilters.shouldFilterPackagedDateGt"
                  initial-date
                  size="sm"
                  v-model="stragglerPackagesFormFilters.packagedDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="stragglerPackagesFormFilters.shouldFilterPackagedDateLt">
                  <span class="leading-6">Packaged on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="stragglerPackagesFormFilters.shouldFilterPackagedDateLt"
                  :disabled="!stragglerPackagesFormFilters.shouldFilterPackagedDateLt"
                  initial-date
                  size="sm"
                  v-model="stragglerPackagesFormFilters.packagedDateLt"
                />
              </div>

              <hr />

              <div class="font-semibold text-gray-700">Columns:</div>

              <b-form-checkbox-group
                v-model="fields[ReportType.STRAGGLER_PACKAGES]"
                class="flex flex-col items-start gap-1"
              >
                <b-form-checkbox
                  v-for="fieldData of SHEET_FIELDS[ReportType.STRAGGLER_PACKAGES]"
                  v-bind:key="fieldData.value"
                  :value="fieldData"
                  :disabled="fieldData.required"
                >
                  <span class="leading-6">{{ fieldData.readableName }}</span>
                </b-form-checkbox>
              </b-form-checkbox-group>

              <div class="grid grid-cols-2 gap-2">
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="checkAll(ReportType.STRAGGLER_PACKAGES)"
                  >CHECK ALL</b-button
                >
                <b-button
                  variant="outline-dark"
                  size="sm"
                  @click="uncheckAll(ReportType.STRAGGLER_PACKAGES)"
                  >UNCHECK ALL</b-button
                >
              </div>
            </div>
          </div>
        </template>

        <!-- Employee Audit -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.EMPLOYEE_AUDIT)"
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Employee Activity</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="text-red-500 text-xs">
                This report loads a significant amount of data from Metrc. For multi-license
                operators with many packages or transfers, it's recommended you limit audit periods
                to one month or less.
              </div>

              <div class="font-semibold text-gray-700">Filters:</div>

              <div class="flex flex-col items-start gap-1">
                <b-form-group
                  label="Employee Names or Usernames:"
                  description="Full or partial match, uppercase or lowercase, separated by commas"
                >
                  <b-form-input
                    size="sm"
                    :state="employeeAuditFormFilters.employeeQuery.length > 3"
                    v-model="employeeAuditFormFilters.employeeQuery"
                  >
                  </b-form-input>
                </b-form-group>
              </div>

              <b-form-checkbox v-model="employeeAuditFormFilters.includePackages">
                <span class="leading-6">Include package activity</span>
              </b-form-checkbox>

              <b-form-checkbox v-model="employeeAuditFormFilters.includeTransfers">
                <span class="leading-6">Include transfer activity</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="employeeAuditFormFilters.shouldFilterActivityDateGt">
                  <span class="leading-6">Activity on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="employeeAuditFormFilters.shouldFilterActivityDateGt"
                  :disabled="!employeeAuditFormFilters.shouldFilterActivityDateGt"
                  initial-date
                  size="sm"
                  v-model="employeeAuditFormFilters.activityDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="employeeAuditFormFilters.shouldFilterActivityDateLt">
                  <span class="leading-6">Activity on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="employeeAuditFormFilters.shouldFilterActivityDateLt"
                  :disabled="!employeeAuditFormFilters.shouldFilterActivityDateLt"
                  initial-date
                  size="sm"
                  v-model="employeeAuditFormFilters.activityDateLt"
                />
              </div>

              <hr />

              <simple-drawer toggleText="ADVANCED">
                <report-license-picker
                  :formFilters="employeeAuditFormFilters"
                ></report-license-picker>
              </simple-drawer>
            </div>
          </div>
        </template>

        <!-- Packages Quickview -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.PACKAGES_QUICKVIEW)"
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Packages Quickview</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <b-form-group label="Slice packages by:" label-size="sm">
                <b-form-select
                  v-model="packagesQuickviewFormFilters.primaryDimension"
                  :options="PACKAGES_QUICKVIEW_DIMENSIONS"
                ></b-form-select>
              </b-form-group>

              <b-form-group label="Slice packages by: (optional)" label-size="sm">
                <b-form-select
                  v-model="packagesQuickviewFormFilters.secondaryDimension"
                  :options="[{ text: 'None', value: null }, ...PACKAGES_QUICKVIEW_DIMENSIONS]"
                ></b-form-select>
              </b-form-group>

              <b-form-checkbox v-model="packagesQuickviewFormFilters.includeActive">
                <span class="leading-6">Include Active</span>
              </b-form-checkbox>

              <b-form-checkbox v-model="packagesQuickviewFormFilters.includeIntransit">
                <span class="leading-6">Include In Transit</span>
              </b-form-checkbox>

              <b-form-checkbox v-model="packagesQuickviewFormFilters.includeInactive">
                <span class="leading-6">Include Inactive</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="packagesQuickviewFormFilters.shouldFilterPackagedDateGt">
                  <span class="leading-6">Packaged on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="packagesQuickviewFormFilters.shouldFilterPackagedDateGt"
                  :disabled="!packagesQuickviewFormFilters.shouldFilterPackagedDateGt"
                  initial-date
                  size="sm"
                  v-model="packagesQuickviewFormFilters.packagedDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox v-model="packagesQuickviewFormFilters.shouldFilterPackagedDateLt">
                  <span class="leading-6">Packaged on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="packagesQuickviewFormFilters.shouldFilterPackagedDateLt"
                  :disabled="!packagesQuickviewFormFilters.shouldFilterPackagedDateLt"
                  initial-date
                  size="sm"
                  v-model="packagesQuickviewFormFilters.packagedDateLt"
                />
              </div>

              <simple-drawer toggleText="ADVANCED">
                <report-license-picker
                  :formFilters="packagesQuickviewFormFilters"
                ></report-license-picker>
              </simple-drawer>
            </div>
          </div>
        </template>

        <!-- Immature Plants Quickview -->
        <template
          v-if="
            selectedReports.find((report) => report.value === ReportType.IMMATURE_PLANTS_QUICKVIEW)
          "
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">
              Immature Plants Quickview
            </div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <b-form-group label="Slice plants by:" label-size="sm">
                <b-form-select
                  v-model="immaturePlantsQuickviewFormFilters.primaryDimension"
                  :options="IMMATURE_PLANT_QUICKVIEW_DIMENSIONS"
                ></b-form-select>
              </b-form-group>

              <b-form-group label="Slice plants by: (optional)" label-size="sm">
                <b-form-select
                  v-model="immaturePlantsQuickviewFormFilters.secondaryDimension"
                  :options="[{ text: 'None', value: null }, ...IMMATURE_PLANT_QUICKVIEW_DIMENSIONS]"
                ></b-form-select>
              </b-form-group>

              <b-form-checkbox v-model="immaturePlantsQuickviewFormFilters.includeActive">
                <span class="leading-6">Include Active</span>
              </b-form-checkbox>

              <b-form-checkbox v-model="immaturePlantsQuickviewFormFilters.includeInactive">
                <span class="leading-6">Include Inactive</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
                >
                  <span class="leading-6">Planted on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
                  :disabled="!immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
                  initial-date
                  size="sm"
                  v-model="immaturePlantsQuickviewFormFilters.plantedDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
                >
                  <span class="leading-6">Planted on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
                  :disabled="!immaturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
                  initial-date
                  size="sm"
                  v-model="immaturePlantsQuickviewFormFilters.plantedDateLt"
                />
              </div>

              <simple-drawer toggleText="ADVANCED">
                <report-license-picker
                  :formFilters="immaturePlantsQuickviewFormFilters"
                ></report-license-picker>
              </simple-drawer>
            </div>
          </div>
        </template>

        <!-- Mature Plants Quickview -->
        <template
          v-if="
            selectedReports.find((report) => report.value === ReportType.MATURE_PLANTS_QUICKVIEW)
          "
        >
          <div
            class="overflow-visible rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">
              Mature Plants Quickview
            </div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <div class="font-semibold text-gray-700">Filters:</div>

              <b-form-group label="Slice plants by:" label-size="sm">
                <b-form-select
                  v-model="maturePlantsQuickviewFormFilters.primaryDimension"
                  :options="MATURE_PLANT_QUICKVIEW_DIMENSIONS"
                ></b-form-select>
              </b-form-group>

              <b-form-group label="Slice plants by: (optional)" label-size="sm">
                <b-form-select
                  v-model="maturePlantsQuickviewFormFilters.secondaryDimension"
                  :options="[{ text: 'None', value: null }, ...MATURE_PLANT_QUICKVIEW_DIMENSIONS]"
                ></b-form-select>
              </b-form-group>

              <b-form-checkbox v-model="maturePlantsQuickviewFormFilters.includeVegetative">
                <span class="leading-6">Include Vegetative</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="maturePlantsQuickviewFormFilters.includeFlowering">
                <span class="leading-6">Include Flowering</span>
              </b-form-checkbox>
              <b-form-checkbox v-model="maturePlantsQuickviewFormFilters.includeInactive">
                <span class="leading-6">Include Inactive</span>
              </b-form-checkbox>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="maturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
                >
                  <span class="leading-6">Planted on or after:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="maturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
                  :disabled="!maturePlantsQuickviewFormFilters.shouldFilterPlantedDateGt"
                  initial-date
                  size="sm"
                  v-model="maturePlantsQuickviewFormFilters.plantedDateGt"
                />
              </div>

              <div class="flex flex-col items-start gap-1">
                <b-form-checkbox
                  v-model="maturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
                >
                  <span class="leading-6">Planted on or before:</span>
                </b-form-checkbox>
                <b-form-datepicker
                  v-if="maturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
                  :disabled="!maturePlantsQuickviewFormFilters.shouldFilterPlantedDateLt"
                  initial-date
                  size="sm"
                  v-model="maturePlantsQuickviewFormFilters.plantedDateLt"
                />
              </div>

              <simple-drawer toggleText="ADVANCED">
                <report-license-picker
                  :formFilters="maturePlantsQuickviewFormFilters"
                ></report-license-picker>
              </simple-drawer>
            </div>
          </div>
        </template>
      </div>

      <!-- End Column -->
      <div class="flex flex-col gap-4 items-stretch text-center">
        <template v-if="reportStatus === ReportStatus.INITIAL">
          <b-button
            variant="primary"
            size="sm"
            @click="generateReports('GOOGLE_SHEETS')"
            :disabled="!enableGoogleSheetsGenerateButton"
            >EXPORT TO GOOGLE SHEETS</b-button
          >
          <template v-if="oAuthState === OAuthState.NOT_AUTHENTICATED">
            <div class="text-sm">
              <span class="ttt-purple underline cursor-pointer" @click="openOAuthPage()"
                >Sign in</span
              >
              to your Google account to export to Sheets.
            </div>
          </template>
          <b-button
            variant="primary"
            size="sm"
            @click="generateReports('CSV')"
            :disabled="!enableCsvGenerateButton"
            >EXPORT TO CSV</b-button
          >
          <template v-if="!enableCsvGenerateButton && selectedReports.length > 0">
            <div class="text-xs">The selected report(s) are not CSV compatible</div>
          </template>

          <template v-if="selectedReports.length === 0">
            <div class="text-red-500 text-center">Select something to include in your report</div>
          </template>
        </template>

        <template v-if="reportStatus === ReportStatus.INFLIGHT">
          <div v-if="reportStatusMessage" class="flex flex-row items-center gap-4">
            <b-spinner small></b-spinner>
            <span>{{ reportStatusMessage.text }}</span>
          </div>

          <div class="flex flex-col items-stretch gap-2">
            <div
              v-for="(statusMessageHistoryEntry, index) in reportStatusMessageHistory"
              v-bind:key="index"
              class="flex flex-row justify-start items-center gap-2"
            >
              <font-awesome-icon
                v-if="statusMessageHistoryEntry.level === 'success'"
                class="text-green-400"
                icon="check"
              ></font-awesome-icon>
              <font-awesome-icon
                v-if="statusMessageHistoryEntry.level === 'warning'"
                class="text-yellow-300"
                icon="exclamation-triangle"
              ></font-awesome-icon>
              <font-awesome-icon
                v-if="statusMessageHistoryEntry.level === 'error'"
                class="text-red-500"
                icon="cross"
              ></font-awesome-icon>
              <span class="text-gray-300">{{ statusMessageHistoryEntry.text }}</span>
            </div>
          </div>
        </template>

        <template v-if="reportStatus === ReportStatus.ERROR">
          <div class="text-red-500">Something went wrong.</div>
          <div>{{ reportStatusMessage }}</div>
          <b-button variant="outline-primary" @click="reset()">RESET</b-button>
        </template>

        <template v-if="reportStatus === ReportStatus.SUCCESS">
          <b-button
            v-if="generatedSpreadsheet"
            variant="primary"
            :href="generatedSpreadsheet.spreadsheetUrl"
            target="_blank"
            >VIEW REPORT</b-button
          >
          <b-button variant="outline-primary" @click="reset()">START OVER</b-button>
        </template>

        <div
          class="flex flex-col items-stretch gap-2 text-start py-12"
          v-if="generatedSpreadsheetHistory.length > 0"
        >
          <div style="text-align: start">Recent reports:</div>
          <div
            class="flex flex-col items-start"
            v-bind:key="spreadsheetEntry.uuid"
            v-for="spreadsheetEntry of showAllRecent
              ? generatedSpreadsheetHistory
              : generatedSpreadsheetHistory.slice(0, 5)"
          >
            <a
              class="underline text-purple-500 text-sm"
              :href="spreadsheetEntry.spreadsheet.spreadsheetUrl"
              target="_blank"
            >
              {{ spreadsheetEntry.spreadsheet.properties.title }}
            </a>
            <span class="text-xs text-gray-300"
              >{{ new Date(spreadsheetEntry.timestamp).toLocaleDateString() }}
              {{ new Date(spreadsheetEntry.timestamp).toLocaleTimeString() }}</span
            >
          </div>
          <b-button
            @click="showAllRecent = true"
            v-if="generatedSpreadsheetHistory.length > 5 && !showAllRecent"
            variant="outline-dark"
            size="sm"
            >SHOW ALL</b-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ReportCheckboxSection from "@/components/overlay-widget/shared/ReportCheckboxSection.vue";
import ReportLicensePicker from "@/components/overlay-widget/shared/ReportLicensePicker.vue";
import { MessageType } from "@/consts";
import { IPluginState } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { messageBus } from "@/modules/message-bus.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { OAuthState, PluginAuthActions } from "@/store/page-overlay/modules/plugin-auth/consts";
import {
  ReportAuxTask,
  ReportsActions,
  ReportStatus,
  ReportType,
  SHEET_FIELDS,
} from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig, IReportOption } from "@/store/page-overlay/modules/reports/interfaces";
import { getIsoDateFromOffset } from "@/utils/date";
import { addCogsReport, cogsFormFiltersFactory } from "@/utils/reports/cogs-report";
import {
  addCogsTrackerReport,
  cogsTrackerFormFiltersFactory,
} from "@/utils/reports/cogs-tracker-report";
import {
  addCogsV2Report,
  cogsV2FormFiltersFactory,
  getCogsV2CacheKey,
} from "@/utils/reports/cogs-v2-report";
import {
  addEmployeeAuditReport,
  employeeAuditFormFiltersFactory,
} from "@/utils/reports/employee-audit-report";
import {
  addEmployeeSamplesReport,
  employeeSamplesFormFiltersFactory,
} from "@/utils/reports/employee-samples-report";
import {
  addHarvestPackagesReport,
  harvestPackagesFormFiltersFactory,
} from "@/utils/reports/harvest-packages-report";
import { addHarvestsReport, harvestsFormFiltersFactory } from "@/utils/reports/harvests-report";
import {
  addImmaturePlantsQuickviewReport,
  immaturePlantsQuickviewFormFiltersFactory,
  IMMATURE_PLANT_QUICKVIEW_DIMENSIONS,
} from "@/utils/reports/immature-plants-quickview-report";
import {
  addImmaturePlantsReport,
  immaturePlantsFormFiltersFactory,
} from "@/utils/reports/immature-plants-report";
import {
  addIncomingTransfersReport,
  incomingTransfersFormFiltersFactory,
} from "@/utils/reports/incoming-transfers-report";
import {
  addMaturePlantsQuickviewReport,
  maturePlantsQuickviewFormFiltersFactory,
  MATURE_PLANT_QUICKVIEW_DIMENSIONS,
} from "@/utils/reports/mature-plants-quickview-report";
import {
  addMaturePlantsReport,
  maturePlantsFormFiltersFactory,
} from "@/utils/reports/mature-plants-report";
import {
  addOutgoingTransferManifestsReport,
  outgoingTransferManifestsFormFiltersFactory,
} from "@/utils/reports/outgoing-transfer-manifests-report";
import {
  addOutgoingTransfersReport,
  outgoingTransfersFormFiltersFactory,
} from "@/utils/reports/outgoing-transfers-report";
import { addPackageReport, packageFormFiltersFactory } from "@/utils/reports/package-report";
import {
  addPackagesQuickviewReport,
  packagesQuickviewFormFiltersFactory,
  PACKAGES_QUICKVIEW_DIMENSIONS,
} from "@/utils/reports/packages-quickview-report";
import {
  addPointInTimeInventoryReport,
  pointInTimeInventoryFormFiltersFactory,
} from "@/utils/reports/point-in-time-inventory-report";
import { reportCatalogFactory } from "@/utils/reports/reports-shared";
import {
  addStragglerPackagesReport,
  stragglerPackagesFormFiltersFactory,
} from "@/utils/reports/straggler-package-report";
import { addTagsReport, tagsFormFiltersFactory } from "@/utils/reports/tags-report";
import {
  addTransferHubTransfersReport,
  transferHubTransfersFormFiltersFactory,
} from "@/utils/reports/transfer-hub-transfers-report";
import _ from "lodash-es";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import ArchiveWidget from "../shared/ArchiveWidget.vue";
import SimpleDrawer from "../shared/SimpleDrawer.vue";

export default Vue.extend({
  name: "GoogleSheetsExport",
  store,
  router,
  props: {},
  components: {
    ArchiveWidget,
    SimpleDrawer,
    ReportLicensePicker,
    ReportCheckboxSection,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      oAuthState: (state: IPluginState) => state.pluginAuth.oAuthState,
      clientValues: (state: IPluginState) => state.client.values,
      t3plus: (state: IPluginState) => state.client.t3plus,
      generatedSpreadsheet: (state: IPluginState) => state.reports.generatedSpreadsheet,
      generatedSpreadsheetHistory: (state: IPluginState) =>
        state.reports.generatedSpreadsheetHistory,
      reportStatus: (state: IPluginState) => state.reports.status,
      reportStatusMessage: (state: IPluginState) => state.reports.statusMessage,
      reportStatusMessageHistory: (state: IPluginState) => state.reports.statusMessageHistory,
    }),
    enableCsvGenerateButton(): boolean {
      return (
        this.selectedReports.length > 0 &&
        this.selectedReports.filter((x: IReportOption) => x.usesFormulas || x.isMultiSheet)
          .length === 0
      );
    },
    enableGoogleSheetsGenerateButton(): boolean {
      return (
        this.selectedReports.length > 0 &&
        store.state.pluginAuth.oAuthState === OAuthState.AUTHENTICATED
      );
    },
    reportOptions(): IReportOption[] {
      return reportCatalogFactory();
    },
    // eligibleReportOptions(): IReportOption[] {
    //   return this.eligibleReportOptionsImpl();
    // },
    // disabledVisibleReportOptions(): IReportOption[] {
    //   return this.disabledVisibleReportOptionsImpl();
    // },
    cogsV2key(): string {
      return getCogsV2CacheKey({
        licenses: this.$data.cogsV2FormFilters.licenses,
        departureDateGt: this.$data.cogsV2FormFilters.cogsDateGt,
        departureDateLt: this.$data.cogsV2FormFilters.cogsDateLt,
      });
    },
  },
  data(): any {
    return {
      OAuthState,
      ReportStatus,
      ReportType,
      SHEET_FIELDS,
      MATURE_PLANT_QUICKVIEW_DIMENSIONS,
      IMMATURE_PLANT_QUICKVIEW_DIMENSIONS,
      PACKAGES_QUICKVIEW_DIMENSIONS,
      selectedReports: [] as IReportOption[],
      cogsFormFilters: cogsFormFiltersFactory(),
      cogsV2FormFilters: cogsV2FormFiltersFactory(),
      cogsTrackerFormFilters: cogsTrackerFormFiltersFactory(),
      packagesFormFilters: packageFormFiltersFactory(),
      stragglerPackagesFormFilters: stragglerPackagesFormFiltersFactory(),
      maturePlantsFormFilters: maturePlantsFormFiltersFactory(),
      packagesQuickviewFormFilters: packagesQuickviewFormFiltersFactory(),
      maturePlantsQuickviewFormFilters: maturePlantsQuickviewFormFiltersFactory(),
      immaturePlantsQuickviewFormFilters: immaturePlantsQuickviewFormFiltersFactory(),
      immaturePlantsFormFilters: immaturePlantsFormFiltersFactory(),
      harvestsFormFilters: harvestsFormFiltersFactory(),
      incomingTransfersFormFilters: incomingTransfersFormFiltersFactory(),
      outgoingTransfersFormFilters: outgoingTransfersFormFiltersFactory(),
      transferHubTransfersFormFilters: transferHubTransfersFormFiltersFactory(),
      outgoingTransferManifestsFormFilters: outgoingTransferManifestsFormFiltersFactory(),
      pointInTimeInventoryFormFilters: pointInTimeInventoryFormFiltersFactory(),
      // transferHubTransferManifestsFormFilters: transferHubTransferManifestsFormFiltersFactory(),
      tagsFormFilters: tagsFormFiltersFactory(),
      employeeSamplesFormFilters: employeeSamplesFormFiltersFactory(),
      harvestPackagesFormFilters: harvestPackagesFormFiltersFactory(),
      employeeAuditFormFilters: employeeAuditFormFiltersFactory(),
      // These are only the selected fields
      fields: (() => {
        const fields = _.cloneDeep(SHEET_FIELDS);

        for (const key in fields) {
          if (Array.isArray(fields[key])) {
            fields[key] = fields[key].filter((x) => x.initiallyChecked);
          }
        }

        return fields;
      })(),
      showAllRecent: false,
    };
  },
  methods: {
    getIsoDateFromOffset,
    ...mapActions({
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      generateSpreadsheet: `reports/${ReportsActions.GENERATE_REPORT}`,
      reset: `reports/${ReportsActions.RESET}`,
      runAuxReportTask: `reports/${ReportsActions.RUN_AUX_REPORT_TASK}`,
    }),
    async updateMasterPbCostSheet() {
      const reportConfig: IReportConfig = {
        authState: await authManager.authStateOrError(),
      };

      if (
        !this.selectedReports.find((report: IReportOption) => report.value === ReportType.COGS_V2)
      ) {
        throw new Error("Must include Cogs V2 report");
      }

      addCogsV2Report({
        reportConfig,
        cogsV2FormFilters: this.cogsV2FormFilters,
      });

      store.dispatch(`reports/${ReportsActions.RUN_AUX_REPORT_TASK}`, {
        auxTask: ReportAuxTask.UPDATE_MASTER_COST_SHEET,
        reportConfig,
      });
    },
    checkAll(reportType: ReportType): void {
      this.fields[reportType] = _.cloneDeep(SHEET_FIELDS[reportType]);
    },
    uncheckAll(reportType: ReportType): void {
      this.fields[reportType] = _.cloneDeep(SHEET_FIELDS[reportType]).filter((x) => x.required);
    },
    // eligibleReportOptionsImpl(): IReportOption[] {
    //   return this.reportCatalogFactory().filter((x: IReportOption) => {
    //     if (x.hidden) {
    //       return false;
    //     }

    //     if (!x.enabled) {
    //       return false;
    //     }

    //     if (x.t3plus) {
    //       return store.state.client.values.ENABLE_T3PLUS || store.state.client.t3plus;
    //     }
    //     return true;
    //   });
    // },
    // disabledVisibleReportOptionsImpl(): IReportOption[] {
    //   return this.reportCatalogFactory().filter((x: IReportOption) => {
    //     if (x.hidden) {
    //       return false;
    //     }

    //     if (!x.enabled) {
    //       return true;
    //     }

    //     if (x.t3plus) {
    //       return !store.state.client.values.ENABLE_T3PLUS && !store.state.client.t3plus;
    //     }
    //     return false;
    //   });
    // },
    openOAuthPage(): void {
      messageBus.sendMessageToBackground(MessageType.OPEN_OPTIONS_PAGE, {
        path: "/google-sheets",
      });
    },
    async generateReports(exportFormat: "GOOGLE_SHEETS" | "CSV" = "GOOGLE_SHEETS"): Promise<void> {
      const reportConfig: IReportConfig = {
        authState: await authManager.authStateOrError(),
        exportFormat,
      };

      if (this.selectedReports.find((report: IReportOption) => report.value === ReportType.COGS)) {
        addCogsReport({
          reportConfig,
          cogsFormFilters: this.cogsFormFilters,
          mutableArchiveData: await this.$refs.archive.getMutableArchiveData(),
        });
      }

      if (
        this.selectedReports.find((report: IReportOption) => report.value === ReportType.COGS_V2)
      ) {
        addCogsV2Report({
          reportConfig,
          cogsV2FormFilters: this.cogsV2FormFilters,
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.COGS_TRACKER
        )
      ) {
        addCogsTrackerReport({
          reportConfig,
          cogsTrackerFormFilters: this.cogsTrackerFormFilters,
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.EMPLOYEE_SAMPLES
        )
      ) {
        addEmployeeSamplesReport({
          reportConfig,
          employeeSamplesFormFilters: this.employeeSamplesFormFilters,
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.HARVEST_PACKAGES
        )
      ) {
        addHarvestPackagesReport({
          reportConfig,
          harvestPackagesFormFilters: this.harvestPackagesFormFilters,
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.POINT_IN_TIME_INVENTORY
        )
      ) {
        addPointInTimeInventoryReport({
          reportConfig,
          pointInTimeInventoryFormFilters: this.pointInTimeInventoryFormFilters,
        });
      }

      if (
        this.selectedReports.find((report: IReportOption) => report.value === ReportType.PACKAGES)
      ) {
        addPackageReport({
          reportConfig,
          packagesFormFilters: this.packagesFormFilters,
          fields: this.fields[ReportType.PACKAGES],
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.STRAGGLER_PACKAGES
        )
      ) {
        addStragglerPackagesReport({
          reportConfig,
          stragglerPackagesFormFilters: this.stragglerPackagesFormFilters,
          fields: this.fields[ReportType.STRAGGLER_PACKAGES],
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.EMPLOYEE_AUDIT
        )
      ) {
        addEmployeeAuditReport({
          reportConfig,
          employeeAuditFormFilters: this.employeeAuditFormFilters,
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.MATURE_PLANTS
        )
      ) {
        addMaturePlantsReport({
          reportConfig,
          maturePlantsFormFilters: this.maturePlantsFormFilters,
          fields: this.fields[ReportType.MATURE_PLANTS],
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.INCOMING_TRANSFERS
        )
      ) {
        addIncomingTransfersReport({
          reportConfig,
          incomingTransfersFormFilters: this.incomingTransfersFormFilters,
          fields: this.fields[ReportType.INCOMING_TRANSFERS],
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.OUTGOING_TRANSFERS
        )
      ) {
        addOutgoingTransfersReport({
          reportConfig,
          outgoingTransfersFormFilters: this.outgoingTransfersFormFilters,
          fields: this.fields[ReportType.OUTGOING_TRANSFERS],
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.TRANSFER_HUB_TRANSFERS
        )
      ) {
        addTransferHubTransfersReport({
          reportConfig,
          transferHubTransfersFormFilters: this.transferHubTransfersFormFilters,
          fields: this.fields[ReportType.TRANSFER_HUB_TRANSFERS],
        });
      }

      if (
        this.selectedReports.find((report: IReportOption) => report.value === ReportType.HARVESTS)
      ) {
        addHarvestsReport({
          reportConfig,
          harvestsFormFilters: this.harvestsFormFilters,
          fields: this.fields[ReportType.HARVESTS],
        });
      }

      if (this.selectedReports.find((report: IReportOption) => report.value === ReportType.TAGS)) {
        addTagsReport({
          reportConfig,
          tagsFormFilters: this.tagsFormFilters,
          fields: this.fields[ReportType.TAGS],
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.IMMATURE_PLANTS
        )
      ) {
        addImmaturePlantsReport({
          reportConfig,
          immaturePlantsFormFilters: this.immaturePlantsFormFilters,
          fields: this.fields[ReportType.IMMATURE_PLANTS],
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.OUTGOING_TRANSFER_MANIFESTS
        )
      ) {
        addOutgoingTransferManifestsReport({
          reportConfig,
          outgoingTransferManifestsFormFilters: this.outgoingTransferManifestsFormFilters,
          fields: this.fields[ReportType.OUTGOING_TRANSFER_MANIFESTS],
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS
        )
      ) {
        // addTransferHubTransferManifestsReport({
        //   reportConfig,
        //   transferHubTransferManifestsFormFilters: this.transferHubTransferManifestsFormFilters,
        //   fields: this.fields[ReportType.TRANSFER_HUB_TRANSFER_MANIFESTS],
        // });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.PACKAGES_QUICKVIEW
        )
      ) {
        addPackagesQuickviewReport({
          reportConfig,
          packagesQuickviewFormFilters: this.packagesQuickviewFormFilters,
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.IMMATURE_PLANTS_QUICKVIEW
        )
      ) {
        addImmaturePlantsQuickviewReport({
          reportConfig,
          immaturePlantsQuickviewFormFilters: this.immaturePlantsQuickviewFormFilters,
        });
      }

      if (
        this.selectedReports.find(
          (report: IReportOption) => report.value === ReportType.MATURE_PLANTS_QUICKVIEW
        )
      ) {
        addMaturePlantsQuickviewReport({
          reportConfig,
          maturePlantsQuickviewFormFilters: this.maturePlantsQuickviewFormFilters,
        });
      }

      this.generateSpreadsheet({ reportConfig });
    },
  },

  watch: {
    selectedReports: {
      immediate: true,
      handler(newValue: IReportOption[], oldValue) {
        // console.log(newValue);

        const singleonReportTypes: ReportType[] = reportCatalogFactory()
          .filter((x: IReportOption) => x.isMultiSheet)
          .map((x: IReportOption) => x.value) as ReportType[];

        for (const reportType of singleonReportTypes) {
          const firstSelectedSingleton = newValue.find(
            (report: IReportOption) => report.value === reportType
          );

          if (newValue.length > 1 && firstSelectedSingleton) {
            this.selectedReports = [firstSelectedSingleton];
            break;
          }
        }
      },
    },
  },
  async created() {},
  async mounted() {
    this.refreshOAuthState({});

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.refreshOAuthState({});
      }
    });
  },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
