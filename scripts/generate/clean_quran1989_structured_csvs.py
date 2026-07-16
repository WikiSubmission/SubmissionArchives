"""Conservatively repair the structured 1989 Quran transcription.

The 1989 PDF contains an embedded OCR layer.  It is useful for locating text, but
line wrapping, decorative rules, and narrow columns occasionally split words or
leak neighboring material into a verse.  This post-processor keeps the 1989
wording, uses the later transcription only as a spelling/alignment aid, and
applies a small set of page-verified corrections for rows the OCR cannot recover.

Raw page OCR in ``Quran1989_complete.json`` and ``Quran1989_pages_layout.jsonl``
is intentionally left untouched as provenance.  Only the three structured CSVs
consumed by the site are cleaned.
"""

from __future__ import annotations

import csv
import re
from difflib import SequenceMatcher
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
EDITION_DIR = REPO_ROOT / "data" / "sources" / "quran" / "1989"
PRIMARY_DIR = REPO_ROOT / "data" / "sources" / "quran" / "1992"
WORD_RE = re.compile(r"[A-Za-z]+(?:[’'][A-Za-z]+)?")


# Every value below was checked against the rendered 1989 PDF page recorded in
# Quran1989_verse_index.csv.  These are extraction repairs, not later-edition
# substitutions.
PAGE_VERIFIED_VERSES = {
    "7:71": "He said, “You have incurred condemnation and wrath from your Lord. Do you argue with me in defense of innovations you have fabricated—you and your parents—in which GOD has placed no power? Therefore, wait and I will wait along with you.”",
    "8:8": "For He causes the truth to prevail, and the falsehood to vanish, despite the evildoers.",
    "12:111": "In their history, there is a lesson for those who possess intelligence. This is not a fabricated Hadith; this (Quran) confirms all previous scriptures, and provides the details of everything. It is a beacon and mercy for those who believe.",
    "24:64": "Absolutely, to GOD belongs everything in the heavens and the earth. He fully knows every condition you may be in. Thus, the day you are returned to Him, He will inform them of everything they had done. GOD is fully aware of all things.",
    "25:77": "Say, “You attain value at my Lord only through your worship. But if you disbelieve, you incur the inevitable consequences.”",
    "35:18": "No soul can carry the sins of another soul. If a soul that is loaded with sins implores to have part of its load removed, no other soul can carry any part of it, even if they are related. The only people to heed your warnings are those who reverence their Lord, even when alone in their privacy, and observe the contact prayers (Salat). Whoever purifies his soul, does so for his own good. To GOD is the final destiny.",
    "40:34": "Joseph had come to you in the past with clear signs, but you continued to doubt his message. And when he died you said, “GOD will not send any messenger after him. (He was the last messenger)!” GOD thus sends astray those who are transgressors, doubtful.*",
    "42:14": "Ironically, they broke up into sects—only after the knowledge had come to them—due to jealousy and resentment among themselves. If it were not for a predetermined decision from your Lord to respite them for a definite interim, they would have been judged immediately. Indeed, these later generations who inherited the scripture are full of doubts.",
    "44:56": "They never taste death therein, beyond the first death. He has spared them the retribution of Hell.",
    "46:35": "Therefore, be patient like the messengers who possessed strength and practiced patience, and do not be in a hurry (to see the retribution coming) to them. The day they see it, it will seem as if they lasted one hour of the day. This is a proclamation: Is it not the wicked who are annihilated?",
    "49:13": "O people, we created you from the same male and female, and rendered you distinct peoples and tribes, that you may recognize one another. The best among you in the sight of GOD is the most righteous. GOD is Omniscient, Cognizant.",
    "51:60": "Woe to those who disbelieved from the day that is awaiting them.",
    "56:96": "You shall glorify the name of your Lord, the Great.",
    "63:11": "GOD never delays the appointed time of death for any soul. GOD is fully Cognizant of everything you do.",
    "68:28": "The righteous among them said, “If only you had glorified (God)!”",
    "68:44": "Therefore, let Me deal with those who reject this Hadith; we will lead them on whence they never perceive.",
    "69:4": "Thamoud and Aad disbelieved in the Shocker.",
    "70:44": "With their eyes subdued, shame will cover them. That is the day that is awaiting them.",
    "75:40": "Is He then unable to revive the dead?",
    "78:38": "The day will come when the Spirit and the angels will stand in a row. None will speak except those permitted by the Most Gracious and they will utter only what is right.",
    "79:15": "Have you known about the history of Moses?",
    "80:42": "These are the wicked disbelievers.",
    "82:19": "That is the day when no soul can help another soul, and all decisions, on that day, will belong to GOD.",
    "83:6": "That is the day when all people will stand before the Lord of the universe.",
    "84:25": "As for those who believed and led a righteous life, they receive a recompense that is well deserved.",
    "90:17": "And being one of those who believe, and exhorting one another to be steadfast, and exhorting one another to be kind.",
    "92:14": "I have warned you about the blazing Hellfire.",
    "92:21": "He will certainly attain salvation.",
    "95:5": "Then turned him into lowliest of the lowly.",
    "99:8": "And whoever does an atom’s weight of evil will see it.",
    "101:11": "The blazing Hellfire.",
    "103:3": "Except those who believe and lead a righteous life, and exhort one another to uphold the truth, and exhort one another to be steadfast.",
    "106:4": "For He is the One who fed them after hunger, and provided them with security after fear.",
    "108:3": "Your opponent will be the loser.",
    "110:3": "You shall glorify and praise your Lord, and implore Him for forgiveness. He is the Redeemer.",
    "112:1": "Proclaim, “He is the One and only GOD.",
    "112:2": "“The Absolute GOD.",
    "112:3": "“Never did He beget. Nor was He begotten.",
    "112:4": "“None equals Him.”",
    "113:1": "Say, “I seek refuge in the Lord of daybreak.",
    "113:2": "“From the evils among His creations.",
    "113:3": "“From the evils of darkness as it falls.",
    "113:4": "“From the evils of the troublemakers.",
    "113:5": "“From the evils of the envious when they envy.”",
    "114:1": "Say, “I seek refuge in the Lord of the people.",
    "114:2": "“The King of the people.",
    "114:3": "“The god of the people.",
    "114:4": "“From the evils of sneaky whisperers.",
    "114:5": "“Who whisper into the chests of the people.",
    "114:6": "“Be they of the jinns, or the people.”",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    if not rows:
        raise ValueError(f"Refusing to write empty CSV: {path}")
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def normalize_apostrophes(value: str) -> str:
    value = value.replace("\u00ad", "")
    value = re.sub(r"\bG\s+O\s+D\b", "GOD", value)
    value = re.sub(r"\bGO\s+D\b", "GOD", value)
    value = re.sub(r"\bGOD\s+[’']s\b", "GOD’s", value)
    value = re.sub(r"\bGODs\b", "GOD’s", value)
    value = re.sub(r"\bGODa\b", "GOD a", value)
    return re.sub(r"\s+([,.;:!?])", r"\1", value).strip()


def merge_split_words(value: str, references: str) -> str:
    """Join only whitespace-separated fragments that form a reference word."""
    reference_words = {
        match.group().lower().replace("’", "'"): match.group()
        for match in WORD_RE.finditer(references)
    }
    if not reference_words:
        return value

    for _ in range(12):
        tokens = list(WORD_RE.finditer(value))
        changed = False
        for width in range(min(8, len(tokens)), 1, -1):
            for index in range(len(tokens) - width + 1):
                chunk = tokens[index:index + width]
                if any(
                    not re.fullmatch(r"\s+", value[chunk[pos].end():chunk[pos + 1].start()])
                    for pos in range(width - 1)
                ):
                    continue
                joined = "".join(match.group() for match in chunk).lower().replace("’", "'")
                replacement = reference_words.get(joined)
                if replacement:
                    value = value[:chunk[0].start()] + replacement + value[chunk[-1].end():]
                    changed = True
                    break
            if changed:
                break
        if not changed:
            break
    return value


def repair_unambiguous_token_errors(value: str, reference: str, vocabulary: set[str]) -> str:
    """Repair aligned nonwords while leaving genuine edition wording untouched."""
    source_tokens = list(WORD_RE.finditer(value))
    reference_tokens = list(WORD_RE.finditer(reference))
    source_words = [match.group().lower().replace("’", "'") for match in source_tokens]
    reference_words = [match.group().lower().replace("’", "'") for match in reference_tokens]
    matcher = SequenceMatcher(None, source_words, reference_words, autojunk=False)
    replacements: list[tuple[int, int, str]] = []

    for operation, i1, i2, j1, j2 in matcher.get_opcodes():
        if operation != "replace" or i2 - i1 != j2 - j1:
            continue
        for source_index, reference_index in zip(range(i1, i2), range(j1, j2)):
            source_word = source_words[source_index]
            reference_word = reference_words[reference_index]
            if source_word in vocabulary or reference_word not in vocabulary:
                continue
            if len(source_word) < 3 or SequenceMatcher(None, source_word, reference_word).ratio() < 0.68:
                continue
            source_match = source_tokens[source_index]
            replacements.append((source_match.start(), source_match.end(), reference_tokens[reference_index].group()))

    for start, end, replacement in reversed(replacements):
        value = value[:start] + replacement + value[end:]
    return value


def clean_with_reference(value: str, reference: str, vocabulary: set[str]) -> str:
    value = normalize_apostrophes(value)
    value = merge_split_words(value, reference)
    value = repair_unambiguous_token_errors(value, reference, vocabulary)
    return normalize_apostrophes(value)


def main() -> None:
    primary_rows = read_csv(PRIMARY_DIR / "ws_quran_text_rows.csv")
    primary_by_verse = {
        row["verse_id"]: row["english"].replace("Â±", "").strip()
        for row in primary_rows
    }
    vocabulary = {
        match.group().lower().replace("’", "'")
        for text in primary_by_verse.values()
        for match in WORD_RE.finditer(text)
    }

    verse_path = EDITION_DIR / "Quran1989_verse_index.csv"
    verse_rows = read_csv(verse_path)
    for row in verse_rows:
        verse_id = row["verse_id"]
        if verse_id in PAGE_VERIFIED_VERSES:
            row["english_1989"] = PAGE_VERIFIED_VERSES[verse_id]
            row["english_transcription_source"] = "manual visual correction"
            row["english_transcription_note"] = "Checked against the rendered 1989 source page."
        elif int(row["verse_number"]) > 0:
            row["english_1989"] = clean_with_reference(
                row["english_1989"], primary_by_verse.get(verse_id, ""), vocabulary
            )
    write_csv(verse_path, verse_rows)

    footnote_path = EDITION_DIR / "Quran1989_footnotes.csv"
    footnote_rows = read_csv(footnote_path)
    for row in footnote_rows:
        candidate = row.get("later_edition_candidates_same_label", "")
        row["text"] = clean_with_reference(row["text"], candidate, vocabulary)
        if row["verse_reference"] == "81:23" and int(row["pdf_page"]) == 605:
            row["text"] = "Rashad Khalifa was summoned to the high horizon as detailed in Appendix 2."
    write_csv(footnote_path, footnote_rows)

    subheading_path = EDITION_DIR / "Quran1989_subheadings.csv"
    subheading_rows = read_csv(subheading_path)
    for row in subheading_rows:
        candidate = row.get("later_edition_candidates_same_verse", "")
        row["text"] = clean_with_reference(row["text"], candidate, vocabulary)
    write_csv(subheading_path, subheading_rows)

    numbered_verses = [row for row in verse_rows if int(row["verse_number"]) > 0]
    if len(verse_rows) != 6346 or len(numbered_verses) != 6234:
        raise AssertionError(f"Unexpected verse counts: {len(verse_rows)} total, {len(numbered_verses)} numbered")
    if len(footnote_rows) != 341 or len(subheading_rows) != 752:
        raise AssertionError(
            f"Unexpected structural counts: {len(footnote_rows)} footnotes, {len(subheading_rows)} subheadings"
        )

    artifact_pattern = re.compile(r"_{3,}|-{5,}|\\")
    artifact_rows = [
        row["verse_id"] for row in numbered_verses if artifact_pattern.search(row["english_1989"])
    ]
    if artifact_rows:
        raise AssertionError(f"Decorative PDF/OCR debris remains in verses: {artifact_rows[:10]}")

    print(
        f"Cleaned {len(numbered_verses)} numbered verses, "
        f"{len(footnote_rows)} footnotes, and {len(subheading_rows)} subheadings."
    )


if __name__ == "__main__":
    main()
