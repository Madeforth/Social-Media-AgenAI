import type { CreativePlan, CreativeRequest } from '@apex/types';

import { reapplyLockedCopy, validatePlanPolicy } from './gates';
import { CREATIVE_PLAN_SCHEMA } from './schema';
import { validateCreativePlan } from './validators';

export interface GeminiDirectorOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  brandContext: unknown;
  timeoutMs?: number;
}

export async function createCreativePlan(
  request: CreativeRequest,
  options: GeminiDirectorOptions,
): Promise<CreativePlan> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent?key=${encodeURIComponent(options.apiKey)}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify({ request, brandContext: options.brandContext }) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: CREATIVE_PLAN_SCHEMA,
            temperature: 0.45,
          },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini creative director failed: ${response.status} ${(await response.text()).slice(0, 500)}`);
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text;
    if (typeof text !== 'string') throw new Error('Gemini creative director returned no JSON text.');

    const parsed = validateCreativePlan(JSON.parse(text));
    if (!parsed.ok) {
      throw new Error(`Creative plan failed validation: ${parsed.failures.map((f) => `${f.field}: ${f.problem}`).join('; ')}`);
    }

    // Prompt obedience is not a security boundary: exact user copy is restored in code.
    const locked = reapplyLockedCopy(parsed.value, request);
    const gate = validatePlanPolicy(locked, request);
    if (!gate.ok) throw new Error(`Creative plan policy failed: ${gate.failures.join('; ')}`);
    return locked;
  } finally {
    clearTimeout(timeout);
  }
}
