import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate event structure (customize this for your actual Soroban event structure)
    const events = body?.events;
    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid event format' }, { status: 400 });
    }

    // Filter for finalize or aiSig events
    const relevantEvents = events.filter(
      (event: any) =>
        event.topic === 'finalize' || event.topic === 'aiSig'
    );

    if (relevantEvents.length === 0) {
      return NextResponse.json({ message: 'No relevant events to process' });
    }

    // Trigger AI executor for each finalized address
    const results = await Promise.all(
      relevantEvents.map(async (event: any) => {
        const address = event.user || event.address || event.data?.address;
        if (!address) return { success: false, error: 'Missing address in event' };

        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ai/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });

        const result = await res.json();
        return { address, ...result };
      })
    );

    return NextResponse.json({ processed: results });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}