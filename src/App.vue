<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <nav class="quick-nav">
      <RouterLink to="/lote-don-avelino">📍 Lote Don Avelino</RouterLink>
    </nav>
    
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
}

.quick-nav {
  padding: 15px 20px;
}

.quick-nav a {
  color: #58a6ff;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1em;
}

.quick-nav a:hover {
  text-decoration: underline;
}
</style>
