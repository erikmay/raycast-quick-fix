import { Clipboard, environment, getPreferenceValues, getSelectedText, showHUD } from "@raycast/api";
import { spawn } from "node:child_process";
import { join } from "node:path";

interface Preferences {
  openRouterApiKey: string;
  openRouterModel?: string;
  providerSlug?: string;
  reasoningEffort?: "automatic" | "minimal" | "low" | "medium" | "high";
}

interface OpenRouterResponse {
  provider?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

const DEFAULT_MODEL = "google/gemini-3.8-flash";
const DEFAULT_PROVIDER_SLUG = "google-ai-studio";

// Raycast's original "fix-spelling-grammar" prompt, extended with
// preservation rules found necessary during the bilingual evaluation.
const PROMPT_TEMPLATE = `Act as a spelling corrector and improver. Reply only with the rewritten text and nothing else.

Strictly follow these rules:
- Correct spelling, grammar and punctuation
- ALWAYS detect and maintain the original language of the given text
- NEVER surround the rewritten text with quotes
- Don't replace urls with markdown links
- Don't change emojis
- Make the smallest possible edits needed for correctness
- Do not paraphrase, formalize, translate, or alter typographic style
- Never replace a correct word or expand a colloquial contraction
- Correct punctuation around direct quotations without changing quote characters
- Preserve meaning, tone, and line breaks
- Treat every URL and emoji as an immutable string
- If the text is already correct, return it unchanged

Text to rewrite:
{selection}

Rewritten text:`;

const SYSTEM_PROMPT = "You are a helpful assistant.";

// With the Raycast window closed (hotkey launch), showToast falls back to a
// static HUD — there is no real spinner API in that state. Fake one by
// redrawing the HUD with rotating frames.
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function startSpinner(title: string): { stop: () => void } {
  let frame = 0;
  let active = true;
  let busy = false;
  const tick = async () => {
    if (!active || busy) return;
    busy = true;
    try {
      const glyph = SPINNER_FRAMES[frame++ % SPINNER_FRAMES.length];
      if (active) await showHUD(`${glyph} ${title}`);
    } finally {
      busy = false;
    }
  };
  void tick();
  const timer = setInterval(tick, 100);
  return {
    stop() {
      active = false;
      clearInterval(timer);
    },
  };
}

// Same fallback Raycast's Quick Fix uses: if nothing is selected, select the
// whole focused field (Cmd+A) and read the selection again.
async function selectAll(): Promise<void> {
  await systemEvents('keystroke "a" using command down');
  await new Promise((r) => setTimeout(r, 120));
}

function systemEvents(command: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("/usr/bin/osascript", ["-e", `tell application "System Events" to ${command}`]);
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`osascript exited with ${code}`)),
    );
  });
}

// Press Return to send the text, for example a chat message. When nothing was
// pasted, the text can still be selected, so first move the cursor to the end
// of the selection. Otherwise Return would replace the text in most editors.
async function submit(collapseSelection: boolean): Promise<void> {
  // Give the app time to insert the pasted text before it receives Return.
  await new Promise((r) => setTimeout(r, 150));
  if (collapseSelection) await systemEvents("key code 124");
  await systemEvents("key code 36");
}

type CapturedText = { text: string; selectionReady?: Promise<void> };

async function readFocusedText(): Promise<{ kind: "selected" | "field"; text: string } | null> {
  return new Promise((resolve) => {
    const child = spawn("/usr/bin/osascript", [
      "-l",
      "JavaScript",
      join(environment.assetsPath, "read-focused-text.js"),
    ], { timeout: 1_500 });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) return resolve(null);
      try {
        const result = JSON.parse(output) as { kind?: string; text?: string };
        if ((result.kind === "selected" || result.kind === "field") && result.text?.trim()) {
          resolve({ kind: result.kind, text: result.text });
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    });
  });
}

async function captureText(): Promise<CapturedText> {
  const focused = await readFocusedText();
  if (focused?.kind === "selected") return { text: focused.text };
  if (focused?.kind === "field") {
    const selectionReady = selectAll();
    selectionReady.catch(() => {});
    return { text: focused.text, selectionReady };
  }

  try {
    const selected = await getSelectedText();
    if (selected.trim()) return { text: selected };
  } catch {
    // fall through to select-all
  }
  await selectAll();
  const selected = await getSelectedText();
  if (!selected.trim()) throw new Error("No text found");
  return { text: selected };
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = /^```(?:[a-z]*)?\s*([\s\S]*?)\n?```$/i.exec(trimmed);
  return (match?.[1] ?? trimmed).trim();
}

