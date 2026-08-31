# Quick Fix (Codex)

Raycast's [Quick Fix](https://manual.raycast.com/new-in-v2) — fix spelling and grammar of the selected text in any app with one hotkey — is paywalled behind Raycast Pro. This extension rebuilds it for free by running inference through your existing ChatGPT subscription instead of Raycast AI.

Select text anywhere (or just focus a text field), hit your hotkey, get the corrected text pasted back in place. Uses the original Raycast prompt, including the select-all fallback behavior.

## Requirements

- [Raycast](https://raycast.com) (free plan is fine)
- [pi](https://github.com/badlogic/pi-mono) CLI, authenticated with the `openai-codex` provider (`pi auth check --provider openai-codex` should print `ready`) — this is what routes requests through your ChatGPT subscription
- [Bun](https://bun.sh) (or npm) to build

## Install

```sh
bun install
bun run dev   # imports the extension into Raycast, Ctrl+C afterwards
```

Then assign a hotkey to "Quick Fix Selected Text" in Raycast Settings → Extensions.

## Adapt to your setup

Everything machine-specific is a Raycast preference (Raycast Settings → Extensions → Quick Fix):

- **Pi CLI Path** — absolute path to your `pi` binary (`which pi`)
- **Model** — any `openai-codex` model from `pi --list-models`
- **Thinking Level** — keep `off` for speed
- **Fast Mode** — sends `service_tier=priority` (via `assets/pi-fast.ts`)

The prompt lives in `src/quick-fix.ts` if you want a different fixing behavior, and swapping pi's `--provider`/`--model` flags there lets you use any other provider pi supports.
