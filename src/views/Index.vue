<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
    <div class="container">
        <div class="header">
            <h1>🌾 AgroClima</h1>
            <p style="color: #8b949e; margin-top: 10px">Sistema de análisis de datos climáticos e índices de vegetación</p>
        </div>

        <div class="nav-cards">
            <RouterLink to="/comparativas" class="nav-card">
                <h2>📊 Comparativas</h2>
                <p>Comparar datos de precipitación entre diferentes fuentes y regiones</p>
            </RouterLink>

            <RouterLink to="/lotes" class="nav-card">
                <h2>📍 Datos de Lotes</h2>
                <p>Ver datos climáticos e índices de vegetación de lotes específicos</p>
            </RouterLink>

            <RouterLink to="/diagnostico-cultivos" class="nav-card">
                <h2>🌱 Diagnóstico de Cultivos</h2>
                <p>Análisis detallado de ciclos de cultivo, eventos y evolución de índices</p>
            </RouterLink>

            <RouterLink to="/diagnostico-cultivos-v2" class="nav-card">
                <h2>🌱 Diagnóstico de Cultivos V2</h2>
                <p>Versión 2 del análisis detallado de ciclos de cultivo, eventos y evolución de índices</p>
            </RouterLink>

            <RouterLink to="/diagnostico-cultivos-v3" class="nav-card">
                <h2>🌱 Diagnóstico de Cultivos V3</h2>
                <p>Versión 3 con datos de La Querencia Lote 4, análisis de índices NDVI y RECI</p>
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.header {
    text-align: center;
    margin-bottom: 3rem;
}

.header h1 {
    color: #e6edf3;
    font-size: 2.5rem;
    margin: 0;
}

.nav-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.nav-card {
    background: rgba(22, 27, 34, 0.95);
    border: 1px solid #30363d;
    border-radius: 15px;
    padding: 40px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
}

.nav-card:hover {
    border-color: #58a6ff;
    transform: translateY(-2px);
}

.nav-card h2 {
    color: #58a6ff;
    margin-bottom: 10px;
}

.nav-card p {
    color: #8b949e;
    font-size: 1rem;
}
</style>