function assertPreservedTokens(original: string, fixed: string): void {
  const urls = original.match(/https?:\/\/[^\s)\]]+/g) ?? [];
  const fixedUrls = fixed.match(/https?:\/\/[^\s)\]]+/g) ?? [];
  const emojis = original.match(/\p{Extended_Pictographic}/gu) ?? [];
  const fixedEmojis = fixed.match(/\p{Extended_Pictographic}/gu) ?? [];
  if (JSON.stringify(urls) !== JSON.stringify(fixedUrls)) throw new Error("The model changed a URL");
  if (JSON.stringify(emojis) !== JSON.stringify(fixedEmojis)) throw new Error("The model changed an emoji");
  if (/\[[^\]]+\]\(https?:\/\//.test(fixed)) throw new Error("The model added a Markdown link");
}

async function fixText(prefs: Preferences, text: string): Promise<string> {
  const apiKey = prefs.openRouterApiKey?.trim();
  if (!apiKey) throw new Error("Set your OpenRouter API key in Raycast preferences");
  const model = prefs.openRouterModel?.trim() || DEFAULT_MODEL;
  const providerSlug = prefs.providerSlug?.trim() || DEFAULT_PROVIDER_SLUG;
  if (!/^[a-z0-9-]+$/.test(providerSlug)) throw new Error("Invalid OpenRouter provider slug");

  let reasoningEffort: Exclude<Preferences["reasoningEffort"], "automatic"> | undefined;
  if (!prefs.reasoningEffort || prefs.reasoningEffort === "automatic") {
    reasoningEffort = model === DEFAULT_MODEL ? "minimal" : undefined;
  } else {
    reasoningEffort = prefs.reasoningEffort;
  }

  // Leave room for a correction near the input size plus mandatory hidden reasoning.
  // The provider charges actual output, not this ceiling.
  const maxTokens = Math.min(65_536, Math.max(4_096, Math.ceil(text.length / 2) + 2_048));
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/erikmay/raycast-quick-fix",
      "X-Title": "Raycast Quick Fix",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: PROMPT_TEMPLATE.replace("{selection}", () => text) },
      ],
      max_tokens: maxTokens,
      ...(reasoningEffort ? { reasoning: { effort: reasoningEffort, exclude: true } } : {}),
      provider: {
        only: [providerSlug],
        allow_fallbacks: false,
        require_parameters: true,
        data_collection: "deny",
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  const result = (await response.json()) as OpenRouterResponse;
  if (!response.ok) {
    if (result.error?.message?.includes("No allowed providers are available")) {
      throw new Error(`No route for ${model} via ${providerSlug}. Check OpenRouter provider and privacy settings`);
    }
    throw new Error(result.error?.message ?? `OpenRouter returned HTTP ${response.status}`);
  }
  if (providerSlug === DEFAULT_PROVIDER_SLUG && result.provider !== "Google AI Studio") {
    throw new Error(`Unexpected inference provider: ${result.provider ?? "unknown"}`);
  }
  const choice = result.choices?.[0];
  if (choice?.finish_reason === "length") throw new Error("The model response was truncated");
  if (choice?.finish_reason !== "stop") throw new Error("The model response was incomplete");
  const fixed = stripCodeFences(choice.message?.content ?? "");
  if (!fixed) throw new Error("The model returned an empty response");
  assertPreservedTokens(text, fixed);
  return fixed;
}

export async function quickFix(autoSubmit: boolean) {
  const prefs = getPreferenceValues<Preferences>();
  const spinner = startSpinner("Quick fixing…");

  let captured: CapturedText;
  try {
    captured = await captureText();
  } catch {
    spinner.stop();
    await showHUD("❌ No text found");
    return;
  }

  try {
    const { text, selectionReady } = captured;
    const boundary = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
    if (!boundary?.[2]) throw new Error("No text found");
    const fixedCore = await fixText(prefs, boundary[2]);
    const fixed = `${boundary[1]}${fixedCore}${boundary[3]}`;
    if (selectionReady) await selectionReady;

    spinner.stop();
    if (fixed === text) {
      if (autoSubmit) await submit(true);
      await showHUD("✓ Already correct");
      return;
    }
    await Clipboard.paste(fixed);
    if (autoSubmit) await submit(false);
    await showHUD("✓ Quick fixed");
  } catch (error) {
    spinner.stop();
    const message = error instanceof Error ? error.message : String(error);
    await showHUD(`❌ Quick Fix failed: ${message.slice(0, 120)}`);
  }
}

export default function main() {
  return quickFix(false);
}
