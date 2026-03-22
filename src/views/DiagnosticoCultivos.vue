<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, type ChartOptions, type ChartData } from "chart.js";
import { Line, Bar } from "vue-chartjs";
import { DIAGNOSTICO_LOTE_CONFIG, getDiagnosticoLoteConfig } from "@/config/diagnosticoLotes";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();

// Lista de lotes disponibles
const lotes = Object.values(DIAGNOSTICO_LOTE_CONFIG);

// Estado de carga y datos
const loading = ref(true);
const error = ref<string | null>(null);
const diagnosticoData = ref<any>(null);

// Obtener configuración del lote desde el query string
const loteConfig = computed(() => {
    const fieldId = Number(route.query.field_id) || 52; // Default: Marchetti
    return getDiagnosticoLoteConfig(fieldId);
});

const pageTitle = computed(() => {
    if (loteConfig.value) {
        return `🌱 ${loteConfig.value.title}`;
    }
    return "🌱 Diagnóstico de Cultivos";
});

// Configuración de colores para eventos
const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    GOLPE_DE_CALOR: { bg: "#f8514920", border: "#f85149", text: "#f85149" },
    HELADA: { bg: "#58a6ff20", border: "#58a6ff", text: "#58a6ff" },
    SEQUIA: { bg: "#f0883e20", border: "#f0883e", text: "#f0883e" },
    PLAGA: { bg: "#a371f720", border: "#a371f7", text: "#a371f7" },
    DEFAULT: { bg: "#8b949e20", border: "#8b949e", text: "#8b949e" },
};

// Configuración de colores para severidad
const SEVERITY_COLORS: Record<string, string> = {
    BAJA: "#3fb950",
    MEDIA: "#f0883e",
    ALTA: "#f85149",
};

// Datos computados para gráficos
const monthlyLabels = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.month);
});

const ndviData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.ndvi_avg);
});

const ndviMaxData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.ndvi_max);
});

const reciData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.reci_avg);
});

const ndwiData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.ndwi_avg);
});

const ndreData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.ndre_avg);
});

const eviData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.evi_avg);
});

const precipitationData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.precipitation_mm);
});

const tempMaxData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.temp_max_c);
});

const tempMinData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.temp_min_c);
});

const tempAvgData = computed(() => {
    if (!diagnosticoData.value?.monthly_summary) return [];
    return diagnosticoData.value.monthly_summary.map((m: any) => m.temp_avg_c);
});

// Datos del gráfico de índices de vegetación
const vegetationChartData = computed<ChartData<"line">>(() => ({
    labels: monthlyLabels.value,
    datasets: [
        {
            label: "NDVI",
            data: ndviData.value,
            borderColor: "#3fb950",
            backgroundColor: "#3fb95015",
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
        },
        {
            label: "NDVI Máx",
            data: ndviMaxData.value,
            borderColor: "#238636",
            backgroundColor: "#23863610",
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
        },
        {
            label: "RECI",
            data: reciData.value,
            borderColor: "#a371f7",
            backgroundColor: "#a371f715",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: "y1",
        },
        {
            label: "NDWI",
            data: ndwiData.value,
            borderColor: "#58a6ff",
            backgroundColor: "#58a6ff15",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
        },
        {
            label: "NDRE",
            data: ndreData.value,
            borderColor: "#f0883e",
            backgroundColor: "#f0883e15",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
        },
        {
            label: "EVI",
            data: eviData.value,
            borderColor: "#d2a8ff",
            backgroundColor: "#d2a8ff15",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
        },
    ],
}));

// Opciones del gráfico de índices de vegetación
const vegetationChartOptions = computed<ChartOptions<"line">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: "index",
        intersect: false,
    },
    plugins: {
        legend: {
            display: true,
            position: "top",
            labels: {
                color: "#8b949e",
                usePointStyle: true,
                padding: 15,
            },
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
                    if (label) label += ": ";
                    const value = context.parsed.y ?? 0;
                    return label + value.toFixed(3);
                },
            },
        },
    },
    scales: {
        x: {
            grid: { color: "rgba(48, 54, 61, 0.5)" },
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
                text: "NDVI / NDWI / NDRE / EVI",
                color: "#3fb950",
                font: { weight: "bold" },
            },
            grid: { color: "rgba(48, 54, 61, 0.5)" },
            ticks: { color: "#3fb950" },
            min: 0,
        },
        y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
                display: true,
                text: "RECI",
                color: "#a371f7",
                font: { weight: "bold" },
            },
            grid: { drawOnChartArea: false },
            ticks: { color: "#a371f7" },
            min: 0,
        },
    },
}));

