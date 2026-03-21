<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    type ChartOptions,
    type ChartData
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { useComparativasData } from '@/composables/useComparativasData'
import { getAllRegions } from '@/config/regiones'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

const route = useRoute()

// Obtener región del query string
const regionId = computed(() => route.query.region as string || 'inta')

// Estado reactivo para el composable
const composableState = ref<ReturnType<typeof useComparativasData> | null>(null)

// Inicializar composable
function initComposable() {
    composableState.value = useComparativasData(regionId.value)
}

// Inicializar al montar
initComposable()

// Watch para recrear cuando cambie la región
watch(regionId, () => {
    initComposable()
})

// Exponer estado del composable
const data = computed(() => composableState.value?.data ?? null)
const loading = computed(() => composableState.value?.loading ?? true)
const error = computed(() => composableState.value?.error ?? null)
const regionConfig = computed(() => composableState.value?.regionConfig)
const monthlyData = computed(() => composableState.value?.monthlyData ?? [])
const yearSummary = computed(() => composableState.value?.yearSummary ?? [])
const chartLabels = computed(() => composableState.value?.chartLabels ?? [])
const chartDatasets = computed(() => composableState.value?.chartDatasets ?? [])
const hasIncompleteData = computed(() => composableState.value?.hasIncompleteData ?? false)
const fetchData = async () => {
    await composableState.value?.fetchData()
    updateChartData()
}

const availableRegions = getAllRegions()

// Datos reactivos para el gráfico
const chartData = ref<ChartData<'line'>>({
    labels: [],
    datasets: []
})

// Opciones del gráfico
const chartOptions = computed((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false
    },
    plugins: {
        legend: {
            labels: {
                color: '#e6edf3'
            }
        },
        tooltip: {
            backgroundColor: '#0f3460',
            titleColor: '#00d9ff',
            bodyColor: '#e6edf3',
            borderColor: '#00d9ff',
            borderWidth: 1,
            callbacks: {
                label: function (context) {
                    return context.dataset.label + ': ' + context.parsed.y + ' mm'
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: 'Milímetros (mm)',
                color: '#00d9ff'
            },
            ticks: {
                color: '#a0a0a0'
            },
            grid: {
                color: 'rgba(15, 52, 96, 0.5)'
            }
        },
        x: {
            title: {
                display: true,
                text: 'Meses',
                color: '#00d9ff'
            },
            ticks: {
                color: '#a0a0a0',
                maxRotation: 45,
                minRotation: 45
            },
            grid: {
                color: 'rgba(15, 52, 96, 0.5)'
            }
        }
    }
}))

// Actualizar datos del gráfico
function updateChartData() {
    chartData.value = {
        labels: chartLabels.value,
        datasets: chartDatasets.value.map(ds => ({
            ...ds,
            // Manejar valores nulos para Meteoblue
            data: ds.label === 'Meteoblue' 
                ? monthlyData.value.map(m => m.meteoblue ?? null)
                : ds.data
        }))
    }
}

// Cargar datos
async function loadData() {
    await fetchData()
    updateChartData()
}

onMounted(async () => {
    await loadData()
})

// Watch for query param changes
watch(
    () => route.query.region,
    async () => {
        await loadData()
    }
)

// Helpers para formateo
function formatDiff(diff: number | null): string {
    if (diff === null) return 'Sin datos';
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff} mm`;
}

function getDiffClass(diff: number | null): string {
    if (diff === null) return '';
    return diff >= 0 ? 'positivo' : 'negativo';
}

function formatTotal(diff: number): string {
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff} mm`;
}
</script>

