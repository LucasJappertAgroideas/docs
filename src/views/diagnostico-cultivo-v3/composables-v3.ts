// Composables y lógica específica para DiagnosticoCultivosV3
import { computed } from 'vue';
import type { SatelliteImageV3, MonthlySummary } from './types-v3';

// Configuración de colores para tipos de imágenes
export const IMAGE_TYPE_COLORS: Record<string, string> = {
    NDVI: "#3fb950",
    RECI: "#a371f7",
    NDWI: "#58a6ff",
    EVI: "#ffa657",
};

// Configuración de datasets para el gráfico unificado
export const DATASET_CONFIGS = [
    { key: "precipitation", label: "Precipitación (mm)", color: "#58a6ff", yAxisID: "y", type: "bar" as const },
    { key: "ndvi", label: "NDVI", color: "#3fb950", yAxisID: "y1", type: "line" as const },
    { key: "reci", label: "RECI", color: "#a371f7", yAxisID: "y1", type: "line" as const },
    { key: "ndwi", label: "NDWI", color: "#79c0ff", yAxisID: "y1", type: "line" as const },
    { key: "evi", label: "EVI", color: "#ffa657", yAxisID: "y1", type: "line" as const },
    { key: "temp_max", label: "Temp. Máx (°C)", color: "#f85149", yAxisID: "y2", type: "line" as const },
    { key: "temp_min", label: "Temp. Mín (°C)", color: "#ff7b72", yAxisID: "y2", type: "line" as const },
    { key: "temp_avg", label: "Temp. Prom (°C)", color: "#ffa657", yAxisID: "y2", type: "line" as const },
];

// Función para obtener color de tipo de imagen
export function getImageTypeColor(type: string): string {
    return IMAGE_TYPE_COLORS[type.toUpperCase()] || "#58a6ff";
}

// Función para formatear fecha a dd-mm-yyyy
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "Sin definir";
    
    // Si el formato es YYYYMMDD (ej: 20190105), convertirlo primero
    if (/^\d{8}$/.test(dateString)) {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        const formattedDate = `${year}-${month}-${day}`;
        const date = new Date(formattedDate);
        
        if (isNaN(date.getTime())) return "Fecha inválida";
        
        return `${day}-${month}-${year}`;
    }
    
    // Para otros formatos, intentar crear la fecha directamente
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Computed properties para datos mensuales
export function useMonthlyData(diagnosticoData: any) {
    const monthlyData = computed(() => {
        if (!diagnosticoData.value?.monthly_summary) return [];
        
        const summary = diagnosticoData.value.monthly_summary;
        return summary.map((item: MonthlySummary) => ({
            key: item.month,
            month: item
        }));
    });

    const monthlyLabels = computed(() => {
        return monthlyData.value.map((item: { key: string; month: MonthlySummary }) => {
            const [month, year] = item.key.split('-');
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return `${monthNames[parseInt(month) - 1]}-${year}`;
        });
    });

    const precipitationData = computed(() => {
        return monthlyData.value.map((item: { month: MonthlySummary }) => item.month.precipitation_mm || 0);
    });

    const ndviData = computed(() => {
        return monthlyData.value.map((item: { month: MonthlySummary }) => item.month.ndvi_avg || null);
    });

    const reciData = computed(() => {
        return monthlyData.value.map((item: { month: MonthlySummary }) => item.month.reci_avg || null);
    });

    const tempMaxData = computed(() => {
        return monthlyData.value.map((item: { month: MonthlySummary }) => item.month.temp_max_c || 0);
    });

    const tempMinData = computed(() => {
        return monthlyData.value.map((item: { month: MonthlySummary }) => item.month.temp_min_c || 0);
    });

    const tempAvgData = computed(() => {
        return monthlyData.value.map((item: { month: MonthlySummary }) => item.month.temp_avg_c || 0);
    });

    const ndwiData = computed(() => {
        return monthlyData.value.map((item: { month: MonthlySummary }) => item.month.ndwi_avg || null);
    });

    const eviData = computed(() => {
        return monthlyData.value.map((item: { month: MonthlySummary }) => item.month.evi_avg || null);
    });

    return {
        monthlyData,
        monthlyLabels,
        precipitationData,
        ndviData,
        reciData,
        ndwiData,
        eviData,
        tempMaxData,
        tempMinData,
        tempAvgData
    };
}

