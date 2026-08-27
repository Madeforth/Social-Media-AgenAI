# @apex/ai

Framework-neutral prompt templates and response schemas for the Gemini runtime.

This package intentionally has **no runtime dependencies and no network code**.
It is consumed both by Node/bundler workspaces and by Deno-based Supabase Edge
Functions, so every module here must be plain, portable TypeScript.

All Gemini API calls happen server-side inside Edge Functions. The API key is
read from Supabase secrets and never reaches a client.
