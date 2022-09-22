
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue
}

declare module 'vue-intersection-observer';

// https://next.vuex.vuejs.org/guide/typescript-support.html#typing-store-property-in-vue-component
// TODO this fucks up the build, figure out why
// https://vuejs.org/v2/guide/typescript.html#Augmenting-Types-for-Use-with-Plugins
// declare module 'vue/types/vue' {
//   // 3. Declare augmentation for Vue
//   interface Vue {
//     $store: Store<IPluginState>
//   }
// }