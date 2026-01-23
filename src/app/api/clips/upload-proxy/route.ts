import { NextRequest, NextResponse } from 'next/server';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const key = formData.get('key') as string;
        const contentType = formData.get('contentType') as string;

        if (!file || !key) {
            return NextResponse.json({ error: 'Missing file or key' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const cmd = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType || file.type,
        });

        await r2Client.send(cmd);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Upload proxy error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
