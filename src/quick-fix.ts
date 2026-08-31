import {
  Clipboard,
  environment,
  getPreferenceValues,
  getSelectedText,
  showHUD,
} from "@raycast/api";
import { spawn, type ChildProcess } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface Preferences {
  piPath: string;
  model: string;
  thinking: string;
  fastMode: boolean;
}

// Raycast's original "fix-spelling-grammar" prompt template, extracted verbatim
// from the app bundle (register-ai-service-*.js). Sent as the user message with
// a plain system prompt, matching the original's behavior.
const PROMPT_TEMPLATE = `Act as a spelling corrector and improver. Reply only with the rewritten text and nothing else.

Strictly follow these rules:
- Correct spelling, grammar and punctuation
- ALWAYS detect and maintain the original language of the given text
- NEVER surround the rewritten text with quotes
- Don't replace urls with markdown links
- Don't change emojis

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
  await new Promise<void>((resolve, reject) => {
    const child = spawn("/usr/bin/osascript", [
      "-e",
      'tell application "System Events" to keystroke "a" using command down',
    ]);
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`osascript exited with ${code}`)),
    );
  });
  await new Promise((r) => setTimeout(r, 120));
}

async function captureText(): Promise<string> {
  try {
    const selected = await getSelectedText();
    if (selected.trim()) return selected;
  } catch {
    // fall through to select-all
  }
  await selectAll();
  const selected = await getSelectedText();
  if (!selected.trim()) throw new Error("No text found");
  return selected;
}

// Raycast strips accidental markdown code fences from the model output.
function stripCodeFences(text: string): string {
  const match = /^```(?:[a-z]*)?\s*([\s\S]*?)\n?```$/i.exec(text.trim());
  return match?.[1] !== undefined ? match[1].trim() : text.trim();
}

// Spawn pi immediately so its startup overlaps with reading the selection;
// the prompt is streamed to stdin once the text is available.
function startPi(prefs: Preferences): { child: ChildProcess; result: Promise<string> } {
  const child = spawn(
    prefs.piPath,
    [
      "--offline",
      "--provider",
      "openai-codex",
      "--model",
      prefs.model,
      "--thinking",
      prefs.thinking,
      "-p",
      "--no-session",
      "--no-tools",
      "--no-extensions",
      // --no-extensions disables discovery only; explicit -e paths still load
      ...(prefs.fastMode ? ["-e", join(environment.assetsPath, "pi-fast.ts")] : []),
      "--no-skills",
      "--no-context-files",
      "--no-prompt-templates",
      "--no-themes",
      "--system-prompt",
      SYSTEM_PROMPT,
    ],
    { stdio: ["pipe", "pipe", "pipe"], timeout: 45_000, cwd: tmpdir() },
  );
  const result = new Promise<string>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`pi exited with ${code}: ${stderr.slice(-300)}`));
    });
  });
  result.catch(() => {}); // avoid unhandled rejection if capture fails first
  return { child, result };
}

export default async function main() {
  const prefs = getPreferenceValues<Preferences>();

  const spinner = startSpinner("Quick fixing…");
  const pi = startPi(prefs);

  let text: string;
  try {
    text = await captureText();
  } catch {
    pi.child.kill();
    spinner.stop();
    await showHUD("❌ No text found");
    return;
  }

  // replace with a function, like Raycast does, so "$" in the text
  // isn't treated as a replacement pattern
  pi.child.stdin?.end(PROMPT_TEMPLATE.replace("{selection}", () => text));

  try {
    const fixed = stripCodeFences(await pi.result);
    if (!fixed) throw new Error("pi returned an empty response");

    spinner.stop();
    await Clipboard.paste(fixed);
    await showHUD(fixed === text.trim() ? "✓ Already correct" : "✓ Quick fixed");
  } catch (error) {
    spinner.stop();
    const message = error instanceof Error ? error.message : String(error);
    await showHUD(`❌ Quick Fix failed: ${message.slice(0, 120)}`);
  }
}
