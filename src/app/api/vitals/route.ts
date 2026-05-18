import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const metric = await request.json();

        if (process.env.NODE_ENV === 'production') {
            console.info('[web-vitals]', metric);
        }
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
