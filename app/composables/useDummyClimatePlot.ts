import { computed, type Ref } from "vue";

export interface PlotPoint {
  label: string;
  value: number;
}

export interface PlotSeries {
  label: string;
  color: string;
  points: PlotPoint[];
}

export function useDummyClimatePlot(series: Ref<PlotSeries[]>) {
  const labels = computed(
    () => series.value.at(0)?.points.map((point) => point.label) ?? [],
  );

  const rawSeries = computed(() =>
    series.value.map((item) => ({
      label: item.label,
      color: item.color,
      values: item.points.map((point) => point.value),
    })),
  );

  const latestValues = computed(() =>
    rawSeries.value.map((item) => ({
      label: item.label,
      value: item.values.at(-1) ?? null,
    })),
  );

  const deltas = computed(() =>
    rawSeries.value.map((item) => {
      const firstValue = item.values.at(0);
      const latestValue = item.values.at(-1);

      return {
        label: item.label,
        value:
          firstValue === undefined || latestValue === undefined
            ? null
            : roundToOneDecimal(latestValue - firstValue),
      };
    }),
  );

  return {
    labels,
    rawSeries,
    latestValues,
    deltas,
  };
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
