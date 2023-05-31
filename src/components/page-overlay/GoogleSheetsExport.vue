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
          <b-form-group>
            <b-form-checkbox-group v-model="selectedReports" class="flex flex-col gap-4">
              <b-form-checkbox
                v-for="eligibleReportOption of eligibleReportOptions"
                v-bind:key="eligibleReportOption.value"
                :value="eligibleReportOption.value"
                :disabled="reportStatus !== ReportStatus.INITIAL"
                ><div class="flex flex-col items-start gap-1">
                  <span class="">{{ eligibleReportOption.text }}</span>
                  <span class="text-xs text-gray-400">{{ eligibleReportOption.description }}</span>
                </div>
              </b-form-checkbox>

              <div class="text-xs text-start text-gray-600" v-if="!enableT3Plus">
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
                  <span class="text-xs text-gray-400">{{
                    disabledVisibleReportOption.description
                  }}</span>
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
            <div class="text-purple-800 text-center">
              Configure your report below. <br />Defaults to active data and all fields.
            </div>
          </template>

          <!-- COGS -->
          <template v-if="selectedReports.includes(ReportType.COGS)">
            <div class="rounded border border-gray-300 p-2 flex flex-col items-stretch gap-2">
              <div class="font-semibold text-gray-700">COGS</div>
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

                  <b-form-checkbox :disabled="!enableT3Plus">
                    <div class="flex flex-col items-start">
                      <span class="leading-6"
                        >Include packages transferred out of this facility</span
                      >
                      <span v-if="!enableT3Plus" class="text-xs text-gray-300"
                        >Enable this with
                        <a href="https://trackandtrace.tools/plus" target="_blank">T3+</a></span
                      >
                    </div>
                  </b-form-checkbox>

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
                    :disabled="!enableT3Plus"
                    v-model="outgoingTransfersFormFilters.onlyWholesale"
                  >
                    <div class="flex flex-col items-start">
                      <span class="leading-6">Only Wholesale</span>
                    </div>
                    <span v-if="!enableT3Plus" class="text-xs text-gray-300"
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
                    :disabled="!enableT3Plus"
                    v-model="outgoingTransferManifestsFormFilters.onlyWholesale"
                  >
                    <div class="flex flex-col items-start">
                      <span class="leading-6">Only Wholesale</span>
                    </div>
                    <span v-if="!enableT3Plus" class="text-xs text-gray-300"
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
                      v-if="
                        outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateGt
                      "
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
                      v-if="
                        outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateLt
                      "
                      :disabled="
                        !outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateLt
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
              size="sm"
              @click="createSpreadsheet()"
              :disabled="selectedReports.length === 0"
              >CREATE REPORT</b-button
            >

            <template v-if="selectedReports.length === 0">
              <div class="text-red-500 text-center">
                Select something to include in your report
              </div>
            </template>

            <b-button
              size="sm"
              :disabled="
                eligibleReportOptions.length === selectedReports.length ||
                reportStatus !== ReportStatus.INITIAL
              "
              variant="outline-primary"
              @click="snapshotEverything()"
              >GENERATE ALL REPORTS</b-button
            >
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
            <b-button variant="primary" :href="generatedSpreadsheet.spreadsheetUrl" target="_blank"
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
    </template>

    <template v-if="oAuthState === OAuthState.NOT_AUTHENTICATED">
      <div class="flex flex-col gap-8 text-center items-center">
        <div class="text-lg font-semibold">
          Sign in to your Google account to generate reports.
        </div>
        <div class="text-base">
          Track &amp; Trace Tools can generate Metrc reports in Google Sheets.
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
IPluginState,
ITagFilter,
ITransferFilter
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
SHEET_FIELDS
} from "@/store/page-overlay/modules/reports/consts";
import { IReportConfig } from "@/store/page-overlay/modules/reports/interfaces";
import { todayIsodate } from "@/utils/date";
import { addCogsReport, cogsFormFiltersFactory } from "@/utils/reports/cogs-report";
import { addPackageReport, packageFormFiltersFactory } from "@/utils/reports/package-report";
import _ from "lodash";
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import ArchiveWidget from "../shared/ArchiveWidget.vue";

interface IReportOption {
  text: string;
  value: ReportType | null;
  t3plus: boolean;
  enabled: boolean;
  hidden?: boolean;
  description: string;
}

