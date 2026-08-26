import fs from 'fs';

// Read the scanner results and organize by core thematic categories
const raw = fs.readFileSync('./qurantalk-code19-articles.md', 'utf8');

// Specific core themes
const categories = {
    'Core Mathematical Miracle & Code 19 Proofs': [
        'Counting the Sacred Text: A History of Numerical Verification in Scripture Preservation',
        "If Code 19 Doesn’t Exist, Neither Does the U.S.",
        "The Quran's Anomalous Emergence: A Monument Without Scaffolding",
        "19 Angels or 19 Miracle",
        "The Quran's Mathematical Code (26:5 – 26:9)",
        "The Disbelievers Rebutted by the Quran's Mathematical Code (25:4 – 25:6)",
        "Day Mentioned 365 Times in Quran",
        "Basmalah 19 Letters",
        "Basmalah Word Count",
        "Sura 96 and Code 19",
        "Allah Count Quran: 2698 (19×142)",
        "Code 19: Qiraat Sura 36 (Y.S.)",
        "Sura 27 Word Count",
        "Sura 19:31 & 19:94; Count of Y: How the Quran's Mathematical Structure Preserves the Quranic Text"
    ],
    'Quranic Initials & Letter Counts': [
        "H.M. Initial Counts (An Amazing Miracle)",
        "Rashad Khalifa's Lam Counts in the Quran",
        "Sura 19:31 & 19:94; Count of Y: How the Quran's Mathematical Structure Preserves the Quranic Text",
        "Code 19: Qiraat Sura 36 (Y.S.)",
        "Hafs vs. Shuʿbah Recitation",
        "Wash or Wipe & Qira'at"
    ],
    'The Two False Verses (9:128–129) & Manuscript Integrity': [
        "9:128 & 129 Are Not Part of the Original Quran According to Hadith",
        "The History Behind 9:128 – 9:129",
        "An Analysis of the Arabic of 9:128 and 9:129",
        "Word Count of 9:128-129",
        "Who witnessed 9:128-129?",
        "Critical Analysis of the Narrative on Abu Bakr's Collection (9:128-129)",
        "Oldest Quran Manuscripts",
        "The Devil Can't Change the Text of the Quran, but He Can Deceive People in its Meaning"
    ],
    'Dr. Rashad Khalifa, Ahmed Deedat & Messengership Proofs': [
        "Rashad Khalifa Lifespan Mathematically Coded by the Quran",
        "Rashad Khalifa Prophesied in Hadith",
        "Messengers After Muhammad",
        "Divine Interpretation: Sign of Messengership",
        "Would You Support God's Messenger, Today?",
        "Who Did Jesus Say Would Come After Him?",
        "Every Community Receives a Messenger",
        "Sura 96 and Code 19"
    ]
};

console.log("Categories organized.");
