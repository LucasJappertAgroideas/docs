import { ref, computed } from 'vue';
import type { ComparativaData, MonthlySummary, YearSummary, ChartDataset } from '@/types/comparativas';
import { getRegionConfig } from '@/config/regiones';

export function useComparativasData(regionId: string | null) {
    const data = ref<ComparativaData | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const regionConfig = computed(() => regionId ? getRegionConfig(regionId) : undefined);

    // Procesar datos mensuales con diferencias y mejores matches
    const monthlyData = computed((): MonthlySummary[] => {
        if (!data.value) return [];

        return data.value.comparativa_lluvias.map(item => {
            const isIncomplete = item.fuente_meteoblue === null;

            // Calcular diferencias
            const diffMeteo = item.fuente_meteoblue !== null
                ? Math.round(item.fuente_meteoblue - item.fuente_referencia)
                : null;
            const diffApix = Math.round(item.fuente_apix - item.fuente_referencia);

            // Calcular diferencias absolutas para determinar el mejor match
            const absDiffMeteo = item.fuente_meteoblue !== null
                ? Math.abs(item.fuente_meteoblue - item.fuente_referencia)
                : Infinity;
            const absDiffApix = Math.abs(item.fuente_apix - item.fuente_referencia);

            const isMeteoBest = absDiffMeteo < absDiffApix && item.fuente_meteoblue !== null;
            const isApixBest = absDiffApix < absDiffMeteo;

            return {
                mes: item.mes,
                referencia: item.fuente_referencia,
                meteoblue: item.fuente_meteoblue,
                apix: item.fuente_apix,
                diffMeteo,
                diffApix,
                isMeteoBest,
                isApixBest,
                isIncomplete
            };
        });
    });

    // Resumen anual (solo 2025)
    const yearSummary = computed((): YearSummary[] => {
        if (!data.value) return [];

        const lluvias2025 = data.value.comparativa_lluvias.filter(item =>
            item.mes.includes('2025')
        );

        let totalReferencia = 0;
        let totalMeteoblue = 0;
        let totalApix = 0;
        let aciertosMeteo = 0;
        let aciertosApix = 0;

        lluvias2025.forEach(item => {
            totalReferencia += item.fuente_referencia;
            totalMeteoblue += item.fuente_meteoblue || 0;
            totalApix += item.fuente_apix;

            // Contar aciertos (solo si referencia > 0)
            if (item.fuente_referencia > 0 && item.fuente_meteoblue !== null) {
                const absDiffMeteo = Math.abs(item.fuente_meteoblue - item.fuente_referencia);
                const absDiffApix = Math.abs(item.fuente_apix - item.fuente_referencia);

                if (absDiffMeteo < absDiffApix) aciertosMeteo++;
                if (absDiffApix < absDiffMeteo) aciertosApix++;
            }
        });

        const diffMeteoTotal = Math.round(totalMeteoblue - totalReferencia);
        const diffApixTotal = Math.round(totalApix - totalReferencia);

        const refLabel = regionConfig.value?.referenceLabel || 'Referencia';

        return [
            {
                source: refLabel,
                total: totalReferencia,
                difference: 0,
                isReference: true
            },
            {
                source: 'APIX',
                total: totalApix,
                difference: diffApixTotal,
                isReference: false,
                hits: aciertosApix
            },
            {
                source: 'Meteoblue',
                total: totalMeteoblue,
                difference: diffMeteoTotal,
                isReference: false,
                hits: aciertosMeteo
            }
        ];
    });

    // Datos para el gráfico
    const chartLabels = computed((): string[] => {
        if (!data.value) return [];

        const months: Record<string, string> = {
            'Enero': 'Ene', 'Febrero': 'Feb', 'Marzo': 'Mar', 'Abril': 'Abr',
            'Mayo': 'May', 'Junio': 'Jun', 'Julio': 'Jul', 'Agosto': 'Ago',
            'Septiembre': 'Sep', 'Octubre': 'Oct', 'Noviembre': 'Nov', 'Diciembre': 'Dic'
        };

        return data.value.comparativa_lluvias.map(item => {
            let label = item.mes;
            // Shorten year
            label = label.replace('2025', '25').replace('2026', '26');
            // Shorten month names
            Object.entries(months).forEach(([full, short]) => {
                label = label.replace(full, short);
            });
            return label;
        });
    });

    const chartDatasets = computed((): ChartDataset[] => {
        if (!data.value) return [];

        const refLabel = regionConfig.value?.referenceLabel || 'Referencia';

        return [
            {
                label: refLabel,
                data: data.value.comparativa_lluvias.map(item => item.fuente_referencia),
                borderColor: 'rgb(160, 161, 161)',
                backgroundColor: 'rgba(160, 161, 161, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: false
            },
            {
                label: 'APIX',
                data: data.value.comparativa_lluvias.map(item => item.fuente_apix),
                borderColor: 'rgb(22, 193, 93)',
                backgroundColor: 'rgba(22, 193, 93, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: false
            },
            {
                label: 'Meteoblue',
                data: data.value.comparativa_lluvias.map(item => item.fuente_meteoblue ?? 0),
                borderColor: 'rgb(60, 106, 231)',
                backgroundColor: 'rgba(60, 106, 231, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: false
            }
        ];
    });

    // Verificar si hay datos incompletos
    const hasIncompleteData = computed((): boolean => {
        if (!data.value) return false;
        return data.value.comparativa_lluvias.some(item => item.fuente_meteoblue === null);
    });

    // Máximo valor para escala del gráfico
    const maxChartValue = computed((): number => {
        if (!data.value) return 300;

        const allValues = data.value.comparativa_lluvias.flatMap(item => [
            item.fuente_referencia,
            item.fuente_meteoblue ?? 0,
            item.fuente_apix
        ]);

        return Math.max(...allValues) * 1.1;
    });

    // Cargar datos
    async function fetchData(): Promise<void> {
        if (!regionConfig.value) {
            error.value = 'Región no válida';
            loading.value = false;
            return;
        }

        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(regionConfig.value.dataUrl);
            if (!response.ok) {
                throw new Error('Error al cargar los datos');
            }
            data.value = await response.json();
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido';
        } finally {
            loading.value = false;
        }
    }

    return {
        data,
        loading,
        error,
        regionConfig,
        monthlyData,
        yearSummary,
        chartLabels,
        chartDatasets,
        hasIncompleteData,
        maxChartValue,
        fetchData
    };
}
