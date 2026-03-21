import { ref, computed } from 'vue';
import type { ClimateDataset, ClimateData } from '@/types/climate';

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

    // Temperature data
    const temperatureMaxData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].temperature.max);
    });

    const temperatureMinData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].temperature.min);
    });

    const temperatureAvgData = computed(() => {
        if (!data.value) return [];
        return labels.value.map(key => data.value!.data[key].temperature.avg);
    });

    // Indices data - new format: indices.ndvi.average
    const getIndexData = (_key: string, indexName: keyof ClimateData['indices']) => {
        if (!data.value) return [];
        return labels.value.map(k => data.value!.data[k].indices[indexName]?.average ?? 0);
    };

    const ndviData = computed(() => getIndexData('ndvi', 'ndvi'));
    const ndwiData = computed(() => getIndexData('ndwi', 'ndwi'));
    const ndreData = computed(() => getIndexData('ndre', 'ndre'));
    const reciData = computed(() => getIndexData('reci', 'reci'));
    const eviData = computed(() => getIndexData('evi', 'evi'));
    const infrarrojoData = computed(() => getIndexData('infrarrojo', 'infrarrojo'));

    const imagesByType = computed(() => {
        if (!data.value) return {};

        const types = ['ndvi', 'ndwi', 'ndre', 'reci', 'evi', 'infrarrojo'] as const;
        const result: Record<string, Array<{ date: string; month: number; year: number; img: string; type: string; }>> = {};

        for (const type of types) {
            const images: Array<{ date: string; month: number; year: number; img: string; type: string; }> = [];
            for (const key of labels.value) {
                const item = data.value!.data[key];
                const img = item.indices[type]?.img;

                if (img) {
                    images.push({
                        date: key,
                        month: item.month,
                        year: item.year,
                        img,
                        type
                    });
                }
            }
            images.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });
            result[type] = images;
        }

        return result;
    });

    const imagesByMonth = computed(() => {
        if (!data.value) return {};

        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const types = ['ndvi', 'ndwi', 'ndre', 'reci', 'evi', 'infrarrojo'] as const;
        const result: Record<string, Array<{ date: string; month: number; year: number; img: string; type: string; }>> = {};

        const allImages: Array<{ date: string; month: number; year: number; img: string; type: string; }> = [];

        for (const type of types) {
            for (const key of labels.value) {
                const item = data.value!.data[key];
                const img = item.indices[type]?.img;

                if (img) {
                    allImages.push({
                        date: key,
                        month: item.month,
                        year: item.year,
                        img,
                        type
                    });
                }
            }
        }

        allImages.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        for (const image of allImages) {
            const monthKey = `${months[image.month - 1]} ${image.year}`;
            if (!result[monthKey]) {
                result[monthKey] = [];
            }
            result[monthKey].push(image);
        }

        return result;
    });

    const maxPrecipitation = computed(() => {
        if (precipitationData.value.length === 0) return 100;
        return Math.max(...precipitationData.value) * 1.1;
    });

    const maxTemperature = computed(() => {
        if (temperatureMaxData.value.length === 0) return 50;
        return Math.max(...temperatureMaxData.value) * 1.1;
    });

    const minTemperature = computed(() => {
        if (temperatureMinData.value.length === 0) return 0;
        return Math.min(...temperatureMinData.value) * 0.9;
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
            const jsonData = await response.json();
            data.value = jsonData;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido';
            console.error('📊 [useClimateData] Error:', e);
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
        temperatureMaxData,
        temperatureMinData,
        temperatureAvgData,
        ndviData,
        ndwiData,
        ndreData,
        reciData,
        eviData,
        infrarrojoData,
        maxPrecipitation,
        maxTemperature,
        minTemperature,
        maxIndex,
        imagesByType,
        imagesByMonth,
        fetchClimateData
    };
}