// Computed properties para análisis de ciclos
export function useCycleAnalysis(diagnosticoData: any) {
    const availableYears = computed(() => {
        if (!diagnosticoData.value?.data) return [];
        
        const years = new Set<number>();
        Object.keys(diagnosticoData.value.data).forEach(monthKey => {
            const year = parseInt(monthKey.split("-")[1]);
            years.add(year);
        });
        
        return Array.from(years).sort((a, b) => b - a); // Orden descendente
    });

    const activePeriods = computed(() => {
        const periods: Record<number, string> = {};
        
        availableYears.value.forEach(year => {
            if (!diagnosticoData.value?.data) {
                periods[year] = "N/A";
                return;
            }
            
            const yearMonths = Object.keys(diagnosticoData.value.data).filter(key => {
                const keyYear = parseInt(key.split("-")[1]);
                return keyYear === year;
            });
            
            const activeMonths = yearMonths.filter(monthKey => {
                const ndvi = diagnosticoData.value.data[monthKey].indices?.ndvi?.average;
                return ndvi !== null && ndvi !== undefined && ndvi > 0.3; // Umbral para considerar actividad
            });
            
            if (activeMonths.length === 0) {
                periods[year] = "Sin actividad detectada";
            } else {
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const firstMonth = activeMonths[0];
                const lastMonth = activeMonths[activeMonths.length - 1];
                periods[year] = `${monthNames[parseInt(firstMonth.split("-")[0]) - 1]} - ${monthNames[parseInt(lastMonth.split("-")[0]) - 1]}`;
            }
        });
        
        return periods;
    });

    const peakNDVI = computed(() => {
        const peaks: Record<number, number> = {};
        
        availableYears.value.forEach(year => {
            if (!diagnosticoData.value?.data) {
                peaks[year] = 0;
                return;
            }
            
            let maxNDVI = 0;
            Object.keys(diagnosticoData.value.data).forEach(monthKey => {
                const keyYear = parseInt(monthKey.split("-")[1]);
                if (keyYear === year) {
                    const ndvi = diagnosticoData.value.data[monthKey].indices?.ndvi?.average;
                    if (ndvi !== null && ndvi !== undefined && ndvi > maxNDVI) {
                        maxNDVI = ndvi;
                    }
                }
            });
            
            peaks[year] = maxNDVI;
        });
        
        return peaks;
    });

    const peakMonths = computed(() => {
        const months: Record<number, string> = {};
        
        availableYears.value.forEach(year => {
            if (!diagnosticoData.value?.data) {
                months[year] = "N/A";
                return;
            }
            
            let maxNDVI = 0;
            let peakMonth = "";
            
            Object.keys(diagnosticoData.value.data).forEach(monthKey => {
                const keyYear = parseInt(monthKey.split("-")[1]);
                if (keyYear === year) {
                    const ndvi = diagnosticoData.value.data[monthKey].indices?.ndvi?.average;
                    if (ndvi !== null && ndvi !== undefined && ndvi > maxNDVI) {
                        maxNDVI = ndvi;
                        peakMonth = monthKey;
                    }
                }
            });
            
            if (!peakMonth) {
                months[year] = "N/A";
            } else {
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                const monthNum = parseInt(peakMonth.split("-")[0]);
                months[year] = monthNames[monthNum - 1];
            }
        });
        
        return months;
    });

    return {
        availableYears,
        activePeriods,
        peakNDVI,
        peakMonths
    };
}

// Computed properties para imágenes satelitales
export function useSatelliteImages(diagnosticoData: any) {
    const satelliteImages = computed((): SatelliteImageV3[] => {
        if (!diagnosticoData.value?.satellite_images) return [];
        
        const images: SatelliteImageV3[] = [];
        const satelliteGroups = diagnosticoData.value.satellite_images;
        
        satelliteGroups.forEach((group: any) => {
            if (group.images && Array.isArray(group.images)) {
                group.images.forEach((image: any) => {
                    // Convertir la fecha de YYYY-MM-DD a YYYYMMDD para formatDate
                    const dateMatch = image.date.match(/(\d{4})-(\d{2})-(\d{2})/);
                    let dateStr: string;
                    
                    if (dateMatch) {
                        dateStr = `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`;
                    } else {
                        // Fallback: usar el mes del grupo
                        const [month, year] = group.month.split('-');
                        dateStr = `${year}${month.padStart(2, '0')}01`;
                    }
                    
                    images.push({
                        month: group.month,
                        type: image.type,
                        url: image.url,
                        date: dateStr,
                        cloud_coverage: image.cloud_coverage || 0
                    });
                });
            }
        });
        
        return images.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    const imageTypes = computed(() => {
        const types = new Set<string>();
        satelliteImages.value.forEach(img => {
            if (img.type) types.add(img.type);
        });
        return Array.from(types).sort();
    });

    return {
        satelliteImages,
        imageTypes
    };
}
