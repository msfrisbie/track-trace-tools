<template>
  <div class="flex flex-col items-stretch gap-4">
    <b-form-group label="Existing archive file (optional)">
      <b-form-file v-on:change="inspectFile($event)" v-model="existingArchive"></b-form-file>
    </b-form-group>

    <pre v-if="metadata">{{ metadata }}</pre>

    <b-button v-if="!showGenerate" size="sm" variant="light" @click="showGenerate = !showGenerate"
      >ADVANCED</b-button
    >

    <template v-if="showGenerate">
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
    </template>
  </div>
</template>

<script lang="ts">
import {
  IIndexedPackageData,
  IIndexedRichOutgoingTransferData,
  ISimpleOutgoingTransferData,
  ISimplePackageData,
  ISimpleTransferPackageData,
} from '@/interfaces';
import { DataLoader, getDataLoaderByLicense } from '@/modules/data-loader/data-loader.module';
import { facilityManager } from '@/modules/facility-manager.module';
import router from '@/router/index';
import store from '@/store/page-overlay/index';
import { ICogsArchive } from '@/store/page-overlay/modules/reports/interfaces';
import { CompressedDataWrapper, compressedDataWrapperFactory } from '@/utils/compression';
import { readJSONFile } from '@/utils/file';
import {
  extractParentPackageLabelsFromHistory,
  extractChildPackageTagQuantityPairsFromHistory,
} from '@/utils/history';
import { getIdOrError, getItemNameOrError, getLabelOrError } from '@/utils/package';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'ArchiveWidget',
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
      metadata: null,
      archiveUrl: null,
      archiveFileSize: 0,
      showGenerate: false,
      inflight: false,
      message: null,
      loadInactivePackages: false,
      loadInactivePackagesHistory: false,
      loadInactiveOutgoingTransfers: false,
      loadInactiveOutgoingTransfersPackages: false,
    };
  },
  methods: {
    async getMutableArchiveData(): Promise<any> {
      return readJSONFile(this.$data.existingArchive);
    },
    async inspectFile(e: any): Promise<void> {
      if (!e) {
        this.$data.metadata = null;
        return;
      }
      const data: ICogsArchive = await readJSONFile(e.target.files[0]);

      console.log(data);

      const packageWrapper = new CompressedDataWrapper(
        'Package',
        data.packages,
        'Label',
        data.packagesKeys,
      );
      const transferWrapper = new CompressedDataWrapper(
        'Transfer',
        data.transfers,
        'ManifestNumber',
        data.transfersKeys,
      );
      const transferPackageWrapper = new CompressedDataWrapper(
        'Transfer Package',
        data.transfersPackages,
        'Label',
        data.transfersPackagesKeys,
      );

      // const packages = new Set<string>(packa);
      // const transfers = new Set<string>();
      // const transferPackages = new Set<string>();

      this.$data.metadata = {
        licenses: data.licenses,
        packages: data.packages.length,
        transfers: data.transfers.length,
        transferPackages: data.transfersPackages.length,
      };
    },
    async generateArchive(): Promise<void> {
      try {
        this.$data.inflight = true;
        this.$data.message = null;
        URL.revokeObjectURL(this.$data.archiveUrl);
        this.$data.archiveUrl = null;

        const archive: ICogsArchive = this.$data.existingArchive
          ? await this.getMutableArchiveData()
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
          (x) => x.licenseNumber,
        );

        let dataLoader: DataLoader | null = null;

        if (this.$data.loadInactivePackages) {
          this.$data.message = 'Loading inactive packages...';

          let rawPackages: IIndexedPackageData[] = [];

          for (const license of archive.licenses) {
            dataLoader = await getDataLoaderByLicense(license);

            rawPackages = [...rawPackages, ...(await dataLoader!.inactivePackages())];
          }

          this.$data.message = `Processing ${rawPackages.length} inactive packages...`;

          const wrapper = compressedDataWrapperFactory<ISimplePackageData>(
            'Package',
            rawPackages.map((pkg) => ({
              LicenseNumber: pkg.LicenseNumber,
              Id: getIdOrError(pkg),
              PackageState: pkg.PackageState,
              Label: getLabelOrError(pkg),
              ItemName: getItemNameOrError(pkg),
              SourcePackageLabels: pkg.SourcePackageLabels,
              ProductionBatchNumber: pkg.ProductionBatchNumber,
              parentPackageLabels: null,
              childPackageLabelQuantityPairs: null,
            })),
            'Label',
          );

          archive.packages = wrapper.data;
          archive.packagesKeys = wrapper.keys;
        }

        if (this.$data.loadInactivePackagesHistory) {
          this.$data.message = 'Loading inactive package history...';

          const packageHistoryRequests: Promise<any>[] = [];

          const wrapper = new CompressedDataWrapper<ISimplePackageData>(
            'Package',
            archive.packages,
            'Label',
            archive.packagesKeys,
          );

          for (const pkg of wrapper) {
            packageHistoryRequests.push(
              getDataLoaderByLicense(pkg.LicenseNumber).then((dataLoader) =>
                dataLoader.packageHistoryByPackageId(pkg.Id).then((history) => {
                  wrapper.update(
                    pkg.Label,
                    'parentPackageLabels',
                    extractParentPackageLabelsFromHistory(history),
                  );

                  wrapper.update(
                    pkg.Label,
                    'childPackageLabelQuantityPairs',
                    extractChildPackageTagQuantityPairsFromHistory(history),
                  );
                })),
            );

            if (packageHistoryRequests.length % 250 === 0) {
              await Promise.allSettled(packageHistoryRequests);
              this.$data.message = `Loaded ${packageHistoryRequests.length} package history...`;
            }
          }

          await Promise.allSettled(packageHistoryRequests);
        }

        if (this.$data.loadInactiveOutgoingTransfers) {
          this.$data.message = 'Loading inactive outgoing transfers...';

          let rawTransfers: IIndexedRichOutgoingTransferData[] = [];

          for (const license of archive.licenses) {
            dataLoader = await getDataLoaderByLicense(license);

            rawTransfers = [...rawTransfers, ...(await dataLoader!.outgoingInactiveTransfers())];
          }

          this.$data.message = `Processing ${rawTransfers.length} inactive outgoing transfers...`;

          const wrapper = compressedDataWrapperFactory<ISimpleOutgoingTransferData>(
            'Transfers',
            rawTransfers.map((transfer) => ({
              LicenseNumber: transfer.LicenseNumber,
              ManifestNumber: transfer.ManifestNumber,
              Id: transfer.Id,
              TransferState: transfer.TransferState,
              Destinations: [],
            })),
            'ManifestNumber',
          );

          archive.transfers = wrapper.data;
          archive.transfersKeys = wrapper.keys;

          const transferDestinationRequests: Promise<any>[] = [];

          for (const transfer of wrapper) {
            transferDestinationRequests.push(
              getDataLoaderByLicense(transfer.LicenseNumber).then((dataLoader) =>
                dataLoader.transferDestinations(transfer.Id).then((destinations) => {
                  wrapper.update(
                    transfer.ManifestNumber,
                    'Destinations',
                    destinations.map((destination) => ({
                      Id: destination.Id,
                      Type: destination.ShipmentTypeName,
                      ETD: destination.EstimatedDepartureDateTime,
                    })),
                  );
                })),
            );

            if (transferDestinationRequests.length % 250 === 0) {
              await Promise.allSettled(transferDestinationRequests);
              this.$data.message = `Loaded ${transferDestinationRequests.length} destinations...`;
            }
          }

          await Promise.allSettled(transferDestinationRequests);
        }

        if (this.$data.loadInactiveOutgoingTransfersPackages) {
          this.$data.message = 'Loading inactive outgoing transfer packages...';

          const packageRequests: Promise<any>[] = [];

          const rawTransferPackages: ISimpleTransferPackageData[] = [];

          const wrapper = new CompressedDataWrapper<ISimpleOutgoingTransferData>(
            'Transfers',
            archive.transfers,
            'ManifestNumber',
            archive.transfersKeys,
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
                        Id: getIdOrError(pkg),
                        PackageState: pkg.PackageState,
                        Label: getLabelOrError(pkg),
                        ItemName: getItemNameOrError(pkg),
                        Quantity: pkg.ShippedQuantity,
                        UnitOfMeasureAbbreviation: pkg.ShippedUnitOfMeasureAbbreviation,
                        SourcePackageLabels: pkg.SourcePackageLabels,
                        ProductionBatchNumber: pkg.ProductionBatchNumber,
                        parentPackageLabels: null,
                        childPackageLabelQuantityPairs: null,
                      });
                    }
                  })),
              );

              if (packageRequests.length % 250 === 0) {
                await Promise.allSettled(packageRequests);
                this.$data.message = `Loaded ${packageRequests.length} manifests...`;
              }
            }
          }

          await Promise.allSettled(packageRequests);

          this.$data.message = `Processing ${rawTransferPackages.length} manifest packages...`;

          const packageWrapper = compressedDataWrapperFactory<ISimpleTransferPackageData>(
            'Transfer Package',
            rawTransferPackages,
            'Label',
          );

          archive.transfersPackages = packageWrapper.data;
          archive.transfersPackagesKeys = packageWrapper.keys;
        }

        this.$data.message = 'Writing archive to file...';

        const blob = new Blob([JSON.stringify(archive)], { type: 'application/json' });

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
