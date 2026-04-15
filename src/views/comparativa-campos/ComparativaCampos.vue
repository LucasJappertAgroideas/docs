<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, type ChartOptions, type ChartData } from "chart.js";
import { Line } from "vue-chartjs";
import forlinData from "./data/forlin-lote-4-286.json";
import laQuerenciaLote2Data from "./data/la-querencia-lote-2-288.json";
import querenciaLote20Data from "./data/querencia-lote-20-289.json";
import hymLomasLote2Data from "./data/hym-lomas-pino-lote-2-291.json";
import mungeLote1Data from "./data/lote-munge-1-292.json";
import elmerLote8Data from "./data/lote-elmer-8-293.json";
import { getCommonLabels, getFieldIndexData, getFieldColor, INDEX_OPTIONS, getIndexLabel, getIndexRange } from "./composables";
import type { FieldData, MonthlySummary } from "./types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Configuración de campos
const fieldsConfig = [
    { id: "286", title: "La Querencia Lote 4", data: forlinData as FieldData },
    { id: "288", title: "La Querencia Lote 2", data: laQuerenciaLote2Data as FieldData },
    { id: "289", title: "La Querencia Lote 20", data: querenciaLote20Data as FieldData },
    { id: "291", title: "H Y M Lomas Lote 2", data: hymLomasLote2Data as FieldData },
    { id: "292", title: "Munge Lote 1", data: mungeLote1Data as FieldData },
    { id: "293", title: "Elmer Lote 8", data: elmerLote8Data as FieldData },
];

// Estado
const loading = ref(true);
const selectedIndex = ref<keyof MonthlySummary>("ndvi_avg");

// Datos procesados
const fieldsData = computed(() => fieldsConfig.map(f => f.data));
const commonLabels = computed(() => getCommonLabels(fieldsData.value));

// Datos del gráfico
const chartData = computed<ChartData<"line", (number | null)[], string>>(() => {
    const datasets = fieldsConfig.map(field => {
        const data = getFieldIndexData(field.data, selectedIndex.value, commonLabels.value);
        return {
            label: field.title,
            data: data,
            borderColor: getFieldColor(field.id),
            backgroundColor: getFieldColor(field.id),
            borderWidth: 1,
            tension: 0.1,
            pointRadius: 2,
            pointHoverRadius: 5,
        };
    });

    return {
        labels: commonLabels.value,
        datasets: datasets,
    };
});

// Opciones del gráfico
const chartOptions = computed<ChartOptions<"line">>(() => {
    const indexRange = getIndexRange(fieldsData.value, selectedIndex.value);
    const indexLabel = getIndexLabel(selectedIndex.value);

    return {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
            legend: {
                position: "top" as const,
                labels: {
                    color: "#e6edf3",
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                mode: "index" as const,
                intersect: false,
                backgroundColor: "rgba(22, 27, 34, 0.95)",
                titleColor: "#e6edf3",
                bodyColor: "#c9d1d9",
                borderColor: "#30363d",
                borderWidth: 1,
            },
            title: {
                display: true,
                text: `Comparativa de ${indexLabel} entre Campos`,
                color: "#e6edf3",
                font: {
                    size: 16,
                    weight: "bold" as const,
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Mes",
                    color: "#8b949e",
                },
                ticks: {
                    color: "#8b949e",
                    maxRotation: 45,
                    minRotation: 45,
                },
                grid: {
                    color: "#30363d",
                },
            },
            y: {
                title: {
                    display: true,
                    text: indexLabel,
                    color: "#8b949e",
                },
                ticks: {
                    color: "#8b949e",
                },
                grid: {
                    color: "#30363d",
                },
                min: indexRange.min * 0.9,
                max: indexRange.max * 1.1,
            },
        },
        interaction: {
            mode: "nearest" as const,
            axis: "x" as const,
            intersect: false,
        },
    };
});

// Inicialización
onMounted(() => {
    loading.value = false;
});
</script>

<template>
    <div class="comparativa-container">
        <div class="controls">
            <label for="index-select">Seleccionar Índice:</label>
            <select id="index-select" v-model="selectedIndex" class="index-select">
                <option v-for="option in INDEX_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                </option>
            </select>
        </div>

        <div class="chart-container" v-if="!loading">
            <Line :data="chartData" :options="chartOptions" />
        </div>

        <div class="loading" v-else>
            <p>Cargando datos...</p>
        </div>
    </div>
</template>

<style scoped>
.comparativa-container {
    max-width: 1800px;
    margin: 0 auto;
    padding: 5px;
}

.header {
    text-align: center;
}

.header h1 {
    color: #e6edf3;
    font-size: 5px;
    margin: 0 0 0.5rem 0;
}

.header p {
    color: #8b949e;
    font-size: 1rem;
    margin: 0;
}

.controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(22, 27, 34, 0.95);
    border: 1px solid #30363d;
    border-radius: 8px;
}

.controls label {
    color: #e6edf3;
    font-weight: 600;
}

.index-select {
    padding: 0.5rem 1rem;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
    font-size: 1rem;
    cursor: pointer;
    min-width: 200px;
}

.index-select:hover {
    border-color: #58a6ff;
}

.index-select:focus {
    outline: none;
    border-color: #58a6ff;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
}

.chart-container {
    background: rgba(22, 27, 34, 0.95);
    border: 1px solid #30363d;
    border-radius: 12px;
    padding: 5px;
    margin-bottom: 5px;
}

.loading {
    text-align: center;
    padding: 4rem;
    color: #8b949e;
}

.loading p {
    font-size: 1.5px;
}
</style>
