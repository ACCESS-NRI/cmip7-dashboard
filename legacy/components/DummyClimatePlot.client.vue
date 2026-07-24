<template>
  <section
    class="mx-auto mb-12 max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p
          class="text-xs font-semibold uppercase text-blue-700 dark:text-blue-400"
        >
          Prototype plot
        </p>
        <h2
          class="mt-1 text-base font-semibold text-gray-800 dark:text-gray-100"
        >
          CMIP7 readiness signal
        </h2>
      </div>
      <div
        class="rounded-lg bg-blue-50 px-3 py-2 text-right dark:bg-blue-950/40"
      >
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ sourceStatusLabel }}
        </p>
        <p class="text-sm font-semibold text-blue-700 dark:text-blue-400">
          {{ primaryLatest }} tas
        </p>
      </div>
    </div>

    <div class="relative min-h-72 dark:rounded-xl dark:bg-white dark:p-3">
      <Line
        v-if="sourceState !== 'error'"
        :data="chartData"
        :options="chartOptions"
      />
      <p
        v-else
        class="flex h-72 items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400"
      >
        Plot unavailable — the data source could not be loaded.
      </p>
    </div>

    <p class="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
      {{ sourceCopy }}
      {{ primaryDeltaCopy }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  type Chart,
  type ChartOptions,
  type Plugin,
  type TooltipItem,
} from "chart.js";
import { Line } from "vue-chartjs";
import { useDummyClimatePlot } from "../composables/useDummyClimatePlot";
import { buildCmip7PlotData, type PlotSeries } from "../services/cmip7PlotData";
import { getCmip7ParquetSource } from "../services/cmip7Source";
import { loadRemoteParquetDataSource } from "../services/dataSource";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface ZoomHandlers {
  wheel: (event: WheelEvent) => void;
  pointerDown: (event: PointerEvent) => void;
  pointerMove: (event: PointerEvent) => void;
  pointerUp: () => void;
  doubleClick: () => void;
}

