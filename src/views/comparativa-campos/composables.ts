// Composables y lógica específica para ComparativaCampos
import type { FieldData, MonthlySummary, IndexOption } from './types';

// Configuración de colores para cada campo
export const FIELD_COLORS: Record<string, string> = {
    '286': '#3fb950', // La Querencia Lote 4 - Verde
    '288': '#58a6ff', // La Querencia Lote 2 - Azul
    '289': '#a371f7', // La Querencia Lote 20 - Púrpura
    '291': '#ffa657', // H Y M Lomas Lote 2 - Naranja
    '292': '#f85149', // Munge Lote 1 - Rojo
    '293': '#79c0ff', // Elmer Lote 8 - Azul claro
};

// Opciones de índices disponibles para el select
export const INDEX_OPTIONS: IndexOption[] = [
    { value: 'ndvi_avg', label: 'NDVI Promedio' },
    { value: 'ndvi_max', label: 'NDVI Máximo' },
    { value: 'reci_avg', label: 'RECI Promedio' },
    { value: 'reci_max', label: 'RECI Máximo' },
    { value: 'ndwi_avg', label: 'NDWI Promedio' },
    { value: 'evi_avg', label: 'EVI Promedio' },
    { value: 'precipitation_mm', label: 'Precipitación (mm)' },
    { value: 'temp_max_c', label: 'Temperatura Máxima (°C)' },
    { value: 'temp_min_c', label: 'Temperatura Mínima (°C)' },
    { value: 'temp_avg_c', label: 'Temperatura Promedio (°C)' },
    { value: 'num_captures', label: 'Número de Capturas' },
];

// Función para obtener el color de un campo
export function getFieldColor(fieldId: string): string {
    return FIELD_COLORS[fieldId] || '#58a6ff';
}

// Función para obtener todas las etiquetas de tiempo (meses) comunes a todos los campos
export function getCommonLabels(fieldsData: FieldData[]): string[] {
    if (fieldsData.length === 0) return [];
    
    // Obtener todos los meses únicos de todos los campos
    const allMonths = new Set<string>();
    fieldsData.forEach(field => {
        field.monthly_summary.forEach(summary => {
            allMonths.add(summary.month);
        });
    });
    
    // Convertir a array y ordenar cronológicamente
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
        const [monthA, yearA] = a.split('-').map(Number);
        const [monthB, yearB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
    });
    
    return sortedMonths;
}

// Función para obtener los datos de un índice específico para un campo
export function getFieldIndexData(
    fieldData: FieldData,
    indexKey: keyof MonthlySummary,
    commonLabels: string[]
): (number | null)[] {
    const dataMap = new Map<string, number>();
    
    // Crear un mapa con los datos del campo
    fieldData.monthly_summary.forEach(summary => {
        dataMap.set(summary.month, summary[indexKey] as number);
    });
    
    // Mapear los datos a las etiquetas comunes
    return commonLabels.map(label => dataMap.get(label) ?? null);
}

// Función para obtener el label de un índice
export function getIndexLabel(indexKey: keyof MonthlySummary): string {
    const option = INDEX_OPTIONS.find(opt => opt.value === indexKey);
    return option?.label || indexKey;
}

// Función para obtener el rango de valores de un índice
export function getIndexRange(
    fieldsData: FieldData[],
    indexKey: keyof MonthlySummary
): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;
    
    fieldsData.forEach(field => {
        field.monthly_summary.forEach(summary => {
            const value = summary[indexKey] as number;
            if (value !== null && value !== undefined) {
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
        });
    });
    
    return { min, max };
}
