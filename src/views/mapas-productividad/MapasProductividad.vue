<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, type ChartOptions, type ChartData } from "chart.js";
import { Line } from "vue-chartjs";
import { useProductivityMaps } from "./composables/composables";
import type { FieldOption } from "./types/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const route = useRoute();
const router = useRouter();

const { mapData, loading, error, loadMapDataAsync, indexTypes, chartLabels, allSatelliteImagesFlat, getClimateDataByMonth, getMonthlyRainfallAverage, getImageTypeColor, getChartColor, formatDate, imageUsedForMap } = useProductivityMaps();

// Lista de campos disponibles
const fieldOptions: FieldOption[] = [
    { id: "283", name: "283 - Don Avelino El Lucero LOTE 46 N", filename: "283-Don_Avelino_El_Lucero_LOTE_46_N" },
    { id: "286", name: "286 - Forlin - Lote 4", filename: "286-forlin-lote-4" },
    { id: "288", name: "288 - La Querencia - Lote 2", filename: "288-la-querencia-lote-2" },
    { id: "289", name: "289 - Querencia - Lote 20", filename: "289-querencia-lote-20" },
    { id: "291", name: "291 - H Y M Lomas Lote 2", filename: "291-H_Y_M_Lomas_Lote_2" },
    { id: "292", name: "292 - La Querencia SRL Munge 1", filename: "292-La_Querencia_Munge_1" },
    { id: "293", name: "293 - La Querencia Elmer 8", filename: "293-La_Querencia_Elmer_8" },
    { id: "296", name: "296 - Los Claros - Lote 17", filename: "296-los-claros-lote-17" },
    { id: "298", name: "298 - Villa Minetti La Feria", filename: "298-Villa-Minetti-La-Feria" },
    { id: "299", name: "299 - La Querencia SRL Daghero L1", filename: "299-La_Querencia_SRL_Daghero_L1" },
    { id: "301", name: "301 - La Querencia SRL Munge 2", filename: "301-La_Querencia_SRL_Munge_2" },
    { id: "302", name: "302 - La Querencia SRL Lote 3", filename: "302-La_Querencia_SRL_Lote_3" },
    { id: "303", name: "303 - La Querencia SRL Lote 9", filename: "303-La_Querencia_SRL_Lote_9" },
    { id: "304", name: "304 - La Querencia SRL LQ L 17", filename: "304-La_Querencia_SRL_LQ_L_17" },
    { id: "305", name: "305 - La Querencia SRL ISOGLIO 1", filename: "305-La_Querencia_SRL_ISOGLIO_1" },
    { id: "306", name: "306 - La Querencia SRL Petronila 1", filename: "306-La_Querencia_SRL_Petronila_1" },
    { id: "307", name: "307 - La Querencia SRL RACCA L7", filename: "307-La_Querencia_SRL_RACCA_L7" },
];

// Obtener el campo seleccionado desde la URL o usar el primero por defecto
const getFieldFromQuery = (): FieldOption => {
    const fieldId = (route.query.field_id as string) || fieldOptions[0].id;
    const field = fieldOptions.find(f => f.id === fieldId);
    return field || fieldOptions[0];
};

const selectedField = ref<FieldOption>(getFieldFromQuery());
const selectedImageFilter = ref<string>("all");
const filterByUsedForMap = ref<boolean>(true);

// Control de datasets visibles (todos visibles por defecto)
const hiddenDatasets = ref<Set<number>>(new Set());

// Ocultar por defecto las series de temperaturas y promedio mensual de lluvia
const hideTemperatureSeriesByDefault = () => {
    const temperatureKeys = ["temperature_max_c", "temperature_min_c", "temperature_avg_c"];
    const climateSeriesConfig = [
        { key: "precipitation_mm", label: "Precipitación (mm)", color: "#3498db" },
        { key: "temperature_max_c", label: "Temperatura Máx (°C)", color: "#e74c3c" },
        { key: "temperature_min_c", label: "Temperatura Mín (°C)", color: "#2ecc71" },
        { key: "temperature_avg_c", label: "Temperatura Prom (°C)", color: "#f39c12" },
    ];

    let datasetIndex = 0;
    // Primero contar los índices (NDVI, RECI, EVI)
    if (mapData.value) {
        datasetIndex = Object.keys(mapData.value.individual_maps).length;
    }

    // Ocultar las series de temperatura
    climateSeriesConfig.forEach(({ key }) => {
        if (temperatureKeys.includes(key)) {
            hiddenDatasets.value.add(datasetIndex);
        }
        datasetIndex++;
    });

    // Ocultar la serie de promedio mensual de lluvia
    const hasClimateData = chartLabels.value.some(month => {
        const climate = getClimateDataByMonth(month);
        return climate && climate.precipitation_mm !== undefined;
    });
    if (hasClimateData) {
        hiddenDatasets.value.add(datasetIndex);
    }
};

