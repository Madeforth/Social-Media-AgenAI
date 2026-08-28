/**
 * Gemini models used by the production runtime.
 *
 * These are fallbacks. An organization can pick its own models in Settings, and
 * `ai_provider_keys.text_model` / `.image_model` take precedence when set.
 *
 * Pinning a specific version is what broke this once already: `gemini-2.5-pro`
 * and `gemini-2.5-flash` were both retired mid-flight with
 * "no longer available to new users". Verify a replacement with a real
 * `generateContent` call before changing these — the ListModels endpoint still
 * advertises models that then fail.
 *
 * Verified working on 2026-08-28 against a free-tier key: 3 of 3 structured
 * output calls parsed.
 */
export const GEMINI_TEXT_MODEL = 'gemini-3.6-flash';
export const GEMINI_FAST_TEXT_MODEL = 'gemini-3.1-flash-lite';

/**
 * Image generation needs a billed key. Every image model returns 429
 * "You exceeded your current quota" on the free tier, so this default is the
 * one to use once billing is enabled rather than one known to work today.
 */
export const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';

export const AI_PROVIDER = 'google' as const;
