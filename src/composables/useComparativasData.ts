import { ref, computed } from 'vue';
import type { ComparativaData, MonthlySummary, YearSummary, ChartDataset } from '@/types/comparativas';
import { getRegionConfig } from '@/config/regiones';

export function useComparativasData(regionId: string | null) {
    const data = ref<ComparativaData | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const regionConfig = computed(() => regionId ? getRegionConfig(regionId) : undefined);

    // Verificar si los datos tienen wunder_map
    const hasWunderMap = computed((): boolean => {
        if (!data.value) return false;
        return data.value.comparativa_lluvias.some(item => 'wunder_map' in item && item.wunder_map !== undefined);
    });

    // Procesar datos mensuales con diferencias y mejores matches
    const monthlyData = computed((): MonthlySummary[] => {
        if (!data.value) return [];

        return data.value.comparativa_lluvias.map(item => {
            const isIncomplete = item.fuente_meteoblue === null;
            const wunderMapValue = item.wunder_map ?? null;

            // Calcular diferencias
            const diffMeteo = item.fuente_meteoblue !== null
                ? Math.round(item.fuente_meteoblue - item.fuente_referencia)
                : null;
            const diffApix = Math.round(item.fuente_apix - item.fuente_referencia);
            const diffWunderMap = wunderMapValue !== null && wunderMapValue !== undefined
                ? Math.round(wunderMapValue - item.fuente_referencia)
                : null;
            const diffSantaFe = Math.round(item.fuente_provincia_santa_fe - item.fuente_referencia);
            const diffNasaPower = Math.round(item.fuente_nasa_power - item.fuente_referencia);

            // Calcular diferencias absolutas para determinar el mejor match
            const absDiffMeteo = item.fuente_meteoblue !== null
                ? Math.abs(item.fuente_meteoblue - item.fuente_referencia)
                : Infinity;
            const absDiffApix = Math.abs(item.fuente_apix - item.fuente_referencia);
            const absDiffWunderMap = wunderMapValue !== null && wunderMapValue !== undefined
                ? Math.abs(wunderMapValue - item.fuente_referencia)
                : Infinity;
            const absDiffSantaFe = Math.abs(item.fuente_provincia_santa_fe - item.fuente_referencia);
            const absDiffNasaPower = Math.abs(item.fuente_nasa_power - item.fuente_referencia);

            const isMeteoBest = absDiffMeteo < absDiffApix && absDiffMeteo < absDiffWunderMap && absDiffMeteo < absDiffSantaFe && absDiffMeteo < absDiffNasaPower && item.fuente_meteoblue !== null;
            const isWunderMapBest = wunderMapValue !== null && wunderMapValue !== undefined && absDiffWunderMap < absDiffMeteo && absDiffWunderMap < absDiffApix && absDiffWunderMap < absDiffSantaFe && absDiffWunderMap < absDiffNasaPower;
            const isApixBest = absDiffApix < absDiffMeteo && absDiffApix < absDiffWunderMap && absDiffApix < absDiffSantaFe && absDiffApix < absDiffNasaPower;
            const isSantaFeBest = absDiffSantaFe < absDiffMeteo && absDiffSantaFe < absDiffApix && absDiffSantaFe < absDiffWunderMap && absDiffSantaFe < absDiffNasaPower;
            const isNasaPowerBest = absDiffNasaPower < absDiffMeteo && absDiffNasaPower < absDiffApix && absDiffNasaPower < absDiffWunderMap && absDiffNasaPower < absDiffSantaFe;

            return {
                mes: item.mes,
                referencia: item.fuente_referencia,
                meteoblue: item.fuente_meteoblue,
                apix: item.fuente_apix,
                wunderMap: wunderMapValue,
                provinciaSantaFe: item.fuente_provincia_santa_fe,
                nasaPower: item.fuente_nasa_power,
                diffMeteo,
                diffApix,
                diffWunderMap,
                diffSantaFe,
                diffNasaPower,
                isMeteoBest,
                isWunderMapBest,
                isApixBest,
                isSantaFeBest,
                isNasaPowerBest,
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
        let totalWunderMap = 0;
        let totalSantaFe = 0;
        let totalNasaPower = 0;
        let aciertosMeteo = 0;
        let aciertosApix = 0;
        let aciertosWunderMap = 0;
        let aciertosSantaFe = 0;
        let aciertosNasaPower = 0;

        lluvias2025.forEach(item => {
            totalReferencia += item.fuente_referencia;
            totalMeteoblue += item.fuente_meteoblue || 0;
            totalApix += item.fuente_apix;
            totalWunderMap += item.wunder_map || 0;
            totalSantaFe += item.fuente_provincia_santa_fe;
            totalNasaPower += item.fuente_nasa_power;

            // Contar aciertos (solo si referencia > 0)
            if (item.fuente_referencia > 0) {
                const absDiffMeteo = item.fuente_meteoblue !== null
                    ? Math.abs(item.fuente_meteoblue - item.fuente_referencia)
                    : Infinity;
                const absDiffApix = Math.abs(item.fuente_apix - item.fuente_referencia);
                const absDiffWunderMap = item.wunder_map !== undefined
                    ? Math.abs(item.wunder_map - item.fuente_referencia)
                    : Infinity;
                const absDiffSantaFe = Math.abs(item.fuente_provincia_santa_fe - item.fuente_referencia);
                const absDiffNasaPower = Math.abs(item.fuente_nasa_power - item.fuente_referencia);

                if (absDiffMeteo < absDiffApix && absDiffMeteo < absDiffWunderMap && absDiffMeteo < absDiffSantaFe && absDiffMeteo < absDiffNasaPower) aciertosMeteo++;
                if (absDiffApix < absDiffMeteo && absDiffApix < absDiffWunderMap && absDiffApix < absDiffSantaFe && absDiffApix < absDiffNasaPower) aciertosApix++;
                if (absDiffWunderMap < absDiffMeteo && absDiffWunderMap < absDiffApix && absDiffWunderMap < absDiffSantaFe && absDiffWunderMap < absDiffNasaPower && item.wunder_map !== undefined) aciertosWunderMap++;
                if (absDiffSantaFe < absDiffMeteo && absDiffSantaFe < absDiffApix && absDiffSantaFe < absDiffWunderMap && absDiffSantaFe < absDiffNasaPower) aciertosSantaFe++;
                if (absDiffNasaPower < absDiffMeteo && absDiffNasaPower < absDiffApix && absDiffNasaPower < absDiffWunderMap && absDiffNasaPower < absDiffSantaFe) aciertosNasaPower++;
            }
        });

        const diffMeteoTotal = Math.round(totalMeteoblue - totalReferencia);
        const diffApixTotal = Math.round(totalApix - totalReferencia);
        const diffWunderMapTotal = Math.round(totalWunderMap - totalReferencia);
        const diffSantaFeTotal = Math.round(totalSantaFe - totalReferencia);
        const diffNasaPowerTotal = Math.round(totalNasaPower - totalReferencia);

        const refLabel = regionConfig.value?.referenceLabel || 'Referencia';
        const hasWunderMapData = hasWunderMap.value;

        // Construir resultado dinámicamente basado en qué fuentes existen
        const result: YearSummary[] = [
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

        // Agregar Wunder Map si existe
        if (hasWunderMapData) {
            result.push({
                source: 'Wunder Map',
                total: totalWunderMap,
                difference: diffWunderMapTotal,
                isReference: false,
                hits: aciertosWunderMap
            });
        }

        result.push(
            {
                source: 'Provincia Santa Fe',
                total: totalSantaFe,
                difference: diffSantaFeTotal,
                isReference: false,
                hits: aciertosSantaFe
            },
            {
                source: 'NASA Power',
                total: totalNasaPower,
                difference: diffNasaPowerTotal,
                isReference: false,
                hits: aciertosNasaPower
            }
        );

        return result;
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
        const hasWunderMapData = hasWunderMap.value;

        const datasets: ChartDataset[] = [
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

        // Agregar Wunder Map si existe
        if (hasWunderMapData) {
            datasets.push({
                label: 'Wunder Map',
                data: data.value.comparativa_lluvias.map(item => item.wunder_map ?? 0),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: false
            });
        }

        datasets.push(
            {
                label: 'Provincia Santa Fe',
                data: data.value.comparativa_lluvias.map(item => item.fuente_provincia_santa_fe),
                borderColor: 'rgb(155, 89, 182)',
                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: false
            },
            {
                label: 'NASA Power',
                data: data.value.comparativa_lluvias.map(item => item.fuente_nasa_power),
                borderColor: 'rgb(255, 165, 0)',
                backgroundColor: 'rgba(255, 165, 0, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: false
            }
        );

        return datasets;
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
            item.fuente_apix,
            item.fuente_provincia_santa_fe,
            item.fuente_nasa_power
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
        hasWunderMap,
        maxChartValue,
        fetchData
    };
}