// Lista de series climáticas disponibles
const climateSeriesList = computed((): Array<{ key: string; label: string; color: string }> => {
    if (!mapData.value) return [];
    const firstMap = Object.values(mapData.value.individual_maps)[0];
    if (!firstMap) return [];

    const series: Array<{ key: string; label: string; color: string }> = [];
    const climateConfig = [
        { key: "precipitation_mm", label: "Precipitación (mm)", color: "#3498db" },
        { key: "temperature_max_c", label: "Temperatura Máx (°C)", color: "#e74c3c" },
        { key: "temperature_min_c", label: "Temperatura Mín (°C)", color: "#2ecc71" },
        { key: "temperature_avg_c", label: "Temperatura Prom (°C)", color: "#f39c12" },
    ];

    climateConfig.forEach(({ key, label, color }) => {
        const hasData = chartLabels.value.some(month => {
            const climate = getClimateDataByMonth(month);
            return climate && climate[key] !== undefined && climate[key] !== null;
        });
        if (hasData) {
            series.push({ key, label, color });
        }
    });

    return series;
});

// Chart datasets con control de visibilidad
const chartDatasets = computed<any[]>(() => {
    if (!mapData.value) return [];

    const datasets: ChartData<"line">["datasets"] = [];
    let datasetIndex = 0;

    // Series de índices (NDVI, RECI, EVI)
    indexTypes.value.forEach(indexType => {
        const color = getChartColor(indexType);
        const map = mapData.value!.individual_maps[indexType];

        // Obtener información de puntos usados para el mapa
        const usedForMapPoints = chartLabels.value.map<boolean>(month => {
            const monthData = map?.satellite_images.find(m => m.month === month);
            if (!monthData || monthData.images.length === 0) return false;
            return monthData.images.some(img => img.is_used_for_map === true);
        });

        // Función para obtener valor promedio por mes
        const getAverageIndexValueByMonth = (indexType: string, month: string): number => {
            if (!mapData.value) return 0;
            const map = mapData.value.individual_maps[indexType];
            if (!map) return 0;

            const monthData = map.satellite_images.find(m => m.month === month);
            if (!monthData || monthData.images.length === 0) return 0;

            const sum = monthData.images.reduce((acc, img) => acc + img.average_index_value, 0);
            return sum / monthData.images.length;
        };

        // Línea continua fina con puntos destacados
        datasets.push({
            label: `${indexType}`,
            data: chartLabels.value.map(month => getAverageIndexValueByMonth(indexType, month)),
            borderColor: color,
            backgroundColor: `${color}40`,
            borderWidth: 1, // Línea fina
            fill: false,
            tension: 0.1,
            pointRadius: usedForMapPoints.map(used => (used ? 4 : 2)),
            pointHoverRadius: usedForMapPoints.map(used => (used ? 4 : 2)),
            pointBackgroundColor: usedForMapPoints.map(used => (used ? color : `${color}80`)),
            pointBorderColor: usedForMapPoints.map(used => (used ? "#ffffff" : color)),
            pointBorderWidth: usedForMapPoints.map(used => (used ? 1 : 1)),
            hidden: hiddenDatasets.value.has(datasetIndex),
        });
        datasetIndex++;
    });

    // Series climáticas (si existen datos)
    const climateSeriesConfig = [
        { key: "precipitation_mm", label: "Precipitación (mm)", color: getChartColor("precipitation_mm") },
        { key: "temperature_max_c", label: "Temperatura Máx (°C)", color: getChartColor("temperature_max_c") },
        { key: "temperature_min_c", label: "Temperatura Mín (°C)", color: getChartColor("temperature_min_c") },
        { key: "temperature_avg_c", label: "Temperatura Prom (°C)", color: getChartColor("temperature_avg_c") },
    ];

    climateSeriesConfig.forEach(({ key, label, color }) => {
        // Verificar si hay datos para esta serie
        const hasData = chartLabels.value.some(month => {
            const climate = getClimateDataByMonth(month);
            return climate && climate[key] !== undefined && climate[key] !== null;
        });

        if (hasData) {
            const isPrecipitation = key === "precipitation_mm";
            const isTemperature = key.includes("temperature");

            datasets.push({
                label,
                data: chartLabels.value.map(month => {
                    const climate = getClimateDataByMonth(month);
                    return climate && climate[key] !== undefined ? climate[key] : null;
                }),
                type: (isPrecipitation ? "bar" : "line") as any,
                borderColor: color,
                backgroundColor: isPrecipitation ? `${color}60` : `${color}40`,
                borderWidth: isPrecipitation ? 1 : 1.5,
                borderDash: isPrecipitation ? [] : [5, 5],
                fill: false,
                tension: 0.1,
                pointRadius: isPrecipitation ? 0 : 4,
                pointHoverRadius: isPrecipitation ? 0 : 6,
                pointBackgroundColor: isPrecipitation ? "transparent" : `${color}80`,
                pointBorderColor: isPrecipitation ? "transparent" : color,
                pointBorderWidth: isPrecipitation ? 0 : 1,
                hidden: hiddenDatasets.value.has(datasetIndex),
                yAxisID: isTemperature ? "temperature" : "climate",
            });
            datasetIndex++;
        }
    });

    // Serie de promedio mensual de lluvia
    const monthlyRainfallAvg = getMonthlyRainfallAverage();
    const hasClimateData = chartLabels.value.some(month => {
        const climate = getClimateDataByMonth(month);
        return climate && climate.precipitation_mm !== undefined;
    });

    if (hasClimateData) {
        const monthlyAvgColor = getChartColor("precipitation_monthly_avg");
        datasets.push({
            label: "Promedio Mensual Lluvia (mm)",
            data: chartLabels.value.map(month => {
                const monthParts = month.split("-");
                const monthNum = parseInt(monthParts[0], 10) - 1;
                return monthlyRainfallAvg[monthNum] || 0;
            }),
            type: "line" as any,
            borderColor: monthlyAvgColor,
            backgroundColor: `${monthlyAvgColor}40`,
            borderWidth: 1,
            borderDash: [],
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointBackgroundColor: `${monthlyAvgColor}80`,
            pointBorderColor: monthlyAvgColor,
            pointBorderWidth: 1,
            hidden: hiddenDatasets.value.has(datasetIndex),
            yAxisID: "climate",
        });
        datasetIndex++;
    }

    return datasets;
});

