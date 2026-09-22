/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** OpenRouter API Key - Used only for strict Google AI Studio requests through OpenRouter. */
  "openRouterApiKey": string
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

