<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler, type ChartOptions, type ChartData } from "chart.js";
import { Line } from "vue-chartjs";
import { DIAGNOSTICO_LOTE_CONFIG_V3, getDiagnosticoLoteConfigV3 } from "@/config/diagnosticoLotes";
import IndicesInfoButton from "@/components/IndicesInfoButton.vue";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();

// Lista de lotes disponibles
const lotes = Object.values(DIAGNOSTICO_LOTE_CONFIG_V3);

// Estado de carga y datos
const loading = ref(true);
const error = ref<string | null>(null);
const diagnosticoData = ref<any>(null);

// Control de datasets visibles
const hiddenDatasets = ref<Set<number>>(new Set());

// Filtro de tipo de imagen satelital
const selectedImageType = ref<string>("all");

// Obtener configuración del lote desde el query string
const loteConfig = computed(() => {
    const fieldId = (route.query.field_id as string) || "286"; // Default: La Querencia Lote 4
    return getDiagnosticoLoteConfigV3(fieldId);
});

const pageTitle = computed(() => {
    if (loteConfig.value) {
        return `? ${loteConfig.value.title}`;
    }
    return "? Diagnóstico de Cultivos V3";
});

// Configuración de colores para tipos de imágenes
const IMAGE_TYPE_COLORS: Record<string, string> = {
    NDVI: "#3fb950",
    RECI: "#a371f7",
};

// Configuración de datasets para el gráfico unificado
const DATASET_CONFIGS = [
    { key: "precipitation", label: "Precipitación (mm)", color: "#58a6ff", yAxisID: "y", type: "bar" as const },
    { key: "ndvi", label: "NDVI", color: "#3fb950", yAxisID: "y1", type: "line" as const },
    { key: "reci", label: "RECI", color: "#a371f7", yAxisID: "y1", type: "line" as const },
    { key: "temp_max", label: "Temp. Máx (°C)", color: "#f85149", yAxisID: "y2", type: "line" as const },
    { key: "temp_min", label: "Temp. Mín (°C)", color: "#79c0ff", yAxisID: "y2", type: "line" as const },
    { key: "temp_avg", label: "Temp. Prom (°C)", color: "#ffa657", yAxisID: "y2", type: "line" as const },
];

// Datos computados para gráficos - adaptados para la estructura V3
const monthlyData = computed(() => {
    if (!diagnosticoData.value?.data) return [];

    const data = diagnosticoData.value.data;
    const months = Object.keys(data).sort((a: string, b: string) => {
        // Ordenar por fecha (MM-YYYY)
        const [aMonth, aYear] = a.split("-").map(Number);
        const [bMonth, bYear] = b.split("-").map(Number);
        return aYear - bYear || aMonth - bMonth;
    });

    return months.map(monthKey => ({
        key: monthKey,
        month: data[monthKey],
    }));
});

const monthlyLabels = computed(() => {
    return monthlyData.value.map(item => {
        const [month, year] = item.key.split("-");
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return `${monthNames[parseInt(month) - 1]}-${year}`;
    });
});

const precipitationData = computed(() => {
    return monthlyData.value.map(item => item.month.precipitation || 0);
});

const ndviData = computed(() => {
    return monthlyData.value.map(item => {
        const ndvi = item.month.indices?.ndvi?.average;
        return ndvi !== null && ndvi !== undefined ? ndvi : null;
    });
});

const reciData = computed(() => {
    return monthlyData.value.map(item => {
        const reci = item.month.indices?.reci?.average;
        return reci !== null && reci !== undefined ? reci : null;
    });
});

const tempMaxData = computed(() => {
    return monthlyData.value.map(item => item.month.temperature?.max || 0);
});

const tempMinData = computed(() => {
    return monthlyData.value.map(item => item.month.temperature?.min || 0);
});

const tempAvgData = computed(() => {
    return monthlyData.value.map(item => item.month.temperature?.avg || 0);
});

// Valores máximos para escalas
const maxPrecipitation = computed(() => {
    if (!precipitationData.value.length) return 100;
    return Math.ceil(Math.max(...precipitationData.value) * 1.1);
});

const maxTemperature = computed(() => {
    if (!tempMaxData.value.length) return 50;
    return Math.ceil(Math.max(...tempMaxData.value) + 5);
});