export default Vue.extend({
  name: "GoogleSheetsExport",
  store,
  router,
  props: {},
  components: {
    ArchiveWidget,
  },
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
      oAuthState: (state: IPluginState) => state.pluginAuth.oAuthState,
      generatedSpreadsheet: (state: IPluginState) => state.reports.generatedSpreadsheet,
      generatedSpreadsheetHistory: (state: IPluginState) =>
        state.reports.generatedSpreadsheetHistory,
      reportStatus: (state: IPluginState) => state.reports.status,
      reportStatusMessage: (state: IPluginState) => state.reports.statusMessage,
      reportStatusMessageHistory: (state: IPluginState) => state.reports.statusMessageHistory,
    }),
    eligibleReportOptions(): IReportOption[] {
      return this.eligibleReportOptionsImpl();
    },
    disabledVisibleReportOptions(): IReportOption[] {
      return this.disabledVisibleReportOptionsImpl();
    },
    enableT3Plus(): boolean {
      return clientBuildManager.assertValues(["ENABLE_T3PLUS"]);
    },
  },
  data(): any {
    return {
      OAuthState,
      ReportStatus,
      ReportType,
      SHEET_FIELDS,
      selectedReports: [] as ReportType[],
      cogsFormFilters: cogsFormFiltersFactory(),
      packagesFormFilters: packageFormFiltersFactory(),
      stragglerPackagesFormFilters: {
        packagedDateGt: todayIsodate(),
        packagedDateLt: todayIsodate(),
        shouldFilterPackagedDateGt: false,
        shouldFilterPackagedDateLt: false,
        includeNearlyEmpty: false,
        quantityLt: 5,
        lastModifiedDateGt: todayIsodate(),
        lastModifiedDateLt: todayIsodate(),
        shouldFilterLastModifiedDateGt: false,
        shouldFilterLastModifiedDateLt: false,
      },
      maturePlantsFormFilters: {
        plantedDateGt: todayIsodate(),
        plantedDateLt: todayIsodate(),
        includeVegetative: true,
        includeFlowering: true,
        includeInactive: false,
        shouldFilterPlantedDateGt: false,
        shouldFilterPlantedDateLt: false,
      },
      immaturePlantsFormFilters: {
        plantedDateGt: todayIsodate(),
        plantedDateLt: todayIsodate(),
        shouldFilterPlantedDateGt: false,
        shouldFilterPlantedDateLt: false,
        includeActive: true,
        includeInactive: false,
      },
      harvestsFormFilters: {
        harvestDateGt: todayIsodate(),
        harvestDateLt: todayIsodate(),
        shouldFilterHarvestDateGt: false,
        shouldFilterHarvestDateLt: false,
        includeActive: true,
        includeInactive: false,
      },
      incomingTransfersFormFilters: {
        estimatedArrivalDateLt: todayIsodate(),
        estimatedArrivalDateGt: todayIsodate(),
        shouldFilterEstimatedArrivalDateLt: false,
        shouldFilterEstimatedArrivalDateGt: false,
        onlyWholesale: false,
        includeIncoming: true,
        includeIncomingInactive: false,
      },
      outgoingTransfersFormFilters: {
        estimatedDepartureDateLt: todayIsodate(),
        estimatedDepartureDateGt: todayIsodate(),
        shouldFilterEstimatedDepartureDateLt: false,
        shouldFilterEstimatedDepartureDateGt: false,
        onlyWholesale: false,
        includeOutgoing: true,
        includeRejected: true,
        includeOutgoingInactive: false,
      },
      outgoingTransferManifestsFormFilters: {
        estimatedDepartureDateLt: todayIsodate(),
        estimatedDepartureDateGt: todayIsodate(),
        shouldFilterEstimatedDepartureDateLt: false,
        shouldFilterEstimatedDepartureDateGt: false,
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
        Object.keys(SHEET_FIELDS).map((x: any) => {
          fields[x] = false;
        });
        return fields;
      })(),
      showFields: (() => {
        const fields: { [key: string]: boolean } = {};
        Object.keys(SHEET_FIELDS).map((x: any) => {
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
      generateSpreadsheet: `reports/${ReportsActions.GENERATE_SPREADSHEET}`,
      reset: `reports/${ReportsActions.RESET}`,
    }),
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
    snapshotEverything(): void {
      this.selectedReports = this.eligibleReportOptions.map((x: IReportOption) => x.value);
    },
    reportOptionsImpl(): IReportOption[] {
      const reportOptions: IReportOption[] = [
        {
          text: "Packages",
          value: ReportType.PACKAGES,
          t3plus: false,
          enabled: true,
          description: "Filter by packaged date",
        },
        {
          text: "Plant Batches",
          value: ReportType.IMMATURE_PLANTS,
          t3plus: false,
          enabled: true,
          description: "Filter by planted date",
        },
        {
          text: "Mature Plants",
          value: ReportType.MATURE_PLANTS,
          t3plus: false,
          enabled: true,
          description: "Filter by growth phase and planted date",
        },
        {
          text: "Incoming Transfers",
          value: ReportType.INCOMING_TRANSFERS,
          t3plus: true,
          enabled: true,
          description: "Filter by wholesale and estimated time of arrival",
        },
        {
          text: "Outgoing Transfers",
          value: ReportType.OUTGOING_TRANSFERS,
          t3plus: false,
          enabled: true,
          description: "Filter by wholesale and estimated time of departure",
        },
        {
          text: "Tags",
          value: ReportType.TAGS,
          t3plus: true,
          enabled: true,
          description: "Filter by tag type and status",
        },
        {
          text: "Harvests",
          value: ReportType.HARVESTS,
          t3plus: false,
          enabled: true,
          description: "Filter by harvest date",
        },
        {
          text: "Outgoing Transfer Manifests",
          value: ReportType.OUTGOING_TRANSFER_MANIFESTS,
          t3plus: true,
          enabled: true,
          description: "Full transfer and package data for all outgoing transfers",
        },
        {
          text: "Straggler Inventory",
          value: ReportType.STRAGGLER_PACKAGES,
          t3plus: true,
          enabled: true,
          description: "Find straggler inventory so it can be cleared out",
        },
        {
          text: "COGS",
          value: ReportType.COGS,
          t3plus: false,
          enabled: clientBuildManager.assertValues(["ENABLE_COGS"]),
          hidden: !clientBuildManager.assertValues(["ENABLE_COGS"]),
          description: "Generate COGS",
        },
        {
          text: "Package Quickview",
          value: null,
          t3plus: true,
          enabled: false,
          description:
            "Grouped summary of packages by item, remaining quantity, and testing status",
        },
        {
          text: "Immature Plant Quickview",
          value: null,
          t3plus: true,
          enabled: false,
          description: "Grouped summary of mature plants by strain, location, and dates",
        },
        {
          text: "Mature Plant Quickview",
          value: null,
          t3plus: true,
          enabled: false,
          description:
            "Grouped summary of mature plants by growth phase, strain, location, and dates",
        },
        {
          text: "Transfer Quickview",
          value: null,
          t3plus: true,
          enabled: false,
          description: "Summary of incoming, outgoing, and rejected packages",
        },
        {
          text: "Incoming Inventory",
          value: null,
          t3plus: true,
          enabled: false,
          description: "See packages not yet recieved",
        },
        {
          text: "Harvested Plants",
          value: null,
          t3plus: true,
          enabled: false,
          description: "All plants and associated harvest data within this license",
        },
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
          return clientBuildManager.assertValues(["ENABLE_T3PLUS"]);
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
          return !clientBuildManager.assertValues(["ENABLE_T3PLUS"]);
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
    async createSpreadsheet(): Promise<void> {
      const reportConfig: IReportConfig = {
        authState: await authManager.authStateOrError(),
      };

      // TODO: cogs must UNCHECK all other report types
      if (this.selectedReports.includes(ReportType.COGS)) {
        addCogsReport({
          reportConfig,
          cogsFormFilters: this.cogsFormFilters,
          mutableArchiveData: await this.$refs["archive"].getMutableArchiveData(),
        });
      }

      if (this.selectedReports.includes(ReportType.PACKAGES)) {
        addPackageReport({
          reportConfig,
          packagesFormFilters: this.packagesFormFilters,
          fields: this.fields[ReportType.PACKAGES],
        });
      }

      if (this.selectedReports.includes(ReportType.STRAGGLER_PACKAGES)) {
        const stragglerPackagesFormFilters = this.stragglerPackagesFormFilters;
        const stragglerPackageFilter: IPackageFilter = {};

        stragglerPackageFilter.includeActive = true;

        stragglerPackageFilter.quantityLt = stragglerPackagesFormFilters.includeNearlyEmpty
          ? stragglerPackagesFormFilters.quantityLt
          : null;

        stragglerPackageFilter.packagedDateGt =
          stragglerPackagesFormFilters.shouldFilterPackagedDateGt
            ? stragglerPackagesFormFilters.packagedDateGt
            : null;

        stragglerPackageFilter.packagedDateLt =
          stragglerPackagesFormFilters.shouldFilterPackagedDateLt
            ? stragglerPackagesFormFilters.packagedDateLt
            : null;

        stragglerPackageFilter.lastModifiedDateGt =
          stragglerPackagesFormFilters.shouldFilterLastModifiedDateGt
            ? stragglerPackagesFormFilters.lastModifiedDateGt
            : null;

        stragglerPackageFilter.lastModifiedDateLt =
          stragglerPackagesFormFilters.shouldFilterLastModifiedDateLt
            ? stragglerPackagesFormFilters.lastModifiedDateLt
            : null;

        reportConfig[ReportType.STRAGGLER_PACKAGES] = {
          stragglerPackageFilter,
          fields: this.fields[ReportType.STRAGGLER_PACKAGES],
        };
      }

      if (this.selectedReports.includes(ReportType.MATURE_PLANTS)) {
        const plantFilter: IPlantFilter = {};
        const maturePlantsFormFilters = this.maturePlantsFormFilters;

        plantFilter.includeVegetative = maturePlantsFormFilters.includeVegetative;
        plantFilter.includeFlowering = maturePlantsFormFilters.includeFlowering;
        plantFilter.includeInactive = maturePlantsFormFilters.includeInactive;

        plantFilter.plantedDateGt = maturePlantsFormFilters.shouldFilterPlantedDateGt
          ? maturePlantsFormFilters.plantedDateGt
          : null;

        plantFilter.plantedDateLt = maturePlantsFormFilters.shouldFilterPlantedDateLt
          ? maturePlantsFormFilters.plantedDateLt
          : null;

        reportConfig[ReportType.MATURE_PLANTS] = {
          plantFilter,
          fields: this.fields[ReportType.MATURE_PLANTS],
        };
      }

      if (this.selectedReports.includes(ReportType.INCOMING_TRANSFERS)) {
        const transferFilter: ITransferFilter = {};
        const incomingTransfersFormFilters = this.incomingTransfersFormFilters;

        transferFilter.onlyWholesale = incomingTransfersFormFilters.onlyWholesale;
        transferFilter.includeIncoming = incomingTransfersFormFilters.includeIncoming;
        transferFilter.includeIncomingInactive =
          incomingTransfersFormFilters.includeIncomingInactive;

        transferFilter.estimatedArrivalDateGt =
          incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateGt
            ? incomingTransfersFormFilters.estimatedArrivalDateGt
            : null;

        transferFilter.estimatedArrivalDateLt =
          incomingTransfersFormFilters.shouldFilterEstimatedArrivalDateLt
            ? incomingTransfersFormFilters.estimatedArrivalDateLt
            : null;

        reportConfig[ReportType.INCOMING_TRANSFERS] = {
          transferFilter,
          fields: this.fields[ReportType.INCOMING_TRANSFERS],
        };
      }

      if (this.selectedReports.includes(ReportType.OUTGOING_TRANSFERS)) {
        const transferFilter: ITransferFilter = {};
        const outgoingTransfersFormFilters = this.outgoingTransfersFormFilters;

        transferFilter.onlyWholesale = outgoingTransfersFormFilters.onlyWholesale;
        transferFilter.includeOutgoing = outgoingTransfersFormFilters.includeOutgoing;
        transferFilter.includeRejected = outgoingTransfersFormFilters.includeRejected;
        transferFilter.includeOutgoingInactive =
          outgoingTransfersFormFilters.includeOutgoingInactive;

        transferFilter.estimatedDepartureDateGt =
          outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateGt
            ? (outgoingTransfersFormFilters.estimatedDepartureDateGt as string)
            : null;

        transferFilter.estimatedDepartureDateLt =
          outgoingTransfersFormFilters.shouldFilterEstimatedDepartureDateLt
            ? outgoingTransfersFormFilters.estimatedDepartureDateLt
            : null;

        reportConfig[ReportType.OUTGOING_TRANSFERS] = {
          transferFilter,
          fields: this.fields[ReportType.OUTGOING_TRANSFERS],
        };
      }

      if (this.selectedReports.includes(ReportType.HARVESTS)) {
        const harvestFilter: IHarvestFilter = {};
        const harvestsFormFilters = this.harvestsFormFilters;

        harvestFilter.includeActive = harvestsFormFilters.includeActive;
        harvestFilter.includeInactive = harvestsFormFilters.includeInactive;

        harvestFilter.harvestDateGt = harvestsFormFilters.shouldFilterHarvestDateGt
          ? harvestsFormFilters.harvestDateGt
          : null;

        harvestFilter.harvestDateLt = harvestsFormFilters.shouldFilterHarvestDateLt
          ? harvestsFormFilters.harvestDateLt
          : null;

        reportConfig[ReportType.HARVESTS] = {
          harvestFilter,
          fields: this.fields[ReportType.HARVESTS],
        };
      }

      if (this.selectedReports.includes(ReportType.TAGS)) {
        const tagFilter: ITagFilter = {};
        const tagsFormFilters = this.tagsFormFilters;

        tagFilter.includeAvailable = tagsFormFilters.includeAvailable;
        tagFilter.includeUsed = tagsFormFilters.includeUsed;
        tagFilter.includeVoided = tagsFormFilters.includeVoided;
        tagFilter.includePlant = tagsFormFilters.includePlant;
        tagFilter.includePackage = tagsFormFilters.includePackage;

        reportConfig[ReportType.TAGS] = {
          tagFilter,
          fields: this.fields[ReportType.TAGS],
        };
      }

      if (this.selectedReports.includes(ReportType.IMMATURE_PLANTS)) {
        const immaturePlantFilter: IPlantBatchFilter = {};
        const immaturePlantsFormFilters = this.immaturePlantsFormFilters;

        immaturePlantFilter.includeActive = immaturePlantsFormFilters.includeActive;
        immaturePlantFilter.includeInactive = immaturePlantsFormFilters.includeInactive;

        immaturePlantFilter.plantedDateGt = immaturePlantsFormFilters.shouldFilterPlantedDateGt
          ? immaturePlantsFormFilters.plantedDateGt
          : null;

        immaturePlantFilter.plantedDateLt = immaturePlantsFormFilters.shouldFilterPlantedDateLt
          ? immaturePlantsFormFilters.plantedDateLt
          : null;

        reportConfig[ReportType.IMMATURE_PLANTS] = {
          immaturePlantFilter,
          fields: this.fields[ReportType.IMMATURE_PLANTS],
        };
      }

      if (this.selectedReports.includes(ReportType.OUTGOING_TRANSFER_MANIFESTS)) {
        const transferFilter: ITransferFilter = {};
        const outgoingTransferManifestsFormFilters = this.outgoingTransferManifestsFormFilters;

        transferFilter.onlyWholesale = outgoingTransferManifestsFormFilters.onlyWholesale;
        transferFilter.includeOutgoing = outgoingTransferManifestsFormFilters.includeOutgoing;
        transferFilter.includeRejected = outgoingTransferManifestsFormFilters.includeRejected;
        transferFilter.includeOutgoingInactive =
          outgoingTransferManifestsFormFilters.includeOutgoingInactive;

        transferFilter.estimatedDepartureDateGt =
          outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateGt
            ? outgoingTransferManifestsFormFilters.estimatedDepartureDateGt
            : null;

        transferFilter.estimatedDepartureDateLt =
          outgoingTransferManifestsFormFilters.shouldFilterEstimatedDepartureDateLt
            ? outgoingTransferManifestsFormFilters.estimatedDepartureDateLt
            : null;

        reportConfig[ReportType.OUTGOING_TRANSFER_MANIFESTS] = {
          transferFilter,
          fields: this.fields[ReportType.OUTGOING_TRANSFER_MANIFESTS],
        };
      }

      this.generateSpreadsheet({ reportConfig });
    },
  },

  watch: {
    selectedReports: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue.length > 1 && newValue.includes(ReportType.COGS)) {
          this.selectedReports = [ReportType.COGS];
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
