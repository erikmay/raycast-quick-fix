# Quick Fix benchmark

The local benchmark used 16 German and English spelling and grammar cases plus four repeated requests. It measured inference from a script, not the full Raycast hotkey-to-paste workflow.

| Configuration | Median response | p95 response | Exact outputs | Errors |
|---|---:|---:|---:|---:|
| Original `pi` with GPT-5.6 Luna | 4,676.8 ms | 5,879.9 ms | 85% | 0 |
| Direct OpenRouter with Gemini 3.8 Flash on Google AI Studio | 1,174.3 ms | 5,649.5 ms | 95% | 0 |

Manual review found no clear grammar error in the Gemini results. Its one non-exact output was an acceptable punctuation variant that preserved meaning, language, informal tone, and the emoji. OpenRouter reported $0.013475 for the 20 Gemini requests.

A separate comparison used the same Codex model with both CLIs. `fx ask` had a 2,739.5 ms warm median versus 4,858.6 ms for `pi`, but a worse warm p95: 8,048.2 ms versus 4,917.9 ms. The extension therefore calls OpenRouter directly.

The sample is small. In particular, one slow request determines p95 for a 20-request run. The focused-field capture change was added later and was not measured end to end. The user reported that the direct model version felt much faster in Raycast before that capture change.

OpenRouter's [routing documentation](https://openrouter.ai/docs/guides/routing/provider-selection) describes the provider pin and disabled fallback. Google says paid Gemini API inputs are not used to improve its products, but limited abuse-monitoring retention can still apply; see its [terms](https://ai.google.dev/gemini-api/terms) and [zero data retention documentation](https://ai.google.dev/gemini-api/docs/zdr). This extension does not claim zero data retention.
