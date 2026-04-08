<template>
    <div class="section">
        <h2 class="section-title">? Ciclos de Cultivo</h2>
        <div class="cycles-info">
            <div class="info-notice">
                <h3>? Información sobre Ciclos de Cultivo</h3>
                <p>La versión actual de los datos para La Querencia Lote 4 contiene información climática e índices de vegetación mensuales, pero no incluye datos específicos de ciclos de cultivo como fechas de siembra, cosecha o eventos registrados.</p>
                <p>Para análisis detallados de ciclos de cultivo con eventos específicos, consulta las versiones V1 y V2 del diagnóstico.</p>
            </div>
            
            <!-- Análisis basado en datos NDVI disponibles -->
            <div class="ndvi-analysis">
                <h3>? Análisis de Períodos de Actividad (Basado en NDVI)</h3>
                <div class="periods-grid">
                    <div v-for="year in availableYears" :key="year" class="year-period">
                        <h4>{{ year }}</h4>
                        <div class="period-details">
                            <div class="period-item">
                                <span class="period-label">Período Activo:</span>
                                <span class="period-value">{{ activePeriods[year] }}</span>
                            </div>
                            <div class="period-item">
                                <span class="period-label">Pico NDVI:</span>
                                <span class="period-value ndvi-value">{{ peakNDVI[year].toFixed(3) }}</span>
                            </div>
                            <div class="period-item">
                                <span class="period-label">Mes de Pico:</span>
                                <span class="period-value">{{ peakMonths[year] }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    availableYears: number[];
    activePeriods: Record<number, string>;
    peakNDVI: Record<number, number>;
    peakMonths: Record<number, string>;
}>();
</script>

<style scoped>
/* Estilos para sección de ciclos de cultivo */
.cycles-info {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.info-notice {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1.5rem;
}

.info-notice h3 {
    color: #f0883e;
    font-size: 1.1rem;
    margin: 0 0 1rem;
}

.info-notice p {
    color: #8b949e;
    margin: 0 0 0.5rem;
    line-height: 1.5;
}

.info-notice p:last-child {
    margin-bottom: 0;
}

.ndvi-analysis {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1.5rem;
}

.ndvi-analysis h3 {
    color: #58a6ff;
    font-size: 1.1rem;
    margin: 0 0 1rem;
}

.periods-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.year-period {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 1rem;
}

.year-period h4 {
    color: #e6edf3;
    font-size: 1rem;
    margin: 0 0 0.75rem;
    font-weight: 600;
}

.period-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.period-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
}

.period-label {
    color: #8b949e;
    font-size: 0.85rem;
}

.period-value {
    color: #e6edf3;
    font-size: 0.9rem;
    font-weight: 500;
}

.period-value.ndvi-value {
    color: #3fb950;
    font-weight: 600;
}

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
</style>
