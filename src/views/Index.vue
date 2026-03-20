<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>🌾 AgroClima</h1>
      <p style="color: #8b949e; margin-top: 10px;">
        Sistema de análisis de datos climáticos e índices de vegetación
      </p>
    </div>

    <div class="nav-cards">
      <RouterLink to="/lote-don-avelino" class="nav-card">
        <h2>📍 Lote Don Avelino</h2>
        <p>Ver datos climáticos y evolución de índices de vegetación</p>
      </RouterLink>

      <RouterLink to="/comparativas" class="nav-card">
        <h2>📊 Comparativas</h2>
        <p>Comparar datos entre diferentes lotes y períodos</p>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.nav-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.nav-card {
  background: rgba(22, 27, 34, 0.95);
  border: 1px solid #30363d;
  border-radius: 15px;
  padding: 30px;
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
}
</style>
