import { ref, computed } from "vue";
import type { ProductivityMapData, SatelliteImagesByMonth, ClimateData } from "../types/types";

// Configuración de colores para tipos de imágenes
const IMAGE_TYPE_COLORS: Record<string, string> = {
    NDVI: "#3fb950",
    RECI: "#a371f7",
    NDWI: "#58a6ff",
    EVI: "#ffa657",
};

// Configuración de colores para series del gráfico
const CHART_COLORS: Record<string, string> = {
    RECI: "#FF6384",
    EVI: "#36A2EB",
    NDVI: "#19c80d",
    precipitation_mm: "#3498db21",
    precipitation_monthly_avg: "#0099ff",
    temperature_max_c: "#e74c3c",
    temperature_min_c: "#2ecc71",
    temperature_avg_c: "#f39c12",
};

export function getImageTypeColor(type: string): string {
    return IMAGE_TYPE_COLORS[type.toUpperCase()] || "#58a6ff";
}

export function getChartColor(key: string): string {
    return CHART_COLORS[key] || "#999999";
}

export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "Sin definir";
    
    // Si el formato es YYYY-MM-DD (ej: 2019-01-05), usar split directo para evitar problemas de zona horaria
    if (dateString.includes("-") && dateString.length === 10) {
        const parts = dateString.split("-");
        if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1];
            const day = parts[2];
            return `${day}-${month}-${year}`;
        }
    }
    
    // Para otros formatos, usar Date
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

export function imageUsedForMap(image: any): boolean {
    return image.is_used_for_map === true;
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

    const getClimateDataByMonth = (month: string): ClimateData | undefined => {
        if (!mapData.value) return undefined;
        // Buscar en cualquier mapa (todos tienen los mismos climate_data)
        const firstMap = Object.values(mapData.value.individual_maps)[0];
        if (!firstMap) return undefined;
        const monthData = firstMap.satellite_images.find(m => m.month === month);
        return monthData?.climate_data;
    };

    const getMonthlyRainfallAverage = (): number[] => {
        if (!mapData.value) return Array(12).fill(0);
        
        const firstMap = Object.values(mapData.value.individual_maps)[0];
        if (!firstMap) return Array(12).fill(0);
        
        // Arrays para acumular sumas y conteos por mes (índices 0-11 para meses 1-12)
        const monthlySums = Array(12).fill(0);
        const monthlyCounts = Array(12).fill(0);
        
        firstMap.satellite_images.forEach(monthData => {
            if (monthData.climate_data && monthData.climate_data.precipitation_mm !== undefined) {
                const monthParts = monthData.month.split("-");
                const monthNum = parseInt(monthParts[0], 10) - 1; // Convertir a índice 0-11
                
                if (monthNum >= 0 && monthNum < 12) {
                    monthlySums[monthNum] += monthData.climate_data.precipitation_mm;
                    monthlyCounts[monthNum]++;
                }
            }
        });
        
        // Calcular promedios
        return monthlySums.map((sum, index) => 
            monthlyCounts[index] > 0 ? sum / monthlyCounts[index] : 0
        );
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
            NDVI: "#0dbe00",
            precipitation_mm: "#3498db",
            temperature_max_c: "#e74c3c",
            temperature_min_c: "#2ecc71",
            temperature_avg_c: "#f39c12",
        };

        const datasets: any[] = [];
        
        indexTypes.value.forEach((indexType) => {
            const color = colors[indexType] || "#999999";
            const map = mapData.value!.individual_maps[indexType];

            // Obtener información de puntos usados para el mapa
            const usedForMapPoints = allMonths.value.map((month) => {
                const monthData = map?.satellite_images.find((m) => m.month === month);
                if (!monthData || monthData.images.length === 0) return false;
                return monthData.images.some(img => img.is_used_for_map === true);
            });

            // Línea dashed con puntos destacados
            datasets.push({
                label: `${indexType}`,
                data: allMonths.value.map((month) => getAverageIndexValueByMonth(indexType, month)),
                borderColor: color,
                backgroundColor: `${color}40`,
                borderWidth: 2,
                borderDash: [5, 5], // Línea dashed
                fill: false,
                tension: 0.1,
                pointRadius: allMonths.value.map((_, index) => usedForMapPoints[index] ? 8 : 4),
                pointHoverRadius: allMonths.value.map((_, index) => usedForMapPoints[index] ? 10 : 6),
                pointBackgroundColor: allMonths.value.map((_, index) => usedForMapPoints[index] ? color : `${color}80`),
                pointBorderColor: allMonths.value.map((_, index) => usedForMapPoints[index] ? '#ffffff' : color),
                pointBorderWidth: allMonths.value.map((_, index) => usedForMapPoints[index] ? 3 : 1),
                hidden: false, // Se controlará desde el componente
            });
        });

        // Series de datos climáticos (si existen)
        const climateSeries = [
            { key: 'precipitation_mm', label: 'Precipitación (mm)', color: colors.precipitation_mm },
            { key: 'temperature_max_c', label: 'Temperatura Máx (°C)', color: colors.temperature_max_c },
            { key: 'temperature_min_c', label: 'Temperatura Mín (°C)', color: colors.temperature_min_c },
            { key: 'temperature_avg_c', label: 'Temperatura Prom (°C)', color: colors.temperature_avg_c },
        ];

        climateSeries.forEach(({ key, label, color }) => {
            // Verificar si hay datos para esta serie
            const hasData = allMonths.value.some(month => {
                const climate = getClimateDataByMonth(month);
                return climate && climate[key] !== undefined && climate[key] !== null;
            });

            if (hasData) {
                datasets.push({
                    label,
                    data: allMonths.value.map(month => {
                        const climate = getClimateDataByMonth(month);
                        return climate && climate[key] !== undefined ? climate[key] : null;
                    }),
                    borderColor: color,
                    backgroundColor: `${color}40`,
                    borderWidth: 2,
                    borderDash: [3, 3], // Línea más corta para diferenciar
                    fill: false,
                    tension: 0.1,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: `${color}80`,
                    pointBorderColor: color,
                    pointBorderWidth: 1,
                    hidden: false,
                });
            }
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
                        // Usar threshold_min y threshold_max directamente del nuevo modelo
                        const thresholdMin = img.threshold_min !== undefined && img.threshold_min !== null ? img.threshold_min : null;
                        const thresholdMax = img.threshold_max !== undefined && img.threshold_max !== null ? img.threshold_max : null;
                        
                        flatImages.push({
                            type: img.type,
                            url: img.url,
                            date: img.date,
                            cloud_coverage: img.cloud_coverage,
                            average_index_value: img.average_index_value,
                            trend_direction: img.trend_direction,
                            is_peak: img.is_peak,
                            streak: img.streak,
                            is_used_for_map: img.is_used_for_map,
                            threshold_min: thresholdMin,
                            threshold_max: thresholdMax,
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
        getClimateDataByMonth,
        getMonthlyRainfallAverage,
        getImageTypeColor,
        getChartColor,
        formatDate,
        imageUsedForMap,
    };
};
