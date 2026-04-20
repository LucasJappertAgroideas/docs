<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, type ChartOptions } from "chart.js";
import { Line } from "vue-chartjs";
import { useProductivityMaps, getImageTypeColor, formatDate, imageMeetsThreshold } from "./composables/composables";
import type { FieldOption } from "./types/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const route = useRoute();
const router = useRouter();

const { mapData, loading, error, loadMapDataAsync, indexTypes, chartLabels, chartDatasets, allSatelliteImagesFlat, getThresholdForIndex } = useProductivityMaps();

// Lista de campos disponibles
const fieldOptions: FieldOption[] = [
    { id: "288", name: "La Querencia - Lote 2", filename: "la-querencia-lote-2-288" },
    { id: "286", name: "Forlin - Lote 4", filename: "forlin-lote-4-286" },
    { id: "289", name: "Querencia - Lote 20", filename: "querencia-lote-20-289" },
];

// Obtener el campo seleccionado desde la URL o usar el primero por defecto
const getFieldFromQuery = (): FieldOption => {
    const fieldId = (route.query.field_id as string) || fieldOptions[0].id;
    const field = fieldOptions.find(f => f.id === fieldId);
    return field || fieldOptions[0];
};

const selectedField = ref<FieldOption>(getFieldFromQuery());
const selectedImageFilter = ref<string>("all");
const filterByThreshold = ref<boolean>(true);

const chartOptions = computed<ChartOptions<"line">>(() => ({
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
        legend: {
            display: true,
            position: "top",
        },
        tooltip: {
            mode: "index",
            intersect: false,
        },
    },
    scales: {
        x: {
            display: true,
            title: {
                display: true,
                text: "Mes",
            },
        },
        y: {
            display: true,
            title: {
                display: true,
                text: "Valor del Índice",
            },
        },
    },
}));

const filteredSatelliteImages = computed(() => {
    let filtered = allSatelliteImagesFlat.value;

    // Filtrar por tipo
    if (selectedImageFilter.value !== "all") {
        filtered = filtered.filter(img => img.type === selectedImageFilter.value);
    }

    // Filtrar por threshold si el checkbox está marcado
    if (filterByThreshold.value) {
        filtered = filtered.filter(img => imageMeetsThreshold(img, mapData.value));
    }

    return filtered;
});

const onFieldChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const fieldId = target.value;
    const field = fieldOptions.find(f => f.id === fieldId);
    if (field) {
        selectedField.value = field;
        loadMapDataAsync(field.filename);
    }
};

// Watcher para actualizar la URL cuando cambia el campo seleccionado
watch(selectedField, newField => {
    router.push({
        query: { ...route.query, field_id: newField.id },
    });
});

onMounted(() => {
    loadMapDataAsync(selectedField.value.filename);
});
</script>

