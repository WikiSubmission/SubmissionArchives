// These sources retain the archive's documented attribution uncertainty.
// This reports uncertainty only; absence does not certify another recording.
export function hasUnverifiedSpeakerAttribution(item: { type: string; id: string; primaryNumber?: number }) {
  return (item.type === "messenger-audio" && (item.primaryNumber ?? 0) >= 72) ||
    item.id === "video-program/debate-dr-rashad-khalifa-ph-d-vs-sunni-scholars-1987";
}
