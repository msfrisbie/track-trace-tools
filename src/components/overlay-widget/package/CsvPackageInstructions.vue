<template>
  <div class="flex flex-col items-center">
    <div class="grid grid-cols-2 gap-24 max-w-6xl items-start text-lg">
      <div class="flex flex-col gap-8">
        <div class="ttt-purple text-4xl font-bold">INSTRUCTIONS</div>
        <div class="ttt-purple text-2xl font-semibold">Step 1: Fill out a CSV template</div>

        <ul class="flex flex-col gap-2 list-disc ml-4">
          <li>Download a fresh CSV template each time you use the tool</li>
          <li>
            Fill out the CSV with info describing the new packages. (See the FAQ for additional
            details)
          </li>
        </ul>

        <div class="ttt-purple text-2xl font-semibold">Step 2: Upload the completed CSV</div>

        <ul class="flex flex-col gap-2 list-disc ml-4">
          <li>Upload your completed CSV into this tool</li>
          <li>T3 will analyze the CSV, check that it's valid, and autofill any empty cells</li>
          <li>If T3 sees anything is missing or incorrect, you'll see a list of errors</li>
        </ul>
        <div class="ttt-purple text-2xl font-semibold">Step 3: Submit to Metrc</div>
        <ul class="flex flex-col gap-2 list-disc ml-4">
          <li>
            Once you've fixed all your errors, click submit to automatically create your new
            packages
          </li>
        </ul>

        <div class="col-span-2 items-center justify-center py-12">
          <b-button size="lg" variant="primary" @click="open('/package/create-package-csv')">GO BACK</b-button>
        </div>
      </div>

      <div class="flex flex-col gap-8">
        <div class="ttt-purple text-4xl font-bold">FAQ</div>

        <div class="ttt-purple text-2xl font-semibold">
          Do I need to fill out every single cell in the CSV?
        </div>

        <div>
          <span class="font-bold text-purple-500">NO.</span>
          There are only three cells that you must always fill out:

          <ul class="flex flex-col gap-2 list-disc ml-4 font-mono">
            <li class="font-bold text-purple-500">Source Package Tag</li>
            <li class="font-bold text-purple-500">Source Package Quantity Used</li>
            <li class="font-bold text-purple-500">New Package Tag</li>
          </ul>
        </div>
        <div>
          T3 will analyze the source packages to autofill empty cells. You only need to fill out a
          cell if a value is changing. Examples:
        </div>
        <ul class="flex flex-col gap-2 list-disc ml-4">
          <li>
            <span class="font-bold text-purple-500">T3 defaults to the same location as the source package.</span>
            Otherwise, if a child package is in a different location, fill in Location Name.
          </li>

          <li>
            <span class="font-bold text-purple-500">T3 defaults to the same item and unit of measure as the source
              package.</span>
            Otherwise, if a child package has a different item/unit, fill in Item Name, New Package
            Quantity, and New Package Unit.
          </li>

          <li>
            <span class="font-bold text-purple-500">T3 defaults to the sum of all the source packages with the same unit
              of
              measure.</span>
            Otherwise, if a child package shouldn't have the sum of the source packages, fill in New
            Package Quantity and New Package Unit.
          </li>

          <li>
            <span class="font-bold text-purple-500">T3 defaults to today for the packaged date.</span>
            Otherwise, if a child package wasn't created today, fill out Packaged Date.
          </li>

          <li>
            <span class="font-bold text-purple-500">T3 defaults to nothing for Note and Production Batch Number.</span>
            Otherwise, fill in these values.
          </li>

          <li>
            <span class="font-bold text-purple-500">T3 defaults to FALSE for Is Donation and Is Trade Sample.</span>
            Otherwise, fill in these values.
          </li>
        </ul>

        <div>The following CSV is an example of a simple filled-out CSV:</div>

        <b-button variant="outline-primary" @click="downloadAutofillCsv()">DOWNLOAD EXAMPLE CSV</b-button>

        <div class="ttt-purple text-2xl font-semibold">
          What do I enter for columns like New Package Unit, Is Donation, Packaged Date, etc?
        </div>

        <span class="font-bold text-purple-500">T3 can intelligently understand almost anything entered in these
          columns.</span>

        <ul class="flex flex-col gap-2 list-disc ml-4">
          <li>
            <span class="font-bold text-purple-500">For date columns like Packaged Date, T3 can understand most date
              formats.</span>
          </li>
          <li>These are all valid:</li>
          <ul class="flex flex-col gap-2 list-disc ml-4 font-mono">
            <li>2023-12-08</li>
            <li>12/08/2023</li>
            <li>Dec 08 2023</li>
            <li>2023-12-08 15:30:00</li>
            <li>Fri, 08 Dec 2023 12:00:00 GMT</li>
          </ul>

          <li>
            <span class="font-bold text-purple-500">For unit columns like New Package Unit, T3 can read understand most
              unit
              formats.</span>
          </li>
          <li>These are all valid:</li>
          <ul class="flex flex-col gap-2 list-disc ml-4 font-mono">
            <li>g</li>
            <li>G</li>
            <li>grams</li>
            <li>Grams</li>
            <li>GRAMS</li>
          </ul>

          <li>
            <span class="font-bold text-purple-500">For yes/no columns like Is Donation, T3 can read understand most
              formats.</span>
          </li>
          <li>These are all valid:</li>
          <ul class="flex flex-col gap-2 list-disc ml-4 font-mono">
            <li>true</li>
            <li>T</li>
            <li>YES</li>
            <li>Y</li>
          </ul>
        </ul>

        <div>The following example CSV demonstrates various allowed values:</div>

        <b-button variant="outline-primary" @click="downloadAutofillCsv()">DOWNLOAD EXAMPLE CSV</b-button>

        <div class="ttt-purple text-2xl font-semibold">
          How do I make a package that has multiple source packages?
        </div>

        <div>
          <span class="font-bold text-purple-500">Each CSV row represents one source package being used for one child
            package.</span>
          For multiple source packages, enter identical information for the child package on each
          row.
        </div>

        <div>
          For example, if you wanted to create a new package (0001) that used material from three
          different source packages (9992, 9993, 9994), your CSV would appear as follows:
        </div>

        <ul class="flex flex-col gap-2 list-disc ml-4">
          <li>Row 1 describes 9992 being used for 0001</li>
          <li>Row 2 describes 9993 being used for 0001</li>
          <li>Row 3 describes 9994 being used for 0001</li>
        </ul>

        <div>
          Remember, for each of these rows,
          <span class="font-bold text-purple-500">All columns following Source Package Quantity Unit Of Measure must be
            identical.</span>
        </div>

        <div>
          The following example CSV demonstrates how to create a package with multiple sources:
        </div>

        <b-button variant="outline-primary" @click="downloadMultiCsv()">DOWNLOAD EXAMPLE CSV</b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { AnalyticsEvent } from "@/consts";