// Listeners para controles de datasets
const toggleDataset = (index: number) => {
    const newHiddenDatasets = new Set(hiddenDatasets.value);
    if (newHiddenDatasets.has(index)) {
        newHiddenDatasets.delete(index);
    } else {
        newHiddenDatasets.add(index);
    }
    hiddenDatasets.value = newHiddenDatasets;
};

const getButtonClass = (index: number): string => {
    return hiddenDatasets.value.has(index) ? "toggle-btn" : "toggle-btn active";
};

const getDatasetColor = (datasetIndex: number): string => {
    if (!mapData.value) return "#999999";
    const allIndexTypes = indexTypes.value;

    if (datasetIndex < allIndexTypes.length) {
        return getChartColor(allIndexTypes[datasetIndex]);
    } else {
        const climateIndex = datasetIndex - allIndexTypes.length;
        // Si es el índice de la serie de promedio mensual (última serie)
        if (climateIndex === climateSeriesList.value.length) {
            return getChartColor("precipitation_monthly_avg");
        }
        return climateSeriesList.value[climateIndex]?.color || "#999999";
    }
};

const chartOptions = computed<ChartOptions<"line">>(() => {
    // Calcular valores mínimos y máximos globales para el eje Y (índices)
    const globalIndexMin = computed<number>(() => {
        if (!mapData.value) return 0;
        let min = Infinity;
        indexTypes.value.forEach(indexType => {
            const map = mapData.value!.individual_maps[indexType];
            if (map) {
                map.satellite_images.forEach(monthData => {
                    monthData.images.forEach(img => {
                        if (img.average_index_value < min) {
                            min = img.average_index_value;
                        }
                    });
                });
            }
        });
        return min === Infinity ? 0 : min;
    });

    const globalIndexMax = computed<number>(() => {
        if (!mapData.value) return 5;
        let max = -Infinity;
        indexTypes.value.forEach(indexType => {
            const map = mapData.value!.individual_maps[indexType];
            if (map) {
                map.satellite_images.forEach(monthData => {
                    monthData.images.forEach(img => {
                        if (img.average_index_value > max) {
                            max = img.average_index_value;
                        }
                    });
                });
            }
        });
        return max === -Infinity ? 5 : max;
    });

    // Calcular valores mínimos y máximos para precipitación
    const globalPrecipitationMin = computed<number>(() => {
        if (!mapData.value) return 0;
        let min = Infinity;
        const firstMap = Object.values(mapData.value.individual_maps)[0];
        if (!firstMap) return 0;

        firstMap.satellite_images.forEach(monthData => {
            if (monthData.climate_data) {
                const value = monthData.climate_data.precipitation_mm;
                if (value !== undefined && value < min) {
                    min = value;
                }
            }
        });
        return min === Infinity ? 0 : min;
    });

    const globalPrecipitationMax = computed<number>(() => {
        if (!mapData.value) return 100;
        let max = -Infinity;
        const firstMap = Object.values(mapData.value.individual_maps)[0];
        if (!firstMap) return 100;

        firstMap.satellite_images.forEach(monthData => {
            if (monthData.climate_data) {
                const value = monthData.climate_data.precipitation_mm;
                if (value !== undefined && value > max) {
                    max = value;
                }
            }
        });
        return max === -Infinity ? 100 : max;
    });

    // Calcular valores mínimos y máximos para temperaturas
    const globalTemperatureMin = computed<number>(() => {
        if (!mapData.value) return 0;
        let min = Infinity;
        const temperatureKeys = ["temperature_max_c", "temperature_min_c", "temperature_avg_c"];
        const firstMap = Object.values(mapData.value.individual_maps)[0];
        if (!firstMap) return 0;

        firstMap.satellite_images.forEach(monthData => {
            if (monthData.climate_data) {
                temperatureKeys.forEach(key => {
                    const value = (monthData.climate_data as any)[key];
                    if (value !== undefined && value < min) {
                        min = value;
                    }
                });
            }
        });
        return min === Infinity ? 0 : min;
    });

    const globalTemperatureMax = computed<number>(() => {
        if (!mapData.value) return 50;
        let max = -Infinity;
        const temperatureKeys = ["temperature_max_c", "temperature_min_c", "temperature_avg_c"];
        const firstMap = Object.values(mapData.value.individual_maps)[0];
        if (!firstMap) return 50;

        firstMap.satellite_images.forEach(monthData => {
            if (monthData.climate_data) {
                temperatureKeys.forEach(key => {
                    const value = (monthData.climate_data as any)[key];
                    if (value !== undefined && value > max) {
                        max = value;
                    }
                });
            }
        });
        return max === -Infinity ? 50 : max;
    });

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false,
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: "index",
                intersect: false,
            },
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: "Mes",
                },
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: "Valor del Índice",
                },
                min: Math.floor(globalIndexMin.value * 0.9),
                max: Math.ceil(globalIndexMax.value * 1.1),
                ticks: {
                    precision: 2,
                },
            },
            climate: {
                type: "linear",
                display: true,
                position: "right",
                title: {
                    display: true,
                    text: "Precipitación (mm)",
                },
                min: Math.floor(globalPrecipitationMin.value * 0.9),
                max: Math.ceil(globalPrecipitationMax.value * 1.1),
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    precision: 1,
                },
                offset: true,
            },
            temperature: {
                type: "linear",
                display: true,
                position: "right",
                title: {
                    display: true,
                    text: "Temperatura (°C)",
                },
                min: Math.floor(globalTemperatureMin.value * 0.9),
                max: Math.ceil(globalTemperatureMax.value * 1.1),
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    precision: 1,
                },
                offset: true,
            },
        },
    };
});

