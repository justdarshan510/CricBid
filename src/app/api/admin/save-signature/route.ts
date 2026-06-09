import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { svgContent } = await request.json();
    
    if (!svgContent) {
      return NextResponse.json(
        { success: false, error: 'No SVG content provided' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', 'dhoni-signature.svg');
    fs.writeFileSync(filePath, svgContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[save-signature] error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
