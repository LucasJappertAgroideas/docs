<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler, type ChartOptions, type ChartData } from "chart.js";
import { Line } from "vue-chartjs";
import { DIAGNOSTICO_LOTE_CONFIG, getDiagnosticoLoteConfig } from "@/config/diagnosticoLotes";
import IndicesInfoButton from "@/components/IndicesInfoButton.vue";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();

// Lista de lotes disponibles
const lotes = Object.values(DIAGNOSTICO_LOTE_CONFIG);

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
    const fieldId = (route.query.field_id as string) || "52"; // Default: Marchetti
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

// Configuración de colores para tipos de imágenes (basado en colores del gráfico)
const IMAGE_TYPE_COLORS: Record<string, string> = {
    NDVI: "#3fb950",
    NDVI_MAX: "#238636",
    RECI: "#a371f7",
    NDWI: "#00d4ff",
    NDRE: "#f0883e",
    EVI: "#d2a8ff",
    PRECIPITATION: "#58a6ff",
    TEMP_MAX: "#f85149",
    TEMP_MIN: "#79c0ff",
    TEMP_AVG: "#ffa657",
};

// Configuración de datasets para el gráfico unificado
const DATASET_CONFIGS = [
    { key: "precipitation", label: "Precipitación (mm)", color: "#58a6ff", yAxisID: "y", type: "bar" as const },
    { key: "ndvi", label: "NDVI", color: "#3fb950", yAxisID: "y1", type: "line" as const },
    { key: "ndvi_max", label: "NDVI Máx", color: "#238636", yAxisID: "y1", type: "line" as const, borderDash: [5, 5] },
    { key: "reci", label: "RECI", color: "#a371f7", yAxisID: "y1", type: "line" as const },
    { key: "ndwi", label: "NDWI", color: "#00d4ff", yAxisID: "y1", type: "line" as const },
    { key: "ndre", label: "NDRE", color: "#f0883e", yAxisID: "y1", type: "line" as const },
    { key: "evi", label: "EVI", color: "#d2a8ff", yAxisID: "y1", type: "line" as const },
    { key: "temp_max", label: "Temp. Máx (°C)", color: "#f85149", yAxisID: "y2", type: "line" as const },
    { key: "temp_min", label: "Temp. Mín (°C)", color: "#79c0ff", yAxisID: "y2", type: "line" as const },
    { key: "temp_avg", label: "Temp. Prom (°C)", color: "#ffa657", yAxisID: "y2", type: "line" as const },
];

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
    const allIndexData = [...ndviData.value, ...ndviMaxData.value, ...reciData.value, ...ndwiData.value, ...ndreData.value, ...eviData.value];
    if (!allIndexData.length) return 1;
    return Math.ceil(Math.max(...allIndexData.filter(v => v !== null && v !== undefined)) * 1.1 * 100) / 100;
});

