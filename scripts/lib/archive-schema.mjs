import fs from 'node:fs';
import path from 'node:path';

export const ARCHIVE_RECORD_TYPES = new Set([
  'video-program',
  'sermon',
  'video',
  'quran-study',
  'messenger-audio',
  'audio',
  'perspective',
  'appendix',
  'other',
  'quran',
]);

const REQUIRED_COLLECTIONS = {
  Videos: 1,
  'Quran Studies': 1,
  'Messenger Audios': 1,
  'Submitter Perspectives': 1,
  Appendices: 1,
  Quran: 114,
  Books: 1,
};

function isRemotePath(value) {
  return /^https?:\/\//i.test(value || '');
}

function resolvePublicPath(publicDir, value) {
  const relative = String(value || '').replace(/^\/+/, '').replace(/\//g, path.sep);
  return path.resolve(publicDir, relative);
}

export function validateArchiveRecords(records, { publicDir }) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const categoryCounts = {};
  const typeCounts = {};
  const recordsWithoutSegments = [];

  if (!Array.isArray(records)) {
    return {
      valid: false,
      errors: ['Archive index must be an array.'],
      warnings,
      recordCount: 0,
      segmentCount: 0,
      categoryCounts,
      typeCounts,
      recordsWithoutSegments,
    };
  }

  let segmentCount = 0;

  for (const [index, record] of records.entries()) {
    const location = `record[${index}]`;
    if (!record || typeof record !== 'object') {
      errors.push(`${location} must be an object.`);
      continue;
    }

    if (typeof record.id !== 'string' || !record.id.trim()) {
      errors.push(`${location} is missing a non-empty id.`);
    } else if (ids.has(record.id)) {
      errors.push(`Duplicate archive id: ${record.id}`);
    } else {
      ids.add(record.id);
    }

    if (typeof record.title !== 'string' || !record.title.trim()) {
      errors.push(`${record.id || location} is missing a title.`);
    }

    if (!ARCHIVE_RECORD_TYPES.has(record.type)) {
      errors.push(`${record.id || location} has unsupported type: ${record.type}`);
    }

    if (typeof record.category !== 'string' || !record.category.trim()) {
      errors.push(`${record.id || location} is missing a category.`);
    } else {
      categoryCounts[record.category] = (categoryCounts[record.category] || 0) + 1;
    }
    typeCounts[record.type] = (typeCounts[record.type] || 0) + 1;

    if (!Array.isArray(record.segments)) {
      errors.push(`${record.id || location} must contain a segments array.`);
      continue;
    }

    if (record.segmentCount !== record.segments.length) {
      errors.push(`${record.id || location} segmentCount does not match segments.length.`);
    }

    segmentCount += record.segments.length;
    if (record.segments.length === 0) {
      recordsWithoutSegments.push({
        id: record.id,
        category: record.category,
        type: record.type,
        transcriptStatus: record.transcriptStatus,
      });
    }

    if (record.segments.length > 0 && record.transcriptStatus !== 'available') {
      errors.push(`${record.id || location} has segments but transcriptStatus is not available.`);
    }
    if (record.segments.length === 0 && record.transcriptStatus === 'available') {
      errors.push(`${record.id || location} is marked available but has no segments.`);
    }

    for (const [segmentIndex, segment] of record.segments.entries()) {
      if (!segment || typeof segment.text !== 'string' || !segment.text.trim()) {
        errors.push(`${record.id || location} segment[${segmentIndex}] has no searchable text.`);
      }
    }

    for (const field of ['pdfLink', 'thumbnailOverride']) {
      const value = record[field];
      if (!value || isRemotePath(value)) continue;
      const target = resolvePublicPath(publicDir, value);
      if (!fs.existsSync(target)) {
        errors.push(`${record.id || location} references missing ${field}: ${value}`);
      }
    }
  }

  for (const [category, minimum] of Object.entries(REQUIRED_COLLECTIONS)) {
    if ((categoryCounts[category] || 0) < minimum) {
      errors.push(`Collection ${category} must contain at least ${minimum} record(s).`);
    }
  }

  for (const category of ['Videos', 'Quran Studies', 'Messenger Audios', 'Submitter Perspectives', 'Appendices', 'Quran', 'Books']) {
    const searchable = records.some((record) => record.category === category && record.segments?.length > 0);
    if (!searchable) errors.push(`Collection ${category} has no searchable records.`);
  }

  if (recordsWithoutSegments.length > 0) {
    warnings.push(`${recordsWithoutSegments.length} record(s) are clearly marked without searchable segments.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recordCount: records.length,
    segmentCount,
    categoryCounts: Object.fromEntries(Object.entries(categoryCounts).sort(([a], [b]) => a.localeCompare(b))),
    typeCounts: Object.fromEntries(Object.entries(typeCounts).sort(([a], [b]) => a.localeCompare(b))),
    recordsWithoutSegments,
  };
}

export function assertValidArchiveRecords(records, options) {
  const report = validateArchiveRecords(records, options);
  if (!report.valid) {
    throw new Error(`Archive validation failed:\n${report.errors.map((error) => `- ${error}`).join('\n')}`);
  }
  return report;
}
