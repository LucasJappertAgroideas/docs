export interface Temperature {
    max: number;
    min: number;
    avg: number;
}

export interface IndexData {
    average: number;
    img: string;
    cloud_coverage: number;
}

export interface Indices {
    reci: IndexData;
    ndwi: IndexData;
    ndvi: IndexData;
    ndre: IndexData;
    infrarrojo: IndexData;
    evi: IndexData;
}

export interface ClimateData {
    precipitation: number;
    month: number;
    year: number;
    temperature: Temperature;
    indices: Indices;
}

export interface ClimateMetadata {
    latitude: number;
    longitude: number;
    date_from: string;
    date_to: string;
    lote?: string;
}

export interface ClimateApiResponse {
    metadata: ClimateMetadata;
    data: Record<string, ClimateData>;
}

export type ClimateDataset = ClimateApiResponse;

export interface IndexConfig {
    key: string;
    label: string;
    color: string;
    yAxisID: 'y' | 'y1' | 'y2';
    borderWidth: number;
    fill: boolean;
    tension: number;
    pointRadius: number;
    pointHoverRadius: number;
}

export const INDEX_CONFIGS: IndexConfig[] = [
    {
        key: 'precipitation',
        label: 'Precipitación (mm)',
        color: '#065bbb',
        yAxisID: 'y',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
    },
    {
        key: 'temperature_max',
        label: 'Temp. Máxima',
        color: '#f85149',
        yAxisID: 'y2',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
    },
    {
        key: 'temperature_avg',
        label: 'Temp. Promedio',
        color: '#f0883e',
        yAxisID: 'y2',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'temperature_min',
        label: 'Temp. Mínima',
        color: '#79c0ff',
        yAxisID: 'y2',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'ndvi',
        label: 'NDVI',
        color: '#3fb950',
        yAxisID: 'y1',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'ndwi',
        label: 'NDWI',
        color: '#a5d6ff',
        yAxisID: 'y1',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'ndre',
        label: 'NDRE',
        color: '#a371f7',
        yAxisID: 'y1',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'reci',
        label: 'RECI',
        color: '#d2a8ff',
        yAxisID: 'y1',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'evi',
        label: 'EVI',
        color: '#ffa657',
        yAxisID: 'y1',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'infrarrojo',
        label: 'Infrarrojo',
        color: '#db61a2',
        yAxisID: 'y1',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    }
];
