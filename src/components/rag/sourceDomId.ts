export function getSourceDomId(messageId: string, sourceId: string): string {
    const safeMessageId = messageId.replace(/[^a-zA-Z0-9_-]/g, '-');
    const safeSourceId = sourceId.replace(/[^a-zA-Z0-9_-]/g, '-');
    return `ask-source-${safeMessageId}-${safeSourceId}`;
}
