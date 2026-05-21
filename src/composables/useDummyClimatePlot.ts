import { computed, type Ref } from "vue";

export interface PlotPoint {
  label: string;
  value: number;
}

export function useDummyClimatePlot(points: Ref<PlotPoint[]>) {
  const labels = computed(() => points.value.map((point) => point.label));
  const values = computed(() => points.value.map((point) => point.value));

  const latestValue = computed(() => points.value.at(-1)?.value ?? null);
  const firstValue = computed(() => points.value.at(0)?.value ?? null);
  const delta = computed(() => {
    if (latestValue.value === null || firstValue.value === null) return null;
    return roundToOneDecimal(latestValue.value - firstValue.value);
  });

  return {
    labels,
    values,
    latestValue,
    delta,
  };
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
