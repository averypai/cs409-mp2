export interface ArtworkSummary {
    id: number;
    title: string;
    image_id: string | null;
    artist_display: string;
    artwork_type_title: string;
}

export interface ArtworkDetail extends ArtworkSummary {
    date_display: string;
    medium_display: string;
    description: string | null;
    dimensions: string;
    credit_line: string;
}

export interface ArticApiResponse<T> {
    data: T;
}