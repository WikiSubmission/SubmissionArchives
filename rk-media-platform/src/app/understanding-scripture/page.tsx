import React from 'react';
import Link from 'next/link';
import { BookOpen, Scroll, Layers } from 'lucide-react';

export default function UnderstandingScripturePage() {
    return (
        <div className="min-h-screen bg-white font-[family-name:var(--font-crimson)]">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 group-hover:border-amber-200 transition-colors">
                            <BookOpen className="w-4 h-4 text-gray-700/70 group-hover:text-amber-800 transition-colors" />
                        </div>
                        <span className="text-xs uppercase tracking-widest text-gray-500 font-sans group-hover:text-gray-900 transition-colors">Back to Library</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-20 space-y-16">
                {/* Intro */}
                <div className="text-center space-y-6">
                    <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl text-gray-900 leading-tight">
                        Understanding Scripture
                    </h1>
                    <div className="w-24 h-1 bg-amber-100 mx-auto rounded-full"></div>
                    <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed italic">
                        Select a testament to begin your verse-by-verse study with historical context and exegesis.
                    </p>
                </div>

                {/* Content Template */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Old Testament */}
                    <Link href="/study/old-testament/Genesis/1" className="group relative block p-8 rounded-lg border border-gray-200 bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:border-amber-200 hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none transform rotate-12">
                            <Scroll className="w-40 h-40" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-4 py-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-amber-50 group-hover:scale-110 transition-all duration-300">
                                <Scroll className="w-8 h-8 text-gray-400 group-hover:text-amber-800 transition-colors" />
                            </div>
                            <div>
                                <h3 className="font-[family-name:var(--font-playfair)] text-2xl mb-2 text-gray-900 group-hover:text-amber-900 transition-colors">Old Testament</h3>
                                <p className="text-[0.65rem] text-gray-400 font-sans uppercase tracking-[0.2em] font-bold group-hover:text-amber-700/70 transition-colors">Tanakh</p>
                            </div>
                        </div>
                    </Link>

                    {/* New Testament */}
                    <Link href="/study/new-testament/Mark/1" className="group relative block p-8 rounded-lg border border-gray-200 bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:border-amber-200 hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none transform rotate-12">
                            <BookOpen className="w-40 h-40" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-4 py-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-amber-50 group-hover:scale-110 transition-all duration-300">
                                <BookOpen className="w-8 h-8 text-gray-400 group-hover:text-amber-800 transition-colors" />
                            </div>
                            <div>
                                <h3 className="font-[family-name:var(--font-playfair)] text-2xl mb-2 text-gray-900 group-hover:text-amber-900 transition-colors">New Testament</h3>
                                <p className="text-[0.65rem] text-gray-400 font-sans uppercase tracking-[0.2em] font-bold group-hover:text-amber-700/70 transition-colors">Greek Scriptures</p>
                            </div>
                        </div>
                    </Link>

                    {/* Final Testament */}
                    <Link href="/study/quran/Sura/1" className="group relative block p-8 rounded-lg border border-gray-200 bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:border-amber-200 hover:-translate-y-1 transition-all duration-300 text-center overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none transform rotate-12">
                            <Layers className="w-40 h-40" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center gap-4 py-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-amber-50 group-hover:scale-110 transition-all duration-300">
                                <Layers className="w-8 h-8 text-gray-400 group-hover:text-amber-800 transition-colors" />
                            </div>
                            <div>
                                <h3 className="font-[family-name:var(--font-playfair)] text-2xl mb-2 text-gray-900 group-hover:text-amber-900 transition-colors">Final Testament</h3>
                                <p className="text-[0.65rem] text-gray-400 font-sans uppercase tracking-[0.2em] font-bold group-hover:text-amber-700/70 transition-colors">Quran</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Detailed Sections */}
                <div className="space-y-24 max-w-3xl mx-auto pt-12">
                    {/* Old Testament Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900 text-center">Understanding The Old Testament</h2>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>
                        <div className="text-gray-600 text-lg leading-relaxed font-serif space-y-4">
                            <div className="space-y-8 text-gray-800">
                                <section>
                                    <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-4 text-gray-900">The Old Testament: Prophetic Truth and Scribal Corruption</h3>
                                    <p className="mb-4">The Hebrew Bible, known to some as the Old Testament, is a collection of texts written by Israelite prophets, scribes, and sages over approximately a thousand years (roughly 1200-200 BCE). These texts are traditionally divided into three major sections:</p>

                                    <div className="pl-4 border-l border-gray-100 space-y-6 mt-6">
                                        <div>
                                            <h5 className="font-bold text-gray-900 mb-2">1. The Torah (תּוֹרָה) - "The Law" or "The Teaching"</h5>
                                            <p className="mb-2 text-sm">The Torah consists of the first five books, traditionally attributed to Moses:</p>
                                            <ul className="list-disc list-inside pl-4 space-y-1 marker:text-amber-800 text-sm">
                                                <li><strong>Genesis</strong> - Creation, the patriarchs (Abraham, Isaac, Jacob), and Joseph</li>
                                                <li><strong>Exodus</strong> - The Israelites' liberation from Egypt, the giving of the Law at Sinai</li>
                                                <li><strong>Leviticus</strong> - Priestly laws, sacrifices, ritual purity</li>
                                                <li><strong>Numbers</strong> - Israel's wilderness wanderings, census data, more laws</li>
                                                <li><strong>Deuteronomy</strong> - Moses's final speeches, restatement of the Law</li>
                                            </ul>
                                            <p className="mt-2 text-sm italic">The Torah forms the foundation of Jewish law and practice, containing the covenant between God and Israel.</p>
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-gray-900 mb-2">2. The Nevi'im (נְבִיאִים) - "The Prophets"</h5>
                                            <p className="mb-2 text-sm">The Prophetic books are divided into two categories:</p>
                                            <ul className="list-disc list-inside pl-4 space-y-1 marker:text-amber-800 text-sm">
                                                <li><strong>Former Prophets:</strong> Joshua, Judges, Samuel, Kings (Historical narratives)</li>
                                                <li><strong>Latter Prophets:</strong> Isaiah, Jeremiah, Ezekiel, and the 12 Minor Prophets (Prophetic oracles)</li>
                                            </ul>
                                            <p className="mt-2 text-sm italic">These prophets consistently emphasized that God desires mercy, justice, and righteousness over ritual sacrifice alone.</p>
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-gray-900 mb-2">3. The Ketuvim (כְּתוּבִים) - "The Writings"</h5>
                                            <p className="mb-2 text-sm">A diverse collection including Wisdom Literature (Psalms, Proverbs, Job), Festival Scrolls (Song of Songs, Ruth, Esther), and Historical Books (Daniel, Ezra-Nehemiah, Chronicles).</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">General Coherence with Significant Issues</h4>
                                    <p className="mb-4">Unlike the New Testament, which suffers from fundamental contradictions, the Hebrew Bible maintains greater overall coherence in its core theological message: <strong className="font-semibold text-gray-900">Absolute monotheism, individual moral responsibility, and social justice.</strong></p>
                                    <p className="mb-4">However, the text is not free from corruption. Evidence of human tampering, scribal invention, and slanderous distortions appears throughout, often serving political or tribal purposes.</p>
                                </section>

                                <section>
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-6 mt-8">Examples of Scribal Corruption and Slander</h4>

                                    {/* 1. Lot */}
                                    <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-6 mb-8 hover:border-amber-100 transition-colors">
                                        <h5 className="font-bold text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2">1. The Slander of Lot: Incest and Tribal Polemic</h5>
                                        <p className="mb-4 text-sm">Genesis 19:30-38 contains a shocking story: Lot's daughters get him drunk and commit incest to preserve offspring, birthing the Moabites and Ammonites. This is transparent political propaganda against rival nations.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <span className="text-xs font-bold text-red-800 uppercase tracking-widest block mb-2">The Biblical Distortion</span>
                                                <p className="text-sm italic text-gray-600">"Thus both the daughters of Lot were with child by their father." (Genesis 19:36)</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                                                <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-2">The Quranic Correction</span>
                                                <p className="text-sm italic text-gray-600 mb-2">And Lot... we saved him from the community that practiced abominations... We admitted him into our mercy, for he was one of the righteous." (21:74-75)</p>
                                                <p className="text-xs text-gray-400">The Quran vindicates Lot as righteous, identifying his wife as the betrayer.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Solomon */}
                                    <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-6 mb-8 hover:border-amber-100 transition-colors">
                                        <h5 className="font-bold text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2">2. The Slander of Solomon: Idolatry and Sorcery</h5>
                                        <p className="mb-4 text-sm">1 Kings 11 accuses Solomon of worshipping foreign idols. Later traditions went further, accusing him of sorcery and controlling demons. These slanders served Northern Kingdom political interests to delegitimize the Davidic line.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <span className="text-xs font-bold text-red-800 uppercase tracking-widest block mb-2">The Slander</span>
                                                <p className="text-sm italic text-gray-600 mb-2">"Solomon did evil in the sight of the LORD... built a high place for Chemosh... and for Molech..." (1 Kings 11:6-7)</p>
                                                <p className="text-sm italic text-gray-600">"God gave me authority over all demons..." (Testament of Solomon)</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                                                <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-2">The Quranic Correction</span>
                                                <p className="text-sm italic text-gray-600 mb-2">"Solomon did not disbelieve; the devils did disbelieve. They taught the people sorcery..." (2:102)</p>
                                                <p className="text-sm italic text-gray-600">"What an excellent servant; he was obedient." (38:30)</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Abraham */}
                                    <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-6 mb-8 hover:border-amber-100 transition-colors">
                                        <h5 className="font-bold text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2">3. The Sacrifice of Abraham: Isaac or Ishmael?</h5>
                                        <p className="mb-4 text-sm">Genesis 22 says "Take your son, your only son Isaac". But Isaac was never the "only son" (Ishmael was born 14 years prior). The Quran corrects this sequence, identifying the "forbearing boy" (Ishmael) as the sacrifice, with Isaac's birth announced <em>after</em> the test.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <span className="text-xs font-bold text-red-800 uppercase tracking-widest block mb-2">The Scribe's Edit</span>
                                                <p className="text-sm italic text-gray-600">"Take your son, your <strong>only son Isaac</strong>..." (Genesis 22:2)</p>
                                                <p className="text-xs text-red-800/70 mt-2 font-semibold">Contradiction: Ishmael was the firstborn.</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                                                <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-2">The Quranic Account</span>
                                                <ul className="text-sm space-y-2">
                                                    <li className="flex gap-2"><span className="text-amber-800 font-bold">1.</span> <span className="text-gray-600 italic">News of a "forbearing boy" (Ishmael) (37:101)</span></li>
                                                    <li className="flex gap-2"><span className="text-amber-800 font-bold">2.</span> <span className="text-gray-600 italic">The Sacrifice Test (37:102-107)</span></li>
                                                    <li className="flex gap-2"><span className="text-amber-800 font-bold">3.</span> <span className="text-gray-600 italic">News of Isaac, a prophet (37:112)</span></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Aaron */}
                                    <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-6 mb-8 hover:border-amber-100 transition-colors">
                                        <h5 className="font-bold text-lg text-gray-900 mb-4 border-b border-gray-200 pb-2">4. Aaron and the Golden Calf: Shifting Blame</h5>
                                        <p className="mb-4 text-sm">Exodus portrays Aaron creating the calf himself. The Quran clarifies that a "Samiri" led the rebellion, while Aaron tried to stop it but feared dividing the people.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <span className="text-xs font-bold text-red-800 uppercase tracking-widest block mb-2">The Biblical Accusation</span>
                                                <p className="text-sm italic text-gray-600">"[Aaron] took what they handed him and made it into an idol cast in the shape of a calf..." (Exodus 32:4)</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                                                <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-2">The Quranic Vindication</span>
                                                <p className="text-sm italic text-gray-600 mb-2">Aaron had told them... "Your only Lord is the Most Gracious, so follow me..." (20:90)</p>
                                                <p className="text-sm italic text-gray-600">"[God said] We have tested your people... the Samiri misled them." (20:85)</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">The Quranic Principle: Criterion Over Previous Scriptures</h4>
                                    <p className="mb-4">The Quran describes itself as <em>Muhaymin</em> (guardian/criterion) over previous scriptures (5:48). We do not reject previous scriptures wholesale but evaluate them through the Quranic lens.</p>

                                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-lg my-6">
                                        <h5 className="font-bold text-amber-900 mb-3 font-sans uppercase tracking-wide text-sm">Guidelines for Acceptance</h5>
                                        <ul className="list-disc list-inside space-y-2 text-amber-900/80 text-sm">
                                            <li><strong className="text-amber-900">Accept:</strong> Stories showing prophets calling to monotheism and justice.</li>
                                            <li><strong className="text-amber-900">Accept:</strong> Commands establishing mercy, charity, and honoring parents.</li>
                                            <li><strong className="text-amber-900">Reject:</strong> Innovations like Trinity, original sin, or God commanding immorality.</li>
                                            <li><strong className="text-amber-900">Reject:</strong> Tribal propaganda transferring honors or slandering rivals.</li>
                                        </ul>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">Beyond the Canon: The Pseudepigrapha</h4>
                                    <p className="mb-4">This study edition also includes texts like <strong>1 Enoch</strong>, <strong>Jubilees</strong>, and <strong>Wisdom of Sirach</strong>—books used by early believers but excluded from later canons. Many of these preserve pure monotheistic teachings that align more closely with the Quran than some canonical texts.</p>
                                </section>
                            </div>
                        </div>
                    </section>

                    {/* New Testament Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900 text-center">Understanding The New Testament</h2>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>
                        <div className="text-gray-600 text-lg leading-relaxed font-serif space-y-4">
                            <div className="space-y-8 text-gray-800">
                                <section>
                                    <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-4 text-gray-900">The Evolution of Christian Scripture: From Paul to Canon</h3>

                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">The Foundation: Paul's Theology Preceded the Gospels</h4>
                                    <p className="mb-4">The New Testament we know today did not emerge in chronological order. <strong className="font-semibold text-gray-900">Paul's letters, written between 48-62 CE, predate all four canonical Gospels by 15-40 years.</strong> This chronological fact is critically important because Paul's theological framework—his understanding of Jesus as a divine dying-and-rising savior whose death atones for sin—was already circulating among Gentile Christian communities before any written Gospel account existed.</p>

                                    <p className="mb-4">Paul's theology introduced concepts foreign to the Hebrew prophets:</p>
                                    <ul className="list-disc list-inside mb-4 pl-4 space-y-2 marker:text-amber-800">
                                        <li><strong>Original sin transmitted from Adam</strong> (Romans 5:12-19)</li>
                                        <li><strong>Salvation through faith alone, not works</strong> (Ephesians 2:8-9)</li>
                                        <li><strong>Jesus as a pre-existent divine being</strong> (Philippians 2:6-7)</li>
                                        <li><strong>Substitutionary atonement through blood sacrifice</strong> (Romans 3:25)</li>
                                        <li><strong>Abolishment of Torah law for Gentiles</strong> (Galatians 3:23-25)</li>
                                    </ul>

                                    <p className="mb-6">These ideas contradicted the consistent message of the Hebrew prophets that atonement comes through repentance, righteous deeds, and God's mercy—never through human sacrifice (Ezekiel 18:20-23, Hosea 6:6, Micah 6:6-8). As the Quran notes:</p>

                                    <blockquote className="border-l-4 border-amber-200 pl-6 py-2 my-8 bg-gray-50/50 italic text-gray-600">
                                        <p className="mb-4"><strong className="text-amber-800 not-italic font-sans text-xs tracking-wider uppercase block mb-1">[2:78-79]</strong> "Among them are gentiles who do not know the scripture, except through hearsay, then assume that they know it. Therefore, woe to those who distort the scripture with their own hands, then say, 'This is what GOD has revealed,' seeking a cheap material gain."</p>
                                        <p><strong className="text-amber-800 not-italic font-sans text-xs tracking-wider uppercase block mb-1">[6:93]</strong> "Who is more evil than one who fabricates lies and attributes them to GOD, or says, 'I have received divine inspiration,' when no such inspiration was given to him..."</p>
                                    </blockquote>

                                    <p>Paul himself never met Jesus during his ministry, never heard him preach, and received his "gospel" through what he claimed were private visions (Galatians 1:11-12). Yet his writings would profoundly shape how the Gospel writers—writing decades later—would present Jesus's life and mission.</p>
                                </section>

                                <section>
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">The Cultural Context: Nero Redivivus and Dying-Rising Gods</h4>
                                    <p className="mb-4">By the time the Gospels were being written (65-100 CE), the Greco-Roman world was already familiar with myths of dying-and-rising savior figures and miraculous returns from death.</p>
                                    <p className="mb-4"><strong className="font-semibold text-gray-900">The Nero Redivivus legend</strong> is particularly significant. After Emperor Nero's suicide in 68 CE, a widespread belief emerged—especially in the eastern provinces—that he was not truly dead but would somehow return. Ancient historians document this phenomenon:</p>
                                    <ul className="list-disc list-inside mb-4 pl-4 space-y-2 marker:text-amber-800">
                                        <li><strong>Suetonius</strong> (Lives of the Caesars, LVII.1): Court astrologers had predicted Nero would fall but "have power in the East" (XL.2)</li>
                                        <li><strong>Tacitus</strong> (Histories II.8): The first false Nero appeared the next year, claiming to be the resurrected emperor</li>
                                        <li><strong>Dio Cassius</strong> (LXVI.19.3): During Titus's reign (79-81 CE), another impostor appeared in Asia</li>
                                        <li>A third pretender appeared 20 years after Nero's death, supported by the Parthians, nearly causing war (Tacitus I.2)</li>
                                    </ul>
                                    <p>This cultural context—where dying-and-rising figures were expected and celebrated—provided fertile ground for Paul's theology. The Gospels, written after these events and after Paul's letters had circulated for decades, would naturally reflect these influences.</p>
                                </section>

                                <section>
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">The Gospel Timeline and Interdependence</h4>

                                    <div className="pl-4 border-l border-gray-100 space-y-6">
                                        <div>
                                            <h5 className="font-bold text-gray-900 mb-2">Mark: The Earliest Gospel (65-70 CE)</h5>
                                            <p className="mb-2">The <strong>Gospel of Mark</strong> is scholarly consensus as the earliest written Gospel. Mark's Gospel is:</p>
                                            <ul className="list-disc list-inside pl-4 space-y-1 marker:text-gray-300 text-sm">
                                                <li><strong>Shorter and more primitive</strong> than the others</li>
                                                <li><strong>Ends abruptly</strong> at 16:8 with women fleeing the empty tomb in fear, saying nothing to anyone</li>
                                                <li><strong>Contains no post-resurrection appearances</strong> in its original form</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-gray-900 mb-6">The Two-Source Hypothesis</h5>

                                            {/* Visual Graph with SVG Lines */}
                                            <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-8 mb-6 overflow-hidden">
                                                <div className="relative flex flex-col items-center min-w-[300px] h-[200px]">
                                                    {/* SVG Layer for Connections */}
                                                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 200" preserveAspectRatio="none">
                                                        <defs>
                                                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                                                <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                                                            </marker>
                                                        </defs>

                                                        {/* Mark -> Matt */}
                                                        <path d="M120 50 C 120 100, 100 100, 120 140" stroke="#cbd5e1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />

                                                        {/* Mark -> Luke */}
                                                        <path d="M160 50 C 160 100, 240 100, 260 140" stroke="#cbd5e1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />

                                                        {/* Q -> Matt */}
                                                        <path d="M260 50 C 260 100, 150 100, 140 140" stroke="#cbd5e1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />

                                                        {/* Q -> Luke */}
                                                        <path d="M280 50 C 280 100, 280 100, 280 140" stroke="#cbd5e1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />

                                                        {/* M -> Matt */}
                                                        <path d="M50 155 L 90 155" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrowhead)" />

                                                        {/* L -> Luke */}
                                                        <path d="M350 155 L 310 155" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrowhead)" />
                                                    </svg>

                                                    {/* Content Layer */}
                                                    <div className="flex flex-col justify-between h-full z-10 w-full max-w-[400px]">
                                                        {/* Top Row: Sources */}
                                                        <div className="flex justify-center gap-16">
                                                            <div className="flex flex-col items-center gap-1 w-24">
                                                                <div className="bg-amber-100/50 border border-amber-200 text-amber-900 w-full py-2 rounded-lg font-bold shadow-sm text-center text-sm z-10">
                                                                    Mark
                                                                </div>
                                                                <span className="text-[10px] text-gray-400 font-sans uppercase tracking-widest text-center">Narrative</span>
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1 w-24">
                                                                <div className="bg-blue-50 border border-blue-200 text-blue-900 w-full py-2 rounded-lg font-bold shadow-sm text-center text-sm z-10">
                                                                    Q Source
                                                                </div>
                                                                <span className="text-[10px] text-gray-400 font-sans uppercase tracking-widest text-center">Sayings</span>
                                                            </div>
                                                        </div>

                                                        {/* Bottom Row: Gospels */}
                                                        <div className="flex justify-between px-8">
                                                            <div className="flex flex-col items-center gap-1 w-24 relative">
                                                                <div className="absolute -left-10 top-3 text-sm font-bold text-gray-400">M</div>
                                                                <div className="bg-white border border-gray-200 text-gray-900 w-full py-2 rounded-lg font-bold shadow-sm text-center text-sm z-10">
                                                                    Matthew
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1 w-24 relative">
                                                                <div className="absolute -right-10 top-3 text-sm font-bold text-gray-400">L</div>
                                                                <div className="bg-white border border-gray-200 text-gray-900 w-full py-2 rounded-lg font-bold shadow-sm text-center text-sm z-10">
                                                                    Luke
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="mb-2"><strong>Matthew</strong> and <strong>Luke</strong> independently used <strong>Mark</strong> as a source, plus a sayings source ("Q"). Evidence of copying includes:</p>
                                            <ul className="list-disc list-inside pl-4 space-y-1 marker:text-gray-300 text-sm">
                                                <li>Matthew reproduces ~90% of Mark; Luke ~50%</li>
                                                <li>Verbatim Greek word-for-word copying over long stretches</li>
                                                <li>Both modify Mark's difficult grammar and correct his factual errors in the same way</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h5 className="font-bold text-gray-900 mb-2">John: The Theological Gospel (90-100 CE)</h5>
                                            <p className="mb-2">Writes last, presenting a radically different, explicitly divine Jesus ("I am" statements) with no birth narrative, parables, or exorcisms found in the Synoptics.</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">The Non-Canonical Gospels: Lost Voices</h4>
                                    <p className="mb-4">In 1945, the <strong>Gospel of Thomas</strong> and other texts were discovered at Nag Hammadi. Thomas (dated 50-100 CE) contains 114 sayings of Jesus with no narrative, death, or resurrection. It likely preserves an independent, earlier tradition than the canonical Gospels.</p>
                                    <blockquote className="border-l-4 border-gray-200 pl-6 py-2 my-6 bg-gray-50/50 italic text-gray-600 text-sm">
                                        <p className="mb-2"><strong className="text-gray-900 not-italic block mb-1">Thomas 65 (Primitive Parable):</strong> "A good person owned a vineyard... He sent his servant... They seized his servant and beat him... The master said, 'Perhaps he did not recognize them.'... The tenants beat this one as well. Then the owner sent his son... they seized him and killed him."</p>
                                        <p><strong className="text-gray-900 not-italic block mb-1">Contrast Mark 12:1-8 (Expanded/Allegorical):</strong> "...He put a wall around it, dug a pit... built a watchtower... He sent many others... He sent him last of all, saying, 'They will respect my son.' But the tenants said, 'This is the heir...'"</p>
                                    </blockquote>
                                    <p>Thomas's simpler version suggests it predates the theological embellishments found in Mark.</p>
                                </section>

                                <section>
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">The Canon Formation Process: Power, Not Revelation</h4>
                                    <p className="mb-4">Early Christians had no "New Testament." The canon was not decided at a single council but evolved over centuries (official lists appear only in 4th-5th centuries).</p>
                                    <p className="mb-4">Church Fathers who decided the canon were largely Gentiles who did not know Hebrew (save Origen/Jerome). They selected books based on:</p>
                                    <ol className="list-decimal list-inside pl-4 space-y-2 marker:text-amber-800 font-semibold text-gray-900">
                                        <li><span className="font-normal text-gray-800"><strong>Apostolicity:</strong> Attributed to an apostle (or companion)</span></li>
                                        <li><span className="font-normal text-gray-800"><strong>Catholicity:</strong> Widespread use across churches</span></li>
                                        <li><span className="font-normal text-gray-800"><strong>Orthodoxy:</strong> Agreed with the dominant theological group</span></li>
                                    </ol>
                                    <p className="mt-4">As Bart Ehrman notes, this is circular: a book was "apostolic" because it was "orthodox," and "orthodox" because it matched the theology of those in power.</p>
                                </section>

                                <section>
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">Recovering the Words of Jesus: A Quranic Framework</h4>
                                    <p className="mb-4">The Quran describes itself as <em>Muhaymin</em> (guardian/criterion) over previous scriptures (5:48). We do not reject previous scriptures wholesale but evaluate them through the Quranic lens.</p>

                                    <p className="mb-4">Surprisingly, many non-canonical texts confirm Quranic teachings that were erased from the canonical tradition:</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                            <h5 className="font-bold text-gray-900 mb-2 font-sans text-sm uppercase tracking-wide">Virgin Birth & Mary's Purity</h5>
                                            <p className="text-sm">Confirmed by <strong>Protoevangelium of James</strong>. Aligns with Quran 3:35-37, 3:42.</p>
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                            <h5 className="font-bold text-gray-900 mb-2 font-sans text-sm uppercase tracking-wide">Jesus Speaking in Cradle</h5>
                                            <p className="text-sm">Confirmed by <strong>Infancy Gospel of Thomas</strong>. Aligns with Quran 3:46, 19:29-30.</p>
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                            <h5 className="font-bold text-gray-900 mb-2 font-sans text-sm uppercase tracking-wide">Denial of Crucifixion Death</h5>
                                            <p className="text-sm">Confirmed by <strong>Gospel of Peter, Apocalypse of Peter</strong>. Aligns with Quran 4:157.</p>
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                            <h5 className="font-bold text-gray-900 mb-2 font-sans text-sm uppercase tracking-wide">Pure Monotheism</h5>
                                            <p className="text-sm">Confirmed by <strong>Gospel of Thomas (Saying 13, 3)</strong>. Aligns with Quran 5:72, 5:116.</p>
                                        </div>
                                    </div>

                                    <p className="mb-4">This study edition includes both canonical and non-canonical writings, using the Quran as the criterion to distinguish authentic prophetic teaching from later theological distortion.</p>
                                </section>

                                <section className="mt-12 pt-8 border-t border-gray-200">
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4 text-center">Conclusion</h4>
                                    <p className="italic text-center text-gray-600 max-w-2xl mx-auto">
                                        "The New Testament is not divine revelation preserved intact. It is a collection of human documents... Our task is to distinguish between them, using the guidance God has provided in His final revelation."
                                    </p>
                                </section>
                            </div>
                        </div>
                    </section>

                    {/* Final Testament Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <h2 className="font-[family-name:var(--font-playfair)] text-3xl text-gray-900 text-center">Understanding The Final Testament</h2>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>
                        <div className="space-y-8 text-gray-800">
                            <section>
                                <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-4 text-gray-900">The Quran: Revelation, Preservation, and Mathematical Authentication</h3>

                                <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">Revelation and Community Transmission</h4>
                                <p className="mb-4">The Quran is the final scripture revealed by God, delivered to Prophet Muhammad over a period of 23 years (610–632 CE). Unlike previous scriptures that were entrusted to scribes, priestly elites, or isolated communities, the Quran was revealed to a living society, recited publicly, memorized collectively, and implemented immediately.</p>
                                <p className="mb-4">After the Prophet’s death, the Quran continued to exist primarily as a mass-memorized text, supported by written fragments. Approximately 19 years later, the community formally standardized the written Quran to preserve the already well-known and widely transmitted revelation. This process did not introduce new material nor revise doctrine; it documented what was already established through public recitation and memorization.</p>
                                <p className="mb-4">Over more than 1400 years, the Quran has been transmitted by millions of memorizers across every generation, creating a unique form of preservation unparalleled in human history. Differences in orthography, spelling conventions, recitational modes, and manuscript notation naturally arose, as they do in all ancient textual traditions. However, these variations do not alter the Quran’s message or structure and do not constitute doctrinal corruption.</p>
                            </section>

                            <section>
                                <div className="bg-amber-50 border border-amber-100 p-8 rounded-xl my-8 text-center">
                                    <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-4 text-amber-900">The Divine Promise of Preservation</h4>
                                    <p className="text-gray-700 italic mb-4 max-w-2xl mx-auto">Unlike earlier scriptures, the Quran explicitly declares its own divine protection:</p>
                                    <blockquote className="text-xl md:text-2xl font-[family-name:var(--font-playfair)] text-amber-900 mb-4">
                                        “Absolutely, We have revealed the Reminder, and absolutely, We will preserve it.”
                                    </blockquote>
                                    <cite className="text-sm uppercase tracking-widest text-amber-800 font-bold block mb-4">(Quran 15:9)</cite>
                                    <p className="text-sm text-amber-900/80 max-w-2xl mx-auto">This is not a theological sentiment but a testable claim. The Quran places its own credibility at stake.</p>
                                </div>
                            </section>

                            <section>
                                <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">The Discovery of the Mathematical Structure (Code 19)</h4>
                                <p className="mb-4">In 1974, Dr. Rashad Khalifa placed the Arabic Quran into a computer for the first time. What emerged was a precise, pervasive mathematical system governing the entire Quran, based on the number 19—a number the Quran itself highlights in Sura 74:30.</p>

                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 md:p-8 my-8">
                                    <h5 className="font-bold text-lg text-blue-900 mb-6 text-center border-b border-blue-200 pb-4">The Simple Facts (Verifiable Without Tools)</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm md:text-base">
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                            <span className="text-gray-700">Opening Verse (1:1) Letters</span>
                                            <span className="font-bold text-blue-800 font-mono">19</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                            <span className="text-gray-700">Total Suras</span>
                                            <span className="font-bold text-blue-800 font-mono">114 (19 × 6)</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                            <span className="text-gray-700">First Revelation (96:1-5) Words</span>
                                            <span className="font-bold text-blue-800 font-mono">19</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                            <span className="text-gray-700">First Revelation Letters</span>
                                            <span className="font-bold text-blue-800 font-mono">76 (19 × 4)</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                            <span className="text-gray-700">Sura 96 Verses</span>
                                            <span className="font-bold text-blue-800 font-mono">19</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                            <span className="text-gray-700">Sura 96 Arabic Letters</span>
                                            <span className="font-bold text-blue-800 font-mono">304 (19 × 16)</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                            <span className="text-gray-700">Final Revelation (Sura 110) Words</span>
                                            <span className="font-bold text-blue-800 font-mono">19</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                            <span className="text-gray-700">1st Verse of Sura 110 Letters</span>
                                            <span className="font-bold text-blue-800 font-mono">19</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">Quranic Initials and Letter-Level Precision</h4>
                                <p className="mb-4">Twenty-nine suras are prefixed with disconnected letters (e.g., A.L.M., Q, K.H.Y.ʿA.Ṣ). When analyzed, these initials reveal frequency systems so precise that even a single altered letter destroys the structure.</p>

                                <div className="bg-gray-50 border border-gray-100 p-6 rounded-lg my-6">
                                    <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="w-8 h-8 bg-gray-900 text-white rounded flex items-center justify-center font-bold">Q</span>
                                        <span className="uppercase tracking-wide text-sm">Example: The Initial "Q" (Qaaf)</span>
                                    </h5>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <li className="flex gap-2 items-start">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                                            <span className="text-gray-600">Only two suras are prefixed with Q: Sura 42 and Sura 50.</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                                            <span className="text-gray-600">Each contains <strong className="text-gray-900">57</strong> occurrences of Q (19 × 3).</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                                            <span className="text-gray-600">Combined total: <strong className="text-gray-900">114</strong>, the exact number of suras in the Quran.</span>
                                        </li>
                                        <li className="flex gap-2 items-start">
                                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2"></div>
                                            <span className="text-gray-600">The word "Quran" is mentioned 57 times.</span>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3 mt-8">Exposure of Inserted Verses: 9:128–129</h4>
                                <p className="mb-4">One of the most significant implications of the mathematical structure is its role as an internal authentication system (checksum). The final two verses of Sura 9 (9:128–129) failed to conform to the code, breaking multiple 19-based patterns governing chapter totals, verse counts, and letter frequencies.</p>
                                <p className="mb-4">When these two verses are removed, the structure of Sura 9 and the entire Quran realigns perfectly. This confirms they were later insertions, a fact historically debated but now mathematically proven.</p>
                            </section>

                            <section className="border-t border-gray-100 pt-8 mt-12">
                                <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-6 text-center">The Quran as the Criterion (Muhaymin)</h4>
                                <div className="max-w-2xl mx-auto text-center space-y-4">
                                    <p className="text-gray-600 italic">
                                        "We did not leave anything out of this scripture." (6:38)
                                    </p>
                                    <p className="text-lg text-gray-800 leading-relaxed">
                                        Previous scriptures were entrusted to communities—and altered. The Quran was entrusted to God—and preserved. Its preservation is not defended by tradition or consensus, but demonstrated through an internal, mathematical, falsifiable structure embedded directly into the text.
                                    </p>
                                </div>
                            </section>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
