<template>
  <div class="flex flex-col items-stretch gap-4">
    <b-form-group label="Existing archive file (optional)">
      <b-form-file v-on:change="inspectFile($event)" v-model="existingArchive"></b-form-file>
    </b-form-group>

    <!-- <b-button @click="inspect()">INSPECT FILE</b-button> -->

    <b-form-checkbox v-model="loadInactivePackages">Load inactive packages</b-form-checkbox>
    <b-form-checkbox v-model="loadInactivePackagesHistory"
      >Load inactive package history</b-form-checkbox
    >
    <b-form-checkbox v-model="loadInactiveOutgoingTransfers"
      >Load inactive outgoing transfers</b-form-checkbox
    >
    <b-form-checkbox v-model="loadInactiveOutgoingTransfersPackages"
      >Load inactive outgoing transfer packages</b-form-checkbox
    >

    <b-button size="sm" :disabled="inflight" @click="generateArchive()"
      >GENERATE ARCHIVE FILE</b-button
    >

    <span v-if="message">{{ message }}</span>

    <b-button size="sm" v-if="archiveUrl" :href="archiveUrl" download="archive.json"
      >DOWNLOAD ARCHIVE FILE ({{ Math.floor(archiveFileSize / 1000) }} kB)</b-button
    >
  </div>
</template>

