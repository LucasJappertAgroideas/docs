export interface ClimateData {
    precipitation: number;
    month: number;
    year: number;
    ndvi_average: number;
    ndvi_img?: string;
    ndwi_average: number;
    ndwi_img?: string;
    ndre_average: number;
    ndre_img?: string;
    reci_average: number;
    reci_img?: string;
    evi_average: number;
    evi_img?: string;
    infrarrojo_average: number;
    infrarrojo_img?: string;
}

export interface ClimateMetadata {
    latitude: number;
    longitude: number;
    date_from: string;
    date_to: string;
    lote?: string;
}

export interface ClimateDataset {
    metadata: ClimateMetadata;
    data: Record<string, ClimateData>;
}

export interface IndexConfig {
    key: keyof ClimateData;
    label: string;
    color: string;
    yAxisID: 'y' | 'y1';
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
        color: '#58a6ff',
        yAxisID: 'y',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
    },
    {
        key: 'ndvi_average',
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
        key: 'ndwi_average',
        label: 'NDWI',
        color: '#79c0ff',
        yAxisID: 'y1',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'ndre_average',
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
        key: 'reci_average',
        label: 'RECI',
        color: '#f85149',
        yAxisID: 'y1',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'evi_average',
        label: 'EVI',
        color: '#f0883e',
        yAxisID: 'y1',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
    },
    {
        key: 'infrarrojo_average',
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
