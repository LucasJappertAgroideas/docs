// Tipos específicos para DiagnosticoCultivosV4

export interface SatelliteImageV4 {
    month: string;
    type: string;
    url: string;
    date: string;
    cloud_coverage: number;
}

export interface DiagnosticoDataV4 {
    field_id: number;
    date_from: string;
    date_to: string;
    cycles: Cycle[];
    monthly_summary: MonthlySummary[];
    captures_detail: CaptureDetail[];
    satellite_images: SatelliteImageGroup[];
    metadata: MetadataV4;
}

export interface Cycle {
    cultivo: string;
    fecha_siembra: string | null;
    fecha_cosecha: string | null;
    pico_ndvi: number;
    estado_salud: string;
    eventos: Event[];
    status: string;
    confidence: number;
    notes: string;
}

export interface Event {
    tipo: string;
    fecha: string;
    severidad: string;
    descripcion: string;
}

export interface MonthlySummary {
    month: string;
    ndvi_avg: number;
    ndvi_max: number;
    reci_avg: number;
    reci_max: number;
    ndwi_avg: number;
    ndre_avg: number;
    evi_avg: number;
    ndyi_avg: number;
    ndyi_max: number;
    precipitation_mm: number;
    temp_max_c: number;
    temp_min_c: number;
    temp_avg_c: number;
    num_captures: number;
}

export interface CaptureDetail {
    date: string;
    cloud_coverage: number;
    ndvi: number;
    ndwi: number;
    reci: number;
    ndre: number;
    evi: number;
    ndyi: number;
}

export interface SatelliteImageGroup {
    month: string;
    images: SatelliteImageV4[];
}

export interface MetadataV4 {
    total_captures: number;
    filtered_captures: number;
    daily_points: number;
    cycles_detected: number;
    complete_cycles: number;
    partial_cycles: number;
    satellite_images_count: number;
}

export interface CycleAnalysisV4 {
    year: number;
    activePeriod: string;
    peakNDVI: number;
    peakMonth: string;
}
