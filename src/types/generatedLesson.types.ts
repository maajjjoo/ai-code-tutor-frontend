export interface GeneratedLesson {
    id: number;
    topic: string;
    language: string;
    level: string;
    title: string;
    contentJson: string;
    saved: boolean;
    expiresAt: string | null;
    createdAt: string;
    daysUntilExpiry: number;
}

export interface GenerationStatus {
    canGenerate: boolean;
    reason: string | null;
    generatedToday: number;
    dailyLimit: number;
    storedCount: number;
    storageLimit: number;
    lessons: GeneratedLesson[];
}

export interface GenerateLessonDto {
    topic: string;
    language: string;
}
