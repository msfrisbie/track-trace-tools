<template>
  <div class="flex flex-column-shim flex-col space-y-6">
    <div class="grid grid-cols-3 gap-1">
      <b-button @click="toggleDebugMode()">TOGGLE DEBUG MODE</b-button>
      <b-button variant="info" @click="createNoopTasks()">CREATE NOOP TASKS</b-button>
      <b-button variant="info" @click="createNoopNetworkTasks()"
        >CREATE NOOP NETWORK TASKS</b-button
      >
      <b-button variant="info" @click="resetState()">RESET STATE</b-button>
      <b-button variant="info" @click="resetAnnouncements()">RESET ANNOUNCEMENTS</b-button>
      <b-button variant="info" @click="throwError()">THROW ERROR</b-button>
      <b-button variant="info" @click="testToast()">TEST TOAST</b-button>
    </div>

    <div class="grid grid-cols-3 gap-1">
      <b-form-checkbox
        id="checkbox-toggleDebug"
        v-model="debugMode"
        name="checkbox-toggleDebug"
        @change="onChange()"
      >
        Debug mode
      </b-form-checkbox>

      <b-form-checkbox
        id="checkbox-toggleMuteAnalytics"
        v-model="muteAnalytics"
        name="checkbox-toggleMuteAnalytics"
        @change="onChange()"
      >
        Mute analytics
      </b-form-checkbox>

      <b-form-checkbox
        id="checkbox-demoMode"
        v-model="demoMode"
        name="checkbox-demoMode"
        @change="onChange()"
      >
        Demo mode
      </b-form-checkbox>

      <b-form-checkbox
        id="checkbox-mockDataMode"
        v-model="mockDataMode"
        name="checkbox-mockDataMode"
        @change="onChange()"
      >
        Mock data mode
      </b-form-checkbox>
    </div>

    <b-form-group label="Feature Flags">
      <div class="grid grid-cols-1 col-span-1 gap-1">
        <template v-for="(val, key) in flagsData.featureFlags">
          <b-form-checkbox
            :key="val.key"
            v-model="flagsData.featureFlags[key]"
            @input="onFlagsChange(flagsData)"
          >
            {{ key }}
          </b-form-checkbox>
        </template>
      </div>
    </b-form-group>

    <template v-if="mockDataMode">
      <b-form-group label="Mocked Flags">
        <div class="grid grid-cols-2 col-span-1 gap-1">
          <template v-for="(val, key) in flagsData.mockedFlags">
            <b-button-group :key="key">
              <b-button
                :variant="val.enabled ? 'success' : 'outline-secondary'"
                @click="onMockDropDownButtonClick(val, flagsData)"
              >
                {{ key }}
              </b-button>
              <b-dropdown
                :variant="val.enabled ? 'success' : 'outline-secondary'"
                :disabled="Object.keys(val.behavior).length === 0 || !val.enabled"
              >
                <b-dropdown-form>
                  <template v-for="(childVal, childKey) in val.behavior">
                    <b-form-group :key="childKey" :label="childKey">
                      <b-form-input
                        :key="childKey"
                        type="number"
                        min="0"
                        v-model="val.behavior[childKey]"
                        @input="onFlagsChange(flagsData)"
                      >
                      </b-form-input>
                    </b-form-group>
                  </template>
                </b-dropdown-form>
              </b-dropdown>
            </b-button-group>
          </template>
        </div>
      </b-form-group>

      <div class="grid grid-cols-6 gap-1">
        <b-button @click="resetFlags()"> RESET FLAG DATA </b-button>

        <b-button
          :variant="mockedFlagExists ? 'success' : 'outline-secondary'"
          @click="toggleMockedFlags(flagsData)"
        >
          TOGGLE MOCKED FLAGS
        </b-button>
      </div>
    </template>

    <b-form-group label="Tracked Interactions">
      <b-form-textarea
        rows="12"
        v-model="trackedInteractions"
        @input="onTrackedInteractionsChange($event)"
      ></b-form-textarea>
      <b-button @click="resetTrackedInteractions()">RESET TRACKED INTERACTIONS</b-button>
    </b-form-group>
  </div>
</template>

<script lang="ts">
import { ModalType } from '@/consts';
import { modalManager } from '@/modules/modal-manager.module';
import { toastManager } from '@/modules/toast-manager.module';
import { MutationType } from '@/mutation-types';
import store from '@/store/page-overlay/index';
import { AnnouncementsActions } from '@/store/page-overlay/modules/announcements/consts';
import { FlagsActions } from '@/store/page-overlay/modules/flags/consts';
import { IFlagsState } from '@/store/page-overlay/modules/flags/interfaces';
import { SettingsActions, SettingsMutations } from '@/store/page-overlay/modules/settings/consts';
import Vue from 'vue';
import { mapState } from 'vuex';

