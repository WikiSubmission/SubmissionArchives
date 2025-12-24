import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Circle } from 'lucide-react';

interface GenealogyVisualizerProps {
    onClose: () => void;
}

export default function GenealogyVisualizer({ onClose }: GenealogyVisualizerProps) {
    const [activeSlide, setActiveSlide] = useState(0);
    const slides = ['Genealogy Tree', 'Verse Structure Analysis'];

    const nextSlide = () => setActiveSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            {/* Modal Container */}
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-300 overflow-hidden">

                {/* Header / Controls */}
                <div className="flex-none p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={prevSlide} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveSlide(idx)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === activeSlide ? 'bg-amber-600 w-6' : 'bg-gray-300 hover:bg-gray-400'}`}
                                />
                            ))}
                        </div>
                        <button onClick={nextSlide} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto bg-[#faf8f3]">
                    {activeSlide === 0 ? <GenealogyTree /> : <VerseStructureAnalysis />}
                </div>

                {/* Footer / Slide Label */}
                <div className="flex-none p-3 bg-white border-t border-gray-100 text-center text-xs text-gray-400 uppercase tracking-widest font-sans">
                    View {activeSlide + 1} of {slides.length}: {slides[activeSlide]}
                </div>
            </div>
        </div>
    );
}

// --- SLIDE 1: GENEALOGY TREE ---

