import AskArchiveCanvas from './AskArchiveCanvas';
import type { AskAtmosphereMode } from './askUiTypes';
import styles from './AskArchive.module.css';

interface AskArchiveAtmosphereProps {
    mode: AskAtmosphereMode;
    sourceCount: number;
}

export default function AskArchiveAtmosphere({
    mode,
    sourceCount,
}: AskArchiveAtmosphereProps) {
    return (
        <div
            className={styles.atmosphere}
            data-mode={mode}
            aria-hidden="true"
        >
            <div className={styles.ambientGradient} />
            <AskArchiveCanvas mode={mode} sourceCount={sourceCount} />
            <div className={styles.paperGrain} />
        </div>
    );
}
