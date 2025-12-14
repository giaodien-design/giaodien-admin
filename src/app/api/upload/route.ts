import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3, generateS3Key, validateImageFile } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine folder based on file type or query param
    const folder = (formData.get('folder') as string) || 'app-screens';

    // Generate unique key
    const key = generateS3Key(file.name, folder);

    // Upload to S3
    const url = await uploadToS3(buffer, key, file.type);

    return NextResponse.json(
      {
        success: true,
        url,
        key
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';

    // Check if it's a configuration error
    if (errorMessage.includes('AWS_S3_BUCKET_NAME') || errorMessage.includes('AWS credentials')) {
      return NextResponse.json(
        {
          error: errorMessage,
          hint: 'Please check your .env file and ensure AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are set.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Configure body size limit (10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};