const filteredSatelliteImages = computed(() => {
    let filtered = allSatelliteImagesFlat.value;

    // Filtrar por tipo
    if (selectedImageFilter.value !== "all") {
        filtered = filtered.filter(img => img.type === selectedImageFilter.value);
    }

    // Filtrar por imágenes usadas para el mapa si el checkbox está marcado
    if (filterByUsedForMap.value) {
        filtered = filtered.filter(img => imageUsedForMap(img));
    }

    return filtered;
});

const onFieldChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const fieldId = target.value;
    const field = fieldOptions.find(f => f.id === fieldId);
    if (field) {
        selectedField.value = field;
        loadMapDataAsync(field.filename);
    }
};

// Watcher para actualizar la URL cuando cambia el campo seleccionado
watch(selectedField, newField => {
    router.push({
        query: { ...route.query, field_id: newField.id },
    });
});

// Watcher para ocultar series de temperatura cuando se cargan los datos
watch(mapData, () => {
    if (mapData.value) {
        hideTemperatureSeriesByDefault();
    }
});

onMounted(() => {
    loadMapDataAsync(selectedField.value.filename);
});
</script>

<template>
    <div class="mapas-productividad-container">
        <div class="loading" v-if="loading">
            <p>Cargando datos...</p>
        </div>
        <div v-else-if="error">
            <p class="error">{{ error }}</p>
        </div>
        <div v-else-if="mapData">
            <!-- Encabezado -->
            <div class="header">
                <div class="header-top">
                    <h1>Mapas de Productividad - Lote {{ selectedField.id }}</h1>
                    <div class="field-selector">
                        <label for="field-select">Campo:</label>
                        <select id="field-select" :value="selectedField.id" @change="onFieldChange">
                            <option v-for="field in fieldOptions" :key="field.id" :value="field.id">{{ field.name }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Sección de mapas -->
            <section class="maps-section">
                <div class="maps-grid">
                    <div v-for="(map, indexType) in mapData.individual_maps" :key="indexType" class="map-card">
                        <h3>{{ indexType }}</h3>
                        <img :src="map.map_image_url" :alt="`Mapa ${indexType}`" class="map-image" />
                        <div class="map-info">
                            <p>
                                <strong>Área total:</strong>
                                {{ map.total_area_hectares }} ha
                            </p>
                            <p>
                                <strong>Imágenes procesadas:</strong>
                                {{ map.processed_images_count }}
                            </p>
                        </div>
                    </div>
                    <div v-if="mapData.combined_map" class="map-card">
                        <h3>Mapa Combinado</h3>
                        <img :src="mapData.combined_map.map_image_url" alt="Mapa Combinado" class="map-image" />
                        <div class="map-info">
                            <p>
                                <strong>Área total:</strong>
                                {{ mapData.combined_map.total_area_hectares }} ha
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Sección de gráfico -->
            <section class="chart-section">
                <div class="chart-header">
                    <h2>Evolución de Índices y Clima</h2>
                    <div class="legend-info">
                        <button v-for="(indexType, index) in indexTypes" :key="indexType" :class="getButtonClass(index)" @click="toggleDataset(index)" :style="{ borderLeft: '4px solid ' + getDatasetColor(index) }">
                            {{ indexType }}
                        </button>
                        <button v-for="(series, idx) in climateSeriesList" :key="series.label" :class="getButtonClass(indexTypes.length + idx)" @click="toggleDataset(indexTypes.length + idx)" :style="{ borderLeft: '4px solid ' + series.color }">
                            {{ series.label }}
                        </button>
                        <button v-if="chartLabels.some(month => getClimateDataByMonth(month)?.precipitation_mm !== undefined)" :class="getButtonClass(indexTypes.length + climateSeriesList.length)" @click="toggleDataset(indexTypes.length + climateSeriesList.length)" :style="{ borderLeft: '4px solid #00d4ff' }">Promedio Mensual Lluvia (mm)</button>
                    </div>
                </div>
                <div class="chart-container">
                    <Line :data="{ labels: chartLabels, datasets: chartDatasets }" :options="chartOptions" />
                </div>
            </section>

            <!-- Sección de imágenes satelitales -->
            <section class="satellite-section">
                <div class="images-header">
                    <h2 class="images-title">Imágenes Satelitales</h2>
                    <div class="images-header-actions">
                        <div class="image-filter">
                            <label for="image-filter">Filtrar por tipo:</label>
                            <select id="image-filter" v-model="selectedImageFilter">
                                <option value="all">Todos</option>
                                <option v-for="type in indexTypes" :key="type" :value="type">{{ type }}</option>
                            </select>
                        </div>
                        <div class="used-for-map-filter">
                            <label for="used-for-map-filter">
                                <input type="checkbox" id="used-for-map-filter" v-model="filterByUsedForMap" />
                                Usadas para mapa
                            </label>
                        </div>
                    </div>
                </div>
                <div class="image-gallery">
                    <div v-for="img in filteredSatelliteImages" :key="img.date + img.type" class="image-card" :class="{ 'used-for-map-card': img.is_used_for_map }">
                        <div class="image-container">
                            <img :src="img.url" :alt="img.type + ' - ' + img.date" class="index-image" />
                        </div>
                        <div class="image-info">
                            <span class="image-type-badge" :style="{ backgroundColor: getImageTypeColor(img.type) + '20', color: getImageTypeColor(img.type), borderColor: getImageTypeColor(img.type) }">{{ img.type }}</span>
                            <span class="image-date">{{ formatDate(img.date) }}</span>
                            <span class="image-value">Índice: {{ img.average_index_value.toFixed(3) }}</span>
                            <span v-if="(img.threshold_min !== null && img.threshold_min !== undefined) || (img.threshold_max !== null && img.threshold_max !== undefined)" class="image-threshold">
                                Threshold:
                                <span v-if="img.threshold_min !== null && img.threshold_min !== undefined">{{ img.threshold_min.toFixed(2) }}</span>
                                <span v-if="img.threshold_min !== null && img.threshold_min !== undefined && img.threshold_max !== null && img.threshold_max !== undefined">-</span>
                                <span v-if="img.threshold_max !== null && img.threshold_max !== undefined">{{ img.threshold_max.toFixed(2) }}</span>
                            </span>
                            <span class="image-cloud" :class="{ 'has-clouds': img.cloud_coverage > 0 }">Nubes: {{ (img.cloud_coverage / 100).toFixed(1) }}%</span>
                            <div class="image-trend-info">
                                <span v-if="img.trend_direction" class="trend-direction" :class="`trend-${img.trend_direction}`">
                                    {{ img.trend_direction === "up" ? "↗" : img.trend_direction === "down" ? "↘" : "→" }}
                                </span>
                                <span v-if="img.is_peak" class="peak-indicator" title="Pico">⛰</span>
                                <span v-if="img.streak !== undefined && img.streak !== 0" class="streak" :class="{ 'streak-positive': img.streak > 0, 'streak-negative': img.streak < 0 }">{{ img.streak > 0 ? "+" : "" }}{{ img.streak }}</span>
                                <span v-if="img.is_used_for_map" class="used-for-map" title="Usada para mapa">✓</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.mapas-productividad-container {
    max-width: 1800px;
    margin: 0 auto;
    padding: 20px;
}

.loading {
    text-align: center;
    padding: 4rem;
    color: #8b949e;
}

.error {
    text-align: center;
    padding: 4rem;
    color: #f85149;
}

.header {
    margin-bottom: 2rem;
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.header h1 {
    margin: 0;
    color: #e6edf3;
}

.field-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.field-selector label {
    color: #8b949e;
}

.field-selector select {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #30363d;
    background-color: #0d1117;
    color: #e6edf3;
    cursor: pointer;
}

.maps-section,
.chart-section,
.satellite-section {
    margin-bottom: 8px;
}

.maps-section h2,
.chart-section h2,
.satellite-section h2 {
    margin-bottom: 8px;
    color: #e6edf3;
}

.maps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    /* max-height: 300px; */
    gap: 8px;
}

.map-card {
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 10px;
    max-width: 300px;
    max-height: 350px;
    align-items: center;
    justify-content: center;
    display: inline-grid;
    text-align: center;
}

.map-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #e6edf3;
}

