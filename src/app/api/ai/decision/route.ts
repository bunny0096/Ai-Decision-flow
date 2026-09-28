import { NextResponse } from 'next/server';
import { evaluateAiDecision } from '@/lib/ai/decide';

export async function POST(req: Request) {
  try {
    const { prompt, input } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const result = await evaluateAiDecision(prompt, input || '');
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Evaluation failed' },
      { status: 500 }
    );
  }
}
