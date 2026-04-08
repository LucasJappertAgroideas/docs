<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler, type ChartOptions, type ChartData } from "chart.js";
import { Line } from "vue-chartjs";
import { DIAGNOSTICO_LOTE_CONFIG_V3, getDiagnosticoLoteConfigV3 } from "@/config/diagnosticoLotes";
import IndicesInfoButton from "@/components/IndicesInfoButton.vue";
import { useMonthlyData, useSatelliteImages, DATASET_CONFIGS, formatDate } from "./composables-v3";
import CyclesSection from "./components/CyclesSection.vue";
import SatelliteImagesSection from "./components/SatelliteImagesSection.vue";
import MonthlySummaryTable from "./components/MonthlySummaryTable.vue";

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
        return `🌱 ${loteConfig.value.title}`;
    }
    return "🌱 Diagnóstico de Cultivos V3";
});

// Usar composables importados
const { monthlyData, monthlyLabels, precipitationData, ndviData, reciData, tempMaxData, tempMinData, tempAvgData } = useMonthlyData(diagnosticoData);
const { satelliteImages, imageTypes } = useSatelliteImages(diagnosticoData);

// Valores máximos para escalas
const maxPrecipitation = computed(() => {
    if (!precipitationData.value.length) return 100;
    return Math.ceil(Math.max(...precipitationData.value) * 1.1);
});

const maxTemperature = computed(() => {
    if (!tempMaxData.value.length) return 50;
    return Math.ceil(Math.max(...tempMaxData.value) + 5);
});

const maxIndex = computed(() => {
    const allIndexData = [...ndviData.value, ...reciData.value].filter(val => val !== null);
    if (!allIndexData.length) return 1;
    return Math.ceil(Math.max(...allIndexData) * 1.1 * 100) / 100;
});

// Datos del gráfico unificado
const unifiedChartData = computed<ChartData<"line" | "bar">>(() => {
    const dataArrays = [precipitationData.value, ndviData.value, reciData.value, tempMaxData.value, tempMinData.value, tempAvgData.value];

    return {
        labels: monthlyLabels.value,
        datasets: DATASET_CONFIGS.map((config, index) => ({
            label: config.label,
            data: dataArrays[index],
            borderColor: config.color,
            backgroundColor: config.type === "bar" ? `${config.color}80` : `${config.color}15`,
            borderWidth: config.type === "bar" ? 1 : 2,
            borderRadius: config.type === "bar" ? 4 : undefined,
            fill: false,
            tension: 0.1,
            yAxisID: config.yAxisID,
            type: config.type,
            hidden: hiddenDatasets.value.has(index),
        })),
    };
});

// Opciones del gráfico unificado
function createChartOptions(maxPrecip: number, maxTemp: number, minTemp: number, maxIdx: number): ChartOptions<"line" | "bar"> {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index" as const,
            intersect: false,
        },
        plugins: {
            title: {
                display: false,
            },
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "rgba(13, 17, 23, 0.9)",
                titleColor: "#e6edf3",
                bodyColor: "#c9d1d9",
                borderColor: "#30363d",
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        const config = DATASET_CONFIGS[context.datasetIndex];
                        let label = config.label;
                        if (label) {
                            label += ": ";
                        }
                        const yValue = context.parsed.y ?? 0;
                        if (context.dataset.yAxisID === "y") {
                            label += yValue.toFixed(1) + " mm";
                        } else if (context.dataset.yAxisID === "y1") {
                            label += yValue.toFixed(3);
                        } else if (context.dataset.yAxisID === "y2") {
                            label += yValue.toFixed(1) + "°C";
                        }
                        return label;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: "#30363d",
                    drawOnChartArea: true,
                },
                ticks: {
                    color: "#8b949e",
                    font: {
                        size: 11,
                    },
                },
            },
            y: {
                type: "linear" as const,
                display: true,
                position: "left" as const,
                max: maxPrecip,
                title: {
                    display: true,
                    text: "Precipitación (mm)",
                    color: "#58a6ff",
                    font: {
                        size: 12,
                        weight: "bold" as const,
                    },
                },
                grid: {
                    color: "#30363d",
                    drawOnChartArea: true,
                },
                ticks: {
                    color: "#8b949e",
                },
            },
            y1: {
                type: "linear" as const,
                display: true,
                position: "right" as const,
                max: maxIdx,
                title: {
                    display: true,
                    text: "Índices (NDVI/RECI)",
                    color: "#3fb950",
                    font: {
                        size: 12,
                        weight: "bold" as const,
                    },
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: "#8b949e",
                },
            },
            y2: {
                type: "linear" as const,
                display: true,
                position: "right" as const,
                max: maxTemp,
                min: minTemp,
                title: {
                    display: true,
                    text: "Temperatura (°C)",
                    color: "#f85149",
                    font: {
                        size: 12,
                        weight: "bold" as const,
                    },
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: "#8b949e",
                },
                offset: true,
            },
        },
    };
}

const unifiedChartOptions = computed(() => createChartOptions(maxPrecipitation.value, maxTemperature.value, 0, maxIndex.value));

