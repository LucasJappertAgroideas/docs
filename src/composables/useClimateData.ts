import { ref, computed } from 'vue';
import type { ClimateDataset } from '@/types/climate';

export function useClimateData() {
    const data = ref<ClimateDataset | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const labels = computed(() => {
        if (!data.value) return [];
        return Object.keys(data.value.data);
    });

    const precipitationData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].precipitation);
    });

    const ndviData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].ndvi_average);
    });

    const ndwiData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].ndwi_average);
    });

    const ndreData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].ndre_average);
    });

    const reciData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].reci_average);
    });

    const eviData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].evi_average);
    });

    const infrarrojoData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].infrarrojo_average);
    });

    const maxPrecipitation = computed(() => {
        if (precipitationData.value.length === 0) return 100;
        return Math.max(...precipitationData.value) * 1.1;
    });

    const maxIndex = computed(() => {
        const allValues = [
            ...ndviData.value,
            ...ndwiData.value,
            ...ndreData.value,
            ...reciData.value,
            ...eviData.value,
            ...infrarrojoData.value
        ];
        if (allValues.length === 0) return 1;
        return Math.max(...allValues) * 1.1;
    });

    async function fetchClimateData(url: string): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }
            data.value = await response.json();
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido';
        } finally {
            loading.value = false;
        }
    }

    return {
        data,
        loading,
        error,
        labels,
        precipitationData,
        ndviData,
        ndwiData,
        ndreData,
        reciData,
        eviData,
        infrarrojoData,
        maxPrecipitation,
        maxIndex,
        fetchClimateData
    };
}
