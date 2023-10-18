<template>
  <div>
    <table class="text-center">
      <thead>
        <tr>
          <th>License</th>
          <th
            v-for="permissionTemplate of permissionTemplates"
            v-bind:key="permissionTemplate.permissionName"
          >
            {{ permissionTemplate.permissionName }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="[idx, facility] of facilities.entries()">
          <tr v-bind:class="{ 'bg-purple-100': idx % 2 === 0 }" v-bind:key="facility.licenseNumber">
            <td>{{ facility.licenseNumber }}</td>
            <template
              v-for="permission of permissions.filter((x) => x.license === facility.licenseNumber)"
            >
              <td v-bind:key="permission.pemissionName">
                <div class="flex flex-row gap-2 items-center justify-center">
                  <template v-if="permission.state === PermissionState.INITIAL">
                    <b-spinner small />
                  </template>
                  <template v-if="permission.state === PermissionState.GRANTED">
                    <font-awesome-icon icon="check" size="lg" class="text-green-700" />
                    <!-- <span
                      >Granted</span
                    > -->
                  </template>
                  <template v-if="permission.state === PermissionState.NOT_GRANTED">
                    <font-awesome-icon icon="times" size="lg" class="text-red-700" />
                    <!-- <span>NOT Granted</span> -->
                  </template>
                </div>
              </td>
            </template>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { DataLoader, getDataLoaderByLicense } from "@/modules/data-loader/data-loader.module";
import { facilityManager } from "@/modules/facility-manager.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Vue from "vue";
import { mapState } from "vuex";

enum PermissionState {
  INITIAL = "INITIAL",
  GRANTED = "GRANTED",
  NOT_GRANTED = "NOT GRANTED",
}

interface T3Permission {
  permissionName: string;
  state: PermissionState;
  license: string;
  assessmentFn: (dataLoader: DataLoader) => Promise<boolean>;
}

export default Vue.extend({
  name: "CheckPermissionsView",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      PermissionState,
      facilities: [],
      permissions: [],
      permissionTemplates: [],
    };
  },
  methods: {},
  async created() {},
  async mounted() {
    const facilities = await facilityManager.ownedFacilitiesOrError();
    const permissions: T3Permission[] = [];

    const permissionTemplates: {
      permissionName: string;
      assessmentFn: (dataLoader: DataLoader) => Promise<boolean>;
    }[] = [
      {
        permissionName: "Plants",
        assessmentFn: async (dataLoader: DataLoader) => {
          try {
            return (await dataLoader.floweringPlantCount()) !== null;
          } catch {
            return false;
          }
        },
      },
      {
        permissionName: "Harvests",
        assessmentFn: async (dataLoader: DataLoader) => {
          try {
            return (await dataLoader.activeHarvestCount()) !== null;
          } catch {
            return false;
          }
        },
      },
      {
        permissionName: "Transfers",
        assessmentFn: async (dataLoader: DataLoader) => {
          try {
            return (await dataLoader.incomingTransferCount()) !== null;
          } catch {
            return false;
          }
        },
      },
      {
        permissionName: "Packages",
        assessmentFn: async (dataLoader: DataLoader) => {
          try {
            return (await dataLoader.activePackageCount()) !== null;
          } catch {
            return false;
          }
        },
      },
      {
        permissionName: "Strains",
        assessmentFn: async (dataLoader: DataLoader) => {
          try {
            await dataLoader.strains();
            return true;
          } catch {
            return false;
          }
        },
      },
      {
        permissionName: "Locations",
        assessmentFn: async (dataLoader: DataLoader) => {
          try {
            await dataLoader.locations();
            return true;
          } catch {
            return false;
          }
        },
      },
      {
        permissionName: "Items",
        assessmentFn: async (dataLoader: DataLoader) => {
          try {
            await dataLoader.items();
            return true;
          } catch {
            return false;
          }
        },
      },
      {
        permissionName: "Tags",
        assessmentFn: async (dataLoader: DataLoader) => {
          try {
            return (await dataLoader.availableTagCount()) !== null;
          } catch {
            return false;
          }
        },
      },
      {
        permissionName: "Sales",
        assessmentFn: async (dataLoader: DataLoader) => {
          try {
            return (await dataLoader.activeSalesCount()) !== null;
          } catch {
            return false;
          }
        },
      },
    ];

    for (const facility of facilities) {
      for (const permissionTemplate of permissionTemplates) {
        permissions.push({
          ...permissionTemplate,
          state: PermissionState.INITIAL,
          license: facility.licenseNumber,
        });
      }
    }

    for (const permission of permissions) {
      const dataLoader = await getDataLoaderByLicense(permission.license);

      permission
        .assessmentFn(dataLoader)
        .then(
          (result: boolean) =>
            (permission.state = result ? PermissionState.GRANTED : PermissionState.NOT_GRANTED)
        );
    }

    this.$data.permissions = permissions;
    this.$data.permissionTemplates = permissionTemplates;
    this.$data.facilities = facilities;
  },
});
</script>

<style type="text/scss" lang="scss" scoped>
td,
th {
  padding: 1rem;
}
</style>