.map-image {
    max-width: 100%;
    height: auto;
    max-height: 200px;
    object-fit: contain;
    border-radius: 6px;
    margin-bottom: 1rem;
}

.map-info p {
    margin: 0.5rem 0;
    color: #8b949e;
}

.chart-container {
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 8px;
    height: 400px;
    width: 100%;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0px;
    flex-wrap: wrap;
}

.chart-header h2 {
    color: #e6edf3;
    margin: 0;
}

.legend-info {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
}

.toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #8b949e;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.6;
}

.toggle-btn.active {
    color: #e6edf3;
    opacity: 1;
    background: #161b22;
    border-color: #58a6ff;
}

.toggle-btn:hover {
    opacity: 1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.filter-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 8px;
}

.filter-controls label {
    color: #8b949e;
}

.filter-controls select {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #30363d;
    background-color: #0d1117;
    color: #e6edf3;
    cursor: pointer;
}

/* Estilos para sección de imágenes satelitales */
.satellite-section {
    margin-top: 8px;
    padding: 8px;
    background: #0d1117;
    border-radius: 8px;
    border: 1px solid #30363d;
}

.images-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 8px;
    border-bottom: 1px solid #30363d;
    padding-bottom: 0.75rem;
}

.images-title {
    color: #e6edf3;
    margin: 0;
}