// Datos del gráfico de precipitación
const precipitationChartData = computed<ChartData<"bar">>(() => ({
    labels: monthlyLabels.value,
    datasets: [
        {
            label: "Precipitación (mm)",
            data: precipitationData.value,
            backgroundColor: "#58a6ff80",
            borderColor: "#58a6ff",
            borderWidth: 1,
            borderRadius: 4,
        },
    ],
}));

// Opciones del gráfico de precipitación
const precipitationChartOptions = computed<ChartOptions<"bar">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: "top",
            labels: {
                color: "#8b949e",
                usePointStyle: true,
                padding: 15,
            },
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
                    if (label) label += ": ";
                    const value = context.parsed.y ?? 0;
                    return label + value.toFixed(1) + " mm";
                },
            },
        },
    },
    scales: {
        x: {
            grid: { color: "rgba(48, 54, 61, 0.5)" },
            ticks: {
                color: "#8b949e",
                maxRotation: 45,
                minRotation: 45,
            },
        },
        y: {
            type: "linear",
            display: true,
            title: {
                display: true,
                text: "Precipitación (mm)",
                color: "#58a6ff",
                font: { weight: "bold" },
            },
            grid: { color: "rgba(48, 54, 61, 0.5)" },
            ticks: { color: "#58a6ff" },
            min: 0,
        },
    },
}));

// Datos del gráfico de temperatura
const temperatureChartData = computed<ChartData<"line">>(() => ({
    labels: monthlyLabels.value,
    datasets: [
        {
            label: "Temp. Máx (°C)",
            data: tempMaxData.value,
            borderColor: "#f85149",
            backgroundColor: "#f8514915",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
        },
        {
            label: "Temp. Mín (°C)",
            data: tempMinData.value,
            borderColor: "#58a6ff",
            backgroundColor: "#58a6ff15",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
        },
        {
            label: "Temp. Prom (°C)",
            data: tempAvgData.value,
            borderColor: "#f0883e",
            backgroundColor: "#f0883e15",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
        },
    ],
}));

// Opciones del gráfico de temperatura
const temperatureChartOptions = computed<ChartOptions<"line">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: "index",
        intersect: false,
    },
    plugins: {
        legend: {
            display: true,
            position: "top",
            labels: {
                color: "#8b949e",
                usePointStyle: true,
                padding: 15,
            },
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
                    if (label) label += ": ";
                    const value = context.parsed.y ?? 0;
                    return label + value.toFixed(1) + " °C";
                },
            },
        },
    },
    scales: {
        x: {
            grid: { color: "rgba(48, 54, 61, 0.5)" },
            ticks: {
                color: "#8b949e",
                maxRotation: 45,
                minRotation: 45,
            },
        },
        y: {
            type: "linear",
            display: true,
            title: {
                display: true,
                text: "Temperatura (°C)",
                color: "#f0883e",
                font: { weight: "bold" },
            },
            grid: { color: "rgba(48, 54, 61, 0.5)" },
            ticks: {
                color: "#f0883e",
                callback: function (value) {
                    return value + " °C";
                },
            },
        },
    },
}));

// Función para obtener color de evento
function getEventColor(tipo: string) {
    return EVENT_COLORS[tipo] || EVENT_COLORS.DEFAULT;
}

// Función para obtener color de severidad
function getSeverityColor(severidad: string) {
    return SEVERITY_COLORS[severidad] || "#8b949e";
}

