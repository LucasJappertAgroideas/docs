<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, type ChartOptions, type ChartData } from "chart.js";
import { Line } from "vue-chartjs";
import { useClimateData } from "@/composables/useClimateData";
import { INDEX_CONFIGS } from "@/types/climate";
import { getLoteConfig, LOTE_CONFIG } from "@/config/lotes";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Log de inicio para verificar que el componente se carga

const route = useRoute();
const router = useRouter();

// Lista de lotes disponibles
const lotes = Object.values(LOTE_CONFIG);

// DEBUG: Log del field_id desde la ruta
const fieldIdFromQuery = Number(route.query.field_id);

const { data, loading, error, labels, precipitationData, temperatureMaxData, temperatureMinData, temperatureAvgData, ndviData, ndwiData, ndreData, reciData, eviData, infrarrojoData, maxPrecipitation, maxTemperature, minTemperature, maxIndex, imagesByType, imagesByMonth, fetchClimateData } = useClimateData();

const groupBy = ref<"type" | "month">("month");
const hiddenDatasets = ref<Set<number>>(new Set());
const showInfoModal = ref(false);

// Obtener configuración del lote desde el query string
const loteConfig = computed(() => {
    const fieldId = Number(route.query.field_id) || 198; // Default: Don Avelino
    return getLoteConfig(fieldId);
});

const pageTitle = computed(() => {
    if (loteConfig.value) {
        return `📍 ${loteConfig.value.title}`;
    }
    return "📍 Lote";
});

const chartData = ref<ChartData<"line">>({
    labels: [],
    datasets: [],
});

// Base chart options factory
function createChartOptions(maxPrecip: number, maxTemp: number, minTemp: number, maxIdx: number): ChartOptions<"line"> {
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
                            label += yValue + " mm";
                        } else if (context.dataset.yAxisID === "y2") {
                            label += yValue.toFixed(1) + " °C";
                        } else {
                            label += yValue.toFixed(2);
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
                    color: "#8b949e",
                    font: {
                        weight: "bold",
                    },
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: "#8b949e",
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

const chartOptions = ref<ChartOptions<"line">>(createChartOptions(100, 50, 0, 1));

function updateChartData() {
    const dataArrays = [precipitationData.value, temperatureMaxData.value, temperatureAvgData.value, temperatureMinData.value, ndviData.value, ndwiData.value, ndreData.value, reciData.value, eviData.value, infrarrojoData.value];

    chartData.value = {
        labels: labels.value,
        datasets: INDEX_CONFIGS.map((config, index) => {
            const isTemperatureMin = config.key === "temperature_min";
            const isTemperatureMax = config.key === "temperature_max";

            return {
                label: config.label,
                data: dataArrays[index],
                borderColor: config.color,
                backgroundColor: config.fill ? `${config.color}15` : `${config.color}10`,
                borderWidth: config.borderWidth,
                fill: config.fill,
                tension: config.tension,
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
                    // return config.yAxisID === "y2" ? "#ffffff" : "#0d1117";
                    return "#0d1117";
                },
                pointBorderWidth: 2,
                pointRadius: config.pointRadius,
                pointHoverRadius: config.pointHoverRadius,
                yAxisID: config.yAxisID,
                hidden: hiddenDatasets.value.has(index),
            };
        }),
    };

    // Create new options with updated max values (rounded up to integers)
    chartOptions.value = createChartOptions(Math.ceil(maxPrecipitation.value), Math.ceil(maxTemperature.value), Math.floor(minTemperature.value), Math.ceil(maxIndex.value));
}

function toggleDataset(index: number) {
    if (hiddenDatasets.value.has(index)) {
        hiddenDatasets.value.delete(index);
    } else {
        hiddenDatasets.value.add(index);
    }
    updateChartData();
}

function getButtonClass(index: number): string {
    return hiddenDatasets.value.has(index) ? "toggle-btn" : "toggle-btn active";
}

// Descripciones de los tipos de índices
const INDEX_DESCRIPTIONS: Record<string, string> = {
    NDVI: "Normalized Difference Vegetation Index - Índice de vegetación para medir biomasa y vigor del cultivo",
    EVI: "Enhanced Vegetation Index - Índice de vegetación mejorado, menos sensible a efectos del suelo y atmósfera",
    Infrarrojo: "Banda NIR (Near Infrared) - Refleja contenido de biomasa y agua en la vegetación",
    RECI: "Red Edge Chlorophyll Index - Índice de clorofila para estimar contenido de nitrógeno",
    NDWI: "Normalized Difference Water Index - Índice de agua para detectar contenido hídrico foliar (variante de Gao)",
    NDRE: "Normalized Difference Red Edge - Índice de borde rojo para monitoreo de cultivos densos",
};

function openInfoModal() {
    showInfoModal.value = true;
}

