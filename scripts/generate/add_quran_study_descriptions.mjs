/**
 * Step 9: Add description fields to the 52 quran-study entries in audios.json.
 *
 * Each description is a factual 1-2 sentence summary synthesized from:
 * 1. The thumbnail slide text (from thumbnail-text.md)
 * 2. The existing displayTitle
 * 3. The folder/filename for additional context
 *
 * Run: node scripts/generate/add_quran_study_descriptions.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CATALOG_PATH = path.join(ROOT, 'data', 'catalog', 'audios.json');

// Hand-authored descriptions, one per QS entry (1-52).
// Each is synthesized from the thumbnail text, displayTitle, and folder name.
// Format: factual, 1-2 sentences, stating sura(s), topics, who leads, date if known.
const DESCRIPTIONS = {
  1: "Quran study covering Sura 72:19-28 and Sura 73, focusing on Jinns and the Night Prayer. Led by Kathryn, May 26, 1989.",
  2: "Quran study of Sura 95 and 96, exploring the theme that the Quran is not ink and paper. Led by Dr. Mahmoud Sabahi, with discussion of the two verses of Sura 9 dropped out to demons. Recorded August 4, 1989.",
  3: "Quran study covering Sura 10:79-92, Sura 73 (Rashad's Khutbah), and Sura 3:110-117. Recorded January 19 and 26, 1990.",
  4: "Quran study of Sura 37 by Dr. Rashad Khalifa, with Shakira presenting on an asteroid, and a study of Sura 3:118-129. Recorded at dawn, January 21-22, 1990.",
  5: "Quran study covering Sura 56:75 and Sura 57. Led by Lisa, February 17, 1989.",
  6: "Quran study of Sura 59, covering the Post Retirement Account concept, invisible giants, and hypocrites. Led by Donna, March 10, 1989.",
  7: "Quran study of Sura 62 and 63, with discussion of GOD's religion dominating in 20-50 years. Led by Kathryn, March 24, 1989.",
  8: "Quran study of Sura 65 and 66, with discussion on enjoining children to observe Salat. Hamid argues with Dr. Rashad Khalifa. Led by Lori, April 7, 1989.",
  9: "Quran study of Sura 70, covering chastity and worry. Edip wanted Rashad to change the term 'Rich Believer' but Rashad declined. Led by Edip, May 12, 1989.",
  10: "Quran study of Sura 71 and 72, discussing chastity and Jinns. Led by Afameh, May 19, 1989.",
  11: "Quran study of Sura 23:60-88 and Sura 16. Morning session recorded January 18 and 23, 1990, the morning before January 31, 1990.",
  12: "Behrouz's Khutbah and discussion of Edip Yuksel's exposure. Recorded January 25, 1990.",
  13: "Quran study of Sura 7:12 by Dr. Rashad Khalifa, discussing Adam and Eve's bodies. Recorded December 24, 1989.",
  14: "Night of Destiny Zikr session led by Dr. Rashad Khalifa.",
  15: "Quran study covering Sura 54:23 by Dr. Rashad Khalifa, Sura 55-56, and Sura 51, with discussion of Age 40 and the first generation of believers.",
  16: "Quran study of Sura 64 by Dr. Rashad Khalifa on the theme of nothing happening except by GOD, with angels as the best surgeons. Also covers Sura 59 by Donna and Sura 70 by Edip.",
  17: "Quran study of Sura 90 and 91 by Dr. Rashad Khalifa, and Sura 82-83 by Edip. Recorded July 21, 1989.",
  18: "Quran study covering Sura 61, 87, and 94 by Dr. Rashad Khalifa, and Sura 81 by Edip.",
  19: "Quran study of Sura 2:89-119, covering witchcraft and reverting. Includes an introduction to the Blue Quran.",
  20: "Quran study of Sura 3 led by Dr. Mahmoud Sabahi, with discussion of insurance, fear, and worry.",
  21: "Quran study of Sura 9:52 by Dr. Rashad Khalifa on the hypocrites, with an apology to Parivash. Also covers Sura 56:75.",
  22: "Quran study of Sura 39:11 by Dr. Rashad Khalifa on the admission test — 'I don't compromise with a little insurance.' Also covers Sura 37:164 and Sura 28.",
  23: "Quran study of Sura 51 led by Douglas, covering the New Era and the idea that believers are protected from accidents and diseases.",
  24: "Quran study of Sura 55 and 56. Sura 55 led by Lori, and Sura 56 led by Naghmeh.",
  25: "Quran study of Sura 58, led by Robert.",
  26: "Quran study of Sura 67 led by Gatut Adisoma. Hamid argues with Dr. Rashad Khalifa.",
  27: "Quran study covering Sura 14:19 on chastity and pre-marriage pregnancy, Sura 17:47 on contact prayers as a gift, angels unconscious on the Day of Resurrection, deliberate traps in the Quran, and no time sequence for GOD.",
  28: "Quran study of Sura 45:33 at Parivash's home, exploring the 19-based mathematical code of the Quran.",
  29: "Quran study from Tucson, 1985, featuring Mehri's questions and discussion of the admission test and final test.",
  30: "Quran study of Sura 28 and Sura 57 on insurance with GOD, and Sura 45:33 — Rashad was told to devote all his time to GOD. Recorded January 1990.",
  31: "Quran study of Sura 18:98 and Sura 81 by Edip, with the Azan and Salat demonstrated by Dr. Rashad Khalifa. Recorded November 4, 1989.",
  32: "Quran study of Sura 22:15, discussing which Masjids to pray in.",
  33: "Quran study of Sura 74. Recorded June 2, 1989.",
  34: "Quran study of Sura 33, covering the concept that GOD is physical, and innovations in praying and prostrating after Salat. Recorded June 5, 1989.",
  35: "After-dawn-prayer session where Dr. Rashad Khalifa discusses making deliberate mistakes to destroy idols. Recorded September 8, 1989.",
  36: "Quran study of Sura 30:25, covering a miracle coming out of the biggest brewery, intercession, and allegory. Recorded September 7, 1989.",
  37: "Quran study of Sura 11:68 at Shakira's home. Recorded November 4, 1989.",
  38: "Quran study on the topic of certainty. Recorded November 29, 1989.",
  39: "Quran study of Sura 60 and 61, covering the Rich Believer, certainty, and insurance (discussed at the 1:14 mark). Recorded December 28, 1989.",
  40: "Quran study of Sura 3:59. Recorded December 29, 1989.",
  41: "Quran study of Sura 54 by Dr. Rashad Khalifa, with discussion of reciting Al-Fatihah for everything you wish and extreme libertarianism.",
  42: "Interview with Dr. Rashad Khalifa by Ray Caton, covering insurance and interest.",
  43: "Dr. Rashad Khalifa's speech at the 3rd International Conference in Tucson, September 1988, covering Sura 17:39 and insurance based on fear.",
  44: "Quran study of Sura 64 by Dr. Rashad Khalifa on nothing happening except by GOD's will. Also covers Sura 70 by Edip on worry and chastity.",
  45: "Quran study of Sura 40 by Dr. Rashad Khalifa at Feroz's home, discussing Déjà Vu and the idea that old believers usually finish all their affairs before departing.",
  46: "Quran study covering Sura 37:159, 38:25, Sura 9:50, and Sura 39:11 on the admission test — 'I don't compromise with a little insurance.' Also discusses Jinns, hypocrites, and an apology.",
  47: "Introduction to the Blue Quran, covering Sura 1 and the beginning of Sura 2.",
  48: "Dr. Rashad Khalifa's speech at Parivash's home on Salat and Zakat, with Fazeli arguing. Recorded January 11, 1989.",
  49: "Dr. Rashad Khalifa's speech at Parivash's home on the 19-based mathematical code. Recorded November 5, 1989.",
  50: "Quran study of Sura 92, 93, and 94, with discussion that Zakat is not limited to earned money. Led by Kathryn, July 27, 1989.",
  51: "Quran study of Sura 17:59 by Dr. Rashad Khalifa. Recorded 1990.",
  52: "Partial Quran study of Sura 1 and 2, led by Linda. Recorded May 9, 1989.",
};

// --- Main ---
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

let updated = 0;
for (const entry of catalog) {
  if (entry.type !== 'quran-study') continue;

  // Extract QS number from id
  const match = entry.id.match(/^quran-study\/(\d+)/);
  if (!match) {
    console.warn(`  ⚠ Could not extract QS number from id: ${entry.id}`);
    continue;
  }
  const num = Number(match[1]);
  const desc = DESCRIPTIONS[num];
  if (!desc) {
    console.warn(`  ⚠ No description for QS ${num}`);
    continue;
  }

  entry.description = desc;
  updated++;
  console.log(`  ✓ QS ${String(num).padStart(2, '0')}: ${desc.substring(0, 60)}...`);
}

fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
console.log(`\nDone \u2014 ${updated} descriptions added to ${CATALOG_PATH}`);
