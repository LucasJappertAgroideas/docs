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
  imagesByType,
  imagesByMonth,
  fetchClimateData
} = useClimateData()

const groupBy = ref<'type' | 'month'>('month')

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
  await fetchClimateData('/don_avelino/datos-don-avelino.json')
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

      <div class="images-section">
        <div class="images-header">
          <h2 class="images-title">
            {{ groupBy === 'type' ? 'Imágenes por Tipo de Índice' : 'Imágenes por Mes' }}
          </h2>
          <div class="group-by-controls">
            <button 
              :class="['group-btn', { active: groupBy === 'type' }]"
              @click="groupBy = 'type'"
            >
              Por Tipo
            </button>
            <button 
              :class="['group-btn', { active: groupBy === 'month' }]"
              @click="groupBy = 'month'"
            >
              Por Mes
            </button>
          </div>
        </div>
        
        <!-- Agrupar por tipo -->
        <template v-if="groupBy === 'type'">
          <div 
            v-for="(images, type) in imagesByType" 
            :key="type" 
            class="image-type-group"
          >
            <h3 class="image-type-title">{{ type.toUpperCase() }}</h3>
            <div class="image-gallery">
              <div 
                v-for="item in images" 
                :key="item.date" 
                class="image-card"
              >
                <div class="image-container">
                  <img 
                    :src="item.img" 
                    :alt="type.toUpperCase() + ' - ' + item.date"
                    class="index-image"
                  />
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
          <div 
            v-for="(images, month) in imagesByMonth" 
            :key="month" 
            class="image-type-group"
          >
            <h3 class="image-type-title">{{ month }}</h3>
            <div class="image-gallery">
              <div 
                v-for="item in images" 
                :key="item.date + item.type" 
                class="image-card"
              >
                <div class="image-container">
                  <img 
                    :src="item.img" 
                    :alt="item.type.toUpperCase() + ' - ' + item.date"
                    class="index-image"
                  />
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
</template>

<style scoped>
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
  gap: 8px;
}

.image-card {
  background: #161b22;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #30363d;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 170px;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.image-container {
  width: 100%;
  height: 120px;
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
</style>