function closeInfoModal() {
    showInfoModal.value = false;
}

// Manejar cambio de selección de lote
function onLoteChange(event: Event) {
    const fieldId = (event.target as HTMLSelectElement).value;
    router.push({ query: { field_id: Number(fieldId) } });
}

async function loadLoteData() {
    if (!loteConfig.value) {
        error.value = "No se especificó un field_id válido";
        console.error("🔍 [LoteView] No loteConfig found for field_id:", fieldIdFromQuery);
        return;
    }

    await fetchClimateData(loteConfig.value.dataUrl);
    updateChartData();
}

onMounted(async () => {
    await loadLoteData();
});

// Watch for query param changes to reload data
watch(
    () => route.query.field_id,
    async () => {
        await loadLoteData();
    },
);

// Watch for data changes to update chart
watch(
    [precipitationData, temperatureMaxData, temperatureMinData, temperatureAvgData, ndviData, ndwiData, ndreData, reciData, eviData, infrarrojoData],
    () => {
        updateChartData();
    },
    { deep: true },
);
</script>

<template>
    <div class="container">
        <div v-if="!loteConfig" class="error-message">
            <h2>⚠️ Lote no encontrado</h2>
            <p>No se encontró la configuración para este lote. Verifique el parámetro field_id.</p>
        </div>

        <div v-else-if="loading" class="loading">Cargando datos...</div>

        <div v-else-if="error" class="error-message">
            <h2>⚠️ Error al cargar los datos</h2>
            <p>{{ error }}</p>
        </div>

        <template v-else-if="data">
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
                <div class="metadata">
                    <div class="metadata-item">
                        <label>Latitud</label>
                        <span>{{ data.metadata.latitude }}</span>
                    </div>
                    <div class="metadata-item">
                        <label>Longitud</label>
                        <span>{{ data.metadata.longitude }}</span>
                    </div>
                    <div class="metadata-item">
                        <label>Fecha Desde</label>
                        <span>{{ data.metadata.date_from }}</span>
                    </div>
                    <div class="metadata-item">
                        <label>Fecha Hasta</label>
                        <span>{{ data.metadata.date_to }}</span>
                    </div>
                </div>
            </div>

            <div class="chart-container">
                <h2 class="chart-title">Precipitación, Temperatura e Índices de Vegetación - Evolución Mensual</h2>

                <div class="chart-controls">
                    <button v-for="(config, index) in INDEX_CONFIGS" :key="config.key" :class="getButtonClass(index)" @click="toggleDataset(index)" :style="{ borderLeft: '4px solid ' + config.color }">
                        {{ config.label }}
                    </button>
                </div>

                <div class="chart-wrapper">
                    <Line :key="loteConfig?.fieldId" :data="chartData" :options="chartOptions" />
                </div>

                <div class="legend-info">
                    <div v-for="(config, index) in INDEX_CONFIGS" :key="config.key" class="legend-item" :style="{ opacity: hiddenDatasets.has(index) ? 0.4 : 1 }">
                        <div class="legend-color" :style="{ backgroundColor: config.color }"></div>
                        <span>{{ config.label }}</span>
                    </div>
                </div>
            </div>

            <div class="images-section" v-if="data">
                <div class="images-header">
                    <h2 class="images-title">
                        {{ groupBy === "type" ? "Imágenes por Tipo de Índice" : "Imágenes por Mes" }}
                    </h2>
                    <div class="header-actions">
                        <button class="info-btn" @click="openInfoModal" title="Información sobre tipos de índices">
                            <span class="info-icon">ℹ️</span>
                            Info Índices
                        </button>
                        <div class="group-by-controls">
                            <button :class="['group-btn', { active: groupBy === 'type' }]" @click="groupBy = 'type'">Por Tipo</button>
                            <button :class="['group-btn', { active: groupBy === 'month' }]" @click="groupBy = 'month'">Por Mes</button>
                        </div>
                    </div>
                </div>

                <!-- Agrupar por tipo -->
                <template v-if="groupBy === 'type'">
                    <div v-if="Object.keys(imagesByType).length === 0" class="no-images">No hay imágenes disponibles</div>
                    <div v-else v-for="(images, type) in imagesByType" :key="type" class="image-type-group">
                        <h3 class="image-type-title">{{ type.toUpperCase() }}</h3>
                        <div class="image-gallery">
                            <div v-for="item in images" :key="item.date" class="image-card">
                                <div class="image-container">
                                    <img :src="item.img" :alt="type.toUpperCase() + ' - ' + item.date" class="index-image" />
                                </div>
                                <div class="image-info">
                                    <span class="image-date">{{ item.date }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- Agrupar por mes -->
                <template v-else>
                    <div v-if="Object.keys(imagesByMonth).length === 0" class="no-images">No hay imágenes disponibles</div>
                    <div v-else v-for="(images, month) in imagesByMonth" :key="month" class="image-type-group">
                        <h3 class="image-type-title">{{ month }}</h3>
                        <div class="image-gallery">
                            <div v-for="item in images" :key="item.date + item.type" class="image-card">
                                <div class="image-container">
                                    <img :src="item.img" :alt="item.type.toUpperCase() + ' - ' + item.date" class="index-image" />
                                </div>
                                <div class="image-info">
                                    <span class="image-type-badge">{{ item.type.toUpperCase() }}</span>
                                    <span class="image-date">{{ item.date }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </template>
    </div>

    <!-- Modal de información de índices -->
    <Teleport to="body">
        <div v-if="showInfoModal" class="modal-overlay" @click="closeInfoModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Información de Índices</h3>
                    <button class="close-btn" @click="closeInfoModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div v-for="(description, index) in INDEX_DESCRIPTIONS" :key="index" class="index-description">
                        <h4 class="index-name">{{ index }}</h4>
                        <p class="index-desc">{{ description }}</p>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 5px;
}

.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    font-size: 1.2rem;
    color: #8b949e;
}