// Datos del gráfico unificado
const unifiedChartData = computed<ChartData<"line" | "bar">>(() => {
    const dataArrays = [precipitationData.value, ndviData.value, ndviMaxData.value, reciData.value, ndwiData.value, ndreData.value, eviData.value, tempMaxData.value, tempMinData.value, tempAvgData.value];

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
                fill: config.type === "line" && config.key === "ndvi",
                tension: 0.3,
                borderDash: config.borderDash,
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

// Función para obtener color de evento
function getEventColor(tipo: string) {
    return EVENT_COLORS[tipo] || EVENT_COLORS.DEFAULT;
}

// Función para obtener color de severidad
function getSeverityColor(severidad: string) {
    return SEVERITY_COLORS[severidad] || "#8b949e";
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

// Tipos únicos de imágenes satelitales disponibles
const imageTypes = computed(() => {
    if (!diagnosticoData.value?.satellite_images) return [];
    const types = new Set<string>();
    diagnosticoData.value.satellite_images.forEach((monthGroup: any) => {
        monthGroup.images.forEach((img: any) => {
            if (img.type) types.add(img.type);
        });
    });
    return Array.from(types).sort();
});

// Imágenes satelitales filtradas por tipo y ordenadas por fecha
const filteredSatelliteImages = computed(() => {
    if (!diagnosticoData.value?.satellite_images) return [];

    const processMonthGroup = (monthGroup: any) => {
        let images = monthGroup.images;
        if (selectedImageType.value !== "all") {
            images = images.filter((img: any) => img.type === selectedImageType.value);
        }
        // Ordenar imágenes por fecha de menor a mayor
        images = [...images].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return {
            month: monthGroup.month,
            images,
        };
    };

    return diagnosticoData.value.satellite_images.map(processMonthGroup).filter((monthGroup: any) => monthGroup.images.length > 0);
});

// Función para filtrar eventos entre fechas de siembra y cosecha
function getFilteredEventos(cycle: any) {
    if (!cycle.eventos || cycle.eventos.length === 0) {
        return [];
    }

    const fechaSiembra = cycle.fecha_siembra ? new Date(cycle.fecha_siembra) : null;
    const fechaCosecha = cycle.fecha_cosecha ? new Date(cycle.fecha_cosecha) : null;

    return cycle.eventos.filter((evento: any) => {
        const fechaEvento = new Date(evento.fecha);

        // Si ambas fechas son nulas, no mostrar eventos
        if (!fechaSiembra && !fechaCosecha) {
            return false;
        }

        // Si solo hay fecha de siembra, mostrar eventos desde siembra en adelante
        if (fechaSiembra && !fechaCosecha) {
            return fechaEvento >= fechaSiembra;
        }

        // Si solo hay fecha de cosecha, mostrar eventos hasta cosecha
        if (!fechaSiembra && fechaCosecha) {
            return fechaEvento <= fechaCosecha;
        }

        // Si ambas fechas existen, mostrar eventos entre siembra y cosecha
        return fechaEvento >= fechaSiembra! && fechaEvento <= fechaCosecha!;
    });
}

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

                    <!-- Información adicional del ciclo -->
                    <div class="cycle-meta">
                        <div class="cycle-meta-item">
                            <label>Estado</label>
                            <span class="cycle-status" :class="cycle.status?.toLowerCase()">{{ cycle.status }}</span>
                        </div>
                        <div class="cycle-meta-item">
                            <label>Confianza</label>
                            <span class="cycle-confidence">{{ (cycle.confidence * 100).toFixed(0) }}%</span>
                        </div>
                        <div v-if="cycle.notes" class="cycle-meta-item cycle-notes">
                            <label>Notas</label>
                            <span>{{ cycle.notes }}</span>
                        </div>
                    </div>

                    <!-- Eventos del ciclo -->
                    <div class="events-section">
                        <h4 class="events-title">📅 Eventos Registrados</h4>
                        <div v-if="getFilteredEventos(cycle).length > 0" class="events-list">
                            <div
                                v-for="(evento, eIndex) in getFilteredEventos(cycle)"
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
                        <div v-else class="no-events-message">
                            <span class="no-events-icon">✓</span>
                            <span>No se registraron eventos durante el ciclo de cultivo</span>
                        </div>
                    </div>
                </div>
            </div>

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
            <div class="images-section" v-if="diagnosticoData.satellite_images && diagnosticoData.satellite_images.length > 0">
                <div class="images-header">
                    <h2 class="images-title">🛰️ Imágenes Satelitales Utilizadas</h2>
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
                <div v-for="monthGroup in filteredSatelliteImages" :key="monthGroup.month" class="image-type-group">
                    <h3 class="image-type-title">{{ monthGroup.month }}</h3>
                    <div class="image-gallery">
                        <div v-for="img in monthGroup.images" :key="img.date + img.type" class="image-card">
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

.cycle-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1rem;
    background: #0d1117;
    border-radius: 6px;
    margin-bottom: 1.5rem;
}

.cycle-meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.cycle-meta-item label {
    color: #8b949e;
    font-size: 0.8rem;
    font-weight: 500;
}

.cycle-meta-item span {
    color: #e6edf3;
    font-size: 0.95rem;
    font-weight: 600;
}

.cycle-status {
    padding: 0.25rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
    text-transform: uppercase;
    display: inline-block;
}

.cycle-status.completo {
    background: #3fb95020;
    color: #3fb950;
    border: 1px solid #3fb950;
}

.cycle-status.parcial {
    background: #f0883e20;
    color: #f0883e;
    border: 1px solid #f0883e;
}

.cycle-confidence {
    color: #3fb950 !important;
}

.cycle-notes {
    flex: 1 1 100%;
}

.cycle-notes span {
    color: #8b949e;
    font-weight: 400;
    font-size: 0.9rem;
    line-height: 1.5;
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

.no-events-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #3fb95010;
    border: 1px solid #3fb950;
    border-radius: 8px;
    color: #3fb950;
    font-size: 0.95rem;
}

.no-events-icon {
    font-size: 1.2rem;
    font-weight: bold;
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

.chart-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.toggle-btn {
    padding: 0.4rem 0.8rem;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #8b949e;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s ease;
}

.toggle-btn:hover {
    background: #21262d;
    color: #e6edf3;
}

.toggle-btn.active {
    background: #21262d;
    border-color: #30363d;
    color: #e6edf3;
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

/* Estilos para sección de imágenes satelitales */
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
    border: 1px solid transparent;
}

.image-date {
    color: #8b949e;
    font-size: 0.9rem;
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

/* Estilos para el header del gráfico */
.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.chart-header .chart-title {
    margin: 0;
}

/* Estilos para las acciones del header de imágenes */
.images-header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}
</style>