// Funciones de interacción
function toggleDataset(index: number) {
    const newHiddenDatasets = new Set(hiddenDatasets.value);
    if (newHiddenDatasets.has(index)) {
        newHiddenDatasets.delete(index);
    } else {
        newHiddenDatasets.add(index);
    }
    hiddenDatasets.value = newHiddenDatasets;
}

function getButtonClass(index: number): string {
    return hiddenDatasets.value.has(index) ? "toggle-btn" : "toggle-btn active";
}

// Función para manejar cambios de lote
function onLoteChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const fieldId = target.value;
    router.push({ path: "/diagnostico-cultivos-v3", query: { field_id: fieldId } });
}

// Función para cargar datos
async function loadDiagnosticoData() {
    if (!loteConfig.value) {
        error.value = "No se encontró configuración para el lote especificado";
        loading.value = false;
        return;
    }

    try {
        loading.value = true;
        error.value = null;

        const response = await fetch(loteConfig.value.dataUrl);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        diagnosticoData.value = data;
    } catch (err) {
        console.error("Error cargando datos de diagnóstico:", err);
        error.value = err instanceof Error ? err.message : "Error desconocido al cargar los datos";
    } finally {
        loading.value = false;
    }
}

// Lifecycle hooks
onMounted(() => {
    loadDiagnosticoData();
});

watch(
    () => loteConfig.value,
    () => {
        if (loteConfig.value) {
            loadDiagnosticoData();
        }
    },
    { immediate: true },
);
</script>

<template>
    <div class="container">
        <div v-if="loading" class="loading">Cargando datos de diagnóstico...</div>

        <div v-else-if="error" class="error-message">
            <h2>❌ Error al cargar los datos</h2>
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
                    <span>{{ diagnosticoData.field_id || "N/A" }}</span>
                </div>
                <div class="metadata-item">
                    <label>Período</label>
                    <span>{{ formatDate(diagnosticoData.date_from) }} - {{ formatDate(diagnosticoData.date_to) }}</span>
                </div>
                <div class="metadata-item">
                    <label>Capturas Totales</label>
                    <span>{{ diagnosticoData.metadata?.total_captures || 0 }}</span>
                </div>
                <div class="metadata-item">
                    <label>Ciclos Detectados</label>
                    <span>{{ diagnosticoData.metadata?.cycles_detected || 0 }}</span>
                </div>
            </div>

            <!-- Ciclos de Cultivo -->
            <CyclesSection :cycles="diagnosticoData.cycles || []" />

            <!-- Gráfico unificado -->
            <div class="chart-section">
                <div class="chart-header">
                    <h2 class="chart-title">📊 Precipitación, Temperatura e Índices de Vegetación - Evolución Mensual</h2>
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
            <SatelliteImagesSection :satellite-images="satelliteImages" :image-types="imageTypes" :selected-image-type="selectedImageType" @update:selectedImageType="selectedImageType = $event" />

            <!-- Tabla de resumen mensual -->
            <MonthlySummaryTable :monthly-data="monthlyData" />
        </template>
    </div>
</template>

<style scoped>
.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
    background: #0d1117;
    min-height: 100vh;
}

.loading {
    text-align: center;
    padding: 4rem 2rem;
    color: #e6edf3;
    font-size: 1.2rem;
    background: #0d1117;
    border-radius: 8px;
    border: 1px solid #30363d;
    margin: 2rem 0;
}

.error-message {
    background: #0d1117;
    border: 1px solid #f85149;
    border-radius: 8px;
    padding: 2rem;
    margin: 2rem 0;
    text-align: center;
}

.error-message h2 {
    color: #f85149;
    margin: 0 0 1rem;
}

.error-message p {
    color: #c9d1d9;
    margin: 0;
}

.header {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #161b22;
    border-radius: 8px;
    border: 1px solid #30363d;
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.header h1 {
    color: #e6edf3;
    font-size: 2rem;
    margin: 0;
}

.lote-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.lote-selector label {
    color: #8b949e;
    font-weight: 500;
}

.lote-selector select {
    padding: 0.5rem 1rem;
    background: #0d1117;
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

.subtitle {
    color: #8b949e;
    font-size: 1.1rem;
    margin: 0;
}

.metadata {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #161b22;
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
    font-weight: 600;
}

.chart-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #161b22;
    border-radius: 8px;
    border: 1px solid #30363d;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.chart-title {
    color: #e6edf3;
    font-size: 1.5rem;
    margin: 0;
}

.chart-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.toggle-btn {
    padding: 0.5rem 1rem;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #8b949e;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
}

.toggle-btn:hover {
    background: #21262d;
}

.toggle-btn.active {
    background: #238636;
    color: white;
    border-color: #238636;
}

.chart-wrapper {
    height: 400px;
    margin-bottom: 1.5rem;
}

.legend-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    transition: opacity 0.2s ease;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
}

.legend-item span {
    color: #e6edf3;
    font-size: 0.85rem;
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

    .header h1 {
        font-size: 1.5rem;
    }

    .chart-controls {
        justify-content: center;
    }

    .chart-wrapper {
        height: 300px;
    }

    .metadata {
        grid-template-columns: 1fr;
    }
}
</style>
