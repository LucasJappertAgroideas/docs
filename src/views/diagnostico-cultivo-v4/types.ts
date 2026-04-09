// Interfaces y tipos para DiagnosticoCultivosV4

export interface SatelliteImage {
    month: string;
    type: string;
    url: string;
    date: string;
    cloud_coverage: number;
}

export interface DiagnosticoData {
    data: Record<string, MonthData>;
    metadata: Metadata;
}

export interface MonthData {
    precipitation: number;
    month: number;
    year: number;
    temperature: {
        max: number;
        min: number;
        avg: number;
    };
    indices: {
        ndvi: {
            average: number;
            img: string;
            cloud_coverage: number;
        };
        reci: {
            average: number;
            img: string;
            cloud_coverage: number;
        };
    };
}

export interface Metadata {
    latitude: number;
    longitude: number;
    date_from: string;
    date_to: string;
    data_source: string;
    field_id: number;
    nombre: string;
    parent_field: string;
    ha_totals: number;
}

export interface DatasetConfig {
    key: string;
    label: string;
    color: string;
    yAxisID: string;
    type: 'bar' | 'line';
}

export interface CycleAnalysis {
    year: number;
    activePeriod: string;
    peakNDVI: number;
    peakMonth: string;
}
