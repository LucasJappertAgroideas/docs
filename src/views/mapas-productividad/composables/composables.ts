import { ref, computed } from "vue";
import type { ProductivityMapData, SatelliteImagesByMonth } from "../types/types";

// Configuración de colores para tipos de imágenes
const IMAGE_TYPE_COLORS: Record<string, string> = {
    NDVI: "#3fb950",
    RECI: "#a371f7",
    NDWI: "#58a6ff",
    EVI: "#ffa657",
};

export function getImageTypeColor(type: string): string {
    return IMAGE_TYPE_COLORS[type.toUpperCase()] || "#58a6ff";
}

export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "Sin definir";
    
    // Si el formato es YYYY-MM-DD (ej: 2019-01-05)
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
}

export function imageMeetsThreshold(image: any, mapData: ProductivityMapData | null): boolean {
    if (!mapData) return true;
    const map = mapData.individual_maps[image.type];
    if (!map) return true;
    return image.average_index_value >= map.dynamic_threshold_used;
}

export const useProductivityMaps = () => {
    const mapData = ref<ProductivityMapData | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const loadMapDataAsync = async (filename: string) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await import(`../data/${filename}.json`);
            mapData.value = response.default as ProductivityMapData;
        } catch (err) {
            error.value = "Error al cargar los datos del mapa";
            console.error(err);
        } finally {
            loading.value = false;
        }
    };

    const indexTypes = computed(() => {
        if (!mapData.value) return [];
        return Object.keys(mapData.value.individual_maps);
    });

    const allMonths = computed(() => {
        if (!mapData.value) return [];
        const monthsSet = new Set<string>();
        Object.values(mapData.value.individual_maps).forEach((map) => {
            map.satellite_images.forEach((monthData) => {
                monthsSet.add(monthData.month);
            });
        });
        return Array.from(monthsSet).sort((a, b) => {
            const [monthA, yearA] = a.split("-").map(Number);
            const [monthB, yearB] = b.split("-").map(Number);
            if (yearA !== yearB) return yearA - yearB;
            return monthA - monthB;
        });
    });

    const getAverageIndexValueByMonth = (indexType: string, month: string): number => {
        if (!mapData.value) return 0;
        const map = mapData.value.individual_maps[indexType];
        if (!map) return 0;
        
        const monthData = map.satellite_images.find((m) => m.month === month);
        if (!monthData || monthData.images.length === 0) return 0;
        
        const sum = monthData.images.reduce((acc, img) => acc + img.average_index_value, 0);
        return sum / monthData.images.length;
    };

    const getThresholdForIndex = (indexType: string): number => {
        if (!mapData.value) return 0;
        const map = mapData.value.individual_maps[indexType];
        return map?.dynamic_threshold_used || 0;
    };

    const chartLabels = computed(() => allMonths.value);

    const chartDatasets = computed(() => {
        if (!mapData.value) return [];
        
        const colors: Record<string, string> = {
            RECI: "#FF6384",
            EVI: "#36A2EB",
            NDVI: "#4BC0C0",
        };

        const datasets: any[] = [];
        
        indexTypes.value.forEach((indexType) => {
            const threshold = getThresholdForIndex(indexType);
            const color = colors[indexType] || "#999999";

            // Línea recta de threshold
            datasets.push({
                label: `${indexType} - Threshold`,
                data: Array(allMonths.value.length).fill(threshold),
                borderColor: color,
                backgroundColor: `${color}20`,
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0,
                pointRadius: 0,
            });

            // Curva de average_index_value
            datasets.push({
                label: `${indexType} - Promedio`,
                data: allMonths.value.map((month) => getAverageIndexValueByMonth(indexType, month)),
                borderColor: color,
                backgroundColor: `${color}40`,
                borderWidth: 3,
                fill: false,
                tension: 0.3,
                pointRadius: 3,
            });
        });

        return datasets;
    });

    const satelliteImagesByType = computed(() => {
        if (!mapData.value) return {};
        const result: Record<string, SatelliteImagesByMonth[]> = {};
        
        indexTypes.value.forEach((indexType) => {
            const map = mapData.value!.individual_maps[indexType];
            if (map) {
                result[indexType] = map.satellite_images;
            }
        });
        
        return result;
    });

    const allSatelliteImages = computed(() => {
        if (!mapData.value) return [];
        const allImages: SatelliteImagesByMonth[] = [];

        indexTypes.value.forEach((indexType) => {
            const map = mapData.value!.individual_maps[indexType];
            if (map) {
                map.satellite_images.forEach((monthData) => {
                    monthData.images.forEach((img) => {
                        allImages.push({
                            month: monthData.month,
                            images: [img],
                        });
                    });
                });
            }
        });

        return allImages;
    });

    // Lista plana de todas las imágenes individuales ordenadas por fecha (ascendente)
    const allSatelliteImagesFlat = computed(() => {
        if (!mapData.value) return [];
        const flatImages: any[] = [];

        indexTypes.value.forEach((indexType) => {
            const map = mapData.value!.individual_maps[indexType];
            if (map) {
                map.satellite_images.forEach((monthData) => {
                    monthData.images.forEach((img) => {
                        flatImages.push({
                            type: img.type,
                            url: img.url,
                            date: img.date,
                            cloud_coverage: img.cloud_coverage,
                            average_index_value: img.average_index_value,
                        });
                    });
                });
            }
        });

        // Ordenar por fecha ascendente
        return flatImages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return {
        mapData,
        loading,
        error,
        loadMapDataAsync,
        indexTypes,
        chartLabels,
        chartDatasets,
        satelliteImagesByType,
        allSatelliteImages,
        allSatelliteImagesFlat,
        getThresholdForIndex,
    };
};