export default Vue.extend({
  name: 'DebugForm',
  store,
  data() {
    return {
      debugMode: store.state.debugMode,
      muteAnalytics: store.state.muteAnalytics,
      demoMode: store.state.demoMode,
      mockDataMode: store.state.mockDataMode,
      settings: JSON.parse(JSON.stringify(store.state.settings)),
      flagsData: store.state.flags,
      trackedInteractions: JSON.stringify(store.state.trackedInteractions, null, 2),
      count: 1,
    };
  },
  async mounted() {
    if (this.mockedFlagExists) {
      // swal.fire({
      //   icon: "warning",
      //   toast: true,
      //   title: "Flags are mocked",
      //   timer: 2000,
      //   position: "bottom-left",
      //   showConfirmButton: false,
      // });
    }
  },
  computed: {
    ...mapState(['flags']),
    mockedFlagExists(): boolean {
      return Object.values(this.$data.flagsData.mockedFlags).some((x: any) => x.enabled === true);
    },
  },
  watch: {
    flags: {
      immediate: true,
      handler(newValue, oldValue) {
        this.$data.flagsData = newValue;
      },
    },
  },
  methods: {
    async toggleDebugMode() {
      window.location.hash = '';
      store.commit(MutationType.SET_DEBUG_MODE, !store.state.debugMode);
    },
    async throwError() {
      throw new Error('Test error');
    },
    async testToast() {
      toastManager.openToast(`This is toast number ${this.count++}`, {
        title: 'T3',
        autoHideDelay: 5000,
        variant: 'primary',
        appendToast: true,
        toaster: 'ttt-toaster',
        solid: true,
      });
    },
    async resetState() {
      // store.commit(MutationType.RESET_STATE);
      store.dispatch(`settings/${SettingsActions.RESET_SETTINGS}`);
    },
    async resetFlags() {
      store.dispatch(`flags/${FlagsActions.RESET_FLAGS}`);

      toastManager.openToast('Flags reset', {
        title: 'T3',
        autoHideDelay: 5000,
        variant: 'success',
        appendToast: true,
        toaster: 'ttt-toaster',
        solid: true,
      });
    },
    async resetAnnouncements() {
      store.dispatch(`announcements/${AnnouncementsActions.RESET}`);

      toastManager.openToast('Announcements reset', {
        title: 'T3',
        autoHideDelay: 5000,
        variant: 'success',
        appendToast: true,
        toaster: 'ttt-toaster',
        solid: true,
      });
    },
    async toggleMockedFlags(updatedFlags: IFlagsState) {
      try {
        if (this.mockedFlagExists) {
          for (const [key, value] of Object.entries(updatedFlags.mockedFlags)) {
            value.enabled = false;
          }
        } else {
          for (const [key, value] of Object.entries(updatedFlags.mockedFlags)) {
            value.enabled = true;
          }
        }

        await this.onFlagsChange(updatedFlags);
      } catch (e) {
        console.error(e);
      }
    },
    async resetTrackedInteractions() {
      store.commit(MutationType.RESET_TRACKED_INTERACTIONS);
      this.trackedInteractions = JSON.stringify(store.state.trackedInteractions, null, 2);

      toastManager.openToast('Tracked interactions reset', {
        title: 'T3',
        autoHideDelay: 5000,
        variant: 'success',
        appendToast: true,
        toaster: 'ttt-toaster',
        solid: true,
      });
    },
    onChange() {
      store.dispatch(`settings/${SettingsActions.UPDATE_SETTINGS}`, this.settings);
      store.commit(MutationType.SET_DEBUG_MODE, this.debugMode);
      store.commit(MutationType.SET_DEMO_MODE, this.demoMode);
      store.commit(MutationType.SET_MOCK_DATA_MODE, this.mockDataMode);
      store.commit(MutationType.SET_MUTE_ANALYTICS, this.muteAnalytics);
    },
    async onFlagsChange(updatedFlags: IFlagsState) {
      try {
        store.dispatch(`flags/${FlagsActions.SET_FLAGS}`, updatedFlags);

        toastManager.openToast('Flags updated', {
          title: 'T3',
          autoHideDelay: 5000,
          variant: 'success',
          appendToast: true,
          toaster: 'ttt-toaster',
          solid: true,
        });
      } catch (e) {
        console.error(e);
      }
    },
    onMockDropDownButtonClick(e: any, flagsData: IFlagsState) {
      e.enabled = !e.enabled;
      this.onFlagsChange(flagsData);
    },
    onTrackedInteractionsChange(trackedInteractionsJSON: string) {
      try {
        store.commit(MutationType.UPDATE_TRACKED_INTERACTIONS, JSON.parse(trackedInteractionsJSON));

        toastManager.openToast('Tracked interactions updated', {
          title: 'T3',
          autoHideDelay: 5000,
          variant: 'success',
          appendToast: true,
          toaster: 'ttt-toaster',
          solid: true,
        });
      } catch (e) {
        console.error(e);
      }
    },
  },
});
</script>

<style type="text/scss" lang="scss">
.btn-group + .btn-group {
  margin-left: 0px !important;
}
</style>
