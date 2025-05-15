// /app/api/ai/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // 1. Fetch AI profile
    const aiProfile = await prisma.aiProfile.findUnique({ where: { address } });

    if (!aiProfile || !aiProfile.isEnabled || !aiProfile.prompt) {
      return NextResponse.json({ error: 'AI not enabled or prompt missing' }, { status: 400 });
    }

    // 2. Generate structured response via OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: aiProfile.prompt
        }
      ]
    });

    const aiOutput = response.choices[0].message?.content || '';

    // 3. Save result (optional: write to DB or file)
    const output = await prisma.aiOutput.create({
      data: {
        address,
        result: aiOutput,
      }
    });

    return NextResponse.json({ result: aiOutput });
  } catch (error) {
    console.error('AI execution failed:', error);
    return NextResponse.json({ error: 'AI executor error' }, { status: 500 });
  }
}