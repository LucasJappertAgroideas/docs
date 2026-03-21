<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header class="main-header">
      <RouterLink to="/" class="logo">
        🌾 AgroClima
      </RouterLink>
    </header>
    
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
}

.main-header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background: #0d1117;
  border-bottom: 1px solid #30363d;
}

.logo {
  color: #58a6ff;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.5rem;
}

.logo:hover {
  color: #79c0ff;
}
</style>
