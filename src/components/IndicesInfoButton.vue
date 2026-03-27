<script setup lang="ts">
import { ref } from "vue";

const showModal = ref(false);

function openModal() {
    showModal.value = true;
}

function closeModal() {
    showModal.value = false;
}

const indicesInfo = [
    {
        name: "NDVI",
        fullName: "Índice de Vegetación de Diferencia Normalizada",
        description: "Mide la densidad y salud de la vegetación. Valores más altos indican vegetación más densa y saludable.",
        range: "-1 a 1",
        healthyRange: "0.6 - 0.9",
        color: "#3fb950",
    },
    {
        name: "NDVI Máx",
        fullName: "NDVI Máximo",
        description: "Valor máximo de NDVI registrado en el período, indica el pico de vigor vegetativo.",
        range: "-1 a 1",
        healthyRange: "0.7 - 0.9",
        color: "#238636",
    },
    {
        name: "RECI",
        fullName: "Índice de Reflectancia de Clorofila Red Edge",
        description: "Sensible al contenido de clorofila en las hojas, útil para detectar estrés temprano.",
        range: "0 - 10",
        healthyRange: "2 - 6",
        color: "#a371f7",
    },
    {
        name: "NDWI",
        fullName: "Índice de Agua de Diferencia Normalizada",
        description: "Mide el contenido de agua en la vegetación y el suelo.",
        range: "-1 a 1",
        healthyRange: "0.2 - 0.5",
        color: "#00d4ff",
    },
    {
        name: "NDRE",
        fullName: "Índice de Vegetación Red Edge de Diferencia Normalizada",
        description: "Similar al NDVI pero más sensible a variaciones en clorofila, ideal para cultivos densos.",
        range: "-1 a 1",
        healthyRange: "0.3 - 0.7",
        color: "#f0883e",
    },
    {
        name: "EVI",
        fullName: "Índice de Vegetación Mejorado",
        description: "Mejora la sensibilidad en áreas de alta biomasa y reduce influencias atmosféricas.",
        range: "-1 a 1",
        healthyRange: "0.3 - 0.8",
        color: "#d2a8ff",
    },
    {
        name: "GNDVI",
        fullName: "Índice de Vegetación de Diferencia Normalizada Verde",
        description: "Usa la banda verde en lugar de la roja, siendo más sensible al contenido de clorofila en las hojas. Ideal para detectar deficiencias de nitrógeno en cultivos.",
        range: "-1 a 1",
        healthyRange: "0.2 - 0.8",
        color: "#8b5cf6",
    },
];
</script>

<template>
    <div class="indices-info-container">
        <button class="info-button" @click="openModal" title="Información sobre índices de vegetación">
            <span class="info-icon">ℹ️</span>
            <span class="info-text">Índices info</span>
        </button>

        <Teleport to="body">
            <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📊 Información de Índices de Vegetación</h2>
                        <button class="close-button" @click="closeModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <div v-for="index in indicesInfo" :key="index.name" class="index-card">
                            <div class="index-header">
                                <span class="index-badge" :style="{ backgroundColor: index.color + '20', color: index.color, borderColor: index.color }">
                                    {{ index.name }}
                                </span>
                                <span class="index-full-name">{{ index.fullName }}</span>
                            </div>
                            <p class="index-description">{{ index.description }}</p>
                            <div class="index-ranges">
                                <div class="range-item">
                                    <span class="range-label">Rango:</span>
                                    <span class="range-value">{{ index.range }}</span>
                                </div>
                                <div class="range-item">
                                    <span class="range-label">Rango saludable:</span>
                                    <span class="range-value healthy">{{ index.healthyRange }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.indices-info-container {
    display: inline-block;
}

.info-button {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #58a6ff;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.info-button:hover {
    background: #21262d;
    border-color: #58a6ff;
    color: #79c0ff;
}

.info-icon {
    font-size: 1rem;
}

.info-text {
    font-size: 0.8rem;
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    padding: 1rem;
}

.modal-content {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 12px;
    max-width: 1000px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #30363d;
    background: #161b22;
}

.modal-header h2 {
    color: #e6edf3;
    font-size: 1.25rem;
    margin: 0;
}

.close-button {
    background: none;
    border: none;
    color: #8b949e;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
    transition: color 0.2s ease;
}

.close-button:hover {
    color: #e6edf3;
}

.modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.index-card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1rem;
}

.index-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
}

.index-badge {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 700;
    border: 1px solid transparent;
}

.index-full-name {
    color: #e6edf3;
    font-size: 0.9rem;
    font-weight: 500;
}

.index-description {
    color: #8b949e;
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0.5rem 0;
}

.index-ranges {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.range-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.range-label {
    color: #8b949e;
    font-size: 0.8rem;
    font-weight: 500;
}

.range-value {
    color: #e6edf3;
    font-size: 0.85rem;
    font-weight: 600;
}

.range-value.healthy {
    color: #3fb950;
}
</style>
