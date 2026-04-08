<template>
    <div class="images-section" v-if="satelliteImages.length > 0">
        <div class="images-header">
            <h2 class="images-title">? Imágenes Satelitales Utilizadas</h2>
            <div class="images-header-actions">
                <IndicesInfoButton />
                <div class="image-filter" v-if="imageTypes.length > 1">
                    <label for="image-type-select">Filtrar por tipo:</label>
                    <select id="image-type-select" :value="selectedImageType" @change="(e: Event) => $emit('update:selectedImageType', (e.target as HTMLSelectElement).value)">
                        <option value="all">Todos los tipos</option>
                        <option v-for="type in imageTypes" :key="type" :value="type">{{ type }}</option>
                    </select>
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
                    <span class="image-cloud" :class="{ 'has-clouds': img.cloud_coverage > 0 }">Nubes: {{ (img.cloud_coverage / 100).toFixed(1) }}%</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SatelliteImageV3 } from "../types-v3";
import { getImageTypeColor, formatDate } from "../composables-v3";
import IndicesInfoButton from "@/components/IndicesInfoButton.vue";

interface Props {
    satelliteImages: SatelliteImageV3[];
    imageTypes: string[];
    selectedImageType: string;
}

const props = defineProps<Props>();

const filteredSatelliteImages = computed(() => {
    if (props.selectedImageType === "all") {
        return props.satelliteImages;
    }
    return props.satelliteImages.filter(img => img.type === props.selectedImageType);
});
</script>

<style scoped>
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

/* Estilos para las acciones del header de imágenes */
.images-header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}
</style>