// Función para formatear fecha a dd-mm-yyyy
function formatDate(dateString: string) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Manejar cambio de selección de lote
function onLoteChange(event: Event) {
    const fieldId = (event.target as HTMLSelectElement).value;
    router.push({ query: { field_id: Number(fieldId) } });
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
</script>

<template>
    <div class="container">
        <div v-if="loading" class="loading">Cargando datos de diagnóstico...</div>

        <div v-else-if="error" class="error-message">
            <h2>⚠️ Error al cargar los datos</h2>
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
                <p class="subtitle">Análisis detallado de ciclos de cultivo y eventos</p>
            </div>

            <!-- Información del campo -->
            <div class="metadata">
                <div class="metadata-item">
                    <label>Field ID</label>
                    <span>{{ diagnosticoData.field_id }}</span>
                </div>
                <div class="metadata-item">
                    <label>Período</label>
                    <span>{{ formatDate(diagnosticoData.date_from) }} - {{ formatDate(diagnosticoData.date_to) }}</span>
                </div>
                <div class="metadata-item">
                    <label>Total Capturas</label>
                    <span>{{ diagnosticoData.metadata?.total_captures || 0 }}</span>
                </div>
                <div class="metadata-item">
                    <label>Capturas Filtradas</label>
                    <span>{{ diagnosticoData.metadata?.filtered_captures || 0 }}</span>
                </div>
            </div>

            <!-- Ciclos de cultivo -->
            <div class="section">
                <h2 class="section-title">🌾 Ciclos de Cultivo</h2>
                <div v-for="(cycle, index) in diagnosticoData.cycles" :key="index" class="cycle-card">
                    <div class="cycle-header">
                        <div class="cycle-info">
                            <h3 class="cycle-name">{{ cycle.cultivo }}</h3>
                            <div class="cycle-dates">
                                <span class="date-item">
                                    <span class="date-label">Siembra:</span>
                                    <span class="date-value">{{ formatDate(cycle.fecha_siembra) }}</span>
                                </span>
                                <span class="date-item">
                                    <span class="date-label">Cosecha:</span>
                                    <span class="date-value">{{ formatDate(cycle.fecha_cosecha) }}</span>
                                </span>
                            </div>
                        </div>
                        <div class="cycle-stats">
                            <div class="stat-item">
                                <label>Pico NDVI</label>
                                <span class="stat-value ndvi-value">{{ cycle.pico_ndvi.toFixed(3) }}</span>
                            </div>
                            <div class="stat-item">
                                <label>Estado</label>
                                <span class="stat-badge" :class="cycle.estado_salud.toLowerCase()">
                                    {{ cycle.estado_salud }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Eventos del ciclo -->
                    <div v-if="cycle.eventos && cycle.eventos.length > 0" class="events-section">
                        <h4 class="events-title">📅 Eventos Registrados</h4>
                        <div class="events-list">
                            <div
                                v-for="(evento, eIndex) in cycle.eventos"
                                :key="eIndex"
                                class="event-card"
                                :style="{
                                    backgroundColor: getEventColor(evento.tipo).bg,
                                    borderColor: getEventColor(evento.tipo).border,
                                }"
                            >
                                <div class="event-header">
                                    <span class="event-type" :style="{ color: getEventColor(evento.tipo).text }">
                                        {{ evento.tipo.replace(/_/g, " ") }}
                                    </span>
                                    <span class="event-severity" :style="{ backgroundColor: getSeverityColor(evento.severidad) }">
                                        {{ evento.severidad }}
                                    </span>
                                </div>
                                <div class="event-date">{{ formatDate(evento.fecha) }}</div>
                                <div class="event-description">{{ evento.descripcion }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráfico de índices de vegetación -->
            <div class="chart-section">
                <h2 class="chart-title">📊 Evolución de Índices de Vegetación</h2>
                <div class="chart-wrapper">
                    <Line :data="vegetationChartData" :options="vegetationChartOptions" />
                </div>
            </div>

            <!-- Gráfico de precipitación -->
            <div class="chart-section">
                <h2 class="chart-title">🌧️ Precipitación Mensual</h2>
                <div class="chart-wrapper">
                    <Bar :data="precipitationChartData" :options="precipitationChartOptions" />
                </div>
            </div>

            <!-- Gráfico de temperatura -->
            <div class="chart-section">
                <h2 class="chart-title">🌡️ Temperatura Mensual</h2>
                <div class="chart-wrapper">
                    <Line :data="temperatureChartData" :options="temperatureChartOptions" />
                </div>
            </div>

            <!-- Tabla de resumen mensual -->
            <div class="section">
                <h2 class="section-title">📋 Resumen Mensual</h2>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Mes</th>
                                <th>NDVI</th>
                                <th>NDVI Máx</th>
                                <th>RECI</th>
                                <th>NDWI</th>
                                <th>NDRE</th>
                                <th>EVI</th>
                                <th>Precip. (mm)</th>
                                <th>Temp. Máx</th>
                                <th>Temp. Mín</th>
                                <th>Temp. Prom</th>
                                <th>Capturas</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="month in diagnosticoData.monthly_summary" :key="month.month">
                                <td class="month-cell">{{ month.month }}</td>
                                <td>{{ month.ndvi_avg.toFixed(3) }}</td>
                                <td>{{ month.ndvi_max.toFixed(3) }}</td>
                                <td>{{ month.reci_avg.toFixed(3) }}</td>
                                <td>{{ month.ndwi_avg.toFixed(3) }}</td>
                                <td>{{ month.ndre_avg.toFixed(3) }}</td>
                                <td>{{ month.evi_avg.toFixed(3) }}</td>
                                <td>{{ month.precipitation_mm.toFixed(1) }}</td>
                                <td class="temp-max">{{ month.temp_max_c.toFixed(1) }}°C</td>
                                <td class="temp-min">{{ month.temp_min_c.toFixed(1) }}°C</td>
                                <td>{{ month.temp_avg_c.toFixed(1) }}°C</td>
                                <td>{{ month.num_captures }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Detalle de capturas -->
            <div class="section">
                <h2 class="section-title">📸 Detalle de Capturas</h2>
                <div class="captures-grid">
                    <div v-for="capture in diagnosticoData.captures_detail" :key="capture.date" class="capture-card">
                        <div class="capture-date">{{ formatDate(capture.date) }}</div>
                        <div class="capture-stats">
                            <div class="capture-stat">
                                <span class="stat-label">NDVI</span>
                                <span class="stat-value">{{ capture.ndvi.toFixed(2) }}</span>
                            </div>
                            <div class="capture-stat">
                                <span class="stat-label">NDWI</span>
                                <span class="stat-value">{{ capture.ndwi.toFixed(2) }}</span>
                            </div>
                            <div class="capture-stat">
                                <span class="stat-label">RECI</span>
                                <span class="stat-value">{{ capture.reci.toFixed(2) }}</span>
                            </div>
                            <div class="capture-stat">
                                <span class="stat-label">NDRE</span>
                                <span class="stat-value">{{ capture.ndre.toFixed(2) }}</span>
                            </div>
                            <div class="capture-stat">
                                <span class="stat-label">EVI</span>
                                <span class="stat-value">{{ capture.evi.toFixed(2) }}</span>
                            </div>
                            <div class="capture-stat">
                                <span class="stat-label">Nubes</span>
                                <span class="stat-value">{{ capture.cloud_coverage.toFixed(1) }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
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
    margin-bottom: 0.5rem;
}

.header h1 {
    color: #e6edf3;
    font-size: 2rem;
    margin: 0;
}

.subtitle {
    color: #8b949e;
    font-size: 1.1rem;
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
    margin-bottom: 2rem;
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

.section {
    background: #0d1117;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #30363d;
    margin-bottom: 2rem;
}

.section-title {
    color: #e6edf3;
    font-size: 1.5rem;
    margin: 0 0 1.5rem;
}

.cycle-card {
    background: #161b22;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #30363d;
    margin-bottom: 1.5rem;
}

.cycle-card:last-child {
    margin-bottom: 0;
}

.cycle-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.cycle-info {
    flex: 1;
    min-width: 250px;
}

.cycle-name {
    color: #58a6ff;
    font-size: 1.5rem;
    margin: 0 0 1rem;
    font-weight: 700;
}

.cycle-dates {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.date-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.date-label {
    color: #8b949e;
    font-size: 0.9rem;
    font-weight: 500;
}

.date-value {
    color: #e6edf3;
    font-size: 0.95rem;
}

.cycle-stats {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: center;
}

.stat-item label {
    color: #8b949e;
    font-size: 0.85rem;
    font-weight: 500;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
}

.ndvi-value {
    color: #3fb950;
}

.stat-badge {
    padding: 0.35rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
}

.stat-badge.bueno {
    background: #3fb95020;
    color: #3fb950;
    border: 1px solid #3fb950;
}

.stat-badge.regular {
    background: #f0883e20;
    color: #f0883e;
    border: 1px solid #f0883e;
}

.stat-badge.malo {
    background: #f8514920;
    color: #f85149;
    border: 1px solid #f85149;
}

.events-section {
    border-top: 1px solid #30363d;
    padding-top: 1.5rem;
}

.events-title {
    color: #e6edf3;
    font-size: 1.1rem;
    margin: 0 0 1rem;
}

.events-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.event-card {
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid;
}

.event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.event-type {
    font-weight: 600;
    font-size: 1rem;
    text-transform: capitalize;
}

.event-severity {
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #ffffff;
    text-transform: uppercase;
}

.event-date {
    color: #8b949e;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.event-description {
    color: #e6edf3;
    font-size: 0.95rem;
    line-height: 1.5;
}

.chart-section {
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

.chart-wrapper {
    height: 400px;
    margin-bottom: 1.5rem;
}

.table-container {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.data-table th,
.data-table td {
    padding: 0.75rem;
    text-align: center;
    border-bottom: 1px solid #30363d;
}

.data-table th {
    background: #161b22;
    color: #e6edf3;
    font-weight: 600;
    white-space: nowrap;
}

.data-table td {
    color: #8b949e;
}

.data-table tbody tr:hover {
    background: #161b22;
}

.month-cell {
    color: #58a6ff !important;
    font-weight: 600;
    white-space: nowrap;
}

.temp-max {
    color: #f85149 !important;
}

.temp-min {
    color: #58a6ff !important;
}

.captures-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
}

.capture-card {
    background: #161b22;
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid #30363d;
}

.capture-date {
    color: #58a6ff;
    font-weight: 600;
    margin-bottom: 0.75rem;
    font-size: 0.95rem;
}

.capture-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
}

.capture-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
}

.stat-label {
    color: #8b949e;
    font-size: 0.75rem;
    font-weight: 500;
}

.capture-stat .stat-value {
    color: #e6edf3;
    font-size: 0.9rem;
    font-weight: 600;
}
</style>
