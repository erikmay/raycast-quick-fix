# Quick Fix benchmark

## 2026-10-30: OpenAI GPT-6 models and priority tiers

A second run used the same prompt, cases, and method for OpenAI's GPT-6 models on the `openai/fast` and `openai/ultrafast` tiers. Gemini 3.8 Flash and GLM 5.3 Flash ran at the same time again for comparison. Claude Opus 5.5 graded these 8 configurations side by side, so the scores are comparable within this table but not exactly with the first table. Sol and Astra require reasoning and ran with `minimal` effort; the other GPT-6 models ran with `none`.

| Config | p50 ms | p90 ms | max ms | Errors | URL/emoji fails | Quality (all) | Quality (voice) | $/1k req |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| glm-5.3-flash @fireworks | 834 | 1323 | 1615 | 0/54 | 0 | 9.0 | 7.8 | 0.04 |
| gpt-6.1-sol @openai/ultrafast | 1225 | 1422 | 1739 | 0/54 | 0 | 9.4 | 8.8 | 6.69 |
| gpt-6-luna @openai/fast | 1289 | 1656 | 2031 | 0/54 | 0 | 8.3 | 6.5 | 0.11 |
| gpt-6-astra @openai/ultrafast | 1366 | 1802 | 2447 | 0/54 | 0 | 9.6 | 9.0 | 33.78 |
| gpt-6.1-terra @openai/fast | 1525 | 1964 | 3272 | 0/54 | 0 | 9.1 | 7.0 | 1.11 |
| gpt-6.1-terra @openai | 1740 | 2472 | 3347 | 0/54 | 0 | 8.9 | 7.8 | 0.56 |
| gpt-6.1-sol @openai/fast | 1786 | 2461 | 2675 | 0/54 | 0 | 9.4 | 8.3 | 2.23 |
| gemini-3.8-flash @ai-studio (current) | 2016 | 2650 | 6458 | 0/54 | 0 | 8.9 | 7.8 | 0.52 |

GPT-6.1 Sol on `openai/ultrafast` is the new default. It matched or beat Gemini 3.8 Flash in quality, had a lower median, and a much smaller tail: its slowest request took 1.7 s against 6.5 s for Gemini. GPT-6 Astra had the best quality but was slower. GLM 5.3 Flash remains the fastest option with good quality.

## 2026-10-30: model comparison with the voice-transcription prompt

The prompt now also cleans up voice transcriptions: it removes filler words and restructures rambling text. This run compared 14 model and provider configurations with that prompt. It used 18 German and English cases, 4 of them unstructured voice transcriptions, and ran each case 3 times. All requests went through OpenRouter with one pinned provider, no fallback, and `data_collection: deny`. Times are full request times from a script, without the Raycast capture and paste steps.

Claude Opus 5.5 graded the first run of each case blind, on a scale of 1 to 10, comparing all candidates side by side. "Quality (voice)" covers only the 4 transcription cases. The quality sample is small (18 outputs per configuration), so differences below about 0.5 points are noise.