const minTemperature = computed(() => {
    if (!tempMinData.value.length) return 0;
    return Math.floor(Math.min(...tempMinData.value) - 5);
});

const maxIndex = computed(() => {
    const allIndexData = [...ndviData.value, ...reciData.value].filter(v => v !== null && v !== undefined);
    if (!allIndexData.length) return 1;
    return Math.ceil(Math.max(...allIndexData) * 1.1 * 100) / 100;
});

// Datos del gráfico unificado
const unifiedChartData = computed<ChartData<"line" | "bar">>(() => {
    const dataArrays = [precipitationData.value, ndviData.value, reciData.value, tempMaxData.value, tempMinData.value, tempAvgData.value];

    return {
        labels: monthlyLabels.value,
        datasets: DATASET_CONFIGS.map((config, index) => {
            const isTemperatureMin = config.key === "temp_min";
            const isTemperatureMax = config.key === "temp_max";

            return {
                label: config.label,
                data: dataArrays[index],
                borderColor: config.color,
                backgroundColor: config.type === "bar" ? `${config.color}80` : `${config.color}15`,
                borderWidth: config.type === "bar" ? 1 : 2,
                borderRadius: config.type === "bar" ? 4 : undefined,
                fill: false,
                tension: 0.3,
                pointBackgroundColor: (ctx: any) => {
                    const value = ctx.raw;
                    if (isTemperatureMin && value < 5) return "#ffffff";
                    if (isTemperatureMax && value > 35) return "#000000";
                    return config.color;
                },
                pointBorderColor: (ctx: any) => {
                    const value = ctx.raw;
                    if (isTemperatureMin && value < 5) return "#ffffff";
                    if (isTemperatureMax && value > 35) return "#ffd700";
                    return "#0d1117";
                },
                pointBorderWidth: 2,
                pointRadius: config.type === "bar" ? 0 : 4,
                pointHoverRadius: config.type === "bar" ? 0 : 6,
                yAxisID: config.yAxisID,
                hidden: hiddenDatasets.value.has(index),
                type: config.type,
            };
        }),
    };
});

// Opciones del gráfico unificado
function createChartOptions(maxPrecip: number, maxTemp: number, minTemp: number, maxIdx: number): ChartOptions<"line" | "bar"> {
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
                backgroundColor: "rgba(22, 27, 34, 0.95)",
                titleColor: "#e6edf3",
                bodyColor: "#8b949e",
                borderColor: "#30363d",
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || "";
                        if (label) {
                            label += ": ";
                        }
                        const yValue = context.parsed.y ?? 0;
                        if (context.dataset.yAxisID === "y") {
                            label += yValue.toFixed(1) + " mm";
                        } else if (context.dataset.yAxisID === "y2") {
                            label += yValue.toFixed(1) + " °C";
                        } else {
                            label += yValue.toFixed(3);
                        }
                        return label;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: "rgba(48, 54, 61, 0.5)",
                },
                ticks: {
                    color: "#8b949e",
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
            y: {
                type: "linear",
                display: true,
                position: "left",
                title: {
                    display: true,
                    text: "Precipitación (mm)",
                    color: "#58a6ff",
                    font: {
                        weight: "bold",
                    },
                },
                grid: {
                    color: "rgba(48, 54, 61, 0.5)",
                },
                ticks: {
                    color: "#58a6ff",
                },
                min: 0,
                max: maxPrecip,
            },
            y1: {
                type: "linear",
                display: true,
                position: "right",
                title: {
                    display: true,
                    text: "Índices de Vegetación",
                    color: "#3fb950",
                    font: {
                        weight: "bold",
                    },
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: "#3fb950",
                    callback: function (value) {
                        return (value as number).toFixed(2);
                    },
                },
                min: 0,
                max: maxIdx,
                offset: true,
            },
            y2: {
                type: "linear",
                display: true,
                position: "right",
                title: {
                    display: true,
                    text: "Temperatura (°C)",
                    color: "#f0883e",
                    font: {
                        weight: "bold",
                    },
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: "#f0883e",
                    callback: function (value) {
                        return (value as number).toFixed(1) + " °C";
                    },
                },
                min: minTemp,
                max: maxTemp,
                offset: true,
            },
        },
    };
}

const unifiedChartOptions = computed<ChartOptions<"line" | "bar">>(() => createChartOptions(maxPrecipitation.value, maxTemperature.value, minTemperature.value, maxIndex.value));

