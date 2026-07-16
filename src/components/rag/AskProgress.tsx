import {
    BookOpenText,
    ScanSearch,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import type { AskProgressStage } from '@/lib/rag/streamTypes';
import styles from './AskArchive.module.css';

interface AskProgressProps {
    stage: AskProgressStage | null;
    message: string | null;
}

const STAGES: AskProgressStage[] = [
    'embedding',
    'retrieving',
    'ranking',
    'synthesizing',
    'validating',
    'revealing',
];

const STAGE_META: Record<
    AskProgressStage,
    {
        label: string;
        Icon: typeof ScanSearch;
    }
> = {
    embedding: {
        label: 'Mapping the question',
        Icon: ScanSearch,
    },
    retrieving: {
        label: 'Searching indexed passages',
        Icon: BookOpenText,
    },
    ranking: {
        label: 'Comparing the evidence',
        Icon: BookOpenText,
    },
    synthesizing: {
        label: 'Preparing a cited response',
        Icon: Sparkles,
    },
    validating: {
        label: 'Checking every citation',
        Icon: ShieldCheck,
    },
    revealing: {
        label: 'Presenting the verified answer',
        Icon: ShieldCheck,
    },
};

export default function AskProgress({ stage, message }: AskProgressProps) {
    const activeStage = stage ?? 'embedding';
    const activeIndex = STAGES.indexOf(activeStage);
    const { Icon, label } = STAGE_META[activeStage];
    const progress = ((activeIndex + 1) / STAGES.length) * 100;

    return (
        <div className={styles.progressCard} role="status" aria-live="polite">
            <div className={styles.progressIcon} aria-hidden="true">
                <Icon size={17} strokeWidth={1.8} />
            </div>

            <div className={styles.progressBody}>
                <div className={styles.progressHeading}>
                    <span>{message || label}</span>
                    <span>{activeIndex + 1} / {STAGES.length}</span>
                </div>

                <div className={styles.progressTrack} aria-hidden="true">
                    <span style={{ transform: `scaleX(${progress / 100})` }} />
                </div>

                <p>{label}</p>
            </div>
        </div>
    );
}
