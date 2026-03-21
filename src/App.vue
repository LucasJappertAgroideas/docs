<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <nav class="quick-nav">
      <RouterLink to="/lote-don-avelino">📍Lote Don Avelino</RouterLink>
      <RouterLink to="/lote-agroarnaudo-lote-1">📍Lote Agroarnaudo Lote 1</RouterLink>
      <RouterLink to="/don-avelino-el-lucero-lote-14">📍Lote 14 Don Avelino El Lucero</RouterLink>
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
  margin: 0 10px;
}

.quick-nav a:hover {
  text-decoration: underline;
}
</style>
