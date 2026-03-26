/**
 * Tipos de datos para la vista de Comparativas
 */

export interface LluviaItem {
    mes: string;
    fuente_referencia: number;
    fuente_meteoblue: number | null;
    fuente_apix: number;
    fuente_provincia_santa_fe: number;
    fuente_nasa_power: number;
}

export interface ComparativaData {
    titulo: string;
    subtitulo: string;
    comparativa_lluvias: LluviaItem[];
}

export interface RegionConfig {
    id: string;
    name: string;
    label: string;
    referenceLabel: string;
    dataUrl: string;
}

export interface MonthlySummary {
    mes: string;
    referencia: number;
    meteoblue: number | null;
    apix: number;
    provinciaSantaFe: number;
    nasaPower: number;
    diffMeteo: number | null;
    diffApix: number;
    diffSantaFe: number;
    diffNasaPower: number;
    isMeteoBest: boolean;
    isApixBest: boolean;
    isSantaFeBest: boolean;
    isNasaPowerBest: boolean;
    isIncomplete: boolean;
}

export interface YearSummary {
    source: string;
    total: number;
    difference: number;
    isReference: boolean;
    hits?: number;
}

export interface ChartDataset {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    tension: number;
    fill: boolean;
}
