<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
import { useClimateData } from '@/composables/useClimateData'
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

const {
  data,
  loading,
  error,
  labels,
  precipitationData,
  ndviData,
  ndwiData,
  ndreData,
  reciData,
  eviData,
  infrarrojoData,
  maxPrecipitation,
  maxIndex,
  fetchClimateData
} = useClimateData()

const hiddenDatasets = ref<Set<number>>(new Set())

const chartData = ref<ChartData<'line'>>({
  labels: [],
  datasets: []
})

const chartOptions = ref<ChartOptions<'line'>>({
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
      displayColors: true,
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          const yValue = context.parsed.y ?? 0
          if (context.dataset.yAxisID === 'y') {
            label += yValue + ' mm'
          } else {
            label += yValue.toFixed(2)
          }
          return label
        }
      }
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
        font: {
          weight: 'bold'
        }
      },
      grid: {
        color: 'rgba(48, 54, 61, 0.5)'
      },
      ticks: {
        color: '#58a6ff'
      },
      min: 0
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: {
        display: true,
        text: 'Índices de Vegetación',
        color: '#8b949e',
        font: {
          weight: 'bold'
        }
      },
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        color: '#8b949e',
        callback: function (value) {
          return (value as number).toFixed(2)
        }
      },
      min: 0
    }
  }
})

function updateChartData() {
  const dataArrays = [
    precipitationData.value,
    ndviData.value,
    ndwiData.value,
    ndreData.value,
    reciData.value,
    eviData.value,
    infrarrojoData.value
  ]

  chartData.value = {
    labels: labels.value,
    datasets: INDEX_CONFIGS.map((config, index) => ({
      label: config.label,
      data: dataArrays[index],
      borderColor: config.color,
      backgroundColor: config.fill 
        ? `${config.color}15` 
        : `${config.color}10`,
      borderWidth: config.borderWidth,
      fill: config.fill,
      tension: config.tension,
      pointBackgroundColor: config.color,
      pointBorderColor: '#0d1117',
      pointBorderWidth: 2,
      pointRadius: config.pointRadius,
      pointHoverRadius: config.pointHoverRadius,
      yAxisID: config.yAxisID,
      hidden: hiddenDatasets.value.has(index)
    }))
  }

  if (chartOptions.value.scales?.y) {
    chartOptions.value.scales.y.max = maxPrecipitation.value
  }
  if (chartOptions.value.scales?.y1) {
    chartOptions.value.scales.y1.max = maxIndex.value
  }
}

function toggleDataset(index: number) {
  if (hiddenDatasets.value.has(index)) {
    hiddenDatasets.value.delete(index)
  } else {
    hiddenDatasets.value.add(index)
  }
  updateChartData()
}

function getButtonClass(index: number): string {
  return hiddenDatasets.value.has(index) ? 'toggle-btn' : 'toggle-btn active'
}

onMounted(async () => {
  await fetchClimateData('/datos-don-avelino.json')
  updateChartData()
})
</script>

<template>
  <div class="container">
    <div v-if="loading" class="loading">
      Cargando datos...
    </div>

    <div v-else-if="error" class="error-message">
      <h2>⚠️ Error al cargar los datos</h2>
      <p>{{ error }}</p>
    </div>

    <template v-else-if="data">
      <div class="header">
        <h1>📍 Lote Don Avelino</h1>
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
        <h2 class="chart-title">Precipitación e Índices de Vegetación - Evolución Mensual</h2>
        
        <div class="chart-controls">
          <button
            v-for="(config, index) in INDEX_CONFIGS"
            :key="config.key"
            :class="getButtonClass(index)"
            @click="toggleDataset(index)"
          >
            {{ config.label.replace(' (mm)', '').replace('Índices de Vegetación', '') }}
          </button>
        </div>

        <div class="chart-wrapper">
          <Line :data="chartData" :options="chartOptions" />
        </div>

        <div class="legend-info">
          <div 
            v-for="(config, index) in INDEX_CONFIGS" 
            :key="config.key"
            class="legend-item"
            :style="{ opacity: hiddenDatasets.has(index) ? 0.4 : 1 }"
          >
            <div 
              class="legend-color" 
              :style="{ backgroundColor: config.color }"
            ></div>
            <span>{{ config.label }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
