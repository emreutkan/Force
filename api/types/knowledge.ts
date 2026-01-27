// Knowledge Base Types
export interface TrainingResearch {
    id: number;
    title: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    source_title?: string;
    source_url?: string;
    source_authors: string[];
    publication_date?: string;
    evidence_level?: string;
    confidence_score: number;
    applicable_muscle_groups: string[];
    applicable_exercise_types: string[];
    parameters: Record<string, any>;
    is_active: boolean;
    is_validated: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface ResearchFilters {
    category?: string;
    muscle_group?: string;
    exercise_type?: string;
    tags?: string[];
}
