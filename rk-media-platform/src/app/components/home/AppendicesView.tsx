import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { ThemeColors } from "@/types/media";

interface AppendicesViewProps {
    theme: ThemeColors;
    darkMode: boolean;
}

const APPENDICES = [
    { id: 'proclamation', title: 'Proclamation' },
    { id: 'glossary', title: 'Glossary' },
    { id: 'introduction', title: 'Introduction' },
    { id: 'appendix-1', title: '1. One of the Great Miracles [74:35]' },
    { id: 'appendix-2', title: '2. God\'s Messenger of the Covenant [3:81]' },
    { id: 'appendix-3', title: '3. We Made the Quran Easy [54:17]' },
    { id: 'appendix-4', title: '4. Why Was the Quran Revealed in Arabic?' },
    { id: 'appendix-5', title: '5. Heaven and Hell' },
    { id: 'appendix-6', title: '6. Greatness of God' },
    { id: 'appendix-7', title: '7. Why Were We Created?' },
    { id: 'appendix-8', title: '8. The Myth of Intercession' },
    { id: 'appendix-9', title: '9. Abraham: Original Messenger of Islam' },
    { id: 'appendix-10', title: '10. God\'s Usage of the Plural Tense' },
    { id: 'appendix-11', title: '11. The Day of Resurrection' },
    { id: 'appendix-12', title: '12. Role of the Prophet Muhammad' },
    { id: 'appendix-13', title: '13. The First Pillar of Islam' },
    { id: 'appendix-14', title: '14. Predestination' },
    { id: 'appendix-15', title: '15. Religious Duties: Gift from God' },
    { id: 'appendix-16', title: '16. Dietary Prohibition' },
    { id: 'appendix-17', title: '17. Death' },
    { id: 'appendix-18', title: '18. Quran Is All You Need' },
    { id: 'appendix-19', title: '19. Hadith and Sunna: Satanic Innovations' },
    { id: 'appendix-20', title: '20. Quran: Unlike Any Other Book' },
    { id: 'appendix-21', title: '21. Satan: Fallen Angel' },
    { id: 'appendix-22', title: '22. Jesus' },
    { id: 'appendix-23', title: '23. Chronological Order of Revelation' },
    { id: 'appendix-24', title: '24. Two False Verses Removed from the Quran' },
    { id: 'appendix-25', title: '25. End of the World' },
    { id: 'appendix-26', title: '26. The Three Messengers of Islam' },
    { id: 'appendix-27', title: '27. Who Is Your God?' },
    { id: 'appendix-28', title: '28. Muhammad Wrote God\'s Revelations With His Own Hand' },
    { id: 'appendix-29', title: '29. The Missing Basmalah' },
    { id: 'appendix-30', title: '30. Polygamy' },
    { id: 'appendix-31', title: '31. Evolution: A Divinely Guided Process' },
    { id: 'appendix-32', title: '32. The Crucial Age of 40' },
    { id: 'appendix-33', title: '33. Why Did God Send a Messenger Now?' },
    { id: 'appendix-34', title: '34. Virginity/Chastity: A Trait of the True Believers' },
    { id: 'appendix-35', title: '35. Drugs & Alcohol' },
    { id: 'appendix-36', title: '36. What Price a Great Nation' },
    { id: 'appendix-37', title: '37. Criminal Justice in Islam' },
    { id: 'appendix-38', title: '38. The Creator\'s Signature' },
];

export function AppendicesView({ theme, darkMode }: AppendicesViewProps) {
    return (
        <div className="space-y-6">
            <div className={`${theme.card} rounded-sm border ${theme.border} shadow-sm overflow-hidden`}>
                <div className={`p-6 ${darkMode ? 'bg-zinc-900' : 'bg-white'} border-b ${theme.border}`}>
                    <div className="flex items-baseline gap-4">
                        <h3 className={`text-2xl font-serif ${theme.text}`}>Quran Translation Appendices</h3>
                        <span className={`text-[10px] font-mono font-bold ${theme.textVeryMuted} border ${theme.border} px-2 py-0.5 rounded-sm uppercase tracking-wider`}>
                            {APPENDICES.length} Appendices
                        </span>
                    </div>
                </div>
                <div className={`p-6 ${darkMode ? 'bg-black/20' : 'bg-gray-50/50'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {APPENDICES.map((appendix) => (
                            <Link
                                key={appendix.id}
                                href={`/appendices/${appendix.id}`}
                                className={`group h-full ${theme.card} border ${theme.border} rounded-sm p-5 hover:border-zinc-400 transition-all cursor-pointer flex flex-col relative overflow-hidden shadow-sm hover:shadow-md`}
                            >
                                <div className="mb-4">
                                    <h4 className={`font-serif text-base ${theme.text} group-hover:opacity-70 transition-opacity leading-tight`}>
                                        {appendix.title}
                                    </h4>
                                </div>
                                <div className={`mt-auto flex items-center justify-between pt-4 border-t ${theme.border} text-xs font-mono uppercase tracking-widest ${theme.textVeryMuted}`}>
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen className="w-3 h-3" />
                                        <span>Read</span>
                                    </div>
                                    <ArrowLeft className={`w-3 h-3 rotate-180 transform group-hover:translate-x-1 transition-transform ${theme.text}`} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
