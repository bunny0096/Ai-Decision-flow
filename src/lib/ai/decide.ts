import OpenAI from 'openai';
import { DecisionResult } from '@/types/workflow';

export interface DecisionEvaluationResult {
  decision: DecisionResult;
  reasoning: string;
  source: 'openai' | 'simulator';
  modelUsed: string;
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Intelligent fallback simulator when no OpenAI API key is supplied or when offline.
 * Analyzes semantic intent, positive/negative indicators, and context.
 */
function simulateDecision(prompt: string, input: string): DecisionEvaluationResult {
  const pLower = prompt.toLowerCase();
  const iLower = input.toLowerCase();

  let decision: DecisionResult = 'NO';
  let reasoning = '';

  // 1. Urgency / critical check
  if (pLower.includes('urgent') || pLower.includes('critical') || pLower.includes('emergency') || pLower.includes('high priority')) {
    const isUrgent =
      iLower.includes('down') ||
      iLower.includes('outage') ||
      iLower.includes('critical') ||
      iLower.includes('broken') ||
      iLower.includes('crash') ||
      iLower.includes('asap') ||
      iLower.includes('error 500') ||
      iLower.includes('production') ||
      iLower.includes('emergency') ||
      iLower.includes('security');

    decision = isUrgent ? 'YES' : 'NO';
    reasoning = isUrgent
      ? `The input contains high-severity signals (${iLower.includes('down') ? 'outage' : 'urgent terms'}) indicating critical urgency.`
      : 'The input does not mention downtime, system crashes, or emergency signals.';
  }
  // 2. Enterprise / budget / tier check
  else if (pLower.includes('enterprise') || pLower.includes('budget') || pLower.includes('vip') || pLower.includes('paying') || pLower.includes('tier')) {
    const isEnterprise =
      iLower.includes('enterprise') ||
      iLower.includes('fortune') ||
      iLower.includes('team of 100') ||
      iLower.includes('team of 50') ||
      iLower.includes('custom contract') ||
      iLower.includes('sla') ||
      iLower.includes('$50') ||
      iLower.includes('$100') ||
      iLower.includes('annual') ||
      iLower.includes('procurement');

    decision = isEnterprise ? 'YES' : 'NO';
    reasoning = isEnterprise
      ? 'The inquiry references enterprise requirements, procurement, or high-tier budget keywords.'
      : 'The inquiry appears to be standard or individual user scope without enterprise procurement signals.';
  }
  // 3. Technical support / bug vs sales check
  else if (pLower.includes('support') || pLower.includes('bug') || pLower.includes('technical') || pLower.includes('error')) {
    const isSupport =
      iLower.includes('error') ||
      iLower.includes('issue') ||
      iLower.includes('bug') ||
      iLower.includes('fix') ||
      iLower.includes('failed') ||
      iLower.includes('broken') ||
      iLower.includes('not working') ||
      iLower.includes('help');

    decision = isSupport ? 'YES' : 'NO';
    reasoning = isSupport
      ? 'The message reports technical failure or unexpected behavior requiring engineering support.'
      : 'The message does not contain technical bug descriptions or error reports.';
  }
  // 4. Content moderation / toxic / spam check
  else if (pLower.includes('spam') || pLower.includes('toxic') || pLower.includes('offensive') || pLower.includes('moderation')) {
    const isSpam =
      iLower.includes('casino') ||
      iLower.includes('free money') ||
      iLower.includes('viagra') ||
      iLower.includes('crypto giveaway') ||
      iLower.includes('hate') ||
      iLower.includes('stupid') ||
      iLower.includes('scam') ||
      iLower.includes('http://bit.ly');

    decision = isSpam ? 'YES' : 'NO';
    reasoning = isSpam
      ? 'Content flagged for containing spam patterns or toxic markers.'
      : 'Content conforms to standard safety guidelines without spam or toxic keywords.';
  }
  // 5. General fallback: look for positive vs negative confirmation in input
  else {
    const affirmativeKeywords = ['yes', 'definitely', 'urgent', 'high', 'tier 1', 'enterprise', 'vip', 'need', 'important'];
    const matched = affirmativeKeywords.some((w) => iLower.includes(w) || pLower.includes(w));
    decision = matched ? 'YES' : 'NO';
    reasoning = matched
      ? `Evaluation of prompt "${prompt.slice(0, 40)}..." against input correlated positively with affirmative keywords.`
      : `Evaluation of prompt "${prompt.slice(0, 40)}..." did not find affirmative criteria in input.`;
  }

  return {
    decision,
    reasoning,
    source: 'simulator',
    modelUsed: 'heuristic-evaluator-v1',
  };
}

export async function evaluateAiDecision(
  prompt: string,
  input: string
): Promise<DecisionEvaluationResult> {
  const client = getOpenAIClient();

  if (!client) {
    return simulateDecision(prompt, input);
  }

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an AI binary decision engine in an automated workflow.
You are evaluating an input context against a specific decision question.
You MUST decide either "YES" or "NO".
Your response MUST be strict JSON in this exact format:
{
  "decision": "YES" | "NO",
  "reasoning": "A concise 1-2 sentence explanation of why this decision was reached."
}`,
        },
        {
          role: 'user',
          content: `DECISION QUESTION / PROMPT:
${prompt}

WORKFLOW INPUT CONTEXT:
${input}

Analyze and respond with JSON. Only return "YES" or "NO" for "decision".`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content);
    const rawDecision = String(parsed.decision).trim().toUpperCase();
    const decision: DecisionResult = rawDecision === 'YES' ? 'YES' : 'NO';
    const reasoning = String(parsed.reasoning || 'Evaluated by OpenAI');

    return {
      decision,
      reasoning,
      source: 'openai',
      modelUsed: response.model || 'gpt-4o-mini',
    };
  } catch (error) {
    console.warn('OpenAI evaluation failed or returned error, falling back to simulator:', error);
    const fallback = simulateDecision(prompt, input);
    return {
      ...fallback,
      reasoning: `(OpenAI fallback: ${error instanceof Error ? error.message : 'API error'}) ${fallback.reasoning}`,
    };
  }
}
