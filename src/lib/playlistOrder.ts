// Curated display order for video programs and sermons.
//
// Keyed by catalog id, NOT by title. Titles in data/catalog/videos.json are
// display strings that get rewritten (punctuation, dates, splitting a combined
// video into two); every such edit used to silently drop the video out of this
// map and fall back to date parsing. Ids are stable, so they cannot drift.
//
// Values come from the original playlist index preserved in the "Video Title"
// column of each transcript in data/sources/playlists/video-transcripts.
// Fractional values slot in videos split out of a combined original: "Who is
// GOD" was published as "01b" inside the same entry as "What is Life All
// About" (01), so it sorts at 1.5. The two videos that never carried a playlist
// index (Arabic Language Lessons, and the 1987 Sunni Scholars debate) are
// appended at 50 and 51.
export const PLAYLIST_ORDER: Record<string, number> = {
    "video-program/what-is-life-all-about": 1, // What is Life All About?
    "video-program/who-is-god": 1.5, // Who is GOD?
    "video-program/witness-a-miracle": 2, // Witness a Miracle
    "video-program/mathematical-miracle-of-quran": 3, // Mathematical Miracle of Quran
    "video-program/essentials-of-submission-islam": 4, // Essentials of Submission (Islam)
    "video-program/principles-of-contact-prayers-salat": 5, // Principles of Contact Prayers Salat
    "video-program/principles-of-friday-prayer": 6, // Principles of Friday Prayer
    "video-program/old-message-new-messenger": 7, // Old Message, New Messenger
    "video-program/the-great-debate-dr-rashad-khalifa-vs-dr-abdel-rahman": 8, // The Great Debate: Dr. Rashad Khalifa vs Dr. Abdel Rahman
    "video-program/in-defense-of-the-bible": 9, // In Defense of the Bible
    "video-program/evolution-or-creation-the-final-argument-by-dr-rashad-khalifa": 10, // Evolution or Creation: The Final Argument by Dr. Rashad Khalifa
    "video-program/king-of-chaos": 11, // King of Chaos
    "video-program/friday-sermon-knowing-god-god-is-doing-everything-06051987": 12, // Friday Sermon: Knowing GOD: GOD is Doing Everything (06/05/1987)
    "video-program/friday-sermon-god-is-doing-everything-rearranging-our-priorities-1987-07-no2": 13, // Friday Sermon: GOD is Doing Everything, Rearranging Our Priorities (07/1987 No. 2)
    "video-program/friday-sermon-quran-vs-bible-code-end-of-the-world-revealed-2280ad-1987-07-n": 14, // Friday Sermon: Quran vs Bible Code, End of the World Revealed 2280AD (07/1987)
    "video-program/friday-sermon-universal-unity-through-devotion-to-god-alone": 15, // Friday Sermon: Universal Unity Through Devotion to GOD Alone
    "video-program/friday-sermon-the-mathematical-miracle-proves-the-quran-to-be-the-word-of-god-10161987": 16, // Friday Sermon: The Mathematical Miracle Proves the Quran to be the Word of GOD (10/16/1987)
    "video-program/friday-sermon-evidence-is-increasing-this-life-is-a-school-for-the-eternal-life-111987": 17, // Friday Sermon: Evidence is Increasing, This Life is a School for the Eternal Life (11/1987)
    "video-program/friday-sermon-quran-is-the-only-book-in-the-world-that-is-mathematically-composed-111987": 18, // Friday Sermon: Quran is the Only Book in the World That is Mathematically Composed (11/1987)
    "video-program/friday-sermon-more-evidence-memorize-this-supplication-for-divine-protection-111987": 19, // Friday Sermon: More Evidence - Memorize This Supplication For Divine Protection (11/1987)
    "video-program/friday-sermon-the-muhammadans-worship-muhammad-discoveries-by-atef-and-lisa-12041987": 20, // Friday Sermon: The Muhammadans Worship Muhammad, Discoveries by Atef and Lisa (12/04/1987)
    "video-program/friday-sermon-the-power-of-repentance-the-secret-of-happiness-01011988": 21, // Friday Sermon: The Power of Repentance, The Secret of Happiness (01/01/1988)
    "video-program/friday-sermon-god-is-doing-everything-story-about-ahmed-subhy-mansour-1221988": 22, // Friday Sermon: GOD is Doing Everything, Story About Ahmed Subhy Mansour (1/22/1988)
    "video-program/friday-sermon-our-purpose-gods-kingdom-vs-satans-kingdom-abrahams-dream-03041988": 23, // Friday Sermon: Our Purpose, GOD's Kingdom vs Satan's Kingdom, Abraham's Dream (03/04/1988)
    "video-program/friday-sermon-seek-gods-kingship-over-you-and-everything-else-follows-03251988": 24, // Friday Sermon: Seek GOD's Kingship Over You and Everything Else Follows (03/25/1988)
    "video-program/friday-sermon-marriage-importance-of-love-muhammads-example-04081988": 25, // Friday Sermon: Marriage Importance of Love, Muhammad's Example (04/08/1988)
    "video-program/friday-sermon-proclaiming-messengership-abrahams-religion-04151988": 26, // Friday Sermon: Proclaiming Messengership, Abraham's Religion (04/15/1988)
    "video-program/friday-sermon-rashad-explains-his-messengership-details-05161988": 27, // Friday Sermon: Rashad Explains His Messengership Details (05/16/1988)
    "video-program/friday-sermon-natural-instinct-who-is-the-real-you-how-to-find-perfect-happiness-05271988": 28, // Friday Sermon: Natural Instinct - Who is The Real You? How to Find Perfect Happiness (05/27/1988)
    "video-program/friday-sermon-the-meaning-of-life-discovering-the-miracle-07151988": 29, // Friday Sermon: The Meaning of Life, Discovering the Miracle (07/15/1988)
    // Slot 30 was "Friday Sermon: Who is GOD? Understanding Our Universe (08/04/1988)".
    // It was the same recording as "Who is GOD?" at 1.5, proven by a flat timestamp
    // offset, so it was merged into that entry and its 08/04/1988 dating moved there.
    // The gap in the sequence is left as-is: these values only need to sort, and
    // renumbering 31 onward would churn every line below for no gain.
    "video-program/friday-sermon-who-is-your-god-majority-of-believers-are-going-to-hell-10281988": 31, // Friday Sermon: Who is Your GOD? Majority of Believers Are Going to Hell (10/28/1988)
    "video-program/friday-sermon-classification-of-creatures-loving-god-hell-is-not-enough-12091988": 32, // Friday Sermon: Classification of Creatures, Loving GOD, Hell is not Enough (12/09/1988)
    "video-program/friday-sermon-what-about-previous-generations-12301988": 33, // Friday Sermon: What About Previous Generations? (12/30/1988)
    "video-program/united-submitters-international-conference-explaining-the-fulfillment-of-the-covenant-1988": 34, // United Submitters International Conference: Explaining the Fulfillment of the Covenant (1988)
    "video-program/friday-sermon-remember-god-constantly-submitter-vs-objector-01131989": 35, // Friday Sermon: Remember GOD Constantly, Submitter vs Objector (01/13/1989)
    "video-program/friday-sermon-revelation-of-quran-to-revelation-of-miracle-importance-of-dawn-prayer-02031989": 36, // Friday Sermon: Revelation of Quran to Revelation of Miracle, Importance of Dawn Prayer (02/03/1989)
    "video-program/friday-sermon-original-sin-only-god-guides-majority-of-believers-are-going-to-hell-03031989": 37, // Friday Sermon: Original Sin, Only GOD Guides, Majority of Believers Are Going to Hell (03/03/1989)
    "video-program/friday-sermon-purpose-of-messengers-the-advent-of-the-pure-quran-03171989": 38, // Friday Sermon: Purpose of Messengers, The Advent of the Pure Quran (03/17/1989)
    "video-program/friday-sermon-why-announce-messengership-08111989": 39, // Friday Sermon: Why Announce Messengership? (08/11/1989)
    "video-program/friday-sermon-proving-every-verse-word-letter-with-irrefutable-evidence-11091989": 40, // Friday Sermon: Proving Every Verse, Word, Letter, with Irrefutable Evidence (11/09/1989)
    "video-program/friday-sermon-the-heavenly-feud-the-importance-of-killing-the-ego-11291989": 41, // Friday Sermon: The Heavenly Feud, The Importance of Killing the Ego (11/29/1989)
    "video-program/friday-sermon-proving-salat-al-jummah-the-righteous-go-straight-to-heaven-11261989": 42, // Friday Sermon: Proving Salat al-Jummah, The Righteous Go Straight to Heaven (11/26/1989)
    "video-program/friday-sermon-miracle-of-miracles-al-fatiha-proving-the-five-salat-12081989": 43, // Friday Sermon: Miracle of Miracles - Al-Fatiha, Proving the Five Salat (12/08/1989)
    "video-program/friday-sermon-united-submitters-international-conference-1989": 44, // Friday Sermon: United Submitters International Conference (1989)
    "video-program/united-submitters-international-conference-final-speech-by-dr-rashad-khalifa-1989": 45, // United Submitters International Conference: Final Speech by Dr. Rashad Khalifa (1989)
    "video-program/city-council-al-fatiha-recitation-by-dr-rashad-khalifa": 46, // City Council Al-Fatiha Recitation by Dr. Rashad Khalifa
    "video-program/excerpts-from-a-radio-debate-with-dr-rashad-khalifa": 47, // Excerpts From a Radio Debate With Dr. Rashad Khalifa
    "video-program/world-news-bulletin": 48, // World News Bulletin
    "video-program/the-creators-signature": 49, // The Creators Signature
    "video-program/arabic-language-lessons-by-dr-rashad-khalifa": 50, // Arabic Language Lessons By Dr. Rashad Khalifa
    "video-program/debate-dr-rashad-khalifa-ph-d-vs-sunni-scholars-1987": 51, // Debate: Dr Rashad Khalifa Ph D vs Sunni Scholars (1987)
};
