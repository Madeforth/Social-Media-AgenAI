# API Contracts — Conceptual

## POST /generate-post

Input:

- brand_id
- mode: ai_suggestion | custom_brief
- custom_brief optional
- desired_publish_date optional

Output:

- post_id
- status
- proposal object
- image_generation_pending boolean

## POST /posts/:id/regenerate

Input:

- instruction optional
- preserve_copy boolean optional
- preserve_visual boolean optional

Output:

- new_version_id
- status

## POST /posts/:id/approve

Input:

- scheduled_at optional

Output:

- status
- publication_job_id optional

## POST /posts/:id/schedule

Input:

- scheduled_at
- social_account_id

Output:

- publication_job_id
- status

## Server-side only

External Gemini and Meta calls must never be made directly from the mobile/web clients with secret credentials.
