export interface ChapterMarker {
  id: number;
  startTime: number;
  endTime?: number;
  title: string;
  description?: string;
  speaker?: string;
}
