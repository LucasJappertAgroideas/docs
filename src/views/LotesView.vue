<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LOTE_CONFIG } from '@/config/lotes'
import { useClimateData } from '@/composables/useClimateData'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    type ChartOptions,
    type ChartData
} from 'chart.js'
import { Line } from 'vue-chartjs'
import { INDEX_CONFIGS } from '@/types/climate'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

const router = useRouter()
const route = useRoute()

// Obtener el field_id del query string o usar el primero por defecto
const selectedFieldId = computed(() => {
    const fieldId = route.query.field_id
    if (fieldId && !isNaN(Number(fieldId))) {
        return Number(fieldId)
    }
    return 198 // Por defecto: Don Avelino
})

// Obtener configuración del lote
const loteConfig = computed(() => LOTE_CONFIG[selectedFieldId.value])

// Cargar datos del lote
const {
    data,
    loading,
    error,
    labels,
    precipitationData,
    ndviData,
    maxPrecipitation,
    maxIndex,
    fetchClimateData
} = useClimateData()

// Cargar datos al montar
import { onMounted } from 'vue'
onMounted(async () => {
    if (loteConfig.value) {
        await fetchClimateData(loteConfig.value.dataUrl)
    }
})

// Watch para recargar cuando cambie el field_id
import { watch } from 'vue'
watch(selectedFieldId, async () => {
    if (loteConfig.value) {
        await fetchClimateData(loteConfig.value.dataUrl)
    }
})

// Lista de lotes disponibles
const lotes = Object.values(LOTE_CONFIG)

// Manejar cambio de selección
function onLoteChange(event: Event) {
    const fieldId = (event.target as HTMLSelectElement).value
    router.push({ query: { field_id: Number(fieldId) } })
}

// Datos del gráfico
const chartData = computed<ChartData<'line'>>(() => {
    const dataArrays = [precipitationData.value, ndviData.value]
    
    return {
        labels: labels.value,
        datasets: INDEX_CONFIGS.slice(0, 2).map((config, index) => ({
            label: config.label,
            data: dataArrays[index],
            borderColor: config.color,
            backgroundColor: config.fill ? `${config.color}15` : `${config.color}10`,
            borderWidth: config.borderWidth,
            fill: config.fill,
            tension: config.tension,
            pointBackgroundColor: config.color,
            pointBorderColor: '#0d1117',
            pointBorderWidth: 2,
            pointRadius: config.pointRadius,
            pointHoverRadius: config.pointHoverRadius,
            yAxisID: config.yAxisID
        }))
    }
})

const chartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false
    },
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            backgroundColor: 'rgba(22, 27, 34, 0.95)',
            titleColor: '#e6edf3',
            bodyColor: '#8b949e',
            borderColor: '#30363d',
            borderWidth: 1,
            padding: 12,
            displayColors: true
        }
    },
    scales: {
        x: {
            grid: {
                color: 'rgba(48, 54, 61, 0.5)'
            },
            ticks: {
                color: '#8b949e',
                maxRotation: 45,
                minRotation: 45
            }
        },
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: 'Precipitación (mm)',
                color: '#58a6ff',
                font: { weight: 'bold' }
            },
            grid: {
                color: 'rgba(48, 54, 61, 0.5)'
            },
            ticks: { color: '#58a6ff' },
            min: 0,
            max: Math.ceil(maxPrecipitation.value)
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: 'Índices de Vegetación',
                color: '#8b949e',
                font: { weight: 'bold' }
            },
            grid: { drawOnChartArea: false },
            ticks: {
                color: '#8b949e',
                callback: (value) => (value as number).toFixed(2)
            },
            min: 0,
            max: Math.ceil(maxIndex.value)
        }
    }
}))
</script>

<template>
  <div class="container">
    <div class="lotes-header">
      <h1>📍 Datos de Lotes</h1>
      
      <div class="lote-selector">
        <label for="lote-select">Seleccionar Lote:</label>
        <select 
            id="lote-select"
            :value="selectedFieldId"
            @change="onLoteChange"
        >
            <option 
                v-for="lote in lotes" 
                :key="lote.fieldId" 
                :value="lote.fieldId"
            >
                {{ lote.title }}
            </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      Cargando datos...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-message">
      <h2>⚠️ Error al cargar los datos</h2>
      <p>{{ error }}</p>
    </div>

    <!-- Datos -->
    <template v-else-if="data && loteConfig">
      <div class="header">
        <h2>{{ loteConfig.title }}</h2>
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
        <h3 class="chart-title">Precipitación e Índices de Vegetación - Evolución Mensual</h3>
        <div class="chart-wrapper">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <div class="legend-info">
          <div v-for="config in INDEX_CONFIGS.slice(0, 2)" :key="config.key" class="legend-item">
            <div class="legend-color" :style="{ backgroundColor: config.color }"></div>
            <span>{{ config.label }}</span>
          </div>
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

.lotes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.lotes-header h1 {
  color: #e6edf3;
  margin: 0;
}

.lote-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  font-size: 1rem;
  cursor: pointer;
  min-width: 250px;
}

.lote-selector select:focus {
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
}

.error-message h2 {
  color: #f85149;
  margin: 0 0 1rem;
}

.header {
  margin-bottom: 2rem;
}

.header h2 {
  color: #e6edf3;
  font-size: 1.8rem;
  margin: 0 0 1rem;
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
}

.chart-title {
  color: #e6edf3;
  font-size: 1.3rem;
  margin: 0 0 1.5rem;
}

.chart-wrapper {
  height: 400px;
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
</style>
