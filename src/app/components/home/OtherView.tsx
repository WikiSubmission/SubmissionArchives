import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { ThemeColors } from "@/types/media";

interface OtherViewProps {
    theme: ThemeColors;
    darkMode: boolean;
}

const OTHER_RESOURCES = [
    {
        id: 'salat-booklet',
        title: 'Contact Prayer [Salat] Booklet',
        filename: 'salat_booklet.pdf',
        description: 'Comprehensive guide to the Contact Prayer (Salat)'
    },
    {
        id: 'quran-hadith-islam',
        title: 'Quran, Hadith, and Islam',
        filename: 'quran_hadith_islam.pdf',
        description: 'By Dr. Rashad Khalifa'
    },
    {
        id: 'computer-speaks',
        title: 'The Computer Speaks',
        filename: 'computer_speaks.pdf',
        description: "God's Message to the World"
    },
    {
        id: 'quran-visual-presentation',
        title: 'Quran: Visual Presentation of the Miracle',
        filename: 'quran_visual_presentation.pdf',
        description: 'By Dr. Rashad Khalifa'
    },
    {
        id: 'perpetual-miracle',
        title: 'The Perpetual Miracle of Muhammad',
        filename: 'perpetual_miracle.pdf',
        description: 'By Dr. Rashad Khalifa'
    },
    {
        id: 'miracle-of-quran-alphabets',
        title: 'Miracle of Quran: Significance of the Mysterious Alphabets',
        filename: 'miracle_of_quran_alphabets.pdf',
        description: 'By Dr. Rashad Khalifa'
    }
];

export function OtherView({ theme, darkMode }: OtherViewProps) {
    return (
        <div className="space-y-6">
            <div className={`${theme.card} rounded-sm border ${theme.border} shadow-sm overflow-hidden`}>
                <div className={`p-6 ${darkMode ? 'bg-zinc-900' : 'bg-white'} border-b ${theme.border}`}>
                    <div className="flex items-baseline gap-4">
                        <h3 className={`text-2xl font-serif ${theme.text}`}>Other Resources</h3>
                        <span className={`text-[10px] font-mono font-bold ${theme.textVeryMuted} border ${theme.border} px-2 py-0.5 rounded-sm uppercase tracking-wider`}>
                            {OTHER_RESOURCES.length} Items
                        </span>
                    </div>
                </div>
                <div className={`p-6 ${darkMode ? 'bg-black/20' : 'bg-gray-50/50'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {OTHER_RESOURCES.map((resource) => (
                            <Link
                                key={resource.id}
                                href={`/read/${resource.id}`}
                                className={`group h-full ${theme.card} border ${theme.border} rounded-sm overflow-hidden hover:border-zinc-400 transition-all cursor-pointer flex flex-col relative shadow-sm hover:shadow-md`}
                            >
                                {/* Thumbnail Image */}
                                <div className="relative w-full aspect-[3/4] bg-black/5 dark:bg-black/20 overflow-hidden">
                                    <img
                                        src={`/images/other/${resource.id}.jpg`}
                                        alt={resource.title}
                                        className="w-full h-full object-contain p-2 bg-white dark:bg-zinc-900 group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            e.currentTarget.src = '/images/placeholders/rashad-khalifa.png';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="mb-4">
                                        <h4 className={`font-serif text-base ${theme.text} group-hover:opacity-70 transition-opacity leading-tight mb-2`}>
                                            {resource.title}
                                        </h4>
                                        <p className={`text-xs ${theme.textMuted} font-mono leading-relaxed`}>
                                            {resource.description}
                                        </p>
                                    </div>
                                    <div className={`mt-auto flex items-center justify-between pt-4 border-t ${theme.border} text-xs font-mono uppercase tracking-widest ${theme.textVeryMuted}`}>
                                        <div className="flex items-center gap-1.5">
                                            <BookOpen className="w-3 h-3" />
                                            <span>Read PDF</span>
                                        </div>
                                        <ArrowLeft className={`w-3 h-3 rotate-180 transform group-hover:translate-x-1 transition-transform ${theme.text}`} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
