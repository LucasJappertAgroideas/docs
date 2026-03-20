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

    const imagesByType = computed(() => {
        if (!data.value) return {};

        const types = ['ndvi', 'ndwi', 'ndre', 'reci', 'evi', 'infrarrojo'] as const;
        const result: Record<string, Array<{ date: string; month: number; year: number; img: string; type: string; }>> = {};

        for (const type of types) {
            const imgField = type === 'infrarrojo' ? 'infrarrojo_img' : `${type}_img`;
            const images: Array<{ date: string; month: number; year: number; img: string; type: string; }> = [];
            for (const key of labels.value) {
                const item = data.value!.data[key];
                const itemAny = item as unknown as Record<string, unknown>;
                const img = itemAny[imgField] as string | undefined;

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

        // First, collect all images with their types
        const allImages: Array<{ date: string; month: number; year: number; img: string; type: string; }> = [];

        for (const type of types) {
            const imgField = type === 'infrarrojo' ? 'infrarrojo_img' : `${type}_img`;
            for (const key of labels.value) {
                const item = data.value!.data[key];
                const itemAny = item as unknown as Record<string, unknown>;
                const img = itemAny[imgField] as string | undefined;

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

        // Sort by year and month
        allImages.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        // Group by month
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
        imagesByType,
        imagesByMonth,
        fetchClimateData
    };
}