// Toggle dataset visibility
function toggleDataset(index: number) {
    if (hiddenDatasets.value.has(index)) {
        hiddenDatasets.value.delete(index);
    } else {
        hiddenDatasets.value.add(index);
    }
}

function getButtonClass(index: number): string {
    return hiddenDatasets.value.has(index) ? "toggle-btn" : "toggle-btn active";
}

// Función para obtener color de tipo de imagen
function getImageTypeColor(type: string) {
    return IMAGE_TYPE_COLORS[type.toUpperCase()] || "#58a6ff";
}

// Función para formatear fecha a dd-mm-yyyy
function formatDate(dateString: string | null | undefined) {
    if (!dateString) return "Sin definir";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Imágenes satelitales - adaptadas para estructura V3
interface SatelliteImage {
    month: string;
    type: string;
    url: string;
    date: string;
    cloud_coverage: number;
}

const satelliteImages = computed((): SatelliteImage[] => {
    if (!diagnosticoData.value?.data) return [];

    const images: SatelliteImage[] = [];
    const data = diagnosticoData.value.data;

    Object.keys(data).forEach(monthKey => {
        const monthData = data[monthKey];
        if (monthData.indices) {
            ["ndvi", "reci"].forEach(indexType => {
                const indexData = monthData.indices[indexType];
                if (indexData && indexData.img) {
                    images.push({
                        month: monthKey,
                        type: indexType.toUpperCase(),
                        url: indexData.img,
                        date: indexData.img.match(/(\d{4})(\d{2})(\d{2})/)?.[0] || monthKey,
                        cloud_coverage: indexData.cloud_coverage || 0,
                    });
                }
            });
        }
    });

    return images.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
});

// Tipos únicos de imágenes satelitales disponibles
const imageTypes = computed(() => {
    const types = new Set<string>();
    satelliteImages.value.forEach(img => {
        if (img.type) types.add(img.type);
    });
    return Array.from(types).sort();
});

// Imágenes satelitales filtradas por tipo
const filteredSatelliteImages = computed(() => {
    if (selectedImageType.value === "all") {
        return satelliteImages.value;
    }
    return satelliteImages.value.filter(img => img.type === selectedImageType.value);
});

// Manejar cambio de selección de lote
function onLoteChange(event: Event) {
    const fieldId = (event.target as HTMLSelectElement).value;
    router.push({ query: { field_id: fieldId } });
}

// Cargar datos del JSON
async function loadDiagnosticoData() {
    loading.value = true;
    error.value = null;

    if (!loteConfig.value) {
        error.value = "No se especificó un field_id válido";
        loading.value = false;
        return;
    }

    try {
        const response = await fetch(loteConfig.value.dataUrl);
        if (!response.ok) {
            throw new Error(`Error al cargar datos: ${response.status}`);
        }
        diagnosticoData.value = await response.json();
    } catch (err: any) {
        error.value = err.message || "Error al cargar los datos de diagnóstico";
        console.error("Error loading diagnostico data:", err);
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await loadDiagnosticoData();
});

// Watch for query param changes to reload data
watch(
    () => route.query.field_id,
    async () => {
        await loadDiagnosticoData();
    },
);

// Actualizar título de la pestaña cuando cambia el lote
watch(
    pageTitle,
    newTitle => {
        document.title = newTitle;
    },
    { immediate: true },
);
</script>

<template>
    <div class="container">
        <div v-if="loading" class="loading">Cargando datos de diagnóstico...</div>

        <div v-else-if="error" class="error-message">
            <h2>? Error al cargar los datos</h2>
            <p>{{ error }}</p>
        </div>

        <template v-else-if="diagnosticoData">
            <!-- Encabezado -->
            <div class="header">
                <div class="header-top">
                    <h1>{{ pageTitle }}</h1>
                    <div class="lote-selector">
                        <label for="lote-select">Cambiar Lote:</label>
                        <select id="lote-select" :value="loteConfig?.fieldId" @change="onLoteChange">
                            <option v-for="lote in lotes" :key="lote.fieldId" :value="lote.fieldId">
                                {{ lote.title }}
                            </option>
                        </select>
                    </div>
                </div>
                <p class="subtitle">Análisis detallado de índices de vegetación y datos climáticos</p>
            </div>

            <!-- Información del campo -->
            <div class="metadata">
                <div class="metadata-item">
                    <label>Field ID</label>
                    <span>{{ diagnosticoData.metadata?.field_id || "N/A" }}</span>
                </div>
                <div class="metadata-item">
                    <label>Nombre</label>
                    <span>{{ diagnosticoData.metadata?.nombre || "N/A" }}</span>
                </div>
                <div class="metadata-item">
                    <label>Parent Field</label>
                    <span>{{ diagnosticoData.metadata?.parent_field || "N/A" }}</span>
                </div>
                <div class="metadata-item">
                    <label>Período</label>
                    <span>{{ formatDate(diagnosticoData.metadata?.date_from) }} - {{ formatDate(diagnosticoData.metadata?.date_to) }}</span>
                </div>
                <div class="metadata-item">
                    <label>Superficie</label>
                    <span>{{ diagnosticoData.metadata?.ha_totals || 0 }} ha</span>
                </div>
            </div>

            <!-- Gráfico unificado -->
            <div class="chart-section">
                <div class="chart-header">
                    <h2 class="chart-title">? Precipitación, Temperatura e Índices de Vegetación - Evolución Mensual</h2>
                    <IndicesInfoButton />
                </div>

                <div class="chart-controls">
                    <button v-for="(config, index) in DATASET_CONFIGS" :key="config.key" :class="getButtonClass(index)" @click="toggleDataset(index)" :style="{ borderLeft: '4px solid ' + config.color }">
                        {{ config.label }}
                    </button>
                </div>

                <div class="chart-wrapper">
                    <Line :key="loteConfig?.fieldId" :data="unifiedChartData as ChartData<'line'>" :options="unifiedChartOptions as ChartOptions<'line'>" />
                </div>

                <div class="legend-info">
                    <div v-for="(config, index) in DATASET_CONFIGS" :key="config.key" class="legend-item" :style="{ opacity: hiddenDatasets.has(index) ? 0.4 : 1 }">
                        <div class="legend-color" :style="{ backgroundColor: config.color }"></div>
                        <span>{{ config.label }}</span>
                    </div>
                </div>
            </div>

            <!-- Imágenes Satelitales -->
            <div class="images-section" v-if="satelliteImages.length > 0">
                <div class="images-header">
                    <h2 class="images-title">? Imágenes Satelitales Utilizadas</h2>
                    <div class="images-header-actions">
                        <IndicesInfoButton />
                        <div class="image-filter" v-if="imageTypes.length > 1">
                            <label for="image-type-select">Filtrar por tipo:</label>
                            <select id="image-type-select" v-model="selectedImageType">
                                <option value="all">Todos los tipos</option>
                                <option v-for="type in imageTypes" :key="type" :value="type">{{ type }}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="image-gallery">
                    <div v-for="img in filteredSatelliteImages" :key="img.date + img.type" class="image-card">
                        <div class="image-container">
                            <img :src="img.url" :alt="img.type + ' - ' + img.date" class="index-image" />
                        </div>
                        <div class="image-info">
                            <span class="image-type-badge" :style="{ backgroundColor: getImageTypeColor(img.type) + '20', color: getImageTypeColor(img.type), borderColor: getImageTypeColor(img.type) }">{{ img.type }}</span>
                            <span class="image-date">{{ formatDate(img.date) }}</span>
                            <span class="image-cloud" :class="{ 'has-clouds': img.cloud_coverage > 0 }">Nubes: {{ (img.cloud_coverage / 100).toFixed(1) }}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de resumen mensual -->
            <div class="section">
                <h2 class="section-title">? Resumen Mensual</h2>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>NDVI</th>
                                <th>RECI</th>
                                <th>Precip. (mm)</th>
                                <th>Temp. Máx</th>
                                <th>Temp. Mín</th>
                                <th>Temp. Prom</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in monthlyData" :key="item.key">
                                <td class="month-cell">{{ item.key }}</td>
                                <td>{{ item.month.indices?.ndvi?.average !== null && item.month.indices?.ndvi?.average !== undefined ? item.month.indices.ndvi.average.toFixed(3) : "N/A" }}</td>
                                <td>{{ item.month.indices?.reci?.average !== null && item.month.indices?.reci?.average !== undefined ? item.month.indices.reci.average.toFixed(3) : "N/A" }}</td>
                                <td>{{ (item.month.precipitation || 0).toFixed(1) }}</td>
                                <td class="temp-max">{{ (item.month.temperature?.max || 0).toFixed(1) }}°C</td>
                                <td class="temp-min">{{ (item.month.temperature?.min || 0).toFixed(1) }}°C</td>
                                <td>{{ (item.month.temperature?.avg || 0).toFixed(1) }}°C</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.loading {
    text-align: center;
    padding: 40px;
    font-size: 18px;
    color: #8b949e;
}

.error-message {
    text-align: center;
    padding: 40px;
    color: #f85149;
}

.header {
    margin-bottom: 30px;
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.header h1 {
    margin: 0;
    color: #e6edf3;
    font-size: 28px;
}

.subtitle {
    margin: 0;
    color: #8b949e;
    font-size: 16px;
}

.lote-selector {
    display: flex;
    align-items: center;
    gap: 10px;
}

.lote-selector label {
    color: #8b949e;
    font-size: 14px;
}

.lote-selector select {
    padding: 8px 12px;
    border: 1px solid #30363d;
    background: #0d1117;
    color: #e6edf3;
    border-radius: 6px;
    cursor: pointer;
}

.metadata {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
    padding: 20px;
    background: #161b22;
    border-radius: 8px;
    border: 1px solid #30363d;
}

.metadata-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.metadata-item label {
    color: #8b949e;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
}

.metadata-item span {
    color: #e6edf3;
    font-size: 14px;
    font-weight: 500;
}

.section {
    margin-bottom: 40px;
}

.section-title {
    color: #e6edf3;
    font-size: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid #30363d;
    padding-bottom: 10px;
}

.chart-section {
    margin-bottom: 40px;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.chart-title {
    color: #e6edf3;
    font-size: 20px;
    margin: 0;
}

.chart-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
}

.toggle-btn {
    padding: 8px 12px;
    border: 1px solid #30363d;
    background: #0d1117;
    color: #8b949e;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
}

.toggle-btn:hover {
    background: #21262d;
    color: #e6edf3;
}

.toggle-btn.active {
    background: #238636;
    color: #ffffff;
    border-color: #238636;
}

.chart-wrapper {
    height: 400px;
    margin-bottom: 20px;
    background: #0d1117;
    border-radius: 8px;
    padding: 20px;
    border: 1px solid #30363d;
}

.legend-info {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #8b949e;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
}

.images-section {
    margin-bottom: 40px;
}

.images-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.images-title {
    color: #e6edf3;
    font-size: 20px;
    margin: 0;
}

.images-header-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

.image-filter {
    display: flex;
    align-items: center;
    gap: 10px;
}

.image-filter label {
    color: #8b949e;
    font-size: 14px;
}

.image-filter select {
    padding: 8px 12px;
    border: 1px solid #30363d;
    background: #0d1117;
    color: #e6edf3;
    border-radius: 6px;
    cursor: pointer;
}

.image-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.image-card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    overflow: hidden;
}

.image-container {
    width: 100%;
    height: 200px;
    background: #0d1117;
}

.index-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-info {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.image-type-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid;
    text-transform: uppercase;
}

.image-date {
    color: #8b949e;
    font-size: 12px;
}

.image-cloud {
    color: #8b949e;
    font-size: 12px;
}

.image-cloud.has-clouds {
    color: #f0883e;
}

.table-container {
    overflow-x: auto;
    background: #161b22;
    border-radius: 8px;
    border: 1px solid #30363d;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.data-table th,
.data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #30363d;
}

.data-table th {
    background: #0d1117;
    color: #e6edf3;
    font-weight: 600;
    position: sticky;
    top: 0;
}

.data-table td {
    color: #e6edf3;
}

.data-table tbody tr:hover {
    background: #21262d;
}

.month-cell {
    font-weight: 600;
    color: #58a6ff;
}

.temp-max {
    color: #f85149;
}

.temp-min {
    color: #79c0ff;
}

@media (max-width: 768px) {
    .container {
        padding: 10px;
    }

    .header-top {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }

    .metadata {
        grid-template-columns: 1fr;
    }

    .chart-controls {
        justify-content: center;
    }

    .images-header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
    }

    .image-gallery {
        grid-template-columns: 1fr;
    }
}
</style>
