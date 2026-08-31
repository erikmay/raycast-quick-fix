/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Pi CLI Path - Absolute path to the pi binary. */
  "piPath": string,
  /** Model - Model ID for the openai-codex provider (see: pi --list-models). */
  "model": string,
  /** Thinking Level - Lower is faster. 'off' is ideal for spelling/grammar fixes. */
  "thinking": "off" | "minimal" | "low" | "medium",
  /** OpenAI Fast Mode - Sends service_tier=priority with each request, like the Codex fast mode toggle. */
  "fastMode": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `quick-fix` command */
  export type QuickFix = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `quick-fix` command */
  export type QuickFix = {}
}

