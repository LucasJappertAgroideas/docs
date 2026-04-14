<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler, type ChartOptions, type ChartData } from "chart.js";
import { Line } from "vue-chartjs";
import { DIAGNOSTICO_LOTE_CONFIG_V3_LOCAL, getDiagnosticoLoteConfigV3 } from "@/config/diagnosticoLotes";
import laQuerenciaData from "./data/forlin-lote-4-286.json";
import laQuerenciaLote2Data from "./data/la-querencia-lote-2-288.json";
import laQuerenciaLote20Data from "./data/querencia-lote-20-289.json";
import hymLomasLote2Data from "./data/hym-lomas-pino-lote-2-291.json";
import mungeLote1Data from "./data/lote-munge-1-292.json";
import elmerLote8Data from "./data/lote-elmer-8-293.json";
import IndicesInfoButton from "@/components/IndicesInfoButton.vue";
import { useMonthlyData, useCapturesDetail, useSatelliteImages, DATASET_CONFIGS, formatDate } from "./composables-v3";
import { type TimelineSegment } from "./types-v3";
import CyclesSection from "./components/CyclesSection.vue";
import SatelliteImagesSection from "./components/SatelliteImagesSection.vue";
import MonthlySummaryTable from "./components/MonthlySummaryTable.vue";
import JSZip from "jszip";
import { saveAs } from "file-saver";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, BarController, LineController, Title, Tooltip, Legend, Filler);

const route = useRoute();
const router = useRouter();

// Lista de lotes disponibles
const lotes = Object.values(DIAGNOSTICO_LOTE_CONFIG_V3_LOCAL);

// Estado de carga y datos
const loading = ref(true);
const error = ref<string | null>(null);
const diagnosticoData = ref<any>(null);

// Control de datasets visibles (precipitación y temperaturas ocultos por defecto)
const hiddenDatasets = ref<Set<number>>(new Set([0, 5, 6, 7])); // 0=precipitación, 5=temp_max, 6=temp_min, 7=temp_avg

// Control de fuente de datos: true=diaria, false=mensual
const useDailyData = ref(false);

// Filtro de tipo de imagen satelital
const selectedImageType = ref<string>("all");

// Control de sección de ciclos colapsable (inicia plegada por defecto)
const cyclesSectionCollapsed = ref<boolean>(true);

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
const { monthlyData, monthlyLabels, precipitationData, ndviData: monthlyNdviData, reciData: monthlyReciData, ndwiData: monthlyNdwiData, eviData: monthlyEviData, tempMaxData, tempMinData, tempAvgData } = useMonthlyData(diagnosticoData);
const { capturesLabels, precipitationData: dailyPrecipitationData, ndviData: dailyNdviData, reciData: dailyReciData, ndwiData: dailyNdwiData, eviData: dailyEviData } = useCapturesDetail(diagnosticoData);
const { satelliteImages, imageTypes } = useSatelliteImages(diagnosticoData);

// Computed properties dinámicas según fuente de datos
const chartLabels = computed(() => {
    return useDailyData.value ? capturesLabels.value : monthlyLabels.value;
});

const chartPrecipitationData = computed(() => {
    return useDailyData.value ? dailyPrecipitationData.value : precipitationData.value;
});

const chartNdviData = computed(() => {
    return useDailyData.value ? dailyNdviData.value : monthlyNdviData.value;
});

const chartReciData = computed(() => {
    return useDailyData.value ? dailyReciData.value : monthlyReciData.value;
});

const chartNdwiData = computed(() => {
    return useDailyData.value ? dailyNdwiData.value : monthlyNdwiData.value;
});

const chartEviData = computed(() => {
    return useDailyData.value ? dailyEviData.value : monthlyEviData.value;
});

// Valores máximos para escalas
const maxPrecipitation = computed(() => {
    const data = useDailyData.value ? dailyPrecipitationData.value : precipitationData.value;
    if (!data.length) return 100;
    return Math.ceil(Math.max(...data) * 1.1);
});

const maxTemperature = computed(() => {
    if (!tempMaxData.value.length) return 50;
    return Math.ceil(Math.max(...tempMaxData.value) + 5);
});