.image-gallery {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
}

.image-card {
    background: #161b22;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #30363d;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    width: 200px;
}

.image-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.image-card.used-for-map-card {
    border: 2px solid #58a6ff;
    box-shadow: 0 0 8px rgba(88, 166, 255, 0.3);
    background: linear-gradient(135deg, #161b22 0%, #0d1117 100%);
}

.image-card.used-for-map-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(88, 166, 255, 0.4);
}

.image-container {
    width: 100%;
    height: 170px;
    overflow: hidden;
    background: #0d1117;
    display: flex;
    align-items: center;
    justify-content: center;
}

.index-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: scale-down;
}

.image-info {
    padding: 0.75rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.image-type-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    background: #30363d;
    border-radius: 4px;
    color: #58a6ff;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid transparent;
}

.image-date {
    color: #8b949e;
    font-size: 0.9rem;
    font-weight: 500;
}

.image-value {
    color: #e6edf3;
    font-size: 0.85rem;
    font-weight: 600;
}

.image-value.meets-threshold {
    color: #3fb950;
}

.image-value.below-threshold {
    color: #f85149;
}

.image-threshold {
    color: #a371f7;
    font-size: 0.85rem;
    font-weight: 500;
}

.image-cloud {
    color: #8b949e;
    font-size: 0.8rem;
}

