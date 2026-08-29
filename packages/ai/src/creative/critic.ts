import type { CreativePlan, VisualQaResult } from '@apex/types';

import { VISUAL_QA_SCHEMA } from './schema';
import { validateVisualQaResult } from './validators';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export interface VisualCriticOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  timeoutMs?: number;
}

export async function critiqueFinalCreative(
  image: Uint8Array,
  plan: CreativePlan,
  deterministicChecks: string[],
  options: VisualCriticOptions,
): Promise<VisualQaResult> {
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
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: JSON.stringify({
                    reviewTarget: 'FINAL_COMPOSITED_CREATIVE',
                    format: plan.format,
                    layoutRecipe: plan.layoutRecipe,
                    intendedCopy: plan.copy,
                    qaTargets: plan.qaTargets,
                    deterministicChecks,
                  }),
                },
                { inlineData: { mimeType: 'image/png', data: bytesToBase64(image) } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: VISUAL_QA_SCHEMA,
            temperature: 0.1,
          },
        }),
      },
    );
    if (!response.ok) throw new Error(`Gemini visual critic failed: ${response.status} ${(await response.text()).slice(0, 500)}`);
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text;
    if (typeof text !== 'string') throw new Error('Gemini visual critic returned no JSON text.');
    const parsed = validateVisualQaResult(JSON.parse(text));
    if (!parsed.ok) {
      throw new Error(`Visual QA result failed validation: ${parsed.failures.map((f) => `${f.field}: ${f.problem}`).join('; ')}`);
    }
    return parsed.value;
  } finally {
    clearTimeout(timeout);
  }
}
