import { onMounted, ref, type Ref } from "vue";
import {
  loadPayuExperiments,
  type PayuExperiment,
} from "~/services/payuExperiments";

/**
 * usePayuExperiments — client-side loader for payu telemetry experiments.
 *
 * Registers an `onMounted` hook that fetches the experiments from the
 * `payuCmip7ApiUrl` runtime-config endpoint and exposes the reactive
 * loading/error/data triple every dashboard view renders from. Loading stays
 * client-side by design: the fetch runs in `onMounted`, not `useAsyncData`, so
 * it never moves to SSR.
 *
 * Used by: app/pages/index.vue, app/pages/embed/experiments.vue,
 * app/pages/embed/experiments-summary.vue
 */
export function usePayuExperiments(): {
  experiments: Ref<PayuExperiment[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
} {
  const config = useRuntimeConfig();

  const experiments = ref<PayuExperiment[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  onMounted(async () => {
    try {
      experiments.value = await loadPayuExperiments(
        config.public.payuCmip7ApiUrl as string,
      );
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to load experiments.";
    } finally {
      loading.value = false;
    }
  });

  return { experiments, loading, error };
}
