'use server';

import * as fs from 'fs';
import * as path from 'path';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { ListObjectsV2Command, GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { parseVttToSegments, Segment } from '@/lib/transcriptUtils';

export interface StudyTranscriptData {
  studyNumber: number;
  filename: string;
  segments: Segment[];
  audioUrl: string;
}

export async function fetchQuranStudyData(studyNumber: number): Promise<StudyTranscriptData | null> {
  // Find files in R2
  let vttKey = '';
  let audioKey = '';
  let filename = '';

  try {
    const prefix = `media/quran-study-v2/${studyNumber})`;
    const listCmd = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 10
    });
    const listRes = await r2Client.send(listCmd);

    if (listRes.Contents) {
      const vttFile = listRes.Contents.find(c => c.Key && c.Key.endsWith('.vtt'));
      const audioFile = listRes.Contents.find(c => c.Key && /\.(mp3|m4a|wav)$/i.test(c.Key));

      if (vttFile && vttFile.Key) {
        vttKey = vttFile.Key;
        filename = path.basename(vttKey);
      }
      if (audioFile && audioFile.Key) {
        audioKey = audioFile.Key;
      }
    }
  } catch (e) {
    console.error('Error listing R2 objects:', e);
    return null;
  }

  if (!vttKey) {
    console.warn(`No VTT file found for Study ${studyNumber}`);
    return null;
  }

  // Fetch VTT Content from R2
  let vttContent = '';
  try {
    const getCmd = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: vttKey
    });
    const response = await r2Client.send(getCmd) as GetObjectCommandOutput;
    if (response.Body) {
      vttContent = await response.Body.transformToString();
    }
  } catch (e) {
    console.error(`Error fetching VTT content for ${vttKey}:`, e);
    return null;
  }

  const segments = parseVttToSegments(vttContent);
  const audioUrl = audioKey ? `/api/proxy-audio?key=${encodeURIComponent(audioKey)}` : '';

  return {
    studyNumber,
    filename,
    segments,
    audioUrl
  };
}
