export interface Environment {
    id: number;
    name: string;
    color: string;
    area_hectares: number;
    area_percentage: number;
    average_index_value: number;
}

export interface SatelliteImage {
    type: string;
    url: string;
    date: string;
    cloud_coverage: number;
    average_index_value: number;
    trend_direction?: "flat" | "up" | "down";
    is_peak?: boolean;
    streak?: number;
    is_used_for_map?: boolean;
    threshold_min?: number | null;
    threshold_max?: number | null;
}

export interface ClimateData {
    precipitation_mm: number;
    temperature_max_c: number;
    temperature_min_c: number;
    temperature_avg_c: number;
    [key: string]: number | undefined;
}

export interface SatelliteImagesByMonth {
    month: string;
    images: SatelliteImage[];
    climate_data?: ClimateData;
}

export interface IndividualMap {
    map_image_url: string;
    total_area_hectares: number;
    processed_images_count: number;
    discarded_images_count: number;
    dynamic_threshold_used: number;
    environments: Environment[];
    date_from: string;
    date_to: string;
    satellite_images: SatelliteImagesByMonth[];
    index_types_used: string[];
}

export interface CombinedMap {
    map_image_url: string;
    total_area_hectares: number;
    processed_images_count: number;
    discarded_images_count: number;
    dynamic_threshold_used: number;
    environments: Environment[];
    date_from: string;
    date_to: string;
    satellite_images: SatelliteImagesByMonth[];
    index_types_used: string[];
}

export interface ProductivityMapData {
    individual_maps: Record<string, IndividualMap>;
    combined_map: CombinedMap | null;
}

export interface FieldOption {
    id: string;
    name: string;
    filename: string;
}
