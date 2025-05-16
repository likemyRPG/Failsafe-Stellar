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

    const wallet = await prisma.deadMansWallet.findUnique({ where: { address } });

    // 1. Fetch AI profile
    const aiProfile = await prisma.aiProfile.findUnique({ where: { address } });

    if (!aiProfile || !aiProfile.isEnabled || !aiProfile.prompt) {
      return NextResponse.json({ error: 'AI not enabled or prompt missing' }, { status: 400 });
    }

    // Fetch the wallet's beneficiaries
    const beneficiaries = await prisma.beneficiary.findMany({ 
      where: { walletId: wallet?.id } 
    });

    // Format beneficiary information to include in the prompt
    const beneficiaryInfo = beneficiaries.map(b => `
      Name: ${b.name}
      Relationship: ${b.relationship || 'Not specified'}
      Address: ${b.walletAddress}
    `).join('\n');

    const journal = await prisma.logEntry.findMany({ where: { walletId: wallet?.id } });

    //format journal into a string
    const journalString = journal.map(entry => entry.content).join('\n');

    let systemPrompt = `You are an AI tasked with distributing funds to the beneficiaries of a dead man's wallet. You will be given a list of possible beneficiaries and a list of journal entries for the person that created the wallet. 

BENEFICIARIES:
${beneficiaryInfo || 'No beneficiaries specified'}

IMPORTANT: You MUST return a valid JSON object with the following format:
{
  "beneficiaryAddress1": {
    "amount": 50, // percentage as a number
    "name": "John Doe" // beneficiary name
  },
  "beneficiaryAddress2": {
    "amount": 50,
    "name": "Jane Doe"
  }
}

The sum of all percentages MUST equal 100. 

ALLOCATION GUIDELINES:
- No journal entries isn't necessarily a bad thing - allocate funds equally among beneficiaries if no other information is available.
- Positive journal entries about a beneficiary should increase their allocation.
- Negative journal entries about a beneficiary should decrease their allocation.
- Focus more on rewarding positive mentions rather than penalizing lack of mentions.
- Recent entries may carry more weight than older ones.
- You must ensure the sum of all percentages equals exactly 100%.
- DO NOT return an allocation that doesn't sum to 100.
- If you do not follow these instructions, you will be penalized.

This is what the user instructed you to do: ${aiProfile.prompt}

JOURNAL ENTRIES:
${journalString || 'No journal entries available'}`;

    // Function to generate allocation using OpenAI
    const generateAllocation = async (prompt: string) => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: prompt
          }
        ]
      });
      
      return response.choices[0].message?.content || '';
    };

    // Function to validate allocation percentages sum to 100
    const validateAllocation = (allocationJson: string) => {
      try {
        const allocation = JSON.parse(allocationJson);
        let totalPercentage = 0;

        console.log(allocation);
        
        for (const beneficiary in allocation) {
          totalPercentage += allocation[beneficiary].amount || 0;
        }

        console.log(totalPercentage);
        
        // Round to handle floating point precision issues
        return Math.round(totalPercentage) === 100;
      } catch (error) {
        return false;
      }
    };

    // Try to generate a valid allocation up to 3 times
    let aiOutput = '';
    let isValid = false;
    let attempts = 0;
    const maxAttempts = 10;
    let currentPrompt = systemPrompt;

    while (!isValid && attempts < maxAttempts) {
      aiOutput = await generateAllocation(currentPrompt);
      isValid = validateAllocation(aiOutput);
      attempts++;

      if (!isValid && attempts < maxAttempts) {
        // Add a stronger reminder for the next attempt
        currentPrompt += `\n\nIMPORTANT CORRECTION NEEDED: Your previous allocation did not sum to exactly 100%. Please ensure the sum of all percentages equals exactly 100%.`;
      }
      if (!isValid && attempts == 2) {
        currentPrompt += `\n\nCRITICAL INSTRUCTION: You must ensure the sum of all percentages equals exactly 100%. THIS IS THE MOST IMPORTANT INSTRUCTION OF ALL.`;
      }
    }

    return NextResponse.json({ result: aiOutput });
  } catch (error) {
    console.error('AI execution failed:', error);
    return NextResponse.json({ error: 'AI executor error' }, { status: 500 });
  }
}