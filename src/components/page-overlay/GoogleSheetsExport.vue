<template>
  <div>
    <div class="grid grid-cols-3 gap-8 w-full">
      <!-- First Column -->
      <div
        class="flex flex-col gap-2 items-stretch"
        v-bind:class="{ 'opacity-50': reportStatus !== ReportStatus.INITIAL }"
      >
        <b-form-group>
          <b-form-checkbox-group v-model="selectedReports" class="flex flex-col gap-1">
            <b-form-checkbox
              v-for="eligibleReportOption of eligibleReportOptions"
              v-bind:key="eligibleReportOption.value"
              :value="eligibleReportOption"
              :disabled="reportStatus !== ReportStatus.INITIAL"
              ><div class="flex flex-col items-start gap-1">
                <span class="">{{ eligibleReportOption.text }}</span>
                <span class="text-xs text-gray-400">{{ eligibleReportOption.description }}</span>
              </div>
            </b-form-checkbox>

            <div
              class="text-start text-gray-600 pb-2"
              v-if="!clientValues['ENABLE_T3PLUS'] && !t3plus"
            >
              Get access to advanced reports with
              <a
                class="text-purple-500 underline"
                href="https://trackandtrace.tools/plus"
                target="_blank"
                >T3+</a
              >
            </div>

            <b-form-checkbox
              class="opacity-50"
              v-for="disabledVisibleReportOption of disabledVisibleReportOptions"
              v-bind:key="disabledVisibleReportOption.value"
              :value="disabledVisibleReportOption.value"
              :disabled="true"
              ><div class="flex flex-col items-start gap-1">
                <span class="">{{ disabledVisibleReportOption.text }}</span>
                <!-- <span class="text-xs text-gray-400">{{
                    disabledVisibleReportOption.description
                  }}</span> -->
              </div>
            </b-form-checkbox>
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
          <div class="text-center flex flex-col gap-2">
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
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
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
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
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
                <b-form-group label="Licenses:">
                  <b-form-checkbox-group
                    v-model="cogsV2FormFilters.licenses"
                    :options="cogsV2FormFilters.licenseOptions"
                  ></b-form-checkbox-group>
                </b-form-group>
              </simple-drawer>
            </div>
          </div>
        </template>

        <!-- COGS Tracker -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.COGS_TRACKER)">
          <div
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
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
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
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

        <!-- Packages -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.PACKAGES)">
          <div
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Packages</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.PACKAGES)"
                  >{{
                    showFilters[ReportType.PACKAGES] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                > -->
              <div class="font-semibold text-gray-700">Filters:</div>

              <template v-if="showFilters[ReportType.PACKAGES]">
                <b-form-checkbox v-model="packagesFormFilters.includeActive">
                  <span class="leading-6">Include active packages</span>
                </b-form-checkbox>

                <b-form-checkbox v-model="packagesFormFilters.includeInactive">
                  <span class="leading-6">Include inactive packages</span>
                </b-form-checkbox>

                <b-form-checkbox v-model="packagesFormFilters.includeInTransit">
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
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.PACKAGES)"
                  >{{
                    showFields[ReportType.PACKAGES] ? "HIDE COLUMNS" : "CHOOSE COLUMNS"
                  }}</b-button
                > -->
              <template v-if="showFields[ReportType.PACKAGES]">
                <hr />

                <div class="font-semibold text-gray-700">Columns:</div>

                <b-form-checkbox-group
                  v-model="fields[ReportType.PACKAGES]"
                  class="flex flex-col items-start gap-1"
                >
                  <b-form-checkbox
                    v-for="fieldData of SHEET_FIELDS[ReportType.PACKAGES]"
                    v-bind:key="fieldData.value"
                    :value="fieldData"
                    :disabled="fieldData.required"
                  >
                    <span class="leading-6">{{ fieldData.readableName }}</span>
                  </b-form-checkbox>
                </b-form-checkbox-group>

                <div class="grid grid-cols-2 gap-2">
                  <b-button variant="outline-dark" size="sm" @click="checkAll(ReportType.PACKAGES)"
                    >CHECK ALL</b-button
                  >
                  <b-button
                    variant="outline-dark"
                    size="sm"
                    @click="uncheckAll(ReportType.PACKAGES)"
                    >UNCHECK ALL</b-button
                  >
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- Harvests -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.HARVESTS)">
          <div
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Harvests</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.HARVESTS)"
                  >{{
                    showFilters[ReportType.HARVESTS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                > -->
              <div class="font-semibold text-gray-700">Filters:</div>

              <template v-if="showFilters[ReportType.HARVESTS]">
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
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.HARVESTS)"
                  >{{
                    showFields[ReportType.HARVESTS] ? "HIDE COLUMNS" : "CHOOSE COLUMNS"
                  }}</b-button
                > -->
              <template v-if="showFields[ReportType.HARVESTS]">
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
                  <b-button
                    variant="outline-dark"
                    size="sm"
                    @click="uncheckAll(ReportType.HARVESTS)"
                    >UNCHECK ALL</b-button
                  >
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- Mature Plants -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.MATURE_PLANTS)"
        >
          <div
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Mature Plants</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.MATURE_PLANTS)"
                  >{{
                    showFilters[ReportType.MATURE_PLANTS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                > -->
              <div class="font-semibold text-gray-700">Filters:</div>

              <template v-if="showFilters[ReportType.MATURE_PLANTS]">
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
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.MATURE_PLANTS)"
                  >{{
                    showFields[ReportType.MATURE_PLANTS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                > -->
              <template v-if="showFields[ReportType.MATURE_PLANTS]">
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
              </template>
            </div>
          </div>
        </template>

        <!-- Immature Plants -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.IMMATURE_PLANTS)"
        >
          <div
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Immature Plants</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.IMMATURE_PLANTS)"
                  >{{
                    showFilters[ReportType.IMMATURE_PLANTS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                > -->
              <div class="font-semibold text-gray-700">Filters:</div>

              <template v-if="showFilters[ReportType.IMMATURE_PLANTS]">
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
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.IMMATURE_PLANTS)"
                  >{{
                    showFields[ReportType.IMMATURE_PLANTS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                > -->
              <template v-if="showFields[ReportType.IMMATURE_PLANTS]">
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
              </template>
            </div>
          </div>
        </template>

        <!-- Outgoing Transfers -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.OUTGOING_TRANSFERS)"
        >
          <div
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Outgoing Transfers</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.OUTGOING_TRANSFERS)"
                  >{{
                    showFilters[ReportType.OUTGOING_TRANSFERS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                > -->
              <div class="font-semibold text-gray-700">Filters:</div>

              <template v-if="showFilters[ReportType.OUTGOING_TRANSFERS]">
                <b-form-checkbox v-model="outgoingTransfersFormFilters.includeOutgoing">
                  <span class="leading-6">Include Active Outgoing</span>
                </b-form-checkbox>
                <b-form-checkbox v-model="outgoingTransfersFormFilters.includeRejected">
                  <span class="leading-6">Include Rejected</span>
                </b-form-checkbox>
                <b-form-checkbox v-model="outgoingTransfersFormFilters.includeOutgoingInactive">
                  <span class="leading-6">Include Inactive Outgoing</span>
                </b-form-checkbox>
                <b-form-checkbox
                  :disabled="!clientValues['ENABLE_T3PLUS'] && !t3plus"
                  v-model="outgoingTransfersFormFilters.onlyWholesale"
                >
                  <div class="flex flex-col items-start">
                    <span class="leading-6">Only Wholesale</span>
                  </div>
                  <span
                    v-if="!clientValues['ENABLE_T3PLUS'] && !t3plus"
                    class="text-xs text-gray-300"
                    >Enable this with
                    <a href="https://trackandtrace.tools/plus" target="_blank">T3+</a></span
                  >
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
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.OUTGOING_TRANSFERS)"
                  >{{
                    showFields[ReportType.OUTGOING_TRANSFERS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                > -->
              <template v-if="showFields[ReportType.OUTGOING_TRANSFERS]">
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
              </template>
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
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Hub Transfers</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.TRANSFER_HUB_TRANSFERS)"
                  >{{
                    showFilters[ReportType.TRANSFER_HUB_TRANSFERS]
                      ? "HIDE FILTERS"
                      : "CHOOSE FILTERS"
                  }}</b-button
                > -->
              <div class="font-semibold text-gray-700">Filters:</div>
              <template v-if="showFilters[ReportType.TRANSFER_HUB_TRANSFERS]">
                <div class="flex flex-col items-start gap-1">
                  <b-form-checkbox
                    v-model="transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateGt"
                  >
                    <span class="leading-6">ETD on or after:</span>
                  </b-form-checkbox>
                  <b-form-datepicker
                    v-if="transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateGt"
                    :disabled="
                      !transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateGt
                    "
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
                    :disabled="
                      !transferHubTransfersFormFilters.shouldFilterEstimatedDepartureDateLt
                    "
                    initial-date
                    size="sm"
                    v-model="transferHubTransfersFormFilters.estimatedDepartureDateLt"
                  />
                </div>
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.TRANSFER_HUB_TRANSFERS)"
                  >{{
                    showFields[ReportType.TRANSFER_HUB_TRANSFERS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                > -->
              <template v-if="showFields[ReportType.TRANSFER_HUB_TRANSFERS]">
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
              </template>
            </div>
          </div>
        </template>

        <!-- Incoming Transfers -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.INCOMING_TRANSFERS)"
        >
          <div
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Incoming Transfers</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.INCOMING_TRANSFERS)"
                  >{{
                    showFilters[ReportType.INCOMING_TRANSFERS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                > -->

              <div class="font-semibold text-gray-700">Filters:</div>
              <template v-if="showFilters[ReportType.INCOMING_TRANSFERS]">
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
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.INCOMING_TRANSFERS)"
                  >{{
                    showFields[ReportType.INCOMING_TRANSFERS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                > -->
              <template v-if="showFields[ReportType.INCOMING_TRANSFERS]">
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
              </template>
            </div>
          </div>
        </template>

        <!-- Tags -->
        <template v-if="selectedReports.find((report) => report.value === ReportType.TAGS)">
          <div
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Tags</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.TAGS)"
                  >{{ showFilters[ReportType.TAGS] ? "HIDE FILTERS" : "CHOOSE FILTERS" }}</b-button
                > -->

              <div class="font-semibold text-gray-700">Filters:</div>
              <template v-if="showFilters[ReportType.TAGS]">
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
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.TAGS)"
                  >{{ showFields[ReportType.TAGS] ? "HIDE FIELDS" : "CHOOSE FIELDS" }}</b-button
                > -->
              <template v-if="showFields[ReportType.TAGS]">
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
              </template>
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
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">
              Outgoing Transfer Manifests
            </div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.OUTGOING_TRANSFER_MANIFESTS)"
                  >{{
                    showFilters[ReportType.OUTGOING_TRANSFER_MANIFESTS]
                      ? "HIDE FILTERS"
                      : "CHOOSE FILTERS"
                  }}</b-button
                > -->

              <div class="font-semibold text-gray-700">Filters:</div>
              <template v-if="showFilters[ReportType.OUTGOING_TRANSFER_MANIFESTS]">
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
                  <div class="flex flex-col items-start">
                    <span class="leading-6">Only Wholesale</span>
                  </div>
                  <span
                    v-if="!clientValues['ENABLE_T3PLUS'] && !t3plus"
                    class="text-xs text-gray-300"
                    >Enable this with
                    <a href="https://trackandtrace.tools/plus" target="_blank">T3+</a></span
                  >
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
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.OUTGOING_TRANSFER_MANIFESTS)"
                  >{{
                    showFields[ReportType.OUTGOING_TRANSFER_MANIFESTS]
                      ? "HIDE FIELDS"
                      : "CHOOSE FIELDS"
                  }}</b-button
                > -->
              <template v-if="showFields[ReportType.OUTGOING_TRANSFER_MANIFESTS]">
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
              </template>
            </div>
          </div>
        </template>

        <!-- Straggler Packages -->
        <template
          v-if="selectedReports.find((report) => report.value === ReportType.STRAGGLER_PACKAGES)"
        >
          <div
            class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2 overflow-hidden"
          >
            <div class="font-semibold text-white ttt-purple-bg p-2 -m-2">Straggler Packages</div>
            <hr />
            <div class="flex flex-col items-stretch gap-4">
              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.STRAGGLER_PACKAGES)"
                  >{{
                    showFilters[ReportType.STRAGGLER_PACKAGES] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                > -->
              <div class="font-semibold text-gray-700">Filters:</div>

              <template v-if="showFilters[ReportType.STRAGGLER_PACKAGES]">
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
                  <b-form-checkbox
                    v-model="stragglerPackagesFormFilters.shouldFilterPackagedDateGt"
                  >
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
                  <b-form-checkbox
                    v-model="stragglerPackagesFormFilters.shouldFilterPackagedDateLt"
                  >
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
              </template>

              <!-- <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.STRAGGLER_PACKAGES)"
                  >{{
                    showFields[ReportType.STRAGGLER_PACKAGES] ? "HIDE COLUMNS" : "CHOOSE COLUMNS"
                  }}</b-button
                > -->
              <template v-if="showFields[ReportType.STRAGGLER_PACKAGES]">
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
              </template>
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
          <template v-if="!isReportSelectionCsvCompatible">
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
              v-for="statusMessageHistoryEntry of reportStatusMessageHistory"
              v-bind:key="statusMessageHistoryEntry.text"
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
import { MessageType } from "@/consts";
import {
  IHarvestFilter,
  IPackageFilter,
  IPlantBatchFilter,
  IPlantFilter,
  IPluginState,
  ITagFilter,
  ITransferFilter,
} from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { clientBuildManager } from "@/modules/client-build-manager.module";
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
import { IReportConfig } from "@/store/page-overlay/modules/reports/interfaces";
import { getIsoDateFromOffset, todayIsodate } from "@/utils/date";
import { addCogsReport, cogsFormFiltersFactory } from "@/utils/reports/cogs-report";
import {
  addCogsV2Report,
  cogsV2FormFiltersFactory,
  getCogsV2CacheKey,
} from "@/utils/reports/cogs-v2-report";
import {
  addCogsTrackerReport,
  cogsTrackerFormFiltersFactory,
} from "@/utils/reports/cogs-tracker-report";
import { addHarvestsReport, harvestsFormFiltersFactory } from "@/utils/reports/harvests-report";
import {
  addImmaturePlantsReport,
  immaturePlantsFormFiltersFactory,
} from "@/utils/reports/immature-plants-report";
import {
  addIncomingTransfersReport,
  incomingTransfersFormFiltersFactory,
} from "@/utils/reports/incoming-transfers-report";
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
import {
  addTransferHubTransfersReport,
  transferHubTransfersFormFiltersFactory,
} from "@/utils/reports/transfer-hub-transfers-report";
import { addPackageReport, packageFormFiltersFactory } from "@/utils/reports/package-report";
import {
  addStragglerPackagesReport,
  stragglerPackagesFormFiltersFactory,
} from "@/utils/reports/straggler-package-report";
import { addTagsReport, tagsFormFiltersFactory } from "@/utils/reports/tags-report";
import _ from "lodash-es";
import Vue from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
import ArchiveWidget from "../shared/ArchiveWidget.vue";
import SimpleDrawer from "../shared/SimpleDrawer.vue";
import {
  addEmployeeSamplesReport,
  employeeSamplesFormFiltersFactory,
} from "@/utils/reports/employee-samples-report";

interface IReportOption {
  text: string;
  value: ReportType | null;
  t3plus: boolean;
  isCustom: false; // Unused
  enabled: boolean;
  hidden?: boolean;
  description: string;
  isCsvEligible: boolean;
  isSingleton: boolean;
}

export default Vue.extend({
  name: "GoogleSheetsExport",
  store,
  router,
  props: {},
  components: {
    ArchiveWidget,
    SimpleDrawer,
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
        !this.selectedReports.find((x: IReportOption) => !x.isCsvEligible)
      );
    },
    isReportSelectionCsvCompatible(): boolean {
      return !this.selectedReports.find((x: IReportOption) => !x.isCsvEligible);
    },
    enableGoogleSheetsGenerateButton(): boolean {
      return (
        this.selectedReports.length > 0 &&
        store.state.pluginAuth.oAuthState === OAuthState.AUTHENTICATED
      );
    },
    eligibleReportOptions(): IReportOption[] {
      return this.eligibleReportOptionsImpl();
    },
    disabledVisibleReportOptions(): IReportOption[] {
      return this.disabledVisibleReportOptionsImpl();
    },
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
      selectedReports: [] as IReportOption[],
      cogsFormFilters: cogsFormFiltersFactory(),
      cogsV2FormFilters: cogsV2FormFiltersFactory(),
      cogsTrackerFormFilters: cogsTrackerFormFiltersFactory(),
      packagesFormFilters: packageFormFiltersFactory(),
      stragglerPackagesFormFilters: stragglerPackagesFormFiltersFactory(),
      maturePlantsFormFilters: maturePlantsFormFiltersFactory(),
      immaturePlantsFormFilters: immaturePlantsFormFiltersFactory(),
      harvestsFormFilters: harvestsFormFiltersFactory(),
      incomingTransfersFormFilters: incomingTransfersFormFiltersFactory(),
      outgoingTransfersFormFilters: outgoingTransfersFormFiltersFactory(),
      transferHubTransfersFormFilters: transferHubTransfersFormFiltersFactory(),
      outgoingTransferManifestsFormFilters: outgoingTransferManifestsFormFiltersFactory(),
      // transferHubTransferManifestsFormFilters: transferHubTransferManifestsFormFiltersFactory(),
      tagsFormFilters: tagsFormFiltersFactory(),
      employeeSamplesFormFilters: employeeSamplesFormFiltersFactory(),
      showFilters: (() => {
        const fields: { [key: string]: boolean } = {};
        Object.keys(SHEET_FIELDS).map((x: any) => {
          fields[x] = true;
        });
        return fields;
      })(),
      showFields: (() => {
        const fields: { [key: string]: boolean } = {};
        Object.keys(SHEET_FIELDS).map((x: any) => {
          fields[x] = true;
        });
        return fields;
      })(),
      fields: _.cloneDeep(SHEET_FIELDS),
      showAllRecent: false,
    };
  },
  methods: {
    getIsoDateFromOffset,
    ...mapActions({
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      generateSpreadsheet: `reports/${ReportsActions.GENERATE_SPREADSHEET}`,
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
    toggleFilters(reportType: ReportType): void {
      this.showFilters[reportType] = !this.showFilters[reportType];
    },
    toggleFields(reportType: ReportType): void {
      this.showFields[reportType] = !this.showFields[reportType];
    },
    checkAll(reportType: ReportType): void {
      this.fields[reportType] = _.cloneDeep(SHEET_FIELDS[reportType]);
    },
    uncheckAll(reportType: ReportType): void {
      this.fields[reportType] = _.cloneDeep(SHEET_FIELDS[reportType]).filter((x) => x.required);
    },
    // snapshotEverything(): void {
    //   this.selectedReports = this.eligibleReportOptions.map((x: IReportOption) => x.value);
    // },
    reportOptionsImpl(): IReportOption[] {
      const reportOptions: IReportOption[] = [
        {
          text: "Packages",
          value: ReportType.PACKAGES,
          t3plus: true,
          enabled: true,
          description: "All packages. Filter by type and date.",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Point-in-time inventory",
          value: ReportType.POINT_IN_TIME_INVENTORY,
          t3plus: true,
          enabled: false,
          description: "All active packages on a certain date.",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Plant Batches",
          value: ReportType.IMMATURE_PLANTS,
          t3plus: true,
          enabled: true,
          description: "All plant batches. Filter by planted date.",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Mature Plants",
          value: ReportType.MATURE_PLANTS,
          t3plus: true,
          enabled: true,
          description: "All mature plants. Filter by growth phase and planted date",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Incoming Transfers",
          value: ReportType.INCOMING_TRANSFERS,
          t3plus: true,
          enabled: true,
          description: "All incoming transfers. Filter by wholesale and ETA",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Outgoing Transfers",
          value: ReportType.OUTGOING_TRANSFERS,
          t3plus: true,
          enabled: true,
          description: "All outgoing transfers. Filter by wholesale and ETD",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        // Disabled - Destinations returns 0, more like incoming?
        // {
        //   text: "Hub Transfers",
        //   value: ReportType.TRANSFER_HUB_TRANSFERS,
        //   t3plus: false,
        //   enabled: true,
        //   description: "Filter by estimated time of departure",
        //   isCustom: false,
        // },
        {
          text: "Tags",
          value: ReportType.TAGS,
          t3plus: true,
          enabled: true,
          description: "All tags. Filter by status and tag type.",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Harvests",
          value: ReportType.HARVESTS,
          t3plus: true,
          enabled: true,
          description: "All harvests. Filter by status and harvest date.",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Outgoing Transfer Manifests",
          value: ReportType.OUTGOING_TRANSFER_MANIFESTS,
          t3plus: true,
          enabled: true,
          description: "Full transfer and package data for all outgoing transfers.",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Straggler Inventory",
          value: ReportType.STRAGGLER_PACKAGES,
          t3plus: true,
          enabled: true,
          description: "Find old and empty inventory",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "COGS",
          value: ReportType.COGS_V2,
          t3plus: false,
          enabled: !!store.state.client.values["ENABLE_COGS"],
          hidden: !store.state.client.values["ENABLE_COGS"],
          description: "Generate COGS calculator",
          isCustom: false,
          isCsvEligible: false,
          isSingleton: true,
        },
        {
          text: "COGS Tracker",
          value: ReportType.COGS_TRACKER,
          t3plus: false,
          enabled: !!store.state.client.values["ENABLE_COGS_TRACKER"],
          hidden: !store.state.client.values["ENABLE_COGS_TRACKER"],
          description: "Generate COGS Tracker sheets",
          isCustom: false,
          isCsvEligible: false,
          isSingleton: true,
        },
        {
          text: "Employee Samples",
          value: ReportType.EMPLOYEE_SAMPLES,
          t3plus: false,
          enabled: !!store.state.client.values["ENABLE_EMPLOYEE_SAMPLE_TOOL"],
          hidden: !store.state.client.values["ENABLE_EMPLOYEE_SAMPLE_TOOL"],
          description: "Generate summary of employee samples",
          isCustom: false,
          isCsvEligible: false,
          isSingleton: true,
        },
        {
          text: "Package Quickview",
          value: null,
          t3plus: true,
          enabled: false,
          description:
            "Grouped summary of packages by item, remaining quantity, and testing status",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Immature Plant Quickview",
          value: null,
          t3plus: true,
          enabled: false,
          description: "Grouped summary of mature plants by strain, location, and dates",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Mature Plant Quickview",
          value: null,
          t3plus: true,
          enabled: false,
          description:
            "Grouped summary of mature plants by growth phase, strain, location, and dates",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        {
          text: "Transfer Quickview",
          value: null,
          t3plus: true,
          enabled: false,
          description: "Summary of incoming, outgoing, and rejected packages",
          isCustom: false,
          isCsvEligible: true,
          isSingleton: false,
        },
        // {
        //   text: "Incoming Inventory",
        //   value: null,
        //   t3plus: true,
        //   enabled: false,
        //   description: "See packages not yet recieved",
        //   isCustom: false,
        // },
        // {
        //   text: "Harvested Plants",
        //   value: null,
        //   t3plus: true,
        //   enabled: false,
        //   description: "All plants and associated harvest data within this license",
        //   isCustom: false,
        // },
      ];

      return reportOptions.filter((x) => !x.hidden);
    },
    eligibleReportOptionsImpl(): IReportOption[] {
      return this.reportOptionsImpl().filter((x: IReportOption) => {
        if (x.hidden) {
          return false;
        }

        if (!x.enabled) {
          return false;
        }

        if (x.t3plus) {
          return store.state.client.values["ENABLE_T3PLUS"] || store.state.client.t3plus;
        } else {
          return true;
        }
      });
    },
    disabledVisibleReportOptionsImpl(): IReportOption[] {
      return this.reportOptionsImpl().filter((x: IReportOption) => {
        if (x.hidden) {
          return false;
        }

        if (!x.enabled) {
          return true;
        }

        if (x.t3plus) {
          return !store.state.client.values["ENABLE_T3PLUS"] && !store.state.client.t3plus;
        } else {
          return false;
        }
      });
    },
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
          mutableArchiveData: await this.$refs["archive"].getMutableArchiveData(),
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

      this.generateSpreadsheet({ reportConfig });
    },
  },

  watch: {
    selectedReports: {
      immediate: true,
      handler(newValue: IReportOption[], oldValue) {
        // console.log(newValue);
        const singleonReportTypes: ReportType[] = this.reportOptionsImpl()
          .filter((x: IReportOption) => x.isSingleton)
          .map((x: IReportOption) => x.value);

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