const GenealogyTree = () => {
    return (
        <div className="p-12 font-[family-name:var(--font-crimson)] text-gray-800">
            <h1 className="text-center text-3xl font-normal text-gray-800 uppercase tracking-widest mb-2 font-[family-name:var(--font-playfair)]">The Genealogy of Jesus</h1>
            <p className="text-center text-gray-500 italic mb-10 text-lg">Matthew 1 — A Historical-Critical Analysis (hover over names for biblical citations)</p>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 p-6 bg-[#f9f7f4] border-y border-[#e8e4dc]">
                <LegendItem color="bg-[#fdfcfa] border-l-[#8b7d6b]" label="Biblically Attested" />
                <LegendItem color="bg-[#fff5f5] border-l-[#cc4444]" label="Omitted by Matthew" />
                <LegendItem color="bg-[#fffef8] border-l-[#d4a917]" label="Unverified" />
                <LegendItem color="bg-[#fff8f0] border-l-[#d47a1f]" label="Joseph" />
                <LegendItem color="bg-[#f7fdf7] border-l-[#4a8f4a]" label="Jesus" />
                <LegendItem color="bg-[#f0f0ff] border-l-[#6b5bb8]" label="Double-Counted" />
            </div>

            {/* Genealogy Chart */}
            <div className="flex flex-col items-center gap-1 mt-8">

                {/* Section I */}
                <SectionLabel label="Section I — Abraham to David" count="14 generations" />
                <Person name="Abraham" citation="Gen 21:3; 25:19" />
                <Connector />
                <Person name="Isaac" citation="Gen 25:26" />
                <Connector />
                <Person name="Jacob" citation="Gen 29:35; 35:23" />
                <Connector />
                <Person name="Judah" citation="Gen 38:29-30" />
                <Connector />
                <Person name="Perez" citation="Ruth 4:18" />
                <Connector />
                <Person name="Hezron" citation="Ruth 4:19" />
                <Connector />
                <Person name="Ram" citation="Ruth 4:19" />
                <Connector />
                <Person name="Amminadab" citation="Ruth 4:19-20" />
                <Connector />
                <Person name="Nahshon" citation="Ruth 4:20" />
                <Connector />
                <Person name="Salmon" citation="Ruth 4:20-21" />
                <Connector />
                <Person name="Boaz" citation="Ruth 4:21" />
                <Connector />
                <Person name="Obed" citation="Ruth 4:21-22" />
                <Connector />
                <Person name="Jesse" citation="Ruth 4:22; 1 Sam 16:1" />
                <Connector />
                <Person name="David" citation="2 Sam 5:14; 1 Chr 3:5" />

                {/* Section II */}
                <SectionLabel label="Section II — David to the Babylonian Exile" count="14 generations" />
                <Connector />
                <Person name="Solomon" />
                <Connector />
                <Person name="Rehoboam" />
                <Connector />
                <Person name="Abijah" />
                <Connector />
                <Person name="Asa" />
                <Connector />
                <Person name="Jehoshaphat" />
                <Connector />
                <Person name="Jehoram" />

                <Connector color="bg-[#c44]" height="h-6" />
                <div className="text-sm text-[#cc4444] italic my-2 tracking-wide font-serif">Three Kings Omitted</div>
                <Person name="Ahaziah" type="omitted" />
                <Connector color="bg-[#c44]" />
                <Person name="Joash" type="omitted" />
                <Connector color="bg-[#c44]" />
                <Person name="Amaziah" type="omitted" />
                <Connector color="bg-[#c44]" height="h-6" />
                <div className="text-sm text-[#cc4444] italic my-2 tracking-wide font-serif">Genealogy Resumes</div>

                <Connector />
                <Person name="Uzziah" />
                <Connector />
                <Person name="Jotham" />
                <Connector />
                <Person name="Ahaz" />
                <Connector />
                <Person name="Hezekiah" />
                <Connector />
                <Person name="Manasseh" />
                <Connector />
                <Person name="Amon" />
                <Connector />
                <Person name="Josiah" />
                <Connector />
                <Person name="Jeconiah (ends Section II)" type="double-counted" />

                {/* Section III */}
                <SectionLabel label="Section III — Exile to Jesus" count="14 generations" />
                <Connector />
                <Person name="Jeconiah (begins Section III)" type="double-counted" />
                <Connector />
                <Person name="Shealtiel" />
                <Connector />
                <Person name="Zerubbabel" />
                <Connector />
                <Person name="Abiud" type="unverified" />
                <Connector />
                <Person name="Eliakim" type="unverified" />
                <Connector />
                <Person name="Azor" type="unverified" />
                <Connector />
                <Person name="Zadok" type="unverified" />
                <Connector />
                <Person name="Achim" type="unverified" />
                <Connector />
                <Person name="Eliud" type="unverified" />
                <Connector />
                <Person name="Eleazar" type="unverified" />
                <Connector />
                <Person name="Matthan" type="unverified" />
                <Connector />
                <Person name="Jacob" type="unverified" />
                <Connector />
                <Person name="Joseph" type="joseph" />
                <Connector color="bg-[#cc4444]" height="h-6" />
                <Person name="Jesus" type="jesus" />

            </div>

            {/* Mary Section */}
            <div className="mt-12 pt-8 border-t border-dashed border-[#d0ccc4] text-center">
                <p className="text-gray-500 italic mb-4">Outside the Formal Genealogical Chain</p>
                <span className="inline-block px-8 py-3 bg-[#faf8fd] border-l-[3px] border-[#8b6ba8] font-bold text-gray-800 shadow-sm">Mary</span>
            </div>

            {/* Problem Note */}
            <div className="mt-10 p-6 bg-[#fffbf0] border-l-[3px] border-[#d47a1f] text-center text-gray-700 leading-relaxed max-w-2xl mx-auto shadow-sm">
                The genealogy establishes Davidic descent through Joseph, yet Matthew's virgin birth narrative denies Joseph's biological paternity—creating a fundamental tension in the text's claim to Jesus's messianic lineage. Additionally, Jeconiah must be counted twice (at the end of Section II and beginning of Section III) to achieve the 14-14-14 structure, with the three omitted kings and unverified post-exilic names further demonstrating Matthew's prioritization of numerical symbolism over historical accuracy.
            </div>
        </div>
    );
};

// --- SLIDE 2: VERSE STRUCTURE ANALYSIS ---

const VerseStructureAnalysis = () => {
    return (
        <div className="p-12 font-[family-name:var(--font-crimson)] text-gray-800">
            <h1 className="text-center text-3xl font-normal text-gray-800 uppercase tracking-widest mb-2 font-[family-name:var(--font-playfair)]">Verse Structure Analysis</h1>
            <p className="text-center text-gray-500 italic mb-10 text-lg">Matthew 1:2-16 — Generational Distribution Across 14 Verses</p>

            <div className="flex flex-wrap justify-center gap-6 mb-10 p-6 bg-[#f9f7f4] border-y border-[#e8e4dc]">
                <LegendItem color="bg-[#8b7d6b]" label="Standard Pattern (3 generations)" />
                <LegendItem color="bg-[#d47a1f]" label="Compressed (2 generations)" />
                <LegendItem color="bg-[#c44]" label="Special Marker (1 generation)" />
            </div>

            <div className="grid gap-3 max-w-4xl mx-auto mt-8">
                <VerseRow verse="2" count="3 generations" type="standard" content={<>Abraham <Arrow /> Isaac <Arrow /> Jacob <Arrow /> Judah</>} />
                <VerseRow verse="3" count="3 generations" type="standard" content={<>Judah <Arrow /> Perez <Arrow /> Hezron <Arrow /> Ram</>} />
                <VerseRow verse="4" count="3 generations" type="standard" content={<>Ram <Arrow /> Amminadab <Arrow /> Nahshon <Arrow /> Salmon</>} />
                <VerseRow verse="5" count="3 generations" type="standard" content={<>Salmon <Arrow /> Boaz <Arrow /> Obed <Arrow /> Jesse</>} />

                <VerseRow verse="6" count="2 generations" type="variant"
                    content={<>Jesse <Arrow /> David <Arrow /> Solomon <Note>(David the King - section transition)</Note></>}
                />

                <VerseRow verse="7" count="3 generations" type="standard" content={<>Solomon <Arrow /> Rehoboam <Arrow /> Abijah <Arrow /> Asa</>} />
                <VerseRow verse="8" count="3 generations" type="standard"
                    content={<>Asa <Arrow /> Jehoshaphat <Arrow /> Joram <Arrow /> Uzziah <Note>(3 kings omitted between Joram and Uzziah)</Note></>}
                />
                <VerseRow verse="9" count="3 generations" type="standard" content={<>Uzziah <Arrow /> Jotham <Arrow /> Ahaz <Arrow /> Hezekiah</>} />
                <VerseRow verse="10" count="3 generations" type="standard" content={<>Hezekiah <Arrow /> Manasseh <Arrow /> Amon <Arrow /> Josiah</>} />

                <VerseRow verse="11" count="1 generation" type="special"
                    content={<>Josiah <Arrow /> Jeconiah <Note>(+ exile marker: "at the time of the deportation to Babylon")</Note></>}
                />

                <VerseRow verse="12" count="2 generations" type="variant"
                    content={<>Jeconiah <Arrow /> Shealtiel <Arrow /> Zerubbabel <Note>(post-exile restart, Jeconiah counted again)</Note></>}
                />

                <VerseRow verse="13" count="3 generations" type="standard" content={<>Zerubbabel <Arrow /> Abiud <Arrow /> Eliakim <Arrow /> Azor</>} />
                <VerseRow verse="14" count="3 generations" type="standard" content={<>Azor <Arrow /> Zadok <Arrow /> Achim <Arrow /> Eliud</>} />
                <VerseRow verse="15" count="3 generations" type="standard" content={<>Eliud <Arrow /> Eleazar <Arrow /> Matthan <Arrow /> Jacob</>} />

                <VerseRow verse="16" count="2 generations" type="variant"
                    content={<>Jacob <Arrow /> Joseph <Arrow /> Jesus <Note>(climactic ending: "who is called Christ")</Note></>}
                />
            </div>

            <div className="mt-10 p-6 bg-[#f9f7f4] border-l-4 border-[#8b7d6b] max-w-4xl mx-auto">
                <h2 className="mt-0 text-xl font-normal text-gray-800 uppercase tracking-wide mb-4 font-[family-name:var(--font-playfair)]">Pattern Analysis</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>11 verses</strong> follow the standard pattern of 3 generations</li>
                    <li><strong>3 verses</strong> are compressed to 2 generations (verses 6, 12, 16) - marking major transitions</li>
                    <li><strong>1 verse</strong> contains only 1 generation (verse 11) - marking the exile boundary</li>
                    <li>The compression allows Matthew to fit exactly <strong>42 generations into 14 verses</strong></li>
                    <li>Strategic breaks occur at: David's kingship (v6), the Exile (v11-12), and Jesus the Messiah (v16)</li>
                </ul>
            </div>

            {/* Critical Footnote */}
            <div className="mt-12 max-w-4xl mx-auto border-t border-gray-200 pt-8 pb-12">
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-[family-name:var(--font-playfair)]">
                    <span className="text-amber-700 mr-2">*</span>
                    Footnote on Matthew 1:17 — The Forced 14-14-14 Pattern
                </h3>

                <div className="prose prose-stone max-w-none text-gray-800 leading-relaxed font-[family-name:var(--font-crimson)] text-lg">
                    <p className="mb-4">
                        The author structures this genealogy around the number 14 (the gematria value of David's name in Hebrew: דוד = 4+6+4) to present Jesus as the Davidic Messiah. However, this pattern requires significant manipulation:
                    </p>

                    <ul className="list-disc pl-5 space-y-2 mb-8 marker:text-amber-700">
                        <li>
                            <strong>Three kings omitted</strong> between Joram and Uzziah: Ahaziah, Joash, and Amaziah (documented in 1 Chronicles 3:11-12, 2 Kings 8-14).
                        </li>
                        <li>
                            <strong>Jeconiah double-counted</strong> at the exile boundary to reach 14 in the third section.
                        </li>
                        <li>
                            <strong>Nine post-exilic names</strong> (Abiud through Jacob) have no Old Testament attestation.
                        </li>
                        <li>
                            The genealogy spans exactly <strong>14 verses (2-16)</strong>, suggesting deliberate literary construction.
                        </li>
                    </ul>

                    <div className="bg-[#fff5f5] border-l-4 border-[#cc4444] p-6 mb-8 rounded-r">
                        <h4 className="text-[#a33] font-bold uppercase text-sm tracking-widest mb-2 font-sans">Fatal Genealogical Issue</h4>
                        <p className="text-gray-800">
                            Both Matthew and Luke trace through Joseph, yet both Gospels affirm Joseph is not Jesus's biological father (virgin birth narrative, Matthew 1:18-25). Under Torah law, covenant status requires biological descent—adoption cannot transfer Davidic lineage (Genesis 15:4 explicitly rejects non-biological heirs; Numbers 1:18 requires genealogy through biological birth).
                        </p>
                    </div>

                    <div className="bg-[#f0f9ff] border-l-4 border-[#0ea5e9] p-6 rounded-r">
                        <h4 className="text-[#0284c7] font-bold uppercase text-sm tracking-widest mb-2 font-sans">The Evidence for Aaron's Line</h4>
                        <p className="text-gray-800">
                            Biblical evidence suggests Mary was from Aaron's priestly line: she is called Elizabeth's <em>suggenes</em> (relative, Luke 1:36), and Elizabeth is explicitly "a descendant of Aaron" (Luke 1:5). The Quran identifies Mary as "sister of Aaron" (19:28), using standard terminology for tribal membership. Jesus's biological descent would therefore be Levitical through Mary, not Davidic—qualifying him as the Messiah of Aaron (the priestly messiah expected in Dead Sea Scrolls), not the Davidic king that Matthew is trying to force here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SHARED SUBCOMPONENTS ---

const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-3 text-sm text-gray-600">
        <div className={`w-5 h-5 border border-gray-300 ${color}`}></div>
        <span>{label}</span>
    </div>
);

const SectionLabel = ({ label, count }: { label: string, count: string }) => (
    <div className="mt-10 mb-4 text-center">
        <span className="text-gray-500 italic text-[0.95em]">{label}</span>
        <span className="ml-2 text-[#8b7d6b] font-bold text-sm">{count}</span>
    </div>
);

const Connector = ({ color = "bg-[#ccc5ba]", height = "h-3" }: { color?: string, height?: string }) => (
    <div className={`w-px ${height} ${color}`}></div>
);

const Person = ({ name, citation, type = 'normal' }: { name: string, citation?: string, type?: 'normal' | 'omitted' | 'unverified' | 'joseph' | 'jesus' | 'double-counted' }) => {
    let styles = "bg-[#fdfcfa] border-l-[#8b7d6b] text-gray-800";
    if (type === 'omitted') styles = "bg-[#fff5f5] border-l-[#cc4444] text-[#a33] italic";
    if (type === 'unverified') styles = "bg-[#fffef8] border-l-[#d4a917] text-[#6d5d0f]";
    if (type === 'joseph') styles = "bg-[#fff8f0] border-l-[#d47a1f] font-bold text-gray-800";
    if (type === 'jesus') styles = "bg-[#f7fdf7] border-l-[#4a8f4a] font-bold text-lg text-gray-900";
    if (type === 'double-counted') styles = "bg-[#f0f0ff] border-l-[#6b5bb8] font-bold text-gray-800";

    return (
        <div className={`
            px-8 py-3 text-center min-w-[160px] text-[0.95em] border-l-[3px] relative cursor-pointer group shadow-sm hover:shadow transition-all
            ${styles}
        `}>
            {name}
            {citation && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-20">
                    {citation}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-800"></div>
                </div>
            )}
        </div>
    );
};

// Verse Analysis Subcomponents
const Arrow = () => <span className="text-gray-400 mx-1">→</span>;
const Note = ({ children }: { children: React.ReactNode }) => <span className="italic text-gray-500 text-sm ml-2">{children}</span>;

const VerseRow = ({ verse, count, type, content }: { verse: string, count: string, type: 'standard' | 'variant' | 'special', content: React.ReactNode }) => {
    let styles = "bg-[#fdfcfa] border-l-[#8b7d6b]";
    let countStyles = "bg-[#e8e4dc] text-[#5a5a5a]";

    if (type === 'variant') {
        styles = "bg-[#fff8f0] border-l-[#d47a1f]";
        countStyles = "bg-[#ffe6cc] text-[#8b5a00]";
    }
    if (type === 'special') {
        styles = "bg-[#fff5f5] border-l-[#cc4444]";
        countStyles = "bg-[#ffdddd] text-[#a33]";
    }

    return (
        <div className={`grid grid-cols-[80px_120px_1fr] items-center px-5 py-4 border-l-[4px] transition-all hover:translate-x-1 hover:shadow-md ${styles}`}>
            <div className="font-semibold text-gray-500 text-sm">Verse {verse}</div>
            <div className={`font-semibold text-center py-1.5 px-3 rounded text-sm mx-2 ${countStyles}`}>{count}</div>
            <div className="text-gray-800 text-[0.95em]">{content}</div>
        </div>
    );
};
