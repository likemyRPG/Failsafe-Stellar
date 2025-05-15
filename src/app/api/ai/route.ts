import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  try {
    const aiProfile = await prisma.aiProfile.findUnique({
      where: { address },
    });

    if (!aiProfile) {
      return NextResponse.json(
        { 
          isEnabled: false, 
          prompt: null,
          message: 'No AI configuration found for this address' 
        }, 
        { status: 404 }
      );
    }

    return NextResponse.json(aiProfile);
  } catch (error) {
    console.error('Error fetching AI configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, prompt, isEnabled } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // If AI is enabled, prompt is required
    if (isEnabled && !prompt) {
      return NextResponse.json(
        { error: 'Prompt is required when AI is enabled' },
        { status: 400 }
      );
    }

    // Create or update AI configuration
    const aiProfile = await prisma.aiProfile.upsert({
      where: { address },
      update: {
        prompt: prompt || '',
        isEnabled: isEnabled || false,
        updatedAt: new Date()
      },
      create: {
        address,
        prompt: prompt || '',
        isEnabled: isEnabled || false
      },
    });

    return NextResponse.json(aiProfile);
  } catch (error) {
    console.error('Error saving AI configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save AI configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, isEnabled, prompt } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // If AI is being enabled, prompt is required
    if (isEnabled && !prompt) {
      return NextResponse.json(
        { error: 'Prompt is required when AI is enabled' },
        { status: 400 }
      );
    }

    // Update AI configuration
    const aiProfile = await prisma.aiProfile.update({
      where: { address },
      data: {
        isEnabled: isEnabled ?? false,
        prompt: prompt || '',
        updatedAt: new Date()
      },
    });

    return NextResponse.json(aiProfile);
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update AI configuration' },
      { status: 500 }
    );
  }
} 