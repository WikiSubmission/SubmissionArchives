
"use client";

import React, { useState, useEffect, useRef } from 'react';

// Hardcoded Title Map (Same as before)
const RENAME_MAP: Record<number, string> = {
    1: "Quran Study - Q.72:19-28, Q.73 - Jinns (05-26-1989)",
    2: "Quran Study - Q.95 & Q.96 - Quran Is Not Ink & Paper (08-04-1989)",
    3: "Quran Study - Q.10:79-92, Q.73, Q.3:110-117, RK Sermon (01-19&26-1990)",
    4: "Quran Study - Q.37, Q.3:118-129 - Asteroid (01-21&22-1990)",
    5: "Quran Study - Q.56:75 & Q.57 (02-17-1989)",
    6: "Quran Study - Q.59 - PRA, Invisible Giants, Hypocrites (03-10-1989)",
    7: "Quran Study - Q.62 & Q.63 - God's Religion Will Dominate (03-24-1989)",
    8: "Quran Study - Q.65 & Q.66 - Enjoin Kids To Do Salat, Hamid Argues (04-07-1989)",
    9: "Quran Study - Q.70 - Chastity, Worry, Edip's Translation Request (05-12-1989)",
    10: "Quran Study - Q.71 & Q.72 - Chastity, Jinns (05-19-1989)",
    11: "Quran Study - Q.23:60-88, Q.16 (01-18&23&31-1990)",
    12: "Quran Study - Behrouz's Sermon & Edip's Exposure (01-25-1990)",
    13: "Quran Study - Q.7:12 - Adam & Eve's Bodies (12-24-1989)",
    14: "Quran Study - Night of Destiny Zikr",
    15: "Quran Study - Q.54:23, Q.55-56, Q.51 - Age 40 & First Gen",
    16: "Quran Study - Q.64, Q.59, Q.70 - Nothing Happens & Angels Are The Best Surgeons",
    17: "Quran Study - Q.82-83, Q.90-91 (07-21-1989)",
    18: "Quran Study - Q.61, Q.87, Q.94, Q.81",
    19: "Quran Study - Q.2:89 - Witchcraft, Reverting, Intro To Blue Quran",
    20: "Quran Study - Q.3 - Insurance, Worry, Fear",
    21: "Quran Study - Q.9:52, Q.56:75 - The Hypocrites",
    22: "Quran Study - Q.39:11, Q.37:164, Q.28 - Admission Test, No Insurance Compromise",
    23: "Quran Study - Q.51 - New Era, Believers Protected From Accidents & Diseases",
    24: "Quran Study - Q.55 & Q.56",
    25: "Quran Study - Q.58",
    26: "Quran Study - Q.67 - Hamid Argues With Rashad",
    27: "Quran Study - Q.14:18, Q.17:47 - Chastity, Salat As A Gift, DOJ, Quran Traps",
    28: "Quran Study - Q.45:33 - 19 Math",
    29: "Quran Study - 1985 Tucson, Mehri's Questions, Admission Test & Final Test",
    30: "Quran Study - Q.28, Q.57, Q.45:33 - Insurance, Rashad Told To Devote All Time To God (01-1990)",
    31: "Quran Study - Q.18:98, Q.81 - Azan & Salat (11-04-1989)",
    32: "Quran Study - Q.22:15 - Which Masjids To Pray In",
    33: "Quran Study - Q.74 (06-02-1989)",
    34: "Quran Study - Q.33 - God Is Physical Innovations-Praying & Prostrating After Salat",
    35: "Quran Study - Rashad Makes Deliberate Mistakes To Destroy Idols (11-09-1989)",
    36: "Quran Study - Q.30:25 - Miracle From Biggest Brewery, Intercession, Allegory",
    37: "Quran Study - Q.11:68 (11-04-1989)",
    38: "Quran Study - Certainty (11-29)",
    39: "Quran Study - Q.60-61 - Rich Believer, Certainty, Insurance (12-28-1989)",
    40: "Quran Study - Q.3:59 (12-29-1989)",
    41: "Quran Study - Al-Fatiha For Everything You Wish, Extreme Libertarianism",
    42: "Quran Study - Interview W-Rashad by Ray Caton, Insurance, Interest",
    43: "Quran Study - Q.17:39 - 3rd Intl Conf, Rashad Speech, Insurance Based On Fear (11-1988)",
    44: "Quran Study - Q.64, Q.70 - Nothing Happens, Worry, Chastity",
    45: "Quran Study - Q.40 - Deja Vu, Old Believers Usually Finish All Affairs Before Departing",
    46: "Quran Study - Q.37:159, Q.38:25, Q.9:50, Q.39:11 - Admission Test, No Insurance Compromise, Jinns, Hypocrites, Apology",
    47: "Quran Study - Q.1, Q.2 - Intro to Blue Quran",
    48: "Quran Study - Rashad's Speech - Salat, Zakat, Fazeli Argues (01-11-1989)",
    49: "Quran Study - Rashad's Speech, 19 Math (11-05-1989)",
    50: "Quran Study - Q.92-94 - Zakat Not Limited To Earned Income",
    51: "Quran Study - Q.17:59 (1990)",
    52: "Quran Study - Q.1-2 (05-09-1989)"
};