.error-message {
    background: #f8514920;
    border: 1px solid #f85149;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    margin: 2rem 0;
}

.error-message h2 {
    color: #f85149;
    margin: 0 0 1rem;
}

.error-message p {
    color: #8b949e;
    margin: 0;
}

.header {
    margin-bottom: 2rem;
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
}

.header h1 {
    color: #e6edf3;
    font-size: 2rem;
    margin: 0;
}

.lote-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.lote-selector label {
    color: #8b949e;
    font-weight: 500;
}

.lote-selector select {
    padding: 0.5rem 1rem;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
    font-size: 0.9rem;
    cursor: pointer;
    min-width: 200px;
}

.lote-selector select:focus {
    outline: none;
    border-color: #58a6ff;
}

.metadata {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    background: #0d1117;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #30363d;
}

.metadata-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.metadata-item label {
    color: #8b949e;
    font-size: 0.85rem;
    font-weight: 500;
}

.metadata-item span {
    color: #e6edf3;
    font-size: 1rem;
    font-weight: 600;
}

.chart-container {
    background: #0d1117;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #30363d;
    margin-bottom: 2rem;
}

.chart-title {
    color: #e6edf3;
    font-size: 1.5rem;
    margin: 0 0 1.5rem;
}

.chart-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.chart-wrapper {
    height: 450px;
    margin-bottom: 1.5rem;
}

.legend-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #30363d;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #8b949e;
    font-size: 0.9rem;
}

.legend-color {
    width: 16px;
    height: 4px;
    border-radius: 2px;
}

.images-section {
    margin-top: 2rem;
    padding: 1.5rem;
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
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #30363d;
    padding-bottom: 0.75rem;
}

.images-title {
    color: #e6edf3;
    font-size: 1.5rem;
    margin: 0;
}

.group-by-controls {
    display: flex;
    gap: 0.5rem;
}

.group-btn {
    padding: 0.5rem 1rem;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #8b949e;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.group-btn:hover {
    background: #21262d;
    color: #e6edf3;
}

.group-btn.active {
    background: #238636;
    border-color: #238636;
    color: #ffffff;
}

.image-type-group {
    margin-bottom: 2rem;
}

.image-type-group:last-child {
    margin-bottom: 0;
}

.image-type-title {
    color: #58a6ff;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    font-weight: 600;
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
}

.image-date {
    color: #8b949e;
    font-size: 0.9rem;
    font-weight: 500;
}

.no-images {
    text-align: center;
    padding: 2rem;
    color: #8b949e;
    font-size: 1rem;
}

/* Modal de información */
.header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.info-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #1f6feb;
    border: 1px solid #1f6feb;
    border-radius: 6px;
    color: #ffffff;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.info-btn:hover {
    background: #388bfd;
    border-color: #388bfd;
}

.info-icon {
    font-size: 1rem;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal-content {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    max-width: 1200px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    background: #0d1117;
    border-bottom: 1px solid #30363d;
}

.modal-header h3 {
    color: #e6edf3;
    font-size: 1.25rem;
    margin: 0;
    font-weight: 600;
}

.close-btn {
    background: transparent;
    border: none;
    color: #8b949e;
    font-size: 1.75rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.2s ease;
}

.close-btn:hover {
    color: #e6edf3;
}

.modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: calc(80vh - 70px);
}

.index-description {
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid #30363d;
}

.index-description:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.index-name {
    color: #58a6ff;
    font-size: 1.1rem;
    margin: 0 0 0.5rem;
    font-weight: 600;
}

.index-desc {
    color: #8b949e;
    font-size: 0.95rem;
    margin: 0;
    line-height: 1.5;
}
</style>