const maxIndex = computed(() => {
    const allIndexData = [...monthlyNdviData.value, ...monthlyReciData.value, ...monthlyNdwiData.value, ...monthlyEviData.value].filter(val => val !== null);
    if (!allIndexData.length) return 1;
    return Math.ceil(Math.max(...allIndexData) * 1.1 * 100) / 100;
});

// Datos del gráfico unificado
const unifiedChartData = computed<ChartData<"line" | "bar">>(() => {
    const dataArrays = [chartPrecipitationData.value, chartNdviData.value, chartReciData.value, chartNdwiData.value, chartEviData.value, tempMaxData.value, tempMinData.value, tempAvgData.value];

    return {
        labels: chartLabels.value,
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
                    text: "Índices (NDVI/RECI/NDWI/EVI)",
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

// Colores para diferentes cultivos
const CULTIVO_COLORS = {
    TRIGO: "#f59e0b",
    SOJA_2DA: "#10b981",
    MAIZ_TARDIO: "#3b82f6",
    MAIZ_1RA: "#8b5cf6",
    GIRASOL: "#ef4444",
    SOJA_1RA: "#06b6d4",
    SORGO: "#f97316",
    default: "#6b7280",
};

// Función para obtener color de cultivo
function getCultivoColor(cultivo: string): string {
    return CULTIVO_COLORS[cultivo as keyof typeof CULTIVO_COLORS] || CULTIVO_COLORS.default;
}

// Calcular porcentajes de cobertura de cultivos (agregado)
const cultivosCoverage = computed(() => {
    if (!diagnosticoData.value?.cycles || !diagnosticoData.value.date_from || !diagnosticoData.value.date_to) {
        return [];
    }

    const startDate = new Date(diagnosticoData.value.date_from);
    const endDate = new Date(diagnosticoData.value.date_to);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const cultivosMap = new Map<string, { days: number; color: string; name: string }>();

    diagnosticoData.value.cycles.forEach((cycle: any) => {
        if (!cycle.fecha_siembra && !cycle.fecha_cosecha) return;

        const siembraDate = cycle.fecha_siembra ? new Date(cycle.fecha_siembra) : startDate;
        const cosechaDate = cycle.fecha_cosecha ? new Date(cycle.fecha_cosecha) : endDate;

        // Asegurar que las fechas estén dentro del rango del análisis
        const effectiveStart = new Date(Math.max(siembraDate.getTime(), startDate.getTime()));
        const effectiveEnd = new Date(Math.min(cosechaDate.getTime(), endDate.getTime()));

        if (effectiveEnd <= effectiveStart) return;

        const cycleDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));

        const cultivoKey = cycle.cultivo || "Sin cultivo";
        const existing = cultivosMap.get(cultivoKey) || { days: 0, color: getCultivoColor(cultivoKey), name: cultivoKey };
        existing.days += cycleDays;
        cultivosMap.set(cultivoKey, existing);
    });

    // Convertir a array y calcular porcentajes
    const result = Array.from(cultivosMap.values()).map(item => ({
        ...item,
        percentage: (item.days / totalDays) * 100,
    }));

    // Ordenar por porcentaje (mayor a menor)
    return result.sort((a, b) => b.percentage - a.percentage);
});

// Calcular timeline temporal de cultivos para la barra
const cultivosTimeline = computed<TimelineSegment[]>(() => {
    if (!diagnosticoData.value?.cycles || !diagnosticoData.value.date_from || !diagnosticoData.value.date_to) {
        return [];
    }

    const startDate = new Date(diagnosticoData.value.date_from);
    const endDate = new Date(diagnosticoData.value.date_to);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Ordenar ciclos por fecha de siembra
    const sortedCycles = diagnosticoData.value.cycles
        .filter((cycle: any) => cycle.fecha_siembra || cycle.fecha_cosecha)
        .sort((a: any, b: any) => {
            const aDate = a.fecha_siembra ? new Date(a.fecha_siembra) : startDate;
            const bDate = b.fecha_siembra ? new Date(b.fecha_siembra) : startDate;
            return aDate.getTime() - bDate.getTime();
        });

    const rawSegments: (TimelineSegment | null)[] = sortedCycles.map((cycle: any) => {
        const siembraDate = cycle.fecha_siembra ? new Date(cycle.fecha_siembra) : startDate;
        const cosechaDate = cycle.fecha_cosecha ? new Date(cycle.fecha_cosecha) : endDate;

        // Asegurar que las fechas estén dentro del rango del análisis
        const effectiveStart = new Date(Math.max(siembraDate.getTime(), startDate.getTime()));
        const effectiveEnd = new Date(Math.min(cosechaDate.getTime(), endDate.getTime()));

        if (effectiveEnd <= effectiveStart) return null;

        const cycleDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
        const startOffsetDays = Math.ceil((effectiveStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const cultivoKey = cycle.cultivo || "Sin cultivo";
        const color = getCultivoColor(cultivoKey);

        return {
            name: cultivoKey,
            color,
            startPercentage: (startOffsetDays / totalDays) * 100,
            widthPercentage: (cycleDays / totalDays) * 100,
            fecha_siembra: cycle.fecha_siembra,
            fecha_cosecha: cycle.fecha_cosecha,
            cycleDays,
        } as TimelineSegment;
    });

    const segments: TimelineSegment[] = rawSegments.filter((segment): segment is TimelineSegment => segment !== null);

    return segments;
});

// Calcular etiquetas de fecha para el eje x de la barra (fechas de siembra y cosecha)
const timelineLabels = computed(() => {
    if (!diagnosticoData.value?.cycles || !diagnosticoData.value.date_from || !diagnosticoData.value.date_to) {
        return [];
    }

    const startDate = new Date(diagnosticoData.value.date_from);
    const endDate = new Date(diagnosticoData.value.date_to);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const dateSet = new Set<string>();

    // Agregar fechas de siembra y cosecha de todos los ciclos
    diagnosticoData.value.cycles.forEach((cycle: any) => {
        if (cycle.fecha_siembra) {
            const date = new Date(cycle.fecha_siembra);
            if (date >= startDate && date <= endDate) {
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const yy = String(date.getFullYear()).slice(-2);
                dateSet.add(`${mm}-${yy}`);
            }
        }
        if (cycle.fecha_cosecha) {
            const date = new Date(cycle.fecha_cosecha);
            if (date >= startDate && date <= endDate) {
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const yy = String(date.getFullYear()).slice(-2);
                dateSet.add(`${mm}-${yy}`);
            }
        }
    });

    // Convertir a array y ordenar por fecha
    const sortedLabels = Array.from(dateSet).sort((a, b) => {
        const [aMm, aYy] = a.split("-").map(Number);
        const [bMm, bYy] = b.split("-").map(Number);
        const aYear = aYy < 50 ? 2000 + aYy : 1900 + aYy; // Asumir 20xx
        const bYear = bYy < 50 ? 2000 + bYy : 1900 + bYy;
        if (aYear !== bYear) return aYear - bYear;
        return aMm - bMm;
    });

    // Nombres de meses abreviados en español
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    // Calcular porcentajes para cada etiqueta
    const labels = sortedLabels.map(originalLabel => {
        const [mm, yyStr] = originalLabel.split("-");
        const yy = parseInt(yyStr);
        const year = yy < 50 ? 2000 + yy : 1900 + yy;
        const monthIndex = parseInt(mm) - 1; // 0-based
        const monthName = monthNames[monthIndex];
        const label = `${monthName}-${year}`;
        const date = new Date(year, monthIndex, 15); // Mitad del mes para mejor alineación
        const offsetDays = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const percentage = Math.max(0, Math.min(100, (offsetDays / totalDays) * 100)); // Clamp entre 0-100
        return { label, percentage };
    });

    return labels;
});

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

        // Usar JSON importado directamente para cada lote
        if (loteConfig.value.fieldId === "286") {
            diagnosticoData.value = laQuerenciaData;
        } else if (loteConfig.value.fieldId === "288") {
            diagnosticoData.value = laQuerenciaLote2Data;
        } else if (loteConfig.value.fieldId === "289") {
            diagnosticoData.value = laQuerenciaLote20Data;
        } else if (loteConfig.value.fieldId === "291") {
            diagnosticoData.value = hymLomasLote2Data;
        } else if (loteConfig.value.fieldId === "292") {
            diagnosticoData.value = mungeLote1Data;
        } else if (loteConfig.value.fieldId === "293") {
            diagnosticoData.value = elmerLote8Data;
        } else {
            // Para otros lotes, usar fetch (fallback)
            const response = await fetch(loteConfig.value.dataUrl);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            diagnosticoData.value = data;
        }
    } catch (err) {
        console.error("Error cargando datos de diagnóstico:", err);
        error.value = err instanceof Error ? err.message : "Error desconocido al cargar los datos";
    } finally {
        loading.value = false;
    }
}

// Función para exportar todos los JSONs filtrados a ZIP
async function exportJsonsToZip() {
    try {
        const zip = new JSZip();
        const allData = [
            { name: "forlin-lote-4-286.json", data: laQuerenciaData },
            { name: "la-querencia-lote-2-288.json", data: laQuerenciaLote2Data },
            { name: "querencia-lote-20-289.json", data: laQuerenciaLote20Data },
            { name: "hym-lomas-pino-lote-2-291.json", data: hymLomasLote2Data },
            { name: "lote-munge-1-292.json", data: mungeLote1Data },
            { name: "lote-elmer-8-293.json", data: elmerLote8Data },
        ];

        allData.forEach(({ name, data }) => {
            const { captures_detail, satellite_images, ...filteredData } = data;
            zip.file(name, JSON.stringify(filteredData, null, 2));
        });

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "diagnostico-cultivos-v3.zip");
    } catch (error) {
        console.error("Error al exportar JSONs a ZIP:", error);
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

// Watcher para actualizar el título de la pestaña del navegador
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
            <h2>❌ Error al cargar los datos</h2>
            <p>{{ error }}</p>
        </div>

        <template v-else-if="diagnosticoData">
            <!-- Encabezado -->
            <div class="header">
                <div class="header-top">
                    <h1>{{ pageTitle }}</h1>
                    <div class="header-actions">
                        <div class="lote-selector">
                            <label for="lote-select">Cambiar Lote:</label>
                            <select id="lote-select" :value="loteConfig?.fieldId" @change="onLoteChange">
                                <option v-for="lote in lotes" :key="lote.fieldId" :value="lote.fieldId">{{ lote.title }} ({{ lote.fieldId }})</option>
                            </select>
                        </div>
                        <button @click="exportJsonsToZip" class="export-btn" title="Exportar todos los JSONs a ZIP">📦 Exportar ZIP</button>
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
            <div class="section">
                <h2 class="section-title">🌾 Ciclos de Cultivo</h2>

                <!-- Tablas lado a lado: Datos del Productor y Detecciones -->
                <div class="cycles-tables-container">
                    <!-- Datos del Productor -->
                    <div v-if="diagnosticoData.producer_data && diagnosticoData.producer_data.length > 0" class="producer-data-section">
                        <h3 class="table-title">�‍🌾 Datos del Productor</h3>
                        <table class="producer-table">
                            <thead>
                                <tr>
                                    <th>Cultivo Reportado</th>
                                    <th>Campaña</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(data, index) in diagnosticoData.producer_data" :key="index">
                                    <td>{{ data[1] }}</td>
                                    <td>{{ data[0] }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Tabla resumen de ciclos (siempre visible) -->
                    <div class="cycles-summary">
                        <h3 class="table-title">🔍 Ciclos Detectados</h3>
                        <table class="summary-table">
                            <thead>
                                <tr>
                                    <th>Cultivo</th>
                                    <th>Fecha Siembra</th>
                                    <th>Fecha Cosecha</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(cycle, index) in diagnosticoData.cycles" :key="index">
                                    <td class="cultivo-cell">{{ cycle.cultivo }}</td>
                                    <td>{{ formatDate(cycle.fecha_siembra) }}</td>
                                    <td>{{ formatDate(cycle.fecha_cosecha) }}</td>
                                    <td>
                                        <span class="stat-badge" :class="cycle.estado_salud?.toLowerCase()">
                                            {{ cycle.estado_salud }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Sección colapsable para detalles -->
                <div class="collapsible-section">
                    <div class="section-header" @click="cyclesSectionCollapsed = !cyclesSectionCollapsed">
                        <h3 class="collapsible-title">📊 Análisis Detallado de Ciclos</h3>
                        <button class="collapse-toggle" :class="{ collapsed: cyclesSectionCollapsed }">
                            {{ cyclesSectionCollapsed ? "▶" : "▼" }}
                        </button>
                    </div>
                    <div v-show="!cyclesSectionCollapsed" class="section-content">
                        <CyclesSection :cycles="diagnosticoData.cycles || []" />
                    </div>
                </div>
            </div>

            <!-- Gráfico unificado -->
            <div class="chart-section">
                <div class="chart-header">
                    <h2 class="chart-title">📊 Precipitación, Temperatura e Índices de Vegetación - {{ useDailyData ? "Evolución Diaria" : "Evolución Mensual" }}</h2>
                    <IndicesInfoButton />
                </div>

                <div class="chart-controls">
                    <button @click="useDailyData = !useDailyData" :class="['data-source-toggle', useDailyData ? 'daily-active' : 'monthly-active']" title="Cambiar entre datos mensuales y diarios">
                        {{ useDailyData ? "Datos Diarios (captures_detail)" : "Datos Mensuales (monthly_summary)" }}
                    </button>
                    <button v-for="(config, index) in DATASET_CONFIGS" :key="config.key" :class="getButtonClass(index)" @click="toggleDataset(index)" :style="{ borderLeft: '4px solid ' + config.color }">
                        {{ config.label }}
                    </button>
                </div>

                <div class="chart-wrapper">
                    <Line :key="loteConfig?.fieldId" :data="unifiedChartData as ChartData<'line'>" :options="unifiedChartOptions as ChartOptions<'line'>" />
                </div>

                <!-- Barra de cobertura de cultivos -->
                <div v-if="cultivosTimeline.length > 0" class="cultivos-coverage-section">
                    <h3 class="coverage-title">🌾 Cobertura de Cultivos en el Período</h3>
                    <div class="coverage-bar-container">
                        <div class="coverage-bar-timeline">
                            <div
                                v-for="(segment, index) in cultivosTimeline"
                                :key="`${segment.name}-${index}`"
                                class="coverage-segment-timeline"
                                :style="{
                                    left: segment.startPercentage + '%',
                                    width: segment.widthPercentage + '%',
                                    backgroundColor: segment.color,
                                }"
                                :title="`${segment.name}: ${segment.fecha_siembra ? formatDate(segment.fecha_siembra) : 'N/A'} - ${segment.fecha_cosecha ? formatDate(segment.fecha_cosecha) : 'N/A'} (${segment.cycleDays} días)`"
                            ></div>
                        </div>
                        <!-- Eje x con fechas -->
                        <div class="timeline-axis">
                            <div v-for="(label, index) in timelineLabels" :key="index" class="axis-label" :style="{ left: label.percentage + '%' }">
                                {{ label.label }}
                            </div>
                        </div>
                    </div>

                    <!-- Leyenda de cultivos -->
                    <div class="cultivos-legend">
                        <div v-for="cultivo in cultivosCoverage" :key="cultivo.name" class="legend-item-cultivo">
                            <div class="legend-color-cultivo" :style="{ backgroundColor: cultivo.color }"></div>
                            <span class="legend-text-cultivo">{{ cultivo.name }} ({{ cultivo.percentage.toFixed(1) }}%)</span>
                        </div>
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

.header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.export-btn {
    padding: 0.5rem 1rem;
    background: #238636;
    border: 1px solid #238636;
    border-radius: 6px;
    color: white;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.export-btn:hover {
    background: #2ea043;
    border-color: #2ea043;
}

.export-btn:active {
    background: #238636;
    border-color: #238636;
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

.data-source-toggle {
    padding: 0.5rem 1rem;
    background: #0d1117;
    border: 2px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 0.5rem;
}

.data-source-toggle:hover {
    background: #21262d;
    border-color: #58a6ff;
}

.daily-active {
    background: #22c55e;
    color: white;
    border-color: #22c55e;
}

.monthly-active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
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

/* Estilos para barra de cobertura de cultivos */
.cultivos-coverage-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #30363d;
}

.coverage-title {
    color: #e6edf3;
    font-size: 1.2rem;
    margin: 0 0 1rem 0;
    font-weight: 600;
}

.coverage-bar-container {
    margin-bottom: 1.5rem;
}

.timeline-axis {
    position: relative;
    height: 40px;
    margin-top: 5px;
}

.axis-label {
    position: absolute;
    top: 10px;
    transform: translateX(-90%) rotate(-45deg);
    transform-origin: center top;
    color: #8b949e;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
}

.coverage-bar {
    width: 100%;
    height: 40px;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 8px;
    display: flex;
    overflow: hidden;
    position: relative;
}

.coverage-bar-timeline {
    width: 100%;
    height: 40px;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
}

.coverage-segment {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    position: relative;
    min-width: 2px;
}

.coverage-segment-timeline {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    position: absolute;
    top: 0;
    min-width: 2px;
    border-radius: 4px;
    z-index: 1;
    cursor: pointer;
}

.coverage-segment:hover {
    filter: brightness(1.2);
    z-index: 10;
}

.coverage-percentage {
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
}

.cultivos-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
}

.legend-item-cultivo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.legend-item-cultivo:hover {
    border-color: #58a6ff;
    transform: translateY(-1px);
}

.legend-color-cultivo {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    flex-shrink: 0;
}

.legend-text-cultivo {
    color: #e6edf3;
    font-size: 0.9rem;
    font-weight: 500;
}

/* Estilos para sección de ciclos */
.section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #161b22;
    border-radius: 8px;
    border: 1px solid #30363d;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    padding: 0.5rem;
    margin: -0.5rem;
    border-radius: 6px;
    transition: background-color 0.2s ease;
}

.section-header:hover {
    background: #1c2128;
}

.section-title {
    color: #e6edf3;
    font-size: 1.5rem;
    margin: 0 0 1.5rem 0;
    font-weight: 600;
}

.collapsible-section {
    margin-top: 1.5rem;
    border-top: 1px solid #30363d;
    padding-top: 1.5rem;
}

.collapsible-title {
    color: #e6edf3;
    font-size: 1.2rem;
    margin: 0;
    font-weight: 600;
}

.collapse-toggle {
    background: none;
    border: none;
    color: #8b949e;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
}

.collapse-toggle:hover {
    background: #21262d;
    color: #e6edf3;
}

.collapse-toggle.collapsed {
    transform: rotate(0deg);
}

.collapse-toggle:not(.collapsed) {
    transform: rotate(90deg);
}

.section-content {
    margin-top: 1rem;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Estilos para tabla resumen de ciclos */
.cycles-tables-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

@media (max-width: 1024px) {
    .cycles-tables-container {
        grid-template-columns: 1fr;
    }
}

.cycles-summary {
    overflow-x: auto;
}

.table-title {
    color: #e6edf3;
    font-size: 1.1rem;
    margin: 0 0 1rem 0;
}

.summary-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 8px;
    overflow: hidden;
}

.summary-table th,
.summary-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #30363d;
}

.summary-table th {
    background: #161b22;
    color: #e6edf3;
    font-weight: 600;
}

.summary-table td {
    color: #8b949e;
}

.summary-table tbody tr:hover {
    background: #161b22;
}

.cultivo-cell {
    font-weight: 600;
    color: #e6edf3;
}

.producer-data-section {
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    overflow-x: auto;
}

.producer-data-title {
    color: #e6edf3;
    font-size: 1.3rem;
    margin: 0 0 1rem 0;
}

.producer-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 8px;
    overflow: hidden;
}

.producer-table th,
.producer-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #30363d;
}

.producer-table th {
    background: #161b22;
    color: #e6edf3;
    font-weight: 600;
}

.producer-table td {
    color: #8b949e;
}

.producer-table tbody tr:hover {
    background: #161b22;
}

.stat-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-block;
}

.stat-badge.excelente {
    background: #238636;
    color: white;
}

.stat-badge.bueno {
    background: #3fb950;
    color: white;
}

.stat-badge.regular {
    background: #f0883e;
    color: white;
}

.stat-badge.malo {
    background: #f85149;
    color: white;
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
