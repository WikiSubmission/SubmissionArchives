import type { AskNoticeKind, SourceCard } from '@/lib/rag/types';
import type { AskProgressStage } from '@/lib/rag/streamTypes';

export type AskMessagePhase =
    | 'retrieving'
    | 'synthesizing'
    | 'revealing'
    | 'complete'
    | 'cancelled'
    | 'error';

export type AskAtmosphereMode =
    | 'idle'
    | 'retrieving'
    | 'synthesizing'
    | 'revealing'
    | 'settled'
    | 'error';

export interface AskMessage {
    id: string;
    question: string;
    answerText: string;
    sources: SourceCard[];
    citedSourceIds: string[];
    notice: { kind: AskNoticeKind; message: string } | null;
    phase: AskMessagePhase;
    progressStage: AskProgressStage | null;
    progressMessage: string | null;
    error: string | null;
}

export interface HighlightedSource {
    messageId: string;
    sourceId: string;
}
