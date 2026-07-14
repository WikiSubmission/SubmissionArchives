const DEFAULT_SITE_URL = 'https://archive.wikisubmission.org';

export const SITE_URL = normalizeSiteUrl(process.env.SITE_URL || DEFAULT_SITE_URL);
export const SITE_NAME = 'Submission Archives';
export const SITE_DESCRIPTION = 'Preserved sermons, Quran studies, and messenger audios by Dr. Rashad Khalifa, with searchable transcripts, a readable Quran, and a written archive.';

function normalizeSiteUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('SITE_URL must use http or https.');
  }

  return url.toString().replace(/\/$/, '');
}
