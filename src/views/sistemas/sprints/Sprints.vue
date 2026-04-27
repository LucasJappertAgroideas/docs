<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type ChartOptions } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "vue-chartjs";
import type { Sprint, SprintData } from "./types/types";
import { getProjectColor } from "./composables/useProjectColors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const sprints = ref<Sprint[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

const loadSprintsAsync = async () => {
    try {
        loading.value = true;
        error.value = null;

        const sprintModules = import.meta.glob("./data/*.json", { as: "raw" });

        const sprintPromises = Object.entries(sprintModules).map(async ([path, importFn]) => {
            try {
                const content = await importFn();
                const data: SprintData = JSON.parse(content);

                const sprint: Sprint = {
                    id: data.sprint.id,
                    titulo: data.sprint.titulo,
                    fechaDesde: data.sprint.fechaDesde,
                    fechaHasta: data.sprint.fechaHasta,
                    projectEffortSummary: data.projectEffortSummary,
                    totalSprintHours: data.totalSprintHours,
                };

                return sprint;
            } catch (err) {
                console.error(`Error cargando ${path}:`, err);
                return null;
            }
        });

        const results = await Promise.all(sprintPromises);
        sprints.value = results.filter((s): s is Sprint => s !== null);
    } catch (err) {
        error.value = "Error al cargar los sprints";
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
};

const sortedSprints = computed(() => {
    return [...sprints.value].sort((a, b) => new Date(b.fechaHasta).getTime() - new Date(a.fechaHasta).getTime());
});

const getChartOptions = (): ChartOptions<"bar"> => ({
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
        legend: {
            display: false,
        },
        tooltip: {
            callbacks: {
                label: context => {
                    return `${context.parsed.x}h`;
                },
            },
        },
        datalabels: {
            anchor: "end",
            align: "end",
            color: "#e6edf3",
            font: {
                size: 12,
                weight: "bold",
            },
            formatter: (value: number) => `${value}h`,
        },
    },
    scales: {
        x: {
            display: true,
            title: {
                display: true,
                text: "Horas",
                color: "#8b949e",
            },
            ticks: {
                color: "#8b949e",
            },
            grid: {
                color: "#30363d",
            },
        },
        y: {
            display: true,
            ticks: {
                color: "#e6edf3",
            },
            grid: {
                display: false,
            },
        },
    },
});

const getChartData = (sprint: Sprint) => {
    const labels = sprint.projectEffortSummary.map(p => p.projectName);
    const data = sprint.projectEffortSummary.map(p => p.totalHours);
    const backgroundColors = sprint.projectEffortSummary.map(p => getProjectColor(p.projectName));

    return {
        labels,
        datasets: [
            {
                data,
                backgroundColor: backgroundColors,
                borderRadius: 4,
            },
        ],
    };
};

onMounted(() => {
    loadSprintsAsync();
});
</script>

<template>
    <div class="sprints-container">
        <header class="sprints-header">
            <RouterLink to="/sistemas" class="breadcrumb">⚙️ Sistemas</RouterLink>
            <span class="separator">/</span>
            <h1>🏃 Sprints</h1>
        </header>

        <div class="loading" v-if="loading">
            <p>Cargando sprints...</p>
        </div>
        <div v-else-if="error">
            <p class="error">{{ error }}</p>
        </div>
        <div v-else-if="sortedSprints.length === 0" class="empty-state">
            <p>No hay sprints disponibles</p>
        </div>
        <div v-else class="sprints-grid">
            <div v-for="sprint in sortedSprints" :key="sprint.id" class="sprint-card">
                <div class="card-header">
                    <h3>{{ sprint.titulo }}</h3>
                    <span class="date-range">{{ formatDate(sprint.fechaDesde) }} - {{ formatDate(sprint.fechaHasta) }}</span>
                </div>

                <div class="chart-container">
                    <Bar :data="getChartData(sprint)" :options="getChartOptions()" />
                </div>

                <div class="effort-bar">
                    <div
                        v-for="project in sprint.projectEffortSummary"
                        :key="project.projectName"
                        class="effort-segment"
                        :style="{
                            width: `${(project.totalHours / sprint.totalSprintHours) * 100}%`,
                            backgroundColor: getProjectColor(project.projectName),
                        }"
                    ></div>
                </div>

                <div class="card-footer">
                    <span class="total-hours">Total: {{ sprint.totalSprintHours }}h</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sprints-container {
    min-height: 100vh;
    padding: 0 2rem 2rem 2rem;
}

.sprints-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem 0;
    background: #0d1117;
    border-bottom: 1px solid #30363d;
}

.breadcrumb {
    color: #8b949e;
    text-decoration: none;
    font-size: 1rem;
    transition: color 0.2s ease;
}

.breadcrumb:hover {
    color: #58a6ff;
}

.separator {
    color: #30363d;
    font-size: 1.25rem;
}

h1 {
    margin: 0;
    color: #e6edf3;
    font-size: 1.5rem;
}

.loading {
    text-align: center;
    padding: 4rem;
    color: #8b949e;
}

.error {
    text-align: center;
    padding: 4rem;
    color: #f85149;
}

.empty-state {
    text-align: center;
    padding: 4rem;
    color: #8b949e;
}

.sprints-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.sprint-card {
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1.5rem;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.card-header h3 {
    margin: 0;
    color: #e6edf3;
    font-size: 1.25rem;
}

.date-range {
    color: #8b949e;
    font-size: 0.875rem;
}

.chart-container {
    margin-bottom: 1rem;
    background-color: #0d1117;
    border-radius: 6px;
    padding: 1rem;
}

.effort-bar {
    display: flex;
    height: 10px;
    width: 100%;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 1rem;
}

.effort-segment {
    height: 100%;
    transition: width 0.3s ease;
}

.card-footer {
    display: flex;
    justify-content: flex-end;
}

.total-hours {
    color: #8b949e;
    font-size: 0.875rem;
    font-weight: 600;
}
</style>
