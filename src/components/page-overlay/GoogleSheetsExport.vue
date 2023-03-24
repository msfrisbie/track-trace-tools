<template>
  <div>
    <template v-if="oAuthState === OAuthState.INITIAL">
      <b-spinner small></b-spinner>
    </template>

    <template v-if="oAuthState === OAuthState.AUTHENTICATED">
      <div class="grid grid-cols-3 gap-8 w-full">
        <!-- First Column -->
        <div
          class="flex flex-col gap-2 items-stretch"
          v-bind:class="{ 'opacity-50': reportStatus !== ReportStatus.INITIAL }"
        >
          <b-button
            size="sm"
            :disabled="
              eligibleReportOptions.length === selectedReports.length ||
              reportStatus !== ReportStatus.INITIAL
            "
            variant="outline-primary"
            @click="snapshotEverything()"
            >SNAPSHOT EVERYTHING</b-button
          >
          <b-form-group>
            <b-form-checkbox-group v-model="selectedReports" class="flex flex-col gap-4">
              <b-form-checkbox
                v-for="reportOption of eligibleReportOptions"
                v-bind:key="reportOption.value"
                :value="reportOption.value"
                :disabled="reportStatus !== ReportStatus.INITIAL"
                ><div class="flex flex-col items-start gap-1">
                  <span class="">{{ reportOption.text }}</span>
                  <span class="text-xs text-gray-400">{{ reportOption.description }}</span>
                </div>
              </b-form-checkbox>

              <div class="text-xs text-start text-gray-600" v-if="!enablePremium">
                Get access to advanced snapshots with
                <a
                  class="text-purple-500 underline"
                  href="https://trackandtrace.tools/plus"
                  target="_blank"
                  >T3+</a
                >
              </div>

              <b-form-checkbox
                class="opacity-50"
                v-for="reportOption of reportOptions.filter(
                  (x) => !eligibleReportOptions.includes(x)
                )"
                v-bind:key="reportOption.value"
                :value="reportOption.value"
                :disabled="
                  !eligibleReportOptions.includes(reportOption) ||
                  reportStatus !== ReportStatus.INITIAL
                "
                ><div class="flex flex-col items-start gap-1">
                  <span class="">{{ reportOption.text }}</span>
                  <span class="text-xs text-gray-400">{{ reportOption.description }}</span>
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
          <template v-if="selectedReports.length === 0">
            <div class="text-red-500 text-center">Select something to include in your snapshot</div>
          </template>
          <template v-else>
            <div class="text-purple-800 text-center">
              Configure your snapshot below. <br />Defaults to active data and all fields.
            </div>
          </template>

          <!-- Packages -->
          <template v-if="selectedReports.includes(ReportType.PACKAGES)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Packages</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.PACKAGES)"
                  >{{
                    showFilters[ReportType.PACKAGES] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
                <template v-if="showFilters[ReportType.PACKAGES]">
                  <b-form-checkbox v-model="packagesFormFilters.includeActive">
                    <span class="leading-6">Include active packages</span>
                  </b-form-checkbox>

                  <b-form-checkbox v-model="packagesFormFilters.includeInactive">
                    <span class="leading-6">Include inactive packages</span>
                  </b-form-checkbox>

                  <b-form-checkbox :disabled="!enablePremium">
                    <div class="flex flex-col items-start">
                      <span class="leading-6"
                        >Include packages transferred out of this facility</span
                      >
                      <span v-if="!enablePremium" class="text-xs text-gray-300"
                        >Enable this with
                        <a href="https://trackandtrace.tools/plus" target="_blank">T3+</a></span
                      >
                    </div>
                  </b-form-checkbox>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="packagesFormFilters.filterPackagedDateGt">
                      <span class="leading-6">Packaged on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="packagesFormFilters.filterPackagedDateGt"
                      :disabled="!packagesFormFilters.filterPackagedDateGt"
                      initial-date
                      size="sm"
                      v-model="packagesFormFilters.packagedDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="packagesFormFilters.filterPackagedDateLt">
                      <span class="leading-6">Packaged on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="packagesFormFilters.filterPackagedDateLt"
                      :disabled="!packagesFormFilters.filterPackagedDateLt"
                      initial-date
                      size="sm"
                      v-model="packagesFormFilters.packagedDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.PACKAGES)"
                  >{{
                    showFields[ReportType.PACKAGES] ? "HIDE COLUMNS" : "CHOOSE COLUMNS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.PACKAGES]">
                  <div class="grid grid-cols-2 gap-2">
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="checkAll(ReportType.PACKAGES)"
                      >CHECK ALL</b-button
                    >
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="uncheckAll(ReportType.PACKAGES)"
                      >UNCHECK ALL</b-button
                    >
                  </div>

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
                </template>
              </div>
            </div>
          </template>

          <!-- Harvests -->
          <template v-if="selectedReports.includes(ReportType.HARVESTS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Harvests</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.HARVESTS)"
                  >{{
                    showFilters[ReportType.HARVESTS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
                <template v-if="showFilters[ReportType.HARVESTS]">
                  <b-form-checkbox v-model="harvestsFormFilters.includeActive">
                    <span class="leading-6">Include active harvests</span>
                  </b-form-checkbox>

                  <b-form-checkbox v-model="harvestsFormFilters.includeInactive">
                    <span class="leading-6">Include inactive harvests</span>
                  </b-form-checkbox>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="harvestsFormFilters.filterHarvestedDateGt">
                      <span class="leading-6">Harvested on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="harvestsFormFilters.filterHarvestedDateGt"
                      :disabled="!harvestsFormFilters.filterHarvestedDateGt"
                      initial-date
                      size="sm"
                      v-model="harvestsFormFilters.harvestDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="harvestsFormFilters.filterHarvestedDateLt">
                      <span class="leading-6">Harvested on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="harvestsFormFilters.filterHarvestedDateLt"
                      :disabled="!harvestsFormFilters.filterHarvestedDateLt"
                      initial-date
                      size="sm"
                      v-model="harvestsFormFilters.harvestDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.HARVESTS)"
                  >{{
                    showFields[ReportType.HARVESTS] ? "HIDE COLUMNS" : "CHOOSE COLUMNS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.HARVESTS]">
                  <div class="grid grid-cols-2 gap-2">
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="checkAll(ReportType.HARVESTS)"
                      >CHECK ALL</b-button
                    >
                    <b-button
                      variant="outline-dark"
                      size="sm"
                      @click="uncheckAll(ReportType.HARVESTS)"
                      >UNCHECK ALL</b-button
                    >
                  </div>

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
                </template>
              </div>
            </div>
          </template>

          <!-- Mature Plants -->
          <template v-if="selectedReports.includes(ReportType.MATURE_PLANTS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Mature Plants</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.MATURE_PLANTS)"
                  >{{
                    showFilters[ReportType.MATURE_PLANTS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
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
                    <b-form-checkbox v-model="maturePlantsFormFilters.filterPlantedDateGt">
                      <span class="leading-6">Planted on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="maturePlantsFormFilters.filterPlantedDateGt"
                      :disabled="!maturePlantsFormFilters.filterPlantedDateGt"
                      initial-date
                      size="sm"
                      v-model="maturePlantsFormFilters.plantedDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="maturePlantsFormFilters.filterPlantedDateLt">
                      <span class="leading-6">Planted on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="maturePlantsFormFilters.filterPlantedDateLt"
                      :disabled="!maturePlantsFormFilters.filterPlantedDateLt"
                      initial-date
                      size="sm"
                      v-model="maturePlantsFormFilters.plantedDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.MATURE_PLANTS)"
                  >{{
                    showFields[ReportType.MATURE_PLANTS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.MATURE_PLANTS]">
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
                </template>
              </div>
            </div>
          </template>

          <!-- Immature Plants -->
          <template v-if="selectedReports.includes(ReportType.IMMATURE_PLANTS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Immature Plants</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.IMMATURE_PLANTS)"
                  >{{
                    showFilters[ReportType.IMMATURE_PLANTS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
                <template v-if="showFilters[ReportType.IMMATURE_PLANTS]">
                  <b-form-checkbox v-model="immaturePlantsFormFilters.includeActive">
                    <span class="leading-6">Include Active</span>
                  </b-form-checkbox>
                  <b-form-checkbox v-model="immaturePlantsFormFilters.includeInactive">
                    <span class="leading-6">Include Inactive</span>
                  </b-form-checkbox>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="immaturePlantsFormFilters.filterPlantedDateGt">
                      <span class="leading-6">Planted on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="immaturePlantsFormFilters.filterPlantedDateGt"
                      :disabled="!immaturePlantsFormFilters.filterPlantedDateGt"
                      initial-date
                      size="sm"
                      v-model="immaturePlantsFormFilters.plantedDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="immaturePlantsFormFilters.filterPlantedDateLt">
                      <span class="leading-6">Planted on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="immaturePlantsFormFilters.filterPlantedDateLt"
                      :disabled="!immaturePlantsFormFilters.filterPlantedDateLt"
                      initial-date
                      size="sm"
                      v-model="immaturePlantsFormFilters.plantedDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.IMMATURE_PLANTS)"
                  >{{
                    showFields[ReportType.IMMATURE_PLANTS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.IMMATURE_PLANTS]">
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
                </template>
              </div>
            </div>
          </template>

          <!-- Outgoing Transfers -->
          <template v-if="selectedReports.includes(ReportType.OUTGOING_TRANSFERS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Outgoing Transfers</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.OUTGOING_TRANSFERS)"
                  >{{
                    showFilters[ReportType.OUTGOING_TRANSFERS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
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
                    :disabled="!enablePremium"
                    v-model="outgoingTransfersFormFilters.onlyWholesale"
                  >
                    <div class="flex flex-col items-start">
                      <span class="leading-6">Only Wholesale</span>
                    </div>
                    <span v-if="!enablePremium" class="text-xs text-gray-300"
                      >Enable this with
                      <a href="https://trackandtrace.tools/plus" target="_blank">T3+</a></span
                    >
                  </b-form-checkbox>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox
                      v-model="outgoingTransfersFormFilters.filterEstimatedDepartureDateGt"
                    >
                      <span class="leading-6">ETD on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="outgoingTransfersFormFilters.filterEstimatedDepartureDateGt"
                      :disabled="!outgoingTransfersFormFilters.filterEstimatedDepartureDateGt"
                      initial-date
                      size="sm"
                      v-model="outgoingTransfersFormFilters.estimatedDepartureDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox
                      v-model="outgoingTransfersFormFilters.filterEstimatedDepartureDateLt"
                    >
                      <span class="leading-6">ETD on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="outgoingTransfersFormFilters.filterEstimatedDepartureDateLt"
                      :disabled="!outgoingTransfersFormFilters.filterEstimatedDepartureDateLt"
                      initial-date
                      size="sm"
                      v-model="outgoingTransfersFormFilters.estimatedDepartureDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.OUTGOING_TRANSFERS)"
                  >{{
                    showFields[ReportType.OUTGOING_TRANSFERS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.OUTGOING_TRANSFERS]">
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
                </template>
              </div>
            </div>
          </template>

          <!-- Incoming Transfers -->
          <template v-if="selectedReports.includes(ReportType.INCOMING_TRANSFERS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Incoming Transfers</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.INCOMING_TRANSFERS)"
                  >{{
                    showFilters[ReportType.INCOMING_TRANSFERS] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
                <template v-if="showFilters[ReportType.INCOMING_TRANSFERS]">
                  <b-form-checkbox v-model="incomingTransfersFormFilters.includeIncoming">
                    <span class="leading-6">Include Active Incoming</span>
                  </b-form-checkbox>
                  <b-form-checkbox v-model="incomingTransfersFormFilters.includeIncoming">
                    <span class="leading-6">Include Inactive Incoming</span>
                  </b-form-checkbox>
                  <b-form-checkbox v-model="incomingTransfersFormFilters.onlyWholesale">
                    <span class="leading-6">Only Wholesale</span>
                  </b-form-checkbox>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox
                      v-model="incomingTransfersFormFilters.filterEstimatedArrivalDateGt"
                    >
                      <span class="leading-6">ETA on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="incomingTransfersFormFilters.filterEstimatedArrivalDateGt"
                      :disabled="!incomingTransfersFormFilters.filterEstimatedArrivalDateGt"
                      initial-date
                      size="sm"
                      v-model="incomingTransfersFormFilters.estimatedArrivalDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox
                      v-model="incomingTransfersFormFilters.filterEstimatedArrivalDateLt"
                    >
                      <span class="leading-6">ETA on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="incomingTransfersFormFilters.filterEstimatedArrivalDateLt"
                      :disabled="!incomingTransfersFormFilters.filterEstimatedArrivalDateLt"
                      initial-date
                      size="sm"
                      v-model="incomingTransfersFormFilters.estimatedArrivalDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.INCOMING_TRANSFERS)"
                  >{{
                    showFields[ReportType.INCOMING_TRANSFERS] ? "HIDE FIELDS" : "CHOOSE FIELDS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.INCOMING_TRANSFERS]">
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
                </template>
              </div>
            </div>
          </template>

          <!-- Tags -->
          <template v-if="selectedReports.includes(ReportType.TAGS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Tags</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.TAGS)"
                  >{{ showFilters[ReportType.TAGS] ? "HIDE FILTERS" : "CHOOSE FILTERS" }}</b-button
                >
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

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.TAGS)"
                  >{{ showFields[ReportType.TAGS] ? "HIDE FIELDS" : "CHOOSE FIELDS" }}</b-button
                >
                <template v-if="showFields[ReportType.TAGS]">
                  <div class="grid grid-cols-2 gap-2">
                    <b-button variant="outline-dark" size="sm" @click="checkAll(ReportType.TAGS)"
                      >CHECK ALL</b-button
                    >
                    <b-button variant="outline-dark" size="sm" @click="uncheckAll(ReportType.TAGS)"
                      >UNCHECK ALL</b-button
                    >
                  </div>

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
                </template>
              </div>
            </div>
          </template>

          <!-- Outgoing Transfer Manifests -->
          <template v-if="selectedReports.includes(ReportType.OUTGOING_TRANSFER_MANIFESTS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Outgoing Transfer Manifests</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.OUTGOING_TRANSFER_MANIFESTS)"
                  >{{
                    showFilters[ReportType.OUTGOING_TRANSFER_MANIFESTS]
                      ? "HIDE FILTERS"
                      : "CHOOSE FILTERS"
                  }}</b-button
                >
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
                    :disabled="!enablePremium"
                    v-model="outgoingTransferManifestsFormFilters.onlyWholesale"
                  >
                    <div class="flex flex-col items-start">
                      <span class="leading-6">Only Wholesale</span>
                    </div>
                    <span v-if="!enablePremium" class="text-xs text-gray-300"
                      >Enable this with
                      <a href="https://trackandtrace.tools/plus" target="_blank">T3+</a></span
                    >
                  </b-form-checkbox>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox
                      v-model="outgoingTransferManifestsFormFilters.filterEstimatedDepartureDateGt"
                    >
                      <span class="leading-6">ETD on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="outgoingTransferManifestsFormFilters.filterEstimatedDepartureDateGt"
                      :disabled="
                        !outgoingTransferManifestsFormFilters.filterEstimatedDepartureDateGt
                      "
                      initial-date
                      size="sm"
                      v-model="outgoingTransferManifestsFormFilters.estimatedDepartureDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox
                      v-model="outgoingTransferManifestsFormFilters.filterEstimatedDepartureDateLt"
                    >
                      <span class="leading-6">ETD on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="outgoingTransferManifestsFormFilters.filterEstimatedDepartureDateLt"
                      :disabled="
                        !outgoingTransferManifestsFormFilters.filterEstimatedDepartureDateLt
                      "
                      initial-date
                      size="sm"
                      v-model="outgoingTransferManifestsFormFilters.estimatedDepartureDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.OUTGOING_TRANSFER_MANIFESTS)"
                  >{{
                    showFields[ReportType.OUTGOING_TRANSFER_MANIFESTS]
                      ? "HIDE FIELDS"
                      : "CHOOSE FIELDS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.OUTGOING_TRANSFER_MANIFESTS]">
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
                </template>
              </div>
            </div>
          </template>

          <!-- Straggler Packages -->
          <template v-if="selectedReports.includes(ReportType.STRAGGLER_PACKAGES)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">Straggler Packages</div>
              <hr />
              <div class="flex flex-col items-stretch gap-4">
                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFilters(ReportType.STRAGGLER_PACKAGES)"
                  >{{
                    showFilters[ReportType.STRAGGLER_PACKAGES] ? "HIDE FILTERS" : "CHOOSE FILTERS"
                  }}</b-button
                >
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
                      v-model="stragglerPackagesFormFilters.filterLastModifiedDateGt"
                    >
                      <span class="leading-6">Last modified on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="stragglerPackagesFormFilters.filterLastModifiedDateGt"
                      :disabled="!stragglerPackagesFormFilters.filterLastModifiedDateGt"
                      initial-date
                      size="sm"
                      v-model="stragglerPackagesFormFilters.lastModifiedDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox
                      v-model="stragglerPackagesFormFilters.filterLastModifiedDateLt"
                    >
                      <span class="leading-6">Last modified on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="stragglerPackagesFormFilters.filterLastModifiedDateLt"
                      :disabled="!stragglerPackagesFormFilters.filterLastModifiedDateLt"
                      initial-date
                      size="sm"
                      v-model="stragglerPackagesFormFilters.lastModifiedDateLt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="stragglerPackagesFormFilters.filterPackagedDateGt">
                      <span class="leading-6">Packaged on or after:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="stragglerPackagesFormFilters.filterPackagedDateGt"
                      :disabled="!stragglerPackagesFormFilters.filterPackagedDateGt"
                      initial-date
                      size="sm"
                      v-model="stragglerPackagesFormFilters.packagedDateGt"
                    />
                  </div>

                  <div class="flex flex-col items-start gap-1">
                    <b-form-checkbox v-model="stragglerPackagesFormFilters.filterPackagedDateLt">
                      <span class="leading-6">Packaged on or before:</span>
                    </b-form-checkbox>
                    <b-form-datepicker
                      v-if="stragglerPackagesFormFilters.filterPackagedDateLt"
                      :disabled="!stragglerPackagesFormFilters.filterPackagedDateLt"
                      initial-date
                      size="sm"
                      v-model="stragglerPackagesFormFilters.packagedDateLt"
                    />
                  </div>
                </template>

                <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="toggleFields(ReportType.STRAGGLER_PACKAGES)"
                  >{{
                    showFields[ReportType.STRAGGLER_PACKAGES] ? "HIDE COLUMNS" : "CHOOSE COLUMNS"
                  }}</b-button
                >
                <template v-if="showFields[ReportType.STRAGGLER_PACKAGES]">
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
              @click="createSpreadsheet()"
              :disabled="selectedReports.length === 0"
              >CREATE SNAPSHOT</b-button
            >
          </template>

          <template v-if="reportStatus === ReportStatus.INFLIGHT">
            <div class="flex flex-row items-center gap-4">
              <b-spinner small></b-spinner>
              <span>{{ reportStatusMessage }}</span>
            </div>

            <div class="flex flex-col items-stretch gap-2">
              <div
                v-for="statusMessageHistoryEntry of reportStatusMessageHistory"
                v-bind:key="statusMessageHistoryEntry"
                class="flex flex-row justify-start items-center gap-2"
              >
                <font-awesome-icon class="text-green-400" icon="check"></font-awesome-icon>
                <span class="text-gray-300">{{ statusMessageHistoryEntry }}</span>
              </div>
            </div>
          </template>

          <template v-if="reportStatus === ReportStatus.ERROR">
            <div class="text-red-500">Something went wrong.</div>
            <div>{{ reportStatusMessage }}</div>
            <b-button variant="outline-primary" @click="reset()">RESET</b-button>
          </template>

          <template v-if="reportStatus === ReportStatus.SUCCESS">
            <b-button variant="primary" :href="generatedSpreadsheet.spreadsheetUrl" target="_blank"
              >VIEW SNAPSHOT</b-button
            >
            <b-button variant="outline-primary" @click="reset()">START OVER</b-button>
          </template>

          <div
            class="flex flex-col items-stretch gap-2 text-start py-12"
            v-if="generatedSpreadsheetHistory.length > 0"
          >
            <div style="text-align: start">Recent snapshots:</div>
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
    </template>

    <template v-if="oAuthState === OAuthState.NOT_AUTHENTICATED">
      <div class="flex flex-col gap-8 text-center items-center">
        <div class="text-lg font-semibold">
          Sign in to your Google account to generate snapshots.
        </div>
        <div class="text-base">
          Track &amp; Trace Tools can generate Metrc snapshots in Google Sheets.
        </div>

        <a
          class="underline text-purple-600"
          href="https://docs.google.com/spreadsheets/d/1fxBfjBUhFt6Gj7PpbQO8DlT1e76DIDtTwiq_2A5tHCU/edit?usp=sharing"
          target="_blank"
          >Example snapshot</a
        >
        <a class="underline text-purple-600" href="https://youtu.be/JBR21XSKK3I" target="_blank"
          >How do I make a snapshot?</a
        >

        <b-button variant="primary" @click="openOAuthPage()">SIGN IN</b-button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { MessageType } from "@/consts";
import {
  IHarvestFilter,
  IPackageFilter,
  IPlantBatchFilter,
  IPlantFilter,
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
  ReportsActions,
  ReportStatus,
  ReportType,
  REPORT_OPTIONS,
  SHEET_FIELDS,
} from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig } from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "@/utils/date";
import _ from "lodash";
import Vue from "vue";
import { mapActions, mapState } from "vuex";

export default Vue.extend({
  name: "GoogleSheetsExport",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState({
      authState: (state: any) => state.pluginAuth.authState,
      oAuthState: (state: any) => state.pluginAuth.oAuthState,
      generatedSpreadsheet: (state: any) => state.reports.generatedSpreadsheet,
      generatedSpreadsheetHistory: (state: any) => state.reports.generatedSpreadsheetHistory,
      reportStatus: (state: any) => state.reports.status,
      reportStatusMessage: (state: any) => state.reports.statusMessage,
      reportStatusMessageHistory: (state: any) => state.reports.statusMessageHistory,
    }),
    eligibleReportOptions() {
      const enabledOptions = REPORT_OPTIONS.filter((x) => x.enabled);

      if (clientBuildManager.assertValues(["ENABLE_T3PLUS"])) {
        return enabledOptions;
      } else {
        return enabledOptions.filter((x) => !x.premium);
      }
    },
    enablePremium() {
      return clientBuildManager.assertValues(["ENABLE_T3PLUS"]);
    },
  },
  data() {
    return {
      OAuthState,
      ReportStatus,
      ReportType,
      SHEET_FIELDS,
      selectedReports: [],
      reportOptions: REPORT_OPTIONS,
      packagesFormFilters: {
        packagedDateGt: todayIsodate(),
        packagedDateLt: todayIsodate(),
        filterPackagedDateGt: false,
        filterPackagedDateLt: false,
        includeActive: true,
        includeInactive: false,
      },
      stragglerPackagesFormFilters: {
        packagedDateGt: todayIsodate(),
        packagedDateLt: todayIsodate(),
        filterPackagedDateGt: false,
        filterPackagedDateLt: false,
        includeNearlyEmpty: false,
        quantityLt: 5,
        lastModifiedDateGt: todayIsodate(),
        lastModifiedDateLt: todayIsodate(),
        filterLastModifiedDateGt: false,
        filterLastModifiedDateLt: false,
      },
      maturePlantsFormFilters: {
        plantedDateGt: todayIsodate(),
        plantedDateLt: todayIsodate(),
        includeVegetative: true,
        includeFlowering: true,
        includeInactive: false,
        filterPlantedDateGt: false,
        filterPlantedDateLt: false,
      },
      immaturePlantsFormFilters: {
        plantedDateGt: todayIsodate(),
        plantedDateLt: todayIsodate(),
        filterPlantedDateGt: false,
        filterPlantedDateLt: false,
        includeActive: true,
        includeInactive: false,
      },
      harvestsFormFilters: {
        harvestDateGt: todayIsodate(),
        harvestDateLt: todayIsodate(),
        filterHarvestDateGt: false,
        filterHarvestDateLt: false,
        includeActive: true,
        includeInactive: false,
      },
      incomingTransfersFormFilters: {
        estimatedArrivalDateLt: todayIsodate(),
        estimatedArrivalDateGt: todayIsodate(),
        filterEstimatedArrivalDateLt: false,
        filterEstimatedArrivalDateGt: false,
        onlyWholesale: false,
        includeIncoming: true,
        includeIncomingInactive: false,
      },
      outgoingTransfersFormFilters: {
        estimatedDepartureDateLt: todayIsodate(),
        estimatedDepartureDateGt: todayIsodate(),
        filterEstimatedDepartureDateLt: false,
        filterEstimatedDepartureDateGt: false,
        onlyWholesale: false,
        includeOutgoing: true,
        includeRejected: true,
        includeOutgoingInactive: false,
      },
      outgoingTransferManifestsFormFilters: {
        estimatedDepartureDateLt: todayIsodate(),
        estimatedDepartureDateGt: todayIsodate(),
        filterEstimatedDepartureDateLt: false,
        filterEstimatedDepartureDateGt: false,
        onlyWholesale: false,
        includeOutgoing: true,
        includeRejected: true,
        includeOutgoingInactive: false,
      },
      tagsFormFilters: {
        includeAvailable: true,
        includeUsed: false,
        includeVoided: false,
        includePackage: true,
        includePlant: true,
      },
      showFilters: (() => {
        const fields: { [key: string]: boolean } = {};
        Object.keys(SHEET_FIELDS).map((x) => {
          fields[x] = false;
        });
        return fields;
      })(),
      showFields: (() => {
        const fields: { [key: string]: boolean } = {};
        Object.keys(SHEET_FIELDS).map((x) => {
          fields[x] = false;
        });
        return fields;
      })(),
      fields: _.cloneDeep(SHEET_FIELDS),
      showAllRecent: false,
    };
  },
  methods: {
    ...mapActions({
      refreshOAuthState: `pluginAuth/${PluginAuthActions.REFRESH_OAUTH_STATE}`,
      generateReportSpreadsheet: `reports/${ReportsActions.GENERATE_REPORT_SPREADSHEET}`,
      reset: `reports/${ReportsActions.RESET}`,
    }),
    toggleFilters(reportType: ReportType) {
      this.$data.showFilters[reportType] = !this.$data.showFilters[reportType];
    },
    toggleFields(reportType: ReportType) {
      this.$data.showFields[reportType] = !this.$data.showFields[reportType];
    },
    checkAll(reportType: ReportType) {
      this.$data.fields[reportType] = _.cloneDeep(SHEET_FIELDS[reportType]);
    },
    uncheckAll(reportType: ReportType) {
      this.$data.fields[reportType] = _.cloneDeep(SHEET_FIELDS[reportType]).filter(
        (x) => x.required
      );
    },
    snapshotEverything() {
      this.$data.selectedReports = this.eligibleReportOptions.map((x) => x.value);
    },
    async openOAuthPage() {
      messageBus.sendMessageToBackground(MessageType.OPEN_OPTIONS_PAGE, {
        path: "/google-sheets",
      });
    },
    async createSpreadsheet() {
      const reportConfig: IReportConfig = {
        authState: await authManager.authStateOrError(),
      };

      if (this.$data.selectedReports.includes(ReportType.PACKAGES)) {
        const packagesFormFilters = this.$data.packagesFormFilters;
        const packageFilter: IPackageFilter = {};

        packageFilter.includeActive = packagesFormFilters.includeActive;
        packageFilter.includeIntransit = packagesFormFilters.includeIntransit;
        packageFilter.includeInactive = packagesFormFilters.includeInactive;

        packageFilter.packagedDateGt = packagesFormFilters.filterPackagedDateGt
          ? packagesFormFilters.packagedDateGt
          : null;

        packageFilter.packagedDateLt = packagesFormFilters.filterPackagedDateLt
          ? packagesFormFilters.packagedDateLt
          : null;

        reportConfig[ReportType.PACKAGES] = {
          packageFilter,
          fields: this.$data.fields[ReportType.PACKAGES],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.STRAGGLER_PACKAGES)) {
        const stragglerPackagesFormFilters = this.$data.stragglerPackagesFormFilters;
        const stragglerPackageFilter: IPackageFilter = {};

        stragglerPackageFilter.includeActive = true;

        stragglerPackageFilter.quantityLt = stragglerPackagesFormFilters.includeNearlyEmpty
          ? stragglerPackagesFormFilters.quantityLt
          : null;

        stragglerPackageFilter.packagedDateGt = stragglerPackagesFormFilters.filterPackagedDateGt
          ? stragglerPackagesFormFilters.packagedDateGt
          : null;

        stragglerPackageFilter.packagedDateLt = stragglerPackagesFormFilters.filterPackagedDateLt
          ? stragglerPackagesFormFilters.packagedDateLt
          : null;

        stragglerPackageFilter.lastModifiedDateGt =
          stragglerPackagesFormFilters.filterLastModifiedDateGt
            ? stragglerPackagesFormFilters.lastModifiedDateGt
            : null;

        stragglerPackageFilter.lastModifiedDateLt =
          stragglerPackagesFormFilters.filterLastModifiedDateLt
            ? stragglerPackagesFormFilters.lastModifiedDateLt
            : null;

        reportConfig[ReportType.STRAGGLER_PACKAGES] = {
          stragglerPackageFilter,
          fields: this.$data.fields[ReportType.STRAGGLER_PACKAGES],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.MATURE_PLANTS)) {
        const plantFilter: IPlantFilter = {};
        const maturePlantsFormFilters = this.$data.maturePlantsFormFilters;

        plantFilter.includeVegetative = maturePlantsFormFilters.includeVegetative;
        plantFilter.includeFlowering = maturePlantsFormFilters.includeFlowering;
        plantFilter.includeInactive = maturePlantsFormFilters.includeInactive;

        plantFilter.plantedDateGt = maturePlantsFormFilters.filterPlantedDateGt
          ? maturePlantsFormFilters.plantedDateGt
          : null;

        plantFilter.plantedDateLt = maturePlantsFormFilters.filterPackagedDateLt
          ? maturePlantsFormFilters.plantedDateLt
          : null;

        reportConfig[ReportType.MATURE_PLANTS] = {
          plantFilter,
          fields: this.$data.fields[ReportType.MATURE_PLANTS],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.INCOMING_TRANSFERS)) {
        const transferFilter: ITransferFilter = {};
        const incomingTransfersFormFilters = this.$data.incomingTransfersFormFilters;

        transferFilter.onlyWholesale = incomingTransfersFormFilters.onlyWholesale;
        transferFilter.includeIncoming = incomingTransfersFormFilters.includeIncoming;
        transferFilter.includeIncomingInactive =
          incomingTransfersFormFilters.includeIncomingInactive;

        transferFilter.estimatedArrivalDateGt =
          incomingTransfersFormFilters.filterEstimatedArrivalDateGt
            ? incomingTransfersFormFilters.estimatedArrivalDateGt
            : null;

        transferFilter.estimatedArrivalDateLt =
          incomingTransfersFormFilters.filterEstimatedArrivalDateLt
            ? incomingTransfersFormFilters.estimatedArrivalDateLt
            : null;

        reportConfig[ReportType.INCOMING_TRANSFERS] = {
          transferFilter,
          fields: this.$data.fields[ReportType.INCOMING_TRANSFERS],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.OUTGOING_TRANSFERS)) {
        const transferFilter: ITransferFilter = {};
        const outgoingTransfersFormFilters = this.$data.outgoingTransfersFormFilters;

        transferFilter.onlyWholesale = outgoingTransfersFormFilters.onlyWholesale;
        transferFilter.includeOutgoing = outgoingTransfersFormFilters.includeOutgoing;
        transferFilter.includeRejected = outgoingTransfersFormFilters.includeRejected;
        transferFilter.includeOutgoingInactive =
          outgoingTransfersFormFilters.includeOutgoingInactive;

        transferFilter.estimatedDepartureDateGt =
          outgoingTransfersFormFilters.filterEstimatedDepartureDateGt
            ? outgoingTransfersFormFilters.estimatedDepartureDateGt
            : null;

        transferFilter.estimatedDepartureDateLt =
          outgoingTransfersFormFilters.filterEstimatedDepartureDateLt
            ? outgoingTransfersFormFilters.estimatedDepartureDateLt
            : null;

        reportConfig[ReportType.OUTGOING_TRANSFERS] = {
          transferFilter,
          fields: this.$data.fields[ReportType.OUTGOING_TRANSFERS],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.HARVESTS)) {
        const harvestFilter: IHarvestFilter = {};
        const harvestsFormFilters = this.$data.harvestsFormFilters;

        harvestFilter.includeActive = harvestsFormFilters.includeActive;
        harvestFilter.includeInactive = harvestsFormFilters.includeInactive;

        harvestFilter.harvestDateGt = harvestsFormFilters.filterEstimatedArrivalDateGt
          ? harvestsFormFilters.harvestDateGt
          : null;

        harvestFilter.harvestDateLt = harvestsFormFilters.filterEstimatedArrivalDateLt
          ? harvestsFormFilters.harvestDateLt
          : null;

        reportConfig[ReportType.HARVESTS] = {
          harvestFilter,
          fields: this.$data.fields[ReportType.HARVESTS],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.TAGS)) {
        const tagFilter: ITagFilter = {};
        const tagsFormFilters = this.$data.tagsFormFilters;

        tagFilter.includeAvailable = tagsFormFilters.includeAvailable;
        tagFilter.includeUsed = tagsFormFilters.includeUsed;
        tagFilter.includeVoided = tagsFormFilters.includeVoided;
        tagFilter.includePlant = tagsFormFilters.includePlant;
        tagFilter.includePackage = tagsFormFilters.includePackage;

        reportConfig[ReportType.TAGS] = {
          tagFilter,
          fields: this.$data.fields[ReportType.TAGS],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.IMMATURE_PLANTS)) {
        const immaturePlantFilter: IPlantBatchFilter = {};
        const immaturePlantsFormFilters = this.$data.immaturePlantsFormFilters;

        immaturePlantFilter.includeActive = immaturePlantsFormFilters.includeActive;
        immaturePlantFilter.includeInactive = immaturePlantsFormFilters.includeInactive;

        immaturePlantFilter.plantedDateGt = immaturePlantsFormFilters.filterPlantedDateGt
          ? immaturePlantsFormFilters.plantedDateGt
          : null;

        immaturePlantFilter.plantedDateLt = immaturePlantsFormFilters.filterPackagedDateLt
          ? immaturePlantsFormFilters.plantedDateLt
          : null;

        reportConfig[ReportType.IMMATURE_PLANTS] = {
          immaturePlantFilter,
          fields: this.$data.fields[ReportType.IMMATURE_PLANTS],
        };
      }

      if (this.$data.selectedReports.includes(ReportType.OUTGOING_TRANSFER_MANIFESTS)) {
        const transferFilter: ITransferFilter = {};
        const outgoingTransferManifestsFormFilters =
          this.$data.outgoingTransferManifestsFormFilters;

        transferFilter.onlyWholesale = outgoingTransferManifestsFormFilters.onlyWholesale;
        transferFilter.includeOutgoing = outgoingTransferManifestsFormFilters.includeOutgoing;
        transferFilter.includeRejected = outgoingTransferManifestsFormFilters.includeRejected;
        transferFilter.includeOutgoingInactive =
          outgoingTransferManifestsFormFilters.includeOutgoingInactive;

        transferFilter.estimatedDepartureDateGt =
          outgoingTransferManifestsFormFilters.filterEstimatedDepartureDateGt
            ? outgoingTransferManifestsFormFilters.estimatedDepartureDateGt
            : null;

        transferFilter.estimatedDepartureDateLt =
          outgoingTransferManifestsFormFilters.filterEstimatedDepartureDateLt
            ? outgoingTransferManifestsFormFilters.estimatedDepartureDateLt
            : null;

        reportConfig[ReportType.OUTGOING_TRANSFER_MANIFESTS] = {
          transferFilter,
          fields: this.$data.fields[ReportType.OUTGOING_TRANSFER_MANIFESTS],
        };
      }

      this.generateReportSpreadsheet({ reportConfig });
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
