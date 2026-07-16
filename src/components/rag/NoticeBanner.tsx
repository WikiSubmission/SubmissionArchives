import {
    CircleAlert,
    SearchX,
    ShieldAlert,
    WifiOff,
} from 'lucide-react';
import type { AskNoticeKind } from '@/lib/rag/types';
import styles from './AskArchive.module.css';

interface NoticeBannerProps {
    kind: AskNoticeKind;
    message: string;
}

const KIND_META: Record<
    AskNoticeKind,
    {
        label: string;
        Icon: typeof CircleAlert;
    }
> = {
    no_answer: {
        label: 'Answer not verified',
        Icon: ShieldAlert,
    },
    weak_retrieval: {
        label: 'Limited evidence found',
        Icon: CircleAlert,
    },
    model_unavailable: {
        label: 'Synthesis unavailable',
        Icon: WifiOff,
    },
    out_of_scope: {
        label: 'Outside the archive',
        Icon: SearchX,
    },
};

export default function NoticeBanner({ kind, message }: NoticeBannerProps) {
    const { Icon, label } = KIND_META[kind];

    return (
        <div
            className={styles.noticeBanner}
            data-kind={kind}
            role={kind === 'model_unavailable' ? 'alert' : 'status'}
        >
            <span className={styles.noticeIcon} aria-hidden="true">
                <Icon size={17} strokeWidth={1.8} />
            </span>
            <div>
                <p className={styles.noticeLabel}>{label}</p>
                <p className={styles.noticeMessage}>{message}</p>
            </div>
        </div>
    );
}