<template>
    <div class="mapas-productividad-container">
        <div class="loading" v-if="loading">
            <p>Cargando datos...</p>
        </div>
        <div v-else-if="error">
            <p class="error">{{ error }}</p>
        </div>
        <div v-else-if="mapData">
            <!-- Encabezado -->
            <div class="header">
                <div class="header-top">
                    <h1>Mapas de Productividad - Lote {{ selectedField.id }}</h1>
                    <div class="field-selector">
                        <label for="field-select">Campo:</label>
                        <select id="field-select" :value="selectedField.id" @change="onFieldChange">
                            <option v-for="field in fieldOptions" :key="field.id" :value="field.id">{{ field.name }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Sección de mapas -->
            <section class="maps-section">
                <div class="maps-grid">
                    <div v-for="(map, indexType) in mapData.individual_maps" :key="indexType" class="map-card">
                        <h3>{{ indexType }}</h3>
                        <img :src="map.map_image_url" :alt="`Mapa ${indexType}`" class="map-image" />
                        <div class="map-info">
                            <p>
                                <strong>Área total:</strong>
                                {{ map.total_area_hectares }} ha
                            </p>
                            <p>
                                <strong>Threshold:</strong>
                                {{ map.dynamic_threshold_used }}
                            </p>
                        </div>
                    </div>
                    <div v-if="mapData.combined_map" class="map-card">
                        <h3>Mapa Combinado</h3>
                        <img :src="mapData.combined_map.map_image_url" alt="Mapa Combinado" class="map-image" />
                        <div class="map-info">
                            <p>
                                <strong>Área total:</strong>
                                {{ mapData.combined_map.total_area_hectares }} ha
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Sección de gráfico -->
            <section class="chart-section">
                <h2>Evolución de Índices</h2>
                <div class="chart-container">
                    <Line :data="{ labels: chartLabels, datasets: chartDatasets }" :options="chartOptions" />
                </div>
            </section>

            <!-- Sección de imágenes satelitales -->
            <section class="satellite-section">
                <div class="images-header">
                    <h2 class="images-title">Imágenes Satelitales</h2>
                    <div class="images-header-actions">
                        <div class="image-filter">
                            <label for="image-filter">Filtrar por tipo:</label>
                            <select id="image-filter" v-model="selectedImageFilter">
                                <option value="all">Todos</option>
                                <option v-for="type in indexTypes" :key="type" :value="type">{{ type }}</option>
                            </select>
                        </div>
                        <div class="threshold-filter">
                            <label for="threshold-filter">
                                <input type="checkbox" id="threshold-filter" v-model="filterByThreshold" />
                                Filtrar por threshold
                            </label>
                        </div>
                    </div>
                </div>
                <div class="image-gallery">
                    <div v-for="img in filteredSatelliteImages" :key="img.date + img.type" class="image-card">
                        <div class="image-container">
                            <img :src="img.url" :alt="img.type + ' - ' + img.date" class="index-image" />
                        </div>
                        <div class="image-info">
                            <span class="image-type-badge" :style="{ backgroundColor: getImageTypeColor(img.type) + '20', color: getImageTypeColor(img.type), borderColor: getImageTypeColor(img.type) }">{{ img.type }}</span>
                            <span class="image-date">{{ formatDate(img.date) }}</span>
                            <span class="image-value" :class="{ 'meets-threshold': imageMeetsThreshold(img, mapData), 'below-threshold': !imageMeetsThreshold(img, mapData) }">Índice: {{ img.average_index_value.toFixed(3) }}</span>
                            <span class="image-threshold">Threshold: {{ getThresholdForIndex(img.type).toFixed(3) }}</span>
                            <span class="image-cloud" :class="{ 'has-clouds': img.cloud_coverage > 0 }">Nubes: {{ (img.cloud_coverage / 100).toFixed(1) }}%</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.mapas-productividad-container {
    max-width: 1800px;
    margin: 0 auto;
    padding: 20px;
}

.loading {
    text-align: center;
    padding: 4rem;
    color: #8b949e;
}

.error {
    text-align: center;
    padding: 4rem;
    color: #f85149;
}

.header {
    margin-bottom: 2rem;
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.header h1 {
    margin: 0;
    color: #e6edf3;
}

.field-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.field-selector label {
    color: #8b949e;
}

.field-selector select {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #30363d;
    background-color: #0d1117;
    color: #e6edf3;
    cursor: pointer;
}

.maps-section,
.chart-section,
.satellite-section {
    margin-bottom: 3rem;
}

.maps-section h2,
.chart-section h2,
.satellite-section h2 {
    margin-bottom: 1.5rem;
    color: #e6edf3;
}

.maps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    /* max-height: 300px; */
    gap: 1.5rem;
}

.map-card {
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 10px;
    max-width: 300px;
    max-height: 350px;
    align-items: center;
    justify-content: center;
    display: inline-grid;
    text-align: center;
}

.map-card h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #e6edf3;
}

.map-image {
    max-width: 100%;
    height: auto;
    max-height: 200px;
    object-fit: contain;
    border-radius: 6px;
    margin-bottom: 1rem;
}

.map-info p {
    margin: 0.5rem 0;
    color: #8b949e;
}

.chart-container {
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1.5rem;
}

.filter-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.filter-controls label {
    color: #8b949e;
}

.filter-controls select {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #30363d;
    background-color: #0d1117;
    color: #e6edf3;
    cursor: pointer;
}

/* Estilos para sección de imágenes satelitales */
.satellite-section {
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

.image-value {
    color: #e6edf3;
    font-size: 0.85rem;
    font-weight: 600;
}

.image-value.meets-threshold {
    color: #3fb950;
}

.image-value.below-threshold {
    color: #f85149;
}

.image-threshold {
    color: #8b949e;
    font-size: 0.8rem;
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

/* Estilos para las acciones del header de imágenes */
.images-header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.threshold-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.threshold-filter label {
    color: #8b949e;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
}

.threshold-filter input[type="checkbox"] {
    cursor: pointer;
    accent-color: #3fb950;
}
</style>
