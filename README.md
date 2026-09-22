# Quick Fix (Gemini)

Raycast's [Quick Fix](https://manual.raycast.com/new-in-v2) fixes spelling and grammar in selected text with one hotkey. This extension provides the same workflow through Gemini 3.8 Flash on OpenRouter.

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

Enter your OpenRouter API key in the extension's password preference. Assign a hotkey to "Quick Fix Selected Text" in Raycast Settings → Extensions. Do not put the key in source files; Raycast does not read a project `.env` at runtime.

The fast focused-field path may require macOS to allow Raycast to control System Events. If that path is unavailable, the command uses Raycast's selection API. Some apps do not expose editable field text or allow replacement through the fallback.

Requests pin the `google-ai-studio` provider, disable provider fallback, reject data-collecting routes, and verify the provider returned by OpenRouter. The command rejects responses that change URLs or emojis, add Markdown links, or stop before completion. If Google AI Studio is unavailable for your account or region, the request fails instead of using another host.

See [benchmark results](BENCHMARK.md) for the speed and quality comparison. Selected text passes through OpenRouter and Google; review their [data handling terms](https://ai.google.dev/gemini-api/terms) before using the command with sensitive text.
