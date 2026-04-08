<template>
    <div class="section">
        <h2 class="section-title">? Resumen Mensual</h2>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Mes</th>
                        <th>NDVI</th>
                        <th>RECI</th>
                        <th>Precip. (mm)</th>
                        <th>Temp. Máx</th>
                        <th>Temp. Mín</th>
                        <th>Temp. Prom</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in monthlyData" :key="item.key">
                        <td class="month-cell">{{ item.key }}</td>
                        <td>{{ item.month.indices?.ndvi?.average !== null && item.month.indices?.ndvi?.average !== undefined ? item.month.indices.ndvi.average.toFixed(3) : "N/A" }}</td>
                        <td>{{ item.month.indices?.reci?.average !== null && item.month.indices?.reci?.average !== undefined ? item.month.indices.reci.average.toFixed(3) : "N/A" }}</td>
                        <td>{{ (item.month.precipitation || 0).toFixed(1) }}</td>
                        <td class="temp-max">{{ (item.month.temperature?.max || 0).toFixed(1) }}°C</td>
                        <td class="temp-min">{{ (item.month.temperature?.min || 0).toFixed(1) }}°C</td>
                        <td>{{ (item.month.temperature?.avg || 0).toFixed(1) }}°C</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    monthlyData: Array<{
        key: string;
        month: any;
    }>;
}>();
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

.table-container {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.data-table th,
.data-table td {
    padding: 0.75rem;
    text-align: center;
    border-bottom: 1px solid #30363d;
}

.data-table th {
    background: #161b22;
    color: #e6edf3;
    font-weight: 600;
    white-space: nowrap;
}

.data-table td {
    color: #8b949e;
}

.data-table tbody tr:hover {
    background: #161b22;
}

.month-cell {
    color: #58a6ff !important;
    font-weight: 600;
    white-space: nowrap;
}

.temp-max {
    color: #f85149 !important;
}

.temp-min {
    color: #58a6ff !important;
}
</style>
