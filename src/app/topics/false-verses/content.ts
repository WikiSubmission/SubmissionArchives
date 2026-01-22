
export const INTRODUCTION = `
A superhuman mathematical system pervades the Quran and serves to guard and authenticate every element in it. Nineteen years after the Prophet's death, some scribes injected two false verses at the end of Sura 9, the last sura revealed in Medina. The evidence presented in this Appendix incontrovertibly removes these human injections, restores the Quran to its pristine purity, and illustrates a major function of the Quran's mathematical code, namely, to protect the Quran from the slightest tampering. Thus, the code rejects ONLY the false injections 9:128-129.
`;

export type EvidencePoint = {
    id: number;
    title: string;
    description: string;
    // Optional array of verse references to display
    verses?: {
        ref: string;
        text: string;
    }[];
    visual: {
        type: 'equation' | 'list' | 'stat' | 'comparison' | 'table';
        data: any;
        label?: string;
    };
    highlight?: boolean;
};

export const EVIDENCE_POINTS: EvidencePoint[] = [
    {
        id: 1,
        title: "Word 'God' Count",
        description: "The frequency of the word \"God\" (Allah) in the Quran is exact only when the false verses are removed.",
        // No specific verse text to embed here as it's a global count
        visual: {
            type: 'comparison',
            data: {
                correct: { value: 2698, subtext: "19 x 142" },
                incorrect: { value: 2699, subtext: "Not Divisible" }
            }
        },
        highlight: true
    },
    {
        id: 2,
        title: "Sum of Verse Numbers (Word 'God')",
        description: "The sum of all verse numbers where the word \"God\" occurs is a multiple of 19. If the false verse 9:129 is included, this total becomes invalid.",
        visual: {
            type: 'stat',
            data: { value: "118123", subtext: "19 x 6217" }
        }
    },
    {
        id: 3,
        title: "Sura 9 'God' Count",
        description: "The total occurrence of the word \"God\" throughout the Quran up to the end of Sura 9 is a multiple of 19, but only without the extra verses.",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: 1273, subtext: "19 x 67" },
                incorrect: { value: 1274, subtext: "Not Divisible" }
            }
        }
    },
    {
        id: 4,
        title: "'God' in Initialed Section",
        description: "The occurrence of the word \"God\" from the first initial (2:1) to the last initial (68:1) is 2641.",
        visual: {
            type: 'stat',
            data: { value: "2641", subtext: "19 x 139" }
        }
    },
    {
        id: 5,
        title: "'God' in Un-initialed Suras",
        description: "Sura 9 is un-initialed. Across all 85 un-initialed suras, the word \"God\" appears in exactly 57 of them (19x3).",
        visual: {
            type: 'stat',
            data: { value: "57 Suras", subtext: "19 x 3" }
        }
    },
    // We will populate the rest of the 71 points iteratively
    {
        id: 6,
        title: "'God' from Missing to Extra Basmalah",
        description: "From the missing Basmalah in Sura 9 to the extra one in Sura 27, the word \"God\" appears in exactly 513 verses (19x27). Inclusion of the false verses breaks this count to 514.",
        visual: {
            type: 'stat',
            data: { value: 513, subtext: "19 x 27" }
        }
    },
    {
        id: 7,
        title: "Word 'Elaah' (god)",
        description: "The word \"Elaah\" appears 95 times (19x5). The false verse 129 contains this word, which would raise the count to 96, destroying the multiple.",
        verses: [
            { ref: "9:129 (False Verse)", text: "But if they turn away, say: 'God is sufficient for me; there is no god (Elaah) but He.'" }
        ],
        visual: {
            type: 'comparison',
            data: {
                correct: { value: 95, subtext: "19 x 5" },
                incorrect: { value: 96, subtext: "Not Divisible" }
            }
        }
    },
    {
        id: 8,
        title: "Word 'Rasool' (Messenger)",
        description: "Excluding the \"messenger of Pharaoh\" (12:50), the total occurrences of \"Rasool\" referring to God's messenger is 114 (19x6). False verse 128 adds an extra occurrence.",
        verses: [
            { ref: "9:128 (False Verse)", text: "There has come to you a messenger (Rasool) from among yourselves..." }
        ],
        visual: {
            type: 'stat',
            data: { value: 114, subtext: "19 x 6" }
        }
    },
    {
        id: 9,
        title: "Word 'Raheem' (Merciful)",
        description: "\"Raheem\" is used exclusively for God in the Quran (114 times, 19x6). The false verse 128 uses it for the prophet, violating this divine exclusivity.",
        verses: [
            { ref: "9:128 (False Verse)", text: "...grievous to him is your suffering, anxious over you, towards the believers, compassionate, merciful (Raheem)." }
        ],
        visual: {
            type: 'stat',
            data: { value: 114, subtext: "19 x 6 (God Only)" }
        }
    },
    {
        id: 10,
        title: "Word 'Arsh' (Throne)",
        description: "The word \"Arsh\" occurs exactly 19 times when referring to God's throne (excluding Joseph's and Sheba's thrones). False verse 129 adds a 20th occurrence.",
        verses: [
            { ref: "9:129 (False Verse)", text: "...and He is the Lord of the Great Throne (Arsh)." }
        ],
        visual: {
            type: 'comparison',
            data: {
                correct: { value: 19, subtext: "19 x 1" },
                incorrect: { value: 20, subtext: "Not Divisible" }
            }
        }
    },
    {
        id: 11,
        title: "Commands 'Say' vs 'They Said'",
        description: "The command \"Qul\" (Say) and the response \"Qaaloo\" (They Said) each occur exactly 332 times, creating a perfect balance. False verse 129 adds a \"Say\", destroying the match.",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: "332 vs 332", subtext: "Perfect Match" },
                incorrect: { value: "333 vs 332", subtext: "Mismatch" }
            }
        }
    },
    {
        id: 12,
        title: "Total Verses in Quran",
        description: "The total number of verses (numbered + unnumbered Basmalahs) is 6346 (19x334). Adding two verses breaks this fundamental total.",
        visual: {
            type: 'stat',
            data: { value: 6346, subtext: "19 x 334" }
        },
        highlight: true
    },
    {
        id: 13,
        title: "Mathematical Structure (All Suras)",
        description: "Sum of: [Sura No.] + [Verse Count] + [Sum of Verse Nos.] for the entire Quran is a multiple of 19. This massive calculation fails if Sura 9 has 129 verses.",
        visual: {
            type: 'stat',
            data: { value: "346,199", subtext: "19 x 19 x 959" }
        }
    },
    {
        id: 14,
        title: "Structure (Un-initialed Suras)",
        description: "Performing the same calculation for only the 85 un-initialed suras (including Sura 9) also yields a multiple of 19.",
        visual: {
            type: 'stat',
            data: { value: "156,066", subtext: "19 x 8214" }
        }
    },
    {
        id: 15,
        title: "Un-initialed Suras (Start to Sura 9)",
        description: "Sum of [Sura No.] + [Verse Count] for un-initialed suras up to Sura 9 is 703.",
        visual: {
            type: 'stat',
            data: { value: 703, subtext: "19 x 37" }
        }
    },
    {
        id: 16,
        title: "Missing Basmalah to End",
        description: "Sum of [Sura No.] + [Verse Count] + [Sum of Verse Nos.] from Sura 9 (Missing Basmalah) to the end of Quran.",
        visual: {
            type: 'stat',
            data: { value: "116,090", subtext: "19 x 6110" }
        }
    },
    {
        id: 17,
        title: "Missing to Extra Basmalah",
        description: "The same calculation from Sura 9 (Missing Basmalah) to Sura 27 (Extra Basmalah).",
        visual: {
            type: 'stat',
            data: { value: "119,966", subtext: "19 x 6314" }
        }
    },
    {
        id: 18,
        title: "Missing Basmalah to 74:30",
        description: "The same calculation from Sura 9 to 74:30 (where 'Nineteen' is mentioned).",
        visual: {
            type: 'stat',
            data: { value: "207,670", subtext: "19 x 10930" }
        }
    },
    {
        id: 19,
        title: "Verses with Digits Summing to 10",
        description: "Between the missing and extra Basmalahs, the number of verses whose digits sum to 10 is 2470 (19x130). 127 sums to 10 (1+2+7). 129 does not.",
        visual: {
            type: 'stat',
            data: { value: 2470, subtext: "19 x 130" }
        }
    },
    {
        id: 20,
        title: "Suras Repeating '9'",
        description: "Calculations involving suras where verse count ends in '9' (from Sura 10 to 104) total 23655. If Sura 9 had 129 verses, it would join this group and destroy the total.",
        visual: {
            type: 'stat',
            data: { value: "23,655", subtext: "19 x 1245" }
        }
    },
    {
        id: 21,
        title: "Count of Digit '1'",
        description: "Counting all the '1's in verse numbers across the Quran equals 2546 (19x134). If verses 128 and 129 are included, two extra '1's appear.",
        visual: {
            type: 'stat',
            data: { value: 2546, subtext: "19 x 134" }
        }
    },
    {
        id: 22,
        title: "'1's in Un-initialed Suras",
        description: "In the 85 un-initialed suras, the count of the digit '1' in verse numbers is 1406 (19x74).",
        visual: {
            type: 'stat',
            data: { value: 1406, subtext: "19 x 74" }
        }
    },
    {
        id: 23,
        title: "Digits '1', '2', '8', '9'",
        description: "The sum of occurrences of digits 1, 2, 8, and 9 (the digits in 128 & 129) in all verse numbers is 5928 (19x312). Adding the false verses adds 6 more digits.",
        visual: {
            type: 'stat',
            data: { value: 5928, subtext: "19 x 312" }
        }
    },
    {
        id: 24,
        title: "All Digits in Un-initialed Suras",
        description: "The total count of all digits (1-9) in verse numbers for un-initialed suras is 27075.",
        visual: {
            type: 'stat',
            data: { value: "27,075", subtext: "19 x 19 x 75" }
        }
    },
    {
        id: 25,
        title: "Sum of Sura & Verse Digits",
        description: "Sum of digits of all sura numbers + sum of digits of all verse counts = 1881. This total relies on Sura 9 having 127 verses.",
        visual: {
            type: 'stat',
            data: { value: 1881, subtext: "19 x 99" }
        }
    },
    {
        id: 26,
        title: "Product of Digits Sums",
        description: "Multiply (Sum of digits for each sura) x (Sum of digits of its verse count). Grand total is 7771.",
        visual: {
            type: 'stat',
            data: { value: 7771, subtext: "19 x 409" }
        }
    },
    {
        id: 27,
        title: "Odd Suras Calculation",
        description: "For odd-numbered suras: Total (Sura Nos) + Total (Verse Counts) = 950.",
        visual: {
            type: 'stat',
            data: { value: 950, subtext: "19 x 50" }
        }
    },
    {
        id: 28,
        title: "Suras with <= 127 Verses",
        description: "There are 105 suras with 127 or fewer verses. Sum of [Sura No.] + [Verse Count] for these suras is 10963.",
        visual: {
            type: 'stat',
            data: { value: "10,963", subtext: "19 x 577" }
        }
    },
    {
        id: 29,
        title: "Odd Suras / Odd Verses",
        description: "Suras that are both odd-numbered and have an odd number of verses (27 suras). Total sum is 2774.",
        visual: {
            type: 'stat',
            data: { value: 2774, subtext: "19 x 146" }
        }
    },
    {
        id: 30,
        title: "Prime Verse Counts",
        description: "Suras where the verse count is a Prime Number (like 127). Sum of digits of these suras + sum of digits of their verse counts = 266.",
        visual: {
            type: 'stat',
            data: { value: 266, subtext: "19 x 14" }
        }
    },
    {
        id: 31,
        title: "3-Digit / Divisible by 3",
        description: "Suras with 3-digit verse counts divisible by 3. Total sum of sura numbers + verse counts is 836. Sura 9 (127 verses) is excluded. If it had 129 (divisible by 3), it would break this.",
        visual: {
            type: 'stat',
            data: { value: 836, subtext: "19 x 44" }
        }
    },
    {
        id: 32,
        title: "Suras with >= 129 Verses",
        description: "Suras with 129 or more verses. If Sura 9 had 129, the total verse count of this group would be 1706 (Not Divisible). Without it, it maintains the code.",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: "Excluded", subtext: "Patterns Hold" },
                incorrect: { value: 1706, subtext: "Not Divisible" }
            }
        }
    },
    {
        id: 33,
        title: "Verses containing '1' and '2'",
        description: "Suras where verse count contains digits '1' and '2' (like 127). Sum of [Sura No.] + [Verse Count] is 1159.",
        visual: {
            type: 'stat',
            data: { value: 1159, subtext: "19 x 61" }
        }
    },
    {
        id: 34,
        title: "Single Digit Sura / '1' & '2'",
        description: "Single digit suras (1-9) with verse counts containing '1' & '2'. Only Sura 5 and 9. Total verses: 247.",
        visual: {
            type: 'stat',
            data: { value: 247, subtext: "19 x 13" }
        }
    },
    {
        id: 35,
        title: "Verse Count Starts with '1'",
        description: "Suras where verse count begins with digit '1'. Sum of all verse numbers within these suras is 126122.",
        visual: {
            type: 'stat',
            data: { value: "126,122", subtext: "19 x 6638" }
        }
    },
    {
        id: 36,
        title: "Digits Sum to 19",
        description: "Suras where (Sura Digits + Verse Count Digits) sum to 19. Sura 9 (9 + 1+2+7 = 19). Total sum of these suras/verses is 1216.",
        visual: {
            type: 'stat',
            data: { value: 1216, subtext: "19 x 64" }
        }
    },
    {
        id: 37,
        title: "Specific Digit Sums (9 & 10)",
        description: "Suras where sura digits sum to 9 and verse digits sum to 10. Only Suras 9, 45, 54, 72. Total verses: 247.",
        visual: {
            type: 'stat',
            data: { value: 247, subtext: "19 x 13" }
        },
        highlight: true
    },
    {
        id: 38,
        title: "If Verse Count was 129...",
        description: "If Sura 9 had 129 verses, it would match with Sura 27 for 'Sura digits sum 9, Verse digits sum 12'. This group total would be 222 (Not Divisible).",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: "N/A", subtext: "No Conflict" },
                incorrect: { value: 222, subtext: "Not Divisible" }
            }
        }
    },
    {
        id: 39,
        title: "Verse Count Ends in '9'",
        description: "Suras where verse count ends in '9'. Total sum is 23655. If Sura 9 had 129 verses, it would be included and break the total.",
        visual: {
            type: 'stat',
            data: { value: "23,655", subtext: "19 x 1245" }
        }
    },
    {
        id: 40,
        title: "Odd Suras Ends in '9'",
        description: "Odd-numbered suras where verse count ends in '9'. Total sum is 646. If Sura 9 (Odd) had 129 (Ends in 9), total would be 784 (Not Divisible).",
        visual: {
            type: 'stat',
            data: { value: 646, subtext: "19 x 34" }
        }
    },
    {
        id: 41,
        title: "Verse Count Ends in '7'",
        description: "Suras where verse count ends in '7'. There are 7 such suras (including Sura 9). Total sum of [Sura No.] + [Verse Count] is 798.",
        visual: {
            type: 'stat',
            data: { value: 798, subtext: "19 x 42" }
        }
    },
    {
        id: 42,
        title: "Digit '7' in Last Two Verses",
        description: "Counting the digit '7' in the numbers of the last two verses of every sura. Total count is 38.",
        visual: {
            type: 'stat',
            data: { value: 38, subtext: "19 x 2" }
        }
    },
    {
        id: 43,
        title: "Verse 129 Frequency",
        description: "There are 9 suras with a verse 129. The sum of their sura numbers is 114 (19x6).",
        visual: {
            type: 'stat',
            data: { value: 114, subtext: "19 x 6" }
        }
    },
    {
        id: 44,
        title: "Verse 128 Anomaly",
        description: "Suras containing verse 128. If Sura 9 is included (false verse), total is 1410 (Not Divisible). Removing Sura 9 yields 1273.",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: 1273, subtext: "19 x 67" },
                incorrect: { value: 1410, subtext: "Not Divisible" }
            }
        }
    },
    {
        id: 45,
        title: "Un-initialed Last Two Verses",
        description: "Sum of the numbers of the last two verses for all 85 un-initialed suras. Total is 6897.",
        visual: {
            type: 'stat',
            data: { value: 6897, subtext: "19 x 363" }
        }
    },
    {
        id: 46,
        title: "Digits of Last Two Verses",
        description: "Sum of the digits of the last two verse numbers for every sura in the Quran.",
        visual: {
            type: 'stat',
            data: { value: 1824, subtext: "19 x 96" }
        }
    },
    {
        id: 47,
        title: "3-Digit Verse Counts (Last Digit)",
        description: "Sum of the last digits of verse counts for all suras with 3-digit verse counts. Total is 76.",
        visual: {
            type: 'stat',
            data: { value: 76, subtext: "19 x 4" }
        }
    },
    {
        id: 48,
        title: "Odd Verse Counts (Last Digit)",
        description: "Sum of last digits for suras with odd, 3-digit verse counts. Total is 38.",
        visual: {
            type: 'stat',
            data: { value: 38, subtext: "19 x 2" }
        }
    },
    {
        id: 49,
        title: "Odd Sura / Odd 3-Digit Verses",
        description: "Suras that are Odd-Numbered, with Odd, 3-Digit verse counts. Only 9, 11, 17. Total sum of verses is 361.",
        visual: {
            type: 'stat',
            data: { value: 361, subtext: "19 x 19" }
        }
    },
    {
        id: 50,
        title: "Digits Sum (9, 11, 17)",
        description: "Sum of individual digits of Sura Numbers + Verse Counts for the group (9, 11, 17) is exactly 19.",
        visual: {
            type: 'stat',
            data: { value: 19, subtext: "Exact Match" }
        }
    },
    {
        id: 51,
        title: "Sura Digits Sum (9, 11, 17)",
        description: "Sum of digits of just the sura numbers (9, 11, 17) is also 19.",
        visual: {
            type: 'stat',
            data: { value: 19, subtext: "Exact Match" }
        }
    },
    {
        id: 52,
        title: "If Verse Count was 129...",
        description: "If Sura 9 had 129 verses, it would join Suras 11 and 17 in the 'Divisible by 3' group. The digit sum would be 19 ONLY if Sura 9 has 127 verses, not 129.",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: 19, subtext: "With 127" },
                incorrect: { value: "Mismatch", subtext: "With 129" }
            }
        }
    },
    {
        id: 53,
        title: "Specific Sura Properties",
        description: "Suras that are Odd, Odd Verses, Verse Count ends in 7, Prime Verses, Sura divisible by 3 & 9. Only Suras 9 & 45. Sum of digits is 38.",
        visual: {
            type: 'stat',
            data: { value: 38, subtext: "19 x 2" }
        }
    },
    {
        id: 54,
        title: "Sura 9 vs 96 (If 129)",
        description: "If Sura 9 had 129 verses, it would pair with Sura 96 (Starts with 9, Ends with 9). Total sum would be 8828 (Not Divisible).",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: "Excluded", subtext: "Valid" },
                incorrect: { value: 8828, subtext: "Not Divisible" }
            }
        }
    },
    {
        id: 55,
        title: "Verse Digits Sum to 21",
        description: "If Sura 9 had 129 verses, its digits sum to 21. Total for 'Sum 21' group would be 34744 (Not Divisible). With 127, total is 34485.",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: "34,485", subtext: "19 x 1815" },
                incorrect: { value: "34,744", subtext: "Not Divisible" }
            }
        }
    },
    {
        id: 56,
        title: "Sura 15 Link",
        description: "Sura 15 is the only sura that is odd, divisible by 3, verse count divisible by 3, and ends in 9. If Sura 9 had 129, it would join. Total would break.",
        visual: {
            type: 'stat',
            data: { value: 114, subtext: "19 x 6 (Sura 15 Only)" }
        }
    },
    {
        id: 57,
        title: "Last Letter: N vs M",
        description: "The last letter of Sura 9 is 'N' (Noon). False verses end in 'M' (Meem). Gematrical calculation of First/Last letters up to Sura 9 proves it must be 'N'.",
        visual: {
            type: 'stat',
            data: { value: "Last: N", subtext: "Confirmed" }
        }
    },
    {
        id: 58,
        title: "Suras Ending in 'N'",
        description: "There are 43 suras ending in 'N'. Sum of Sura Nos + Count (43) = 1919.",
        visual: {
            type: 'stat',
            data: { value: 1919, subtext: "19 x 101" }
        }
    },
    {
        id: 59,
        title: "La Elaaha Ella Hoo",
        description: "This phrase appears 29 times in 19 suras. Total calculation confirms this count. False verse 129 contains this phrase, which would break the total 2128.",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: 2128, subtext: "19 x 112" },
                incorrect: { value: "Invalid", subtext: "With extra phrase" }
            }
        }
    },
    {
        id: 60,
        title: "First to Last Occurrence",
        description: "From the first occurrence of 'La Elaaha Ella Hoo' (2:163) to the last (73:9). Calculations total 316,502. Extra occurrence in 9:129 would destroy this.",
        verses: [
            { ref: "2:163", text: "Your god is one god; there is no god but He, Most Gracious, Most Merciful." }
        ],
        visual: {
            type: 'stat',
            data: { value: "316,502", subtext: "19 x 16658" }
        }
    },
    {
        id: 61,
        title: "Phrase Occurrence (9:1 to 27:30)",
        description: "Between Missing Basmalah (Sura 9) and Extra Basmalah (Sura 27), 'La Elaaha Ella Hoo' occurs in 7 verses. Sum of verse numbers is 323.",
        visual: {
            type: 'stat',
            data: { value: 323, subtext: "19 x 17" }
        }
    },
    {
        id: 62,
        title: "The Ultimate Miracle (All Verses)",
        description: "Concatenating every verse number in the Quran (Sura No followed by Verse Count followed by Verses) creates a 12,692-digit number divisible by 19.",
        visual: {
            type: 'stat',
            data: { value: "12,692 Digits", subtext: "Divisible by 19" }
        },
        highlight: true
    },
    {
        id: 63,
        title: "Sura 9 Sequence",
        description: "Writing Sura 9, followed by 127, followed by 1..127 produces a number divisible by 19. Using 129 breaks it.",
        visual: {
            type: 'comparison',
            data: {
                correct: { value: "Divisible", subtext: "With 127" },
                incorrect: { value: "Not Divisible", subtext: "With 129" }
            }
        }
    },
    {
        id: 64,
        title: "Odd Verse Digits",
        description: "Concatenating last digits of all odd-numbered verses for every sura produces a 3,371-digit number divisible by 19.",
        visual: {
            type: 'stat',
            data: { value: "3,371 Digits", subtext: "Divisible by 19" }
        }
    },
    {
        id: 65,
        title: "Un-initialed Suras Sequence",
        description: "Concatenating verse numbers for all 85 un-initialed suras produces a 6,635-digit number divisible by 19.",
        visual: {
            type: 'stat',
            data: { value: "6,635 Digits", subtext: "Divisible by 19" }
        }
    },
    {
        id: 66,
        title: "Rashad Khalifa Prophecy",
        description: "Gematrical Value of 'Rashad' + 'Khalifa' + Sura 9 + 127 = 5057259127 (19 x 266171533).",
        visual: {
            type: 'stat',
            data: { value: "5,057,259,127", subtext: "19 x 266171533" }
        }
    },
    {
        id: 67,
        title: "Verses from 3:81 to 9:127",
        description: "Number of verses from the prophecy of the Messenger of the Covenant (3:81) to the end of Sura 9 is exactly 988.",
        verses: [
            { ref: "3:81", text: "God took a covenant from the prophets, saying, 'I will give you the scripture and wisdom. Afterwards, a messenger will come to confirm all existing scriptures. You shall believe in him and support him.' He said, 'Do you agree with this, and pledge to fulfill this covenant?' They said, 'We agree.' He said, 'You have thus borne witness, and I bear witness along with you.'" }
        ],
        visual: {
            type: 'stat',
            data: { value: 988, subtext: "19 x 52" }
        }
    },
    {
        id: 68,
        title: "Sum of Verse Numbers (3:81 to 9:127)",
        description: "The sum of verse numbers for the same span (3:81 to 9:127) is also a multiple of 19.",
        visual: {
            type: 'stat',
            data: { value: "Multiple", subtext: "of 19" }
        }
    },
    {
        id: 69,
        title: "Word 'God' in 3:78",
        description: "In 3:78 (exposing falsifiers), the word 'God' occurs as the 361st occurrence (19x19).",
        verses: [
            { ref: "3:78", text: "Among them are those who twist their tongues to imitate the scripture, that you may think it is from the scripture, when it is not from the scripture, and they claim that it is from GOD, when it is not from GOD. Thus, they utter lies and attribute them to GOD, knowingly." }
        ],
        visual: {
            type: 'stat',
            data: { value: 361, subtext: "19 x 19" }
        }
    },
    {
        id: 70,
        title: "Count of 'God' (3:78 to 9:127)",
        description: "The word 'God' occurs 912 times between 3:78 and the end of Sura 9.",
        visual: {
            type: 'stat',
            data: { value: 912, subtext: "19 x 48" }
        }
    },
    {
        id: 71,
        title: "Letters & Words Match",
        description: "Number of letters/words in 3:78 (Warning) matches exactly with 9:128-129 (False Injections). Total 143.",
        verses: [
            { ref: "3:78", text: "Among them are those who twist their tongues..." },
            { ref: "9:128-129 (False)", text: "There has come to you a messenger... (128) ...He is the Lord of the Great Throne (129)." }
        ],
        visual: {
            type: 'stat',
            data: { value: 143, subtext: "Exact Match" }
        }
    }
];

