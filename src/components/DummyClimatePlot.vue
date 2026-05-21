<template>
  <section
    class="mx-auto mb-12 max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
  >
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase text-blue-700">
          Prototype plot
        </p>
        <h2 class="mt-1 text-base font-semibold text-gray-800">
          CMIP7 readiness signal
        </h2>
      </div>
      <div class="rounded-lg bg-blue-50 px-3 py-2 text-right">
        <p class="text-xs text-gray-500">Latest</p>
        <p class="text-sm font-semibold text-blue-700">
          {{ plot.latestValue.value?.toFixed(1) }} index
        </p>
      </div>
    </div>

    <div class="relative min-h-72">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <p class="mt-4 text-xs leading-relaxed text-gray-500">
      Dummy values are standing in for a future parquet-backed data source.
      Current change: {{ signedDelta }} index points.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Line } from "vue-chartjs";
import {
  useDummyClimatePlot,
  type PlotPoint,
} from "@/composables/useDummyClimatePlot";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

// Replace this stub with rows from loadParquetDataSource/useParquetDataSource once the real CMIP7 source shape is fixed.
const dummySeries = ref<PlotPoint[]>([
  { label: "2027", value: 41.2 },
  { label: "2028", value: 43.1 },
  { label: "2029", value: 42.6 },
  { label: "2030", value: 45.3 },
  { label: "2031", value: 46.7 },
  { label: "2032", value: 48.4 },
  { label: "2033", value: 50.1 },
  { label: "2034", value: 51.8 },
]);

const plot = useDummyClimatePlot(dummySeries);

const signedDelta = computed(() => {
  if (plot.delta.value === null) return "n/a";
  return `${plot.delta.value >= 0 ? "+" : ""}${plot.delta.value.toFixed(1)}`;
});

const chartData = computed(() => ({
  labels: plot.labels.value,
  datasets: [
    {
      label: "Raw value",
      data: plot.values.value,
      borderColor: "#2563eb",
      borderWidth: 2,
      pointBackgroundColor: "#2563eb",
      pointRadius: 3,
      tension: 0,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      position: "top",
      labels: {
        boxWidth: 12,
        color: "#374151",
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: TooltipItem<"line">) =>
          ctx.parsed.y !== null
            ? `${ctx.dataset.label ?? "Value"}: ${ctx.parsed.y.toFixed(1)}`
            : "",
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#6b7280" },
    },
    y: {
      title: {
        display: true,
        text: "Dummy index",
        color: "#4b5563",
      },
      ticks: { color: "#6b7280" },
    },
  },
}));
</script>
