import { useState } from 'react';
import { Bookmark as BookmarkIcon, X } from 'lucide-react';
import { Bookmark } from '@/hooks/useBookmarks';

interface BookmarkPanelProps {
    bookmarks: Bookmark[];
    onSeek: (time: number) => void;
    onDelete: (id: number) => void;
    onAdd: (time: number, note: string, color: string) => void;
    onExport: () => void;
    currentTime: number;
}

export default function BookmarkPanel({ bookmarks, onSeek, onDelete, onAdd, onExport, currentTime }: BookmarkPanelProps) {
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [selectedColor, setSelectedColor] = useState('yellow');

    function formatTime(seconds: number) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2 text-white">
                    <BookmarkIcon className="w-4 h-4 text-green-500" />
                    My Bookmarks ({bookmarks.length})
                </h3>
                <button
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm text-white transition-colors"
                >
                    + Add
                </button>
            </div>

            {showNoteInput && (
                <div className="mb-4 p-3 bg-zinc-800 rounded space-y-3 border border-zinc-700">
                    <input
                        type="text"
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:border-green-500"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        {['yellow', 'red', 'blue', 'green'].map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-6 h-6 rounded-full transition-all ${selectedColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: color === 'yellow' ? '#EAB308' : color === 'red' ? '#EF4444' : color === 'blue' ? '#3B82F6' : '#22C55E' }}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            onAdd(currentTime, newNote, selectedColor);
                            setNewNote('');
                            setShowNoteInput(false);
                        }}
                        className="w-full py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium text-white transition-colors"
                    >
                        Save Bookmark
                    </button>
                </div>
            )}

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {bookmarks.map(bookmark => (
                    <div
                        key={bookmark.id}
                        className={`p-3 rounded border-l-4 bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors group relative`}
                        style={{ borderLeftColor: bookmark.color === 'yellow' ? '#EAB308' : bookmark.color === 'red' ? '#EF4444' : bookmark.color === 'blue' ? '#3B82F6' : '#22C55E' }}
                        onClick={() => onSeek(bookmark.time)}
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-mono text-zinc-400 bg-zinc-900/50 px-1.5 py-0.5 rounded">
                                {formatTime(bookmark.time)}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(bookmark.id);
                                }}
                                className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        {bookmark.note && (
                            <p className="text-sm font-medium mb-2 text-white">{bookmark.note}</p>
                        )}
                        {bookmark.segmentText && (
                            <p className="text-xs text-zinc-500 italic line-clamp-2 pl-2 border-l-2 border-zinc-600">
                                "{bookmark.segmentText}"
                            </p>
                        )}
                    </div>
                ))}

                {bookmarks.length === 0 && !showNoteInput && (
                    <div className="text-center py-6 text-zinc-500 text-sm italic">
                        No bookmarks yet. Press + to add one.
                    </div>
                )}
            </div>

            {bookmarks.length > 0 && (
                <button
                    onClick={onExport}
                    className="w-full mt-4 py-2 border border-zinc-700 rounded hover:bg-zinc-800 text-sm text-zinc-300 hover:text-white transition-colors"
                >
                    Export All Bookmarks
                </button>
            )}
        </div>
    );
}