<template>
    <div class="container">
        <!-- Selector de región -->
        <div class="region-selector">
            <label for="region-select">Seleccionar Región:</label>
            <select 
                id="region-select"
                :value="regionId"
                @change="($event.target as HTMLSelectElement).value && ($router as any).push({ query: { region: ($event.target as HTMLSelectElement).value } })"
            >
                <option 
                    v-for="region in availableRegions" 
                    :key="region.id" 
                    :value="region.id"
                >
                    {{ region.label }}
                </option>
            </select>
        </div>

        <!-- Estado: Región no válida -->
        <div v-if="!regionConfig" class="error-message">
            <h2>⚠️ Región no válida</h2>
            <p>No se encontró la configuración para esta región.</p>
            <p>Regiones disponibles: {{ availableRegions.map(r => r.id).join(', ') }}</p>
        </div>

        <!-- Estado: Cargando -->
        <div v-else-if="loading" class="loading">
            Cargando datos...
        </div>

        <!-- Estado: Error -->
        <div v-else-if="error" class="error-message">
            <h2>⚠️ Error al cargar los datos</h2>
            <p>{{ error }}</p>
        </div>

        <!-- Datos cargados -->
        <template v-else-if="data">
            <div class="header">
                <h1>📊 {{ data.titulo }}</h1>
                <p class="subtitle">{{ data.subtitulo }}</p>
            </div>

            <!-- Tabla comparativa mensual -->
            <div class="table-section">
                <table class="comparativa-table" id="comparativa">
                    <thead>
                        <tr>
                            <th>Mes</th>
                            <th>{{ regionConfig.referenceLabel }}</th>
                            <th>Meteoblue (Diferencia)</th>
                            <th>APIX (Diferencia)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="item in monthlyData" 
                            :key="item.mes"
                            :class="{ 'row-incomplete': item.isIncomplete }"
                        >
                            <td>{{ item.mes }}</td>
                            <td>
                                {{ item.isIncomplete ? '0 mm*' : item.referencia + ' mm' }}
                            </td>
                            <td 
                                :class="{ 
                                    'best-match': item.isMeteoBest && !item.isIncomplete,
                                    'cell-incomplete': item.isIncomplete 
                                }"
                            >
                                <template v-if="item.meteoblue === null">
                                    Sin datos
                                </template>
                                <template v-else>
                                    {{ item.meteoblue }} mm 
                                    (<span :class="getDiffClass(item.diffMeteo)">
                                        {{ formatDiff(item.diffMeteo) }}
                                    </span>)
                                </template>
                            </td>
                            <td :class="{ 'best-match': item.isApixBest }">
                                {{ item.apix }} mm 
                                (<span :class="getDiffClass(item.diffApix)">
                                    {{ formatDiff(item.diffApix) }}
                                </span>)
                            </td>
                        </tr>
                        <!-- Fila de totales -->
                        <tr class="totals-row">
                            <td>TOTALES</td>
                            <td>{{ yearSummary[0].total }} mm</td>
                            <td>
                                {{ yearSummary[2].total }} mm 
                                <span class="hits">({{ yearSummary[2].hits }} ✓)</span>
                            </td>
                            <td>
                                {{ yearSummary[1].total }} mm 
                                <span class="hits">({{ yearSummary[1].hits }} ✓)</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p v-if="hasIncompleteData" class="note">
                    * Nota: El registro de algunos meses está incompleto, se usa 0 mm como referencia visual.
                </p>
            </div>

            <!-- Resumen anual -->
            <div class="summary-section">
                <h2>Resumen Acumulado Anual (Solo 2025)</h2>
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>Fuente de Datos</th>
                            <th>Total Acumulado 2025</th>
                            <th>Diferencia con la Realidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in yearSummary" :key="item.source">
                            <td :class="{ 'reference': item.isReference }">
                                <strong>{{ item.source }}</strong>
                            </td>
                            <td><strong>{{ item.total }} mm</strong></td>
                            <td>
                                <template v-if="item.isReference">-</template>
                                <template v-else>
                                    <span :class="item.difference >= 0 ? 'positivo' : 'negativo'">
                                        {{ formatTotal(item.difference) }}
                                    </span>
                                </template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Gráfico -->
            <div class="chart-section">
                <h2>Evolución de las Precipitaciones</h2>
                <div class="chart-container">
                    <Line 
                        :key="regionId" 
                        :data="chartData" 
                        :options="chartOptions" 
                    />
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
}

.region-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #0d1117;
    border-radius: 8px;
    border: 1px solid #30363d;
}

.region-selector label {
    color: #8b949e;
    font-weight: 500;
}

.region-selector select {
    padding: 0.5rem 1rem;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
    font-size: 1rem;
    cursor: pointer;
}

.region-selector select:focus {
    outline: none;
    border-color: #58a6ff;
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
    text-align: center;
}

.header h1 {
    color: #e6edf3;
    font-size: 2rem;
    margin: 0 0 0.5rem;
}

.subtitle {
    color: #8b949e;
    font-size: 1.1rem;
    margin: 0;
}

.table-section,
.summary-section,
.chart-section {
    background: #0d1117;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #30363d;
    margin-bottom: 2rem;
}

.table-section h2,
.summary-section h2,
.chart-section h2 {
    color: #00d9ff;
    font-size: 1.5rem;
    margin: 0 0 1.5rem;
    text-align: center;
}

.comparativa-table,
.summary-table {
    width: 100%;
    border-collapse: collapse;
}

.comparativa-table th,
.comparativa-table td,
.summary-table th,
.summary-table td {
    border: 1px solid #0f3460;
    padding: 12px;
    text-align: center;
}

.comparativa-table th,
.summary-table th {
    background: #0f3460;
    color: #00d9ff;
    font-weight: bold;
}

.comparativa-table tbody tr:nth-child(even),
.summary-table tbody tr:nth-child(even) {
    background: #1f2b4d;
}

.comparativa-table tbody tr:nth-child(odd),
.summary-table tbody tr:nth-child(odd) {
    background: #16213e;
}

.row-incomplete {
    opacity: 0.7;
}

.cell-incomplete {
    font-style: italic;
    color: #8b949e;
}

.best-match {
    position: relative;
    background: rgba(0, 255, 127, 0.15) !important;
}

.best-match::after {
    content: '✓';
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #00ff7f;
    font-size: 1.2em;
    font-weight: bold;
}

.totals-row {
    font-weight: bold;
    background: #0f3460 !important;
}

.totals-row td {
    border-color: #00d9ff;
}

.hits {
    color: #ffffff;
    margin-left: 0.5rem;
}

.positivo {
    color: #00ff7f;
    font-weight: bold;
}

.negativo {
    color: #ff6b6b;
    font-weight: bold;
}

.reference {
    color: #00d9ff;
}

.note {
    font-size: 0.85em;
    color: #a0a0a0;
    margin-top: 1rem;
    text-align: center;
}

.chart-container {
    height: 400px;
    position: relative;
}
</style>