| Config | p50 ms | p90 ms | max ms | Errors | URL/emoji fails | Quality (all) | Quality (voice) | $/1k req |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| gpt-oss-120b @groq | 418 | 923 | 1758 | 0/54 | 0 | 7.9 | 6.3 | 0.10 |
| gpt-oss-120b @cerebras | 458 | 989 | 1756 | 0/54 | 0 | 8.2 | 7.0 | 0.23 |
| gemini-3.5-flash-lite @ai-studio | 660 | 1046 | 2142 | 0/54 | 0 | 8.1 | 6.8 | 0.22 |
| gemini-3.1-flash-lite @ai-studio | 700 | 1239 | 1935 | 0/54 | 0 | 8.1 | 7.0 | 0.15 |
| glm-5.3-flash @fireworks | 928 | 1323 | 1758 | 0/54 | 0 | 8.8 | 7.5 | 0.04 |
| gpt-5.4-mini @openai/fast | 994 | 1441 | 2274 | 0/54 | 0 | 8.3 | 7.0 | 0.93 |
| gpt-5.4-nano @openai | 1187 | 1794 | 4030 | 0/54 | 0 | 7.3 | 7.8 | 0.12 |
| claude-haiku-5.5 @anthropic | 1384 | 2558 | 3541 | 0/54 | 0 | 8.0 | 7.0 | 0.09 |
| gemini-3.8-flash @vertex/global | 1707 | 3334 | 8729 | 0/54 | 0 | 9.1 | 8.5 | 0.50 |
| mercury-3 @inception | 1935 | 4790 | 32797 | 0/54 | 1 | 8.0 | 6.3 | 0.36 |
| gemini-3.8-flash @ai-studio/priority | 1936 | 2710 | 5506 | 0/54 | 0 | 9.3 | 9.0 | 0.94 |
| qwen3.8-flash @alibaba | 2008 | 6213 | 7461 | 16/54 | 0 | 7.0 | 4.8 | 0.04 |
| gemini-3.8-flash @ai-studio (current) | 2044 | 2848 | 5633 | 0/54 | 0 | 9.1 | 8.8 | 0.52 |

Mistral Small (`mistral`, `mistral/eu`) returned "Provider returned error" for every request. Gemini 3.8 Flash cannot disable reasoning ("Reasoning is mandatory"). Most of its requests used 0 reasoning tokens at `minimal` effort, but some used up to 400 tokens and took about 5 seconds. Its base latency is about 1.5 to 2 seconds even without reasoning.

Results:

- Gemini 3.8 Flash on Google AI Studio had the best quality in this run, especially for voice transcriptions. The priority tier did not make it meaningfully faster and costs about twice as much.
- GLM 5.3 Flash on Fireworks (`z-ai/glm-5.3-flash`, provider `fireworks`, reasoning effort `low`) is about twice as fast with a much smaller tail (p90 1.3 s, max 1.8 s). It fixes errors well but often keeps filler words in transcriptions. On Together, the same model was slower (p50 1.0 s, max 2.4 s).
- GPT-OSS 120B on Groq or Cerebras is the fastest (p50 about 0.4 s). It made more meaning errors, for example it changed "12.000 Euro" and dropped details in transcriptions.

## 2026-10: first benchmark

The first benchmark used 16 German and English spelling and grammar cases plus four repeated requests. It measured inference from a script, not the full Raycast hotkey-to-paste workflow.

| Configuration | Median response | p95 response | Exact outputs | Errors |
|---|---:|---:|---:|---:|
| Original `pi` with GPT-5.6 Luna | 4,676.8 ms | 5,879.9 ms | 85% | 0 |
| Direct OpenRouter with Gemini 3.8 Flash on Google AI Studio | 1,174.3 ms | 5,649.5 ms | 95% | 0 |

Manual review found no clear grammar error in the Gemini results. Its one non-exact output was an acceptable punctuation variant that preserved meaning, language, informal tone, and the emoji. OpenRouter reported $0.013475 for the 20 Gemini requests.

A separate comparison used the same Codex model with both CLIs. `fx ask` had a 2,739.5 ms warm median versus 4,858.6 ms for `pi`, but a worse warm p95: 8,048.2 ms versus 4,917.9 ms. The extension therefore calls OpenRouter directly.

The sample is small. In particular, one slow request determines p95 for a 20-request run. The focused-field capture change was added later and was not measured end to end. The user reported that the direct model version felt much faster in Raycast before that capture change.

OpenRouter's [routing documentation](https://openrouter.ai/docs/guides/routing/provider-selection) describes the provider pin and disabled fallback. Google says paid Gemini API inputs are not used to improve its products, but limited abuse-monitoring retention can still apply; see its [terms](https://ai.google.dev/gemini-api/terms) and [zero data retention documentation](https://ai.google.dev/gemini-api/docs/zdr). This extension does not claim zero data retention.
