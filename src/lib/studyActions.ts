'use server';

import fs from 'fs';
import path from 'path';
import { parseVttToSegments, Segment } from '@/lib/transcriptUtils';
import { getMediaAssetUrl } from '@/lib/mediaAssets';

export interface StudyTranscriptData {
  studyNumber: number;
  filename: string;
  segments: Segment[];
  audioUrl: string;
}

type AudioIndexItem = {
  type: string;
  folder: string;
  audioFile?: string | null;
};

function readGeneratedIndex<T>(filename: string): T[] {
  const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T[];
}

function getAudioCatalog() {
  const catalog = readGeneratedIndex<AudioIndexItem>('AUDIOS_LIST.json');
  if (catalog.length > 0) return catalog;

  const master = readGeneratedIndex<AudioIndexItem>('MASTER_INDEX.json')
    .filter((item) => item.type === 'quran-study' || item.type === 'messenger-audio');
  if (master.length > 0) return master;

  return readGeneratedIndex<AudioIndexItem>('ALL_AUDIOS.json');
}

export async function fetchQuranStudyData(studyNumber: number): Promise<StudyTranscriptData | null> {
  try {
    // 1. Find the item in local audios index
    const allAudios = getAudioCatalog();
    // Find item starting with the study number or matching the pattern
    const item = allAudios.find(a =>
      a.type === 'quran-study' &&
      (a.folder.startsWith(`${studyNumber} `) || a.folder.startsWith(`0${studyNumber} `) || a.folder.startsWith(`${studyNumber})`))
    );

    if (!item) {
      console.warn(`No local record found for Quran Study ${studyNumber}`);
      return null;
    }

    const publicDir = path.join(process.cwd(), 'public');
    const folderPath = path.join(publicDir, 'content', 'audio', 'quran-studies', item.folder);

    if (!fs.existsSync(folderPath)) {
      console.warn(`Local folder not found: ${folderPath}`);
      return null;
    }

    // 2. Find VTT and Audio files
    const files = fs.readdirSync(folderPath);
    const vttFile = files.find(f => f.endsWith('.vtt'));
    const audioFile = files.find(f => /\.(mp3|m4a|wav)$/i.test(f));

    if (!vttFile) {
        console.warn(`No VTT file found in folder: ${item.folder}`);
        return null;
    }

    const vttContent = fs.readFileSync(path.join(folderPath, vttFile), 'utf-8');
    const segments = parseVttToSegments(vttContent);

    // Construct local public URL for audio
    const audioUrl = audioFile
      ? getMediaAssetUrl({ type: item.type, folder: item.folder, audioFile })
      : '';

    return {
      studyNumber,
      filename: vttFile,
      segments,
      audioUrl: encodeURI(audioUrl)
    };

  } catch (e) {
    console.error('Error fetching local Quran Study data:', e);
    return null;
  }
}
