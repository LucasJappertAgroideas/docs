<template>
    <div class="section">
        <h2 class="section-title">? Ciclos de Cultivo</h2>

        <!-- Resumen de ciclos -->
        <div class="cycles-summary">
            <div class="summary-card">
                <div class="summary-number">{{ cycles.length }}</div>
                <div class="summary-label">Ciclos Detectados</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">{{ completeCycles }}</div>
                <div class="summary-label">Ciclos Completos</div>
            </div>
            <div class="summary-card">
                <div class="summary-number">{{ partialCycles }}</div>
                <div class="summary-label">Ciclos Parciales</div>
            </div>
        </div>

        <!-- Lista de ciclos -->
        <div class="cycles-list">
            <div v-for="(cycle, index) in cycles" :key="index" class="cycle-card">
                <div class="cycle-header">
                    <div class="cycle-title">
                        <h3>{{ getCropName(cycle.cultivo) }}</h3>
                        <div class="cycle-status" :class="cycle.status.toLowerCase()">
                            {{ cycle.status }}
                        </div>
                    </div>
                    <div class="cycle-confidence">Confianza: {{ (cycle.confidence * 100).toFixed(0) }}%</div>
                </div>

                <div class="cycle-details">
                    <div class="cycle-info-grid">
                        <div class="info-item">
                            <span class="info-label">Siembra:</span>
                            <span class="info-value">{{ formatDate(cycle.fecha_siembra) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Cosecha:</span>
                            <span class="info-value">{{ formatDate(cycle.fecha_cosecha) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Pico NDVI:</span>
                            <span class="info-value ndvi-value">{{ cycle.pico_ndvi.toFixed(3) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Estado Salud:</span>
                            <span class="info-value" :class="getHealthClass(cycle.estado_salud)">
                                {{ cycle.estado_salud }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Eventos del ciclo -->
                <div v-if="cycle.eventos && cycle.eventos.length > 0" class="cycle-events">
                    <h4>Eventos Registrados</h4>
                    <div class="events-list">
                        <div v-for="event in cycle.eventos" :key="event.fecha" class="event-item">
                            <div class="event-header">
                                <span class="event-type" :class="getEventClass(event.tipo)">
                                    {{ getEventName(event.tipo) }}
                                </span>
                                <span class="event-severity" :class="getSeverityClass(event.severidad)">
                                    {{ event.severidad }}
                                </span>
                                <span class="event-date">{{ formatDate(event.fecha) }}</span>
                            </div>
                            <div class="event-description">{{ event.descripcion }}</div>
                        </div>
                    </div>
                </div>

                <!-- Notas del ciclo -->
                <div v-if="cycle.notes" class="cycle-notes">
                    <h4>Notas</h4>
                    <p>{{ cycle.notes }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Cycle } from "../types-v4";
import { formatDate } from "../composables-v4";

interface Props {
    cycles: Cycle[];
}

const props = defineProps<Props>();

const completeCycles = computed(() => props.cycles.filter(cycle => cycle.status === "COMPLETO").length);

const partialCycles = computed(() => props.cycles.filter(cycle => cycle.status === "PARCIAL").length);

function getCropName(cropCode: string): string {
    const cropNames: Record<string, string> = {
        COBERTURA_MALEZA: "Cobertura de Maleza",
        SOJA_1RA: "Soja 1ra",
        MAIZ_TARDIO: "Maíz Tardío",
        MAIZ_1RA: "Maíz 1ra",
        TRIGO: "Trigo",
        GIRASOL: "Girasol",
        SORGO: "Sorgo",
    };
    return cropNames[cropCode] || cropCode;
}

function getEventName(eventType: string): string {
    const eventNames: Record<string, string> = {
        GOLPE_DE_CALOR: "Golpe de Calor",
        HELADA: "Helada",
        SEQUIA: "Sequía",
        EXCESO_LLUVIA: "Exceso de Lluvia",
        GRANIZO: "Granizo",
        VIENTO: "Viento Fuerte",
    };
    return eventNames[eventType] || eventType;
}

function getHealthClass(health: string): string {
    const classes: Record<string, string> = {
        BUENO: "health-good",
        REGULAR: "health-regular",
        MALO: "health-bad",
    };
    return classes[health] || "";
}

function getEventClass(eventType: string): string {
    const classes: Record<string, string> = {
        GOLPE_DE_CALOR: "event-heat",
        HELADA: "event-frost",
        SEQUIA: "event-drought",
        EXCESO_LLUVIA: "event-rain",
        GRANIZO: "event-hail",
        VIENTO: "event-wind",
    };
    return classes[eventType] || "";
}

function getSeverityClass(severity: string): string {
    const classes: Record<string, string> = {
        BAJA: "severity-low",
        MEDIA: "severity-medium",
        ALTA: "severity-high",
    };
    return classes[severity] || "";
}
</script>

<style scoped>
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

.cycles-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.summary-card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
}

.summary-number {
    font-size: 2rem;
    font-weight: bold;
    color: #58a6ff;
    margin-bottom: 0.5rem;
}

.summary-label {
    color: #8b949e;
    font-size: 0.9rem;
}

.cycles-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.cycle-card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1.5rem;
}

.cycle-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #30363d;
}

.cycle-title {
    flex: 1;
}

.cycle-title h3 {
    color: #e6edf3;
    font-size: 1.2rem;
    margin: 0 0 0.5rem;
}

.cycle-status {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}

.cycle-status.completo {
    background: #238636;
    color: white;
}

.cycle-status.parcial {
    background: #f0883e;
    color: white;
}

.cycle-confidence {
    color: #8b949e;
    font-size: 0.9rem;
    font-weight: 500;
}

.cycle-details {
    margin-bottom: 1rem;
}

.cycle-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
}

.info-label {
    color: #8b949e;
    font-size: 0.9rem;
}

.info-value {
    color: #e6edf3;
    font-weight: 500;
}

.info-value.ndvi-value {
    color: #3fb950;
    font-weight: 600;
}

.health-good {
    color: #3fb950 !important;
}

.health-regular {
    color: #f0883e !important;
}

.health-bad {
    color: #f85149 !important;
}

.cycle-events {
    margin-bottom: 1rem;
}

.cycle-events h4 {
    color: #e6edf3;
    font-size: 1rem;
    margin: 0 0 1rem;
}

.events-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.event-item {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 1rem;
}

.event-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
}

.event-type {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    color: white;
}

.event-heat {
    background: #f85149;
}

.event-frost {
    background: #58a6ff;
}

.event-drought {
    background: #f0883e;
}

.event-rain {
    background: #3fb950;
}

.event-hail {
    background: #a371f7;
}

.event-wind {
    background: #ffa657;
}

.event-severity {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
}

.severity-low {
    background: #3fb950;
    color: white;
}

.severity-medium {
    background: #f0883e;
    color: white;
}

.severity-high {
    background: #f85149;
    color: white;
}

.event-date {
    color: #8b949e;
    font-size: 0.85rem;
}

.event-description {
    color: #c9d1d9;
    font-size: 0.9rem;
    line-height: 1.4;
}

.cycle-notes {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 1rem;
}

.cycle-notes h4 {
    color: #e6edf3;
    font-size: 1rem;
    margin: 0 0 0.75rem;
}

.cycle-notes p {
    color: #8b949e;
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0;
}
</style>
