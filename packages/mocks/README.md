# @apex/mocks

Temporary fixtures so the web and mobile shells can be built and reviewed before
Supabase is provisioned. Both apps import from here so the two surfaces cannot
drift apart while the backend is missing.

Two rules keep this honest:

1. **Every timestamp is derived from `MOCK_NOW`, never from `Date.now()`.** The
   fixtures are deterministic, so server and client render identically and
   screenshots are stable.
2. **No fabricated performance metrics.** Impressions, reach and engagement are
   real numbers that only Instagram can supply, so screens that would show them
   render an empty state instead. Post counts shown on the dashboard are counted
   from the fixtures themselves, so nothing is invented on top of them.

Delete this package once the app reads from Supabase.