.image-cloud.has-clouds {
    color: #f0883e;
}

.image-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.image-filter label {
    color: #8b949e;
    font-size: 0.9rem;
    font-weight: 500;
}

.image-filter select {
    padding: 0.4rem 0.8rem;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
    font-size: 0.85rem;
    cursor: pointer;
    min-width: 150px;
}

.image-filter select:focus {
    outline: none;
    border-color: #58a6ff;
}

/* Estilos para las acciones del header de imágenes */
.images-header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.threshold-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.threshold-filter label {
    color: #8b949e;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
}

.threshold-filter input[type="checkbox"] {
    cursor: pointer;
    accent-color: #3fb950;
}

/* Estilos para el nuevo filtro de usadas para mapa */
.used-for-map-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.used-for-map-filter label {
    color: #8b949e;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
}

.used-for-map-filter input[type="checkbox"] {
    cursor: pointer;
    accent-color: #a371f7;
}

/* Estilos para la información de tendencia */
.image-trend-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
    font-size: 0.75rem;
}

.trend-direction {
    font-size: 0.8rem;
    font-weight: bold;
    padding: 0.1rem 0.2rem;
    border-radius: 3px;
}

.trend-up {
    color: #3fb950;
}

.trend-down {
    color: #f85149;
}

.trend-flat {
    color: #8b949e;
}

.peak-indicator {
    color: #ffa657;
    font-size: 0.7rem;
}

.streak {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.1rem 0.8px;
    border-radius: 3px;
}

.streak-positive {
    color: #3fb950;
    background: rgba(63, 185, 80, 0.1);
}

.streak-negative {
    color: #f85149;
    background: rgba(248, 81, 73, 0.1);
}

.used-for-map {
    color: #a371f7;
    font-size: 0.7rem;
    font-weight: bold;
}
</style>