interface ZoomState {
  canvas?: HTMLCanvasElement;
  originalX?: { min?: unknown; max?: unknown };
  originalY?: { min?: unknown; max?: unknown };
  panStart?: {
    x: number;
    y: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  handlers?: ZoomHandlers;
}

const zoomStates = new WeakMap<Chart, ZoomState>();

const axisZoomPlugin: Plugin<"line"> = {
  id: "axisZoom",
  afterInit(chart) {
    const state = getZoomState(chart);
    const canvas = chart.canvas;
    state.canvas = canvas;

    state.handlers = {
      wheel: (event) => handleWheelZoom(chart, event),
      pointerDown: (event) => handlePointerDown(chart, event),
      pointerMove: (event) => handlePointerMove(chart, event),
      pointerUp: () => handlePointerUp(chart),
      doubleClick: () => resetZoom(chart),
    };

    canvas.addEventListener("wheel", state.handlers.wheel, { passive: false });
    canvas.addEventListener("pointerdown", state.handlers.pointerDown);
    canvas.addEventListener("dblclick", state.handlers.doubleClick);
    window.addEventListener("pointermove", state.handlers.pointerMove);
    window.addEventListener("pointerup", state.handlers.pointerUp);
  },
  afterUpdate(chart) {
    const state = getZoomState(chart);
    state.originalX ??= {
      min: chart.options.scales?.x?.min,
      max: chart.options.scales?.x?.max,
    };
    state.originalY ??= {
      min: chart.options.scales?.y?.min,
      max: chart.options.scales?.y?.max,
    };
  },
  afterDestroy(chart) {
    const state = zoomStates.get(chart);
    if (!state?.handlers) return;

    // Chart.js nulls `chart.canvas` during destroy, so use the reference
    // captured in afterInit. The window listeners must always be removed —
    // otherwise they leak and fire on a destroyed chart after navigation.
    const canvas = state.canvas;
    if (canvas) {
      canvas.removeEventListener("wheel", state.handlers.wheel);
      canvas.removeEventListener("pointerdown", state.handlers.pointerDown);
      canvas.removeEventListener("dblclick", state.handlers.doubleClick);
    }
    window.removeEventListener("pointermove", state.handlers.pointerMove);
    window.removeEventListener("pointerup", state.handlers.pointerUp);
    zoomStates.delete(chart);
  },
};

ChartJS.register(axisZoomPlugin);

const cmip7Source = getCmip7ParquetSource();
const sourceState = ref<"loading" | "ready" | "error">("loading");
const sourceColumnCount = ref(0);
const selectedColumns = ref({ x: "", y: [] as string[] });
const plotSeries = ref<PlotSeries[]>([]);

onMounted(async () => {
  try {
    const result = await loadRemoteParquetDataSource({
      url: cmip7Source.url,
      fileName: cmip7Source.fileName,
      limit: 5000,
    });
    const plotData = buildCmip7PlotData(result.rows, result.schema);

    sourceColumnCount.value = result.schema.length;
    selectedColumns.value = {
      x: plotData.xColumn ?? "",
      y: plotData.yColumns,
    };
    plotSeries.value = plotData.series;
    sourceState.value = "ready";
  } catch (error) {
    console.warn("Unable to load CMIP7 parquet source", error);
    sourceState.value = "error";
  }
});

const plot = useDummyClimatePlot(plotSeries);

const primaryLatest = computed(() => {
  const value = plot.latestValues.value.at(0)?.value;
  return value === null || value === undefined ? "n/a" : value.toFixed(2);
});

const primaryDeltaCopy = computed(() => {
  const delta = plot.deltas.value.at(0)?.value;
  if (delta === null || delta === undefined) return "No change available yet.";

  const signedDelta = `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`;
  const label = plot.latestValues.value.at(0)?.label ?? "First series";
  return `${label} change: ${signedDelta} tas.`;
});

const sourceStatusLabel = computed(() => {
  if (sourceState.value === "ready") return "Parquet ready";
  if (sourceState.value === "error") return "Unavailable";
  return "Loading source";
});

const sourceCopy = computed(() => {
  if (sourceState.value === "ready") {
    const columnCopy =
      sourceColumnCount.value === 1
        ? "1 column"
        : `${sourceColumnCount.value} columns`;
    const lineCopy =
      selectedColumns.value.y.length === 1
        ? "1 line"
        : `${selectedColumns.value.y.length} lines`;
    const mappingCopy =
      selectedColumns.value.y.length > 0
        ? ` plotting ${lineCopy}${selectedColumns.value.x ? ` by ${selectedColumns.value.x}` : ""}.`
        : " but no numeric columns were found to plot.";
    return `Loaded ${columnCopy} from ${cmip7Source.source},${mappingCopy}`;
  }

  if (sourceState.value === "error") {
    return `${cmip7Source.source} could not be loaded in this browser session.`;
  }

  return `Checking ${cmip7Source.source}.`;
});

const chartData = computed(() => ({
  labels: plot.labels.value,
  datasets: plot.rawSeries.value.map((series) => ({
    label: series.label,
    data: series.values,
    borderColor: withOpacity(series.color, 0.72),
    borderWidth: 2,
    pointBackgroundColor: series.color,
    pointRadius: 0,
    pointHoverRadius: 4,
    tension: 0,
  })),
}));

function withOpacity(hexColor: string, opacity: number): string {
  const hex = hexColor.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function getZoomState(chart: Chart): ZoomState {
  const state = zoomStates.get(chart) ?? {};
  zoomStates.set(chart, state);
  return state;
}

function handleWheelZoom(chart: Chart, event: WheelEvent): void {
  if (!isInsideChartArea(chart, event)) return;

  event.preventDefault();

  const factor = event.deltaY < 0 ? 0.82 : 1.18;
  zoomCategoryScale(chart, event.offsetX, factor);
  zoomLinearScale(chart, event.offsetY, factor);
  chart.update("none");
}

function handlePointerDown(chart: Chart, event: PointerEvent): void {
  if (!isInsideChartArea(chart, event)) return;

  chart.canvas.setPointerCapture(event.pointerId);
  chart.canvas.style.cursor = "grabbing";
  getZoomState(chart).panStart = {
    x: event.offsetX,
    y: event.offsetY,
    ...getCategoryBounds(chart),
    ...getLinearBounds(chart),
  };
}

function handlePointerMove(chart: Chart, event: PointerEvent): void {
  const state = zoomStates.get(chart);
  if (!state?.panStart) return;

  const { left, right, top, bottom } = chart.chartArea;
  const xRange = state.panStart.xMax - state.panStart.xMin;
  const yRange = state.panStart.yMax - state.panStart.yMin;
  const xShift = Math.round(
    (-(event.offsetX - state.panStart.x) / (right - left)) * xRange,
  );
  const yShift = ((event.offsetY - state.panStart.y) / (bottom - top)) * yRange;

  setCategoryBounds(
    chart,
    state.panStart.xMin + xShift,
    state.panStart.xMax + xShift,
  );
  setLinearBounds(
    chart,
    state.panStart.yMin + yShift,
    state.panStart.yMax + yShift,
  );
  chart.update("none");
}

function handlePointerUp(chart: Chart): void {
  const state = zoomStates.get(chart);
  if (!state) return;
  state.panStart = undefined;
  if (chart.canvas) chart.canvas.style.cursor = "";
}

function resetZoom(chart: Chart): void {
  const state = getZoomState(chart);
  if (chart.options.scales?.x) {
    chart.options.scales.x.min = state.originalX?.min as never;
    chart.options.scales.x.max = state.originalX?.max as never;
  }
  if (chart.options.scales?.y) {
    chart.options.scales.y.min = state.originalY?.min as never;
    chart.options.scales.y.max = state.originalY?.max as never;
  }
  chart.update("none");
}

function isInsideChartArea(chart: Chart, event: MouseEvent): boolean {
  const { left, right, top, bottom } = chart.chartArea;
  return (
    event.offsetX >= left &&
    event.offsetX <= right &&
    event.offsetY >= top &&
    event.offsetY <= bottom
  );
}

function zoomCategoryScale(chart: Chart, pixelX: number, factor: number): void {
  const labels = chart.data.labels ?? [];
  if (labels.length < 2) return;

  const { left, right } = chart.chartArea;
  const { xMin, xMax } = getCategoryBounds(chart);
  const range = xMax - xMin;
  const anchor = xMin + ((pixelX - left) / (right - left)) * range;
  const nextRange = clamp(range * factor, 1, labels.length - 1);
  setCategoryBounds(
    chart,
    anchor - (anchor - xMin) * (nextRange / range),
    anchor + (xMax - anchor) * (nextRange / range),
  );
}

function zoomLinearScale(chart: Chart, pixelY: number, factor: number): void {
  const scale = chart.scales.y;
  if (!scale) return;

  const anchor = scale.getValueForPixel(pixelY);
  if (anchor === undefined) return;

  const { yMin, yMax } = getLinearBounds(chart);
  setLinearBounds(
    chart,
    anchor - (anchor - yMin) * factor,
    anchor + (yMax - anchor) * factor,
  );
}

function getCategoryBounds(chart: Chart): {
  xMin: number;
  xMax: number;
} {
  const labels = chart.data.labels ?? [];
  const scaleOptions = chart.options.scales?.x;
  return {
    xMin: typeof scaleOptions?.min === "number" ? scaleOptions.min : 0,
    xMax:
      typeof scaleOptions?.max === "number"
        ? scaleOptions.max
        : Math.max(0, labels.length - 1),
  };
}

function setCategoryBounds(chart: Chart, min: number, max: number): void {
  const labels = chart.data.labels ?? [];
  if (!chart.options.scales?.x || labels.length < 2) return;

  const range = clamp(max - min, 1, labels.length - 1);
  const nextMin = clamp(Math.round(min), 0, labels.length - 1 - range);
  chart.options.scales.x.min = nextMin;
  chart.options.scales.x.max = nextMin + range;
}

function getLinearBounds(chart: Chart): {
  yMin: number;
  yMax: number;
} {
  return {
    yMin:
      typeof chart.options.scales?.y?.min === "number"
        ? chart.options.scales.y.min
        : (chart.scales.y?.min ?? 0),
    yMax:
      typeof chart.options.scales?.y?.max === "number"
        ? chart.options.scales.y.max
        : (chart.scales.y?.max ?? 1),
  };
}

function setLinearBounds(chart: Chart, min: number, max: number): void {
  if (!chart.options.scales?.y) return;

  chart.options.scales.y.min = min;
  chart.options.scales.y.max = max;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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
            ? `${ctx.dataset.label ?? "Value"}: ${ctx.parsed.y.toFixed(2)} tas`
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
        text: "tas",
        color: "#4b5563",
      },
      ticks: { color: "#6b7280" },
    },
  },
}));
</script>