export default function MatchToolPage() {
    const [queue, setQueue] = useState<any[]>([]);
    const [snippets, setSnippets] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [status, setStatus] = useState("");

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // If selected from search, we override the current candidate view
    const [overrideCandidate, setOverrideCandidate] = useState<any>(null);

    const videoRef = useRef<HTMLVideoElement>(null);

    const fetchQueue = async () => {
        try {
            const res = await fetch('/api/match-tool');
            const data = await res.json();
            setQueue(data.queue);
            setSnippets(data.snippets);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const performSearch = async (query: string) => {
        if (!query) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/match-tool?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data.results);
        } catch (e) {
            console.error(e);
        }
        setIsSearching(false);
    };

    const currentItem = queue[currentIndex];
    // Determine what to show: Override (from search) OR Current Queue Candidate
    const activeCandidate = overrideCandidate || currentItem?.candidates[candidateIndex];

    const handleMatch = async () => {
        if (!currentItem || !activeCandidate) return;

        setStatus("Saving...");

        try {
            const res = await fetch('/api/match-tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audioId: currentItem.audioId,
                    transcriptFilename: activeCandidate.filename,
                    targetTitle: RENAME_MAP[currentItem.audioId]
                })
            });

            if (res.ok) {
                setStatus("Matched!");
                setTimeout(() => {
                    setStatus("");
                    setOverrideCandidate(null);
                    setCandidateIndex(0);
                    // Move to next audio
                    setCurrentIndex(prev => prev + 1);
                    setSearchQuery(""); // Clear search
                    setSearchResults([]);
                }, 1000);
            } else {
                setStatus("Error saving match.");
            }
        } catch (e) {
            console.error(e);
            setStatus("Error saving match.");
        }
    };

    const handleNextCandidate = () => {
        if (!currentItem) return;
        setOverrideCandidate(null); // Clear override
        setCandidateIndex(prev => (prev + 1) % currentItem.candidates.length);
    };

    const handleSkipAudio = () => {
        setOverrideCandidate(null);
        setCandidateIndex(0);
        setCurrentIndex(prev => prev + 1);
    };

    const handleSearchResultClick = (result: any) => {
        setOverrideCandidate(result);
        setSearchResults([]); // Hide results (optional UX choice)
    };

    if (loading) return <div className="p-10 text-xl">Loading Matching Queue...</div>;
    if (!currentItem) return <div className="p-10 text-xl text-green-600">All Done! No more items in queue.</div>;

    const title = RENAME_MAP[currentItem.audioId] || `Quran Study ${currentItem.audioId}`;

    // Snippet source depends on if it's from search (included) or from big list (looked up)
    const snippetText = activeCandidate
        ? (activeCandidate.snippet || snippets[activeCandidate.filename] || "Loading content...")
        : "Loading content...";

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-sans flex flex-col h-screen">
            {/* Header */}
            <header className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-700 pb-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                        Transcript Matcher
                    </h1>
                    <div className="text-gray-400 text-sm">
                        Audio {currentIndex + 1} / {queue.length}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mt-4 md:mt-0 w-full md:w-1/2 relative">
                    <input
                        type="text"
                        placeholder="Search transcripts by keyword..."
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.length > 2) {
                                performSearch(e.target.value);
                            } else {
                                setSearchResults([]);
                            }
                        }}
                    />
                    {/* Checkbox for live search results could go here, but using dropdown style instead */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 mt-1 max-h-60 overflow-y-auto z-50 rounded-lg shadow-xl">
                            {searchResults.map((res, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSearchResultClick(res)}
                                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0"
                                >
                                    <div className="font-mono text-xs text-green-400 mb-1">{res.filename}</div>
                                    <div className="text-sm text-gray-300 line-clamp-2">{res.snippet}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow overflow-hidden">
                {/* Left Column: Audio */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col h-full overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4 text-blue-300">
                        #{currentItem.audioId}: {title}
                    </h2>

                    <div className="mb-6 sticky top-0 bg-gray-800 z-10 pb-4">
                        <video
                            ref={videoRef}
                            src={currentItem.audioUrl}
                            controls
                            className="w-full rounded-lg bg-black h-16"
                        />
                        <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                            {currentItem.audioKey}
                        </p>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mt-auto">
                        <h3 className="text-sm font-bold text-gray-400 mb-2">TARGET INFO</h3>
                        <p className="text-sm text-gray-300">Expected Content: <span className="text-yellow-400">{title}</span></p>
                    </div>
                </div>

                {/* Right Column: Transcript Candidate */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h2 className="text-xl font-semibold text-green-300">
                            {overrideCandidate ? "Selected from Search" : `Candidate ${candidateIndex + 1}`}
                        </h2>
                        {activeCandidate?.diff !== undefined && (
                            <span className={`text-xs px-2 py-1 rounded ${activeCandidate.diff < 5 ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                Diff: {activeCandidate.diff.toFixed(1)}s
                            </span>
                        )}
                    </div>

                    <div className="flex-grow bg-gray-900 p-4 rounded-lg border border-gray-700 font-mono text-sm text-gray-300 whitespace-pre-wrap overflow-y-auto mb-6 shadow-inner">
                        {snippetText}
                    </div>

                    <p className="text-xs text-center text-gray-500 mb-4 shrink-0">{activeCandidate?.filename}</p>

                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <button
                            onClick={handleNextCandidate}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors border border-gray-600"
                        >
                            Next Candidate
                        </button>
                        <button
                            onClick={handleMatch}
                            disabled={!activeCandidate}
                            className={`text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg ${activeCandidate ? 'bg-green-600 hover:bg-green-500 shadow-green-900/50' : 'bg-gray-600 cursor-not-allowed'}`}
                        >
                            MATCH THIS!
                        </button>
                    </div>
                    <div className="mt-4 text-center shrink-0">
                        <button
                            onClick={handleSkipAudio}
                            className="text-gray-500 hover:text-white text-sm underline"
                        >
                            Skip this Audio
                        </button>
                    </div>
                    {status && (
                        <div className="mt-4 text-center font-bold text-yellow-400 animate-pulse shrink-0">
                            {status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
