
'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
    return (
        <button
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
            title="Print"
        >
            <Printer className="w-5 h-5" />
        </button>
    );
}
