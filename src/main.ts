import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import "./style.css";
import App from "./App.vue";
import "@/composables/usePosthog";
import Aura from "@primeuix/themes/aura";

import PrimeVue from "primevue/config";
import "primeicons/primeicons.css";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";

import { OhVueIcon, addIcons } from "oh-vue-icons";
import {
  BiGithub,
  ViFileTypeTypescript,
  ViFileTypeVue,
} from "oh-vue-icons/icons";

addIcons(BiGithub, ViFileTypeTypescript, ViFileTypeVue);

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.component("v-icon", OhVueIcon);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'system',
    },
  },
});
app.use(ToastService);
app.directive("tooltip", Tooltip);

app.mount("#app");
