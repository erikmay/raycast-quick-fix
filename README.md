# Quick Fix (OpenRouter)

Raycast's [Quick Fix](https://manual.raycast.com/new-in-v2) fixes spelling and grammar in selected text with one hotkey. This extension provides the same workflow through a model and provider you choose on OpenRouter. The default is Gemini 3.8 Flash on Google AI Studio.

Select text anywhere (or focus an editable text field), then press your hotkey. The corrected text replaces the selection. For a focused field, the command reads its text through macOS accessibility and starts selecting it while the model runs. Apps that do not expose the field use Raycast's selected-text API.

## Requirements

- [Raycast](https://raycast.com) on macOS (free plan is fine)
- An [OpenRouter](https://openrouter.ai/) API key with credits
- [Bun](https://bun.sh) to install and build

## Install

```sh
git clone https://github.com/erikmay/raycast-quick-fix.git
cd raycast-quick-fix
bun install
bun run dev   # imports the extension into Raycast, Ctrl+C afterwards
```

Enter your OpenRouter API key in the extension's password preference. The model, provider, and reasoning effort are optional and use the defaults below when left blank. Assign a hotkey to "Quick Fix Selected Text" in Raycast Settings → Extensions. "Quick Fix and Submit" does the same and then presses Return to send the text, for example a chat message. Some apps insert a line break instead. Do not put the key in source files; Raycast does not read a project `.env` at runtime.

## Choose a model

Change these extension preferences in Raycast Settings → Extensions → Quick Fix:

| Preference | Default | Purpose |
|---|---|---|
| Model | `google/gemini-3.8-flash` | OpenRouter model ID from the [model catalog](https://openrouter.ai/models). |
| Provider Slug | `google-ai-studio` | The only provider allowed to process text. Find a compatible slug on the model's Providers page or in the [provider catalog](https://openrouter.ai/providers). |
| Reasoning Effort | Automatic | Uses minimal effort for the default Gemini model; leaves reasoning to the model for other models. Override it if the selected model supports an effort setting. |

Set both the model and a provider that serves it. For example, `openai/gpt-5.4-nano` works with the `openai` provider slug. An incompatible pair fails with an OpenRouter error; the extension does not route to another provider. Model availability, price, and data handling depend on your choices.

The fast focused-field path may require macOS to allow Raycast to control System Events. If that path is unavailable, the command uses Raycast's selection API. Some apps do not expose editable field text or allow replacement through the fallback.

Requests allow only the selected provider, disable provider fallback, and exclude routes marked as collecting data for training. The default Google AI Studio route also checks the provider named in the response. The command rejects responses that change URLs or emojis, add Markdown links, or stop before completion. If the selected provider is unavailable for your account or region, the request fails instead of using another host.

See [benchmark results](BENCHMARK.md) for the default model's speed and quality comparison. Selected text passes through OpenRouter and your selected provider. Review that provider's data handling terms before using the command with sensitive text. For the default, see [Google's terms](https://ai.google.dev/gemini-api/terms).
