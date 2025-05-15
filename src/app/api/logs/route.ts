import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET: Fetch all log entries for a wallet
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  try {
    // First find the wallet by address
    const wallet = await prisma.deadMansWallet.findUnique({
      where: { address }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Then find all log entries for that wallet
    const logEntries = await prisma.logEntry.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(logEntries);
  } catch (error) {
    console.error('Error fetching log entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log entries' },
      { status: 500 }
    );
  }
}

// POST: Create a new log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, content } = body;

    if (!address || !content) {
      return NextResponse.json(
        { error: 'Address and content are required' },
        { status: 400 }
      );
    }

    // Find the wallet by address
    const wallet = await prisma.deadMansWallet.findUnique({
      where: { address }
    });

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Create the log entry
    const logEntry = await prisma.logEntry.create({
      data: {
        content,
        walletId: wallet.id
      }
    });

    return NextResponse.json(logEntry);
  } catch (error) {
    console.error('Error creating log entry:', error);
    return NextResponse.json(
      { error: 'Failed to create log entry' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a log entry
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Log entry ID parameter is required' }, { status: 400 });
  }

  try {
    // Delete the log entry
    await prisma.logEntry.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting log entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete log entry' },
      { status: 500 }
    );
  }
} 