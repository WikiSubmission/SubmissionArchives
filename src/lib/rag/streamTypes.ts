import type { AskNoticeKind, SourceCard } from './types';

export type AskProgressStage =
    | 'embedding'
    | 'retrieving'
    | 'ranking'
    | 'synthesizing'
    | 'validating'
    | 'revealing';

export type AskStreamEvent =
    | {
          type: 'status';
          stage: AskProgressStage;
          message: string;
      }
    | {
          type: 'sources';
          sources: SourceCard[];
          degraded?: string[];
      }
    | {
          type: 'answer_delta';
          text: string;
      }
    | {
          type: 'answer_done';
          citedSourceIds: string[];
      }
    | {
          type: 'notice';
          kind: AskNoticeKind;
          message: string;
      }
    | {
          type: 'done';
      };
