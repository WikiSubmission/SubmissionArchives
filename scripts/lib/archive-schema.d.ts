export interface ArchiveValidationReport {
    valid: boolean;
    errors: string[];
    warnings: string[];
    recordCount: number;
    segmentCount: number;
    categoryCounts: Record<string, number>;
    typeCounts: Record<string, number>;
    recordsWithoutSegments: Array<{
        id: string;
        category: string;
        type: string;
        transcriptStatus: string;
    }>;
}

export function validateArchiveRecords(
    records: unknown,
    options: { publicDir: string },
): ArchiveValidationReport;

export function assertValidArchiveRecords(
    records: unknown,
    options: { publicDir: string },
): ArchiveValidationReport;