<script lang="ts">
import {
  IIndexedPackageData,
  IIndexedRichOutgoingTransferData,
  ISimpleOutgoingTransferData,
  ISimplePackageData,
  ISimpleTransferPackage,
} from "@/interfaces";
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { ICogsArchive } from "@/store/page-overlay/modules/reports/interfaces";
import { CompressedDataWrapper, compressJSON } from "@/utils/compression";
import { readJSONFile } from "@/utils/file";
import {
  extractParentPackageLabelsFromHistory,
  extractTagQuantityPairsFromHistory,
} from "@/utils/history";
import { getId, getItemName, getLabel } from "@/utils/package";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "ArchiveWidget",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      existingArchive: null,
      archiveUrl: null,
      archiveFileSize: 0,
      inflight: false,
      message: null,
      loadInactivePackages: false,
      loadInactivePackagesHistory: false,
      loadInactiveOutgoingTransfers: false,
      loadInactiveOutgoingTransfersPackages: false,
    };
  },
  methods: {
    async getArchiveData(): Promise<any> {
      return readJSONFile(this.$data.existingArchive);
    },
    async inspectFile(e: any): Promise<void> {
      console.log(await readJSONFile(e.target.files[0]));
    },
    async generateArchive(): Promise<void> {
      try {
        this.$data.inflight = true;
        this.$data.message = null;
        URL.revokeObjectURL(this.$data.archiveUrl);
        this.$data.archiveUrl = null;

        const archive: ICogsArchive = this.$data.existingArchive
          ? await this.getArchiveData()
          : {
              licenses: [],
              packages: [],
              packagesKeys: [],
              transfers: [],
              transfersKeys: [],
              transfersPackages: [],
              transfersPackagesKeys: [],
            };

        archive.licenses = (await facilityManager.ownedFacilitiesOrError()).map(
          (x) => x.licenseNumber
        );

        let dataLoader: DataLoader | null = null;

        if (this.$data.loadInactivePackages) {
          this.$data.message = "Loading inactive packages...";

          let rawPackages: IIndexedPackageData[] = [];

          for (const license of archive.licenses) {
            dataLoader = await getDataLoaderByLicense(license);

            rawPackages = [...rawPackages, ...(await dataLoader!.inactivePackages())];
          }

          this.$data.message = `Processing ${rawPackages.length} inactive packages...`;

          const wrapper = compressJSON<ISimplePackageData>(
            rawPackages.map((pkg) => ({
              LicenseNumber: pkg.LicenseNumber,
              Id: getId(pkg),
              PackageState: pkg.PackageState,
              Label: getLabel(pkg),
              ItemName: getItemName(pkg),
              SourcePackageLabels: pkg.SourcePackageLabels,
              ProductionBatchNumber: pkg.ProductionBatchNumber,
              ParentPackageLabels: null,
              TagQuantityPairs: null,
            })),
            "Label"
          );

          archive.packages = wrapper.data;
          archive.packagesKeys = wrapper.keys;
        }

        if (this.$data.loadInactivePackagesHistory) {
          this.$data.message = "Loading inactive package history...";

          const packageHistoryRequests: Promise<any>[] = [];

          const wrapper = new CompressedDataWrapper<ISimplePackageData>(
            archive.packages,
            "Label",
            archive.packagesKeys
          );

          for (const pkg of wrapper) {
            packageHistoryRequests.push(
              getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
                dataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
                  wrapper.update(
                    pkg.Label,
                    "ParentPackageLabels",
                    extractParentPackageLabelsFromHistory(history)
                  );

                  wrapper.update(
                    pkg.Label,
                    "TagQuantityPairs",
                    extractTagQuantityPairsFromHistory(history)
                  );
                })
              )
            );

            if (packageHistoryRequests.length % 250 === 0) {
              await Promise.allSettled(packageHistoryRequests);
              this.$data.message = `Loaded ${packageHistoryRequests.length} package history...`;
            }
          }

          await Promise.allSettled(packageHistoryRequests);
        }

        if (this.$data.loadInactiveOutgoingTransfers) {
          this.$data.message = "Loading inactive outgoing transfers...";

          let rawTransfers: IIndexedRichOutgoingTransferData[] = [];

          for (const license of archive.licenses) {
            dataLoader = await getDataLoaderByLicense(license);

            rawTransfers = [...rawTransfers, ...(await dataLoader!.outgoingInactiveTransfers())];
          }

          this.$data.message = `Processing ${rawTransfers.length} inactive outgoing transfers...`;

          const wrapper = compressJSON<ISimpleOutgoingTransferData>(
            rawTransfers.map((transfer) => ({
              LicenseNumber: transfer.LicenseNumber,
              ManifestNumber: transfer.ManifestNumber,
              Id: transfer.Id,
              TransferState: transfer.TransferState,
              Destinations: [],
            })),
            "ManifestNumber"
          );

          archive.transfers = wrapper.data;
          archive.transfersKeys = wrapper.keys;

          const transferDestinationRequests: Promise<any>[] = [];

          for (const transfer of wrapper) {
            transferDestinationRequests.push(
              getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
                dataLoader.transferDestinations(transfer.Id).then((destinations) => {
                  transfer.Destinations = destinations.map((destination) => ({
                    Id: destination.Id,
                    Type: destination.ShipmentTypeName,
                    ETD: destination.EstimatedDepartureDateTime,
                  }));
                })
              )
            );

            if (transferDestinationRequests.length % 250 === 0) {
              await Promise.allSettled(transferDestinationRequests);
              this.$data.message = `Loaded ${transferDestinationRequests.length} destinations...`;
            }
          }

          await Promise.allSettled(transferDestinationRequests);
        }

        if (this.$data.loadInactiveOutgoingTransfersPackages) {
          this.$data.message = "Loading inactive outgoing transfer packages...";

          const packageRequests: Promise<any>[] = [];

          const rawTransferPackages: any[] = [];

          const wrapper = new CompressedDataWrapper<ISimpleOutgoingTransferData>(
            archive.transfers,
            "ManifestNumber",
            archive.transfersKeys
          );

          for (const transfer of wrapper) {
            for (const destination of transfer.Destinations) {
              packageRequests.push(
                getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
                  dataLoader.destinationPackages(destination.Id).then((destinationPackages) => {
                    for (const pkg of destinationPackages) {
                      rawTransferPackages.push({
                        ETD: destination.ETD,
                        Type: destination.Type,
                        ManifestNumber: transfer.ManifestNumber,
                        LicenseNumber: transfer.LicenseNumber,
                        Id: getId(pkg),
                        PackageState: pkg.PackageState,
                        Label: getLabel(pkg),
                        ItemName: getItemName(pkg),
                        SourcePackageLabels: pkg.SourcePackageLabels,
                        ProductionBatchNumber: pkg.ProductionBatchNumber,
                      });
                    }
                  })
                )
              );

              if (packageRequests.length % 250 === 0) {
                await Promise.allSettled(packageRequests);
                this.$data.message = `Loaded ${packageRequests.length} manifests...`;
              }
            }
          }

          await Promise.allSettled(packageRequests);

          this.$data.message = `Processing ${rawTransferPackages.length} manifest packages...`;

          const packageWrapper = compressJSON<ISimpleTransferPackage>(rawTransferPackages, "Label");

          archive.transfersPackages = packageWrapper.data;
          archive.transfersPackagesKeys = packageWrapper.keys;
        }

        this.$data.message = "Writing archive to file...";

        const blob = new Blob([JSON.stringify(archive)], { type: "application/json" });

        this.$data.archiveFileSize = blob.size;

        this.$data.archiveUrl = URL.createObjectURL(blob);
        this.$data.message = null;
      } catch (e) {
        this.$data.message = e;
      } finally {
        this.$data.inflight = false;
      }
    },
  },
  async created() {},
  async mounted() {},
});
</script>

<style type="text/scss" lang="scss" scoped></style>
