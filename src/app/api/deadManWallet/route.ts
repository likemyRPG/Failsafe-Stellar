import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/prisma';

interface Beneficiary {
  name: string;
  walletAddress: string;
  relationship?: string;
  sharePercentage?: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  try {
    const deadMansWallet = await prisma.deadMansWallet.findUnique({
      where: { address },
      include: {
        beneficiaries: true
      }
    });

    if (!deadMansWallet) {
      return NextResponse.json(
        { 
          isConfigured: false,
          message: 'No Dead Man\'s Wallet configuration found for this address' 
        }, 
        { status: 404 }
      );
    }

    // Get the AI configuration as well if available
    const aiProfile = await prisma.aiProfile.findUnique({
      where: { address },
    });

    return NextResponse.json({
      ...deadMansWallet,
      aiEnabled: aiProfile?.isEnabled || false,
      aiPrompt: aiProfile?.prompt || null
    });
  } catch (error) {
    console.error('Error fetching Dead Man\'s Wallet configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Dead Man\'s Wallet configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      address, 
      destinationAddress, 
      checkInPeriod, 
      isConfigured, 
      lastCheckIn, 
      nextCheckInDeadline,
      useAiOption = false,
      beneficiaries = []
    } = body;

    if (!address || (!destinationAddress && beneficiaries.length === 0) || !checkInPeriod) {
      return NextResponse.json(
        { error: 'Address, either destinationAddress or beneficiaries, and checkInPeriod are required' },
        { status: 400 }
      );
    }

    // First, create or update Dead Man's Wallet configuration
    const deadMansWallet = await prisma.deadMansWallet.upsert({
      where: { address },
      update: {
        destinationAddress,
        checkInPeriod,
        isConfigured,
        lastCheckIn: new Date(lastCheckIn),
        nextCheckInDeadline: new Date(nextCheckInDeadline),
        useAiOption,
        updatedAt: new Date()
      },
      create: {
        address,
        destinationAddress,
        checkInPeriod,
        isConfigured,
        lastCheckIn: new Date(lastCheckIn),
        nextCheckInDeadline: new Date(nextCheckInDeadline),
        useAiOption
      },
      include: {
        beneficiaries: true
      }
    });

    // If there are beneficiaries, handle them
    if (beneficiaries && beneficiaries.length > 0) {
      // First, delete all existing beneficiaries
      await prisma.beneficiary.deleteMany({
        where: {
          walletId: deadMansWallet.id
        }
      });

      // Then, create the new ones
      const beneficiaryPromises = beneficiaries.map((beneficiary: Beneficiary) => {
        return prisma.beneficiary.create({
          data: {
            name: beneficiary.name,
            walletAddress: beneficiary.walletAddress,
            relationship: beneficiary.relationship || null,
            sharePercentage: beneficiary.sharePercentage || 100,
            walletId: deadMansWallet.id
          }
        });
      });

      await Promise.all(beneficiaryPromises);
    }

    // Get the updated wallet with beneficiaries
    const updatedWallet = await prisma.deadMansWallet.findUnique({
      where: { id: deadMansWallet.id },
      include: { beneficiaries: true }
    });

    return NextResponse.json(updatedWallet);
  } catch (error) {
    console.error('Error saving Dead Man\'s Wallet configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save Dead Man\'s Wallet configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, lastCheckIn, nextCheckInDeadline } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Update only the check-in time fields
    const deadMansWallet = await prisma.deadMansWallet.update({
      where: { address },
      data: {
        lastCheckIn: new Date(lastCheckIn),
        nextCheckInDeadline: new Date(nextCheckInDeadline),
        updatedAt: new Date()
      },
      include: {
        beneficiaries: true
      }
    });

    return NextResponse.json(deadMansWallet);
  } catch (error) {
    console.error('Error updating Dead Man\'s Wallet check-in:', error);
    return NextResponse.json(
      { error: 'Failed to update Dead Man\'s Wallet check-in' },
      { status: 500 }
    );
  }
}

// Endpoint to manage beneficiaries directly
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const beneficiaryId = searchParams.get('beneficiaryId');

  if (!beneficiaryId) {
    return NextResponse.json({ error: 'Beneficiary ID parameter is required' }, { status: 400 });
  }

  try {
    // Delete the specified beneficiary
    await prisma.beneficiary.delete({
      where: { id: beneficiaryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    return NextResponse.json(
      { error: 'Failed to delete beneficiary' },
      { status: 500 }
    );
  }
} 