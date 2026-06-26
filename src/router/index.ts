import { createRouter, createWebHashHistory } from "vue-router";
import { ref } from "vue";
import { usePosthog } from "@/composables/usePosthog";

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: () => import("../components/DashboardHome.vue"),
    meta: {
      title: "CMIP7 Dashboard",
    },
  },
  {
    path: "/embed/experiments",
    name: "ExperimentsEmbed",
    component: () => import("../components/ExperimentsEmbed.vue"),
    meta: {
      title: "CMIP7 Experiments",
      embed: true,
    },
  },
  {
    path: "/embed/experiments-summary",
    name: "ExperimentsSummaryEmbed",
    component: () => import("../components/ExperimentsSummaryEmbed.vue"),
    meta: {
      title: "CMIP7 Experiments Summary",
      embed: true,
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export const isNavigating = ref(false);
const { capture } = usePosthog();

router.beforeEach((to, _from, next) => {
  isNavigating.value = true;
  if (to.meta?.title) {
    document.title = to.meta.title as string;
  }
  next();
});

router.afterEach((to) => {
  capture("$pageview", { path: to.fullPath, name: to.name });
  setTimeout(() => {
    isNavigating.value = false;
  }, 100);
});

export default router;