import { ICsvFile, IPluginState } from "@/interfaces";
import { analyticsManager } from "@/modules/analytics-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import { CREATE_PACKAGE_CSV_COLUMNS } from "@/store/page-overlay/modules/create-package-csv/consts";
import { downloadCsvFile } from "@/utils/csv";
import Vue from "vue";
import { mapState } from "vuex";

export default Vue.extend({
  name: "CsvPackageInstructions",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState<IPluginState>({
      authState: (state: IPluginState) => state.pluginAuth.authState,
    }),
  },
  data() {
    return {
      interval: 5000,
    };
  },
  methods: {
    open(path: string) {
      analyticsManager.track(AnalyticsEvent.BUILDER_ENGAGEMENT, {
        action: `Navigated to ${path}`,
      });

      this.$router.push(path);
    },
    next() {
      // @ts-ignore
      this.$refs.csvPackageCarousel.next();
    },
    onSlideStart(slide: any) {
      this.$data.sliding = true;
    },
    onSlideEnd(slide: any) {
      this.$data.sliding = false;
    },
    downloadSimpleCsv() {
      const csvFile: ICsvFile = {
        filename: "example_empty_cells_create_package_template",
        data: [
          CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value),
          ["EXAMPLE00000000000000001", "3", "", "EXAMPLE00000000000005001"],
          ["EXAMPLE00000000000000002", "3", "", "EXAMPLE00000000000005002"],
          ["EXAMPLE00000000000000003", "3", "", "EXAMPLE00000000000005003"],
        ],
      };

      downloadCsvFile({ csvFile, delay: 500 });
    },
    downloadAutofillCsv() {
      const csvFile: ICsvFile = {
        filename: "example_cell_values_create_package_template",
        data: [
          CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value),
          [
            "EXAMPLE00000000000000001",
            "3",
            "g",
            "EXAMPLE00000000000005001",
            "",
            "",
            "",
            "g",
            "01/01/2023",
            "",
            "",
            "YES",
            "NO",
            "01/01/2023",
          ],
          [
            "EXAMPLE00000000000000002",
            "3",
            "grams",
            "EXAMPLE00000000000005002",
            "",
            "",
            "",
            "grams",
            "01-01-2023",
            "",
            "",
            "false",
            "true",
            "01-01-2023",
          ],
          [
            "EXAMPLE00000000000000003",
            "3",
            "G",
            "EXAMPLE00000000000005003",
            "",
            "",
            "",
            "G",
            "Jan 01 2023",
            "",
            "",
            "F",
            "T",
            "Jan 01 2023",
          ],
        ],
      };

      downloadCsvFile({ csvFile, delay: 500 });
    },
    downloadMultiCsv() {
      const csvFile: ICsvFile = {
        filename: "example_multi_source_create_package_template",
        data: [
          CREATE_PACKAGE_CSV_COLUMNS.map((x) => x.value),
          [
            "EXAMPLE00000000000000001",
            "3",
            "",
            "EXAMPLE00000000000009999",
            "Shelf A",
            "Gummies",
            "9",
          ],
          [
            "EXAMPLE00000000000000002",
            "3",
            "",
            "EXAMPLE00000000000009999",
            "Shelf A",
            "Gummies",
            "9",
          ],
          [
            "EXAMPLE00000000000000003",
            "3",
            "",
            "EXAMPLE00000000000009999",
            "Shelf A",
            "Gummies",
            "9",
          ],
        ],
      };

      downloadCsvFile({ csvFile, delay: 500 });
    },
  },
  async created() { },
  async mounted() { },
});
</script>

<style type="text/scss" lang="scss" scoped></style>
