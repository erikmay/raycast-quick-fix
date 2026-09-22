/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** OpenRouter API Key - Used to send text to your selected model and provider through OpenRouter. */
  "openRouterApiKey": string,
  /** Model - OpenRouter model ID, such as google/gemini-3.8-flash. Check openrouter.ai/models for available IDs. */
  "model": string,
  /** Provider Slug - Allow only this OpenRouter provider. Find its slug on the model's Providers page; requests fail if it cannot serve the model. */
  "providerSlug": string,
  /** Reasoning Effort - Automatic keeps minimal reasoning for the default Gemini model and uses the model's default otherwise. */
  "reasoningEffort": "automatic" | "minimal" | "low" | "medium" | "high"
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

