'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StudyEntry, MediaItem } from '@/lib/studyActions';
import { MousePointer2, Library, MonitorPlay, NotebookPen, Search, GripHorizontal } from 'lucide-react';

interface StudyNotebookProps {
    activeVerseRef: string | null;
    chapterEntries: StudyEntry[];
    isLoading: boolean;
}

type Tab = 'home' | 'library' | 'media' | 'notes';

export default function StudyNotebook({ activeVerseRef, chapterEntries, isLoading }: StudyNotebookProps) {
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Scroll logic removed for dynamic view


    // Aggregate Content
    const mediaItems = chapterEntries.flatMap(e => e.media_content || []).filter(m => m.type === 'video' || m.type === 'youtube');
    const bookItems = chapterEntries.flatMap(e => e.media_content || []).filter(m => m.type === 'book');

    const renderTabButton = (tab: Tab, Icon: any) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`p-3 rounded-t-lg transition-colors border-b-[3px] flex-1 flex justify-center ${activeTab === tab ? 'border-amber-700 text-amber-800 bg-amber-50/40' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
        >
            <Icon className="w-5 h-5 stroke-[1.5]" />
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-[#fafafa] text-gray-800 font-[family-name:var(--font-crimson)]">
            {/* WIDGET HEADER / TABS */}
            <div className="flex items-center justify-between px-2 pt-2 pb-0 bg-white border-b border-gray-200 shrink-0 shadow-sm z-10">
                {renderTabButton('home', MousePointer2)}   {/* Exegesis/Interactive */}
                {renderTabButton('library', Library)}       {/* Resources */}
                {renderTabButton('media', MonitorPlay)}     {/* Video/Media */}
                {renderTabButton('notes', NotebookPen)}     {/* User Notes */}
            </div>

            {/* STATIC SEARCH BAR */}
            <div className="p-3 bg-white border-b border-gray-100 flex gap-2 shadow-sm z-0">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
                    <input
                        disabled
                        type="text"
                        placeholder="Search resources..."
                        className="w-full bg-[#f4f4f4] border-none rounded-sm py-1.5 pl-8 pr-3 text-sm focus:ring-1 focus:ring-amber-500 font-sans"
                    />
                </div>
                <button className="p-1.5 text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200 rounded">
                    <GripHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">

                {/* HEAD: Static Tab Titles */}
                <div className="text-center border-b border-gray-200 pb-2 mb-6">
                    <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-sans font-medium">
                        {activeTab === 'home' ? 'Chapter Exegesis' : activeTab === 'media' ? 'Media Library' : activeTab === 'library' ? 'Resources' : 'My Notebook'}
                    </p>
                </div>

                {/* HOME TAB: Dynamic Exegesis (Matches Active Verse) */}
                {activeTab === 'home' && (
                    <div className="space-y-12">
                        {!activeVerseRef ? (
                            <div className="text-center py-20 opacity-60">
                                <MousePointer2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="font-serif italic text-lg text-gray-400">Select a verse to view <br />exegesis & commentary.</p>
                            </div>
                        ) : (
                            (() => {
                                const entry = chapterEntries.find(e => e.verse_ref === activeVerseRef);
                                return entry ? (
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                        <h3 className="text-amber-800 font-[family-name:var(--font-playfair)] font-bold text-xl mb-4 text-center border-b border-gray-100 pb-3">
                                            {activeVerseRef.split(':').slice(1).join(' ')}
                                        </h3>

                                        <div className="prose prose-stone prose-p:text-gray-800 prose-headings:font-[family-name:var(--font-playfair)] prose-headings:font-normal max-w-none font-serif text-[1.1rem] leading-relaxed">
                                            <div dangerouslySetInnerHTML={{ __html: entry.content }} />
                                        </div>

                                        {/* Cross Refs */}
                                        {entry.cross_refs && entry.cross_refs.length > 0 && (
                                            <div className="mt-8 pt-6 border-t border-gray-200">
                                                <h4 className="font-sans font-bold text-[0.65rem] uppercase tracking-widest text-gray-400 mb-3">Cross References</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {entry.cross_refs.map((ref, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-[#f0efe9] text-gray-500 border border-[#e0dfd9] text-[0.65rem] rounded font-sans uppercase tracking-wider">
                                                            {ref}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="italic text-gray-400">No exegesis notes available for {activeVerseRef.split(':').pop()}.</p>
                                    </div>
                                );
                            })()
                        )}
                    </div>
                )}

                {/* MEDIA TAB */}
                {activeTab === 'media' && (
                    <div className="space-y-6">
                        {mediaItems.length > 0 ? mediaItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                {item.type === 'youtube' && item.url ? (
                                    <div className="aspect-video rounded overflow-hidden bg-black mb-2 relative group">
                                        <iframe
                                            width="100%" height="100%"
                                            src={`https://www.youtube.com/embed/${item.url.split('v=')[1]?.split('&')[0]}`}
                                            title={item.title}
                                            frameBorder="0" allowFullScreen
                                            className="relative z-10"
                                        ></iframe>
                                    </div>
                                ) : null}
                                <div className="font-[family-name:var(--font-playfair)] text-md text-gray-800 mt-2 leading-tight">{item.title}</div>
                                {item.citation && <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-sans">{item.citation}</div>}
                            </div>
                        )) : (
                            <div className="text-center py-12">
                                <MonitorPlay className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                                <p className="italic text-gray-400">No media resources linked to this chapter.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* LIBRARY TAB */}
                {activeTab === 'library' && (
                    <div className="space-y-4">
                        {bookItems.length > 0 ? bookItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded shadow-sm border border-gray-100 flex gap-4">
                                <div className="w-12 h-16 bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                    <Library className="w-6 h-6 opacity-30" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800 font-[family-name:var(--font-playfair)]">{item.title}</div>
                                    <div className="text-sm text-gray-500 mt-1 italic">{item.citation || 'Resource'}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12">
                                <Library className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                                <p className="italic text-gray-400">No book resources linked to this chapter.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                    <div className="text-center py-12">
                        <NotebookPen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                        <p className="italic text-gray-400">Your personal notes feature is coming soon.</p>
                    </div>
                )}

            </div>
        </div>
    );
}
