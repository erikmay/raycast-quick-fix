function run() {
  try {
    const systemEvents = Application("System Events");
    const process = systemEvents.applicationProcesses.whose({ frontmost: true })[0];
    if (process.bundleIdentifier() === "com.raycast.macos") {
      return JSON.stringify({ kind: "unavailable" });
    }
    const focused = process.attributes.byName("AXFocusedUIElement").value();
    const role = focused.attributes.byName("AXRole").value();
    if (role === "AXSecureTextField") {
      return JSON.stringify({ kind: "unavailable" });
    }
    if (role === "AXTextField") {
      try {
        if (focused.attributes.byName("AXSubrole").value() === "AXSecureTextField") {
          return JSON.stringify({ kind: "unavailable" });
        }
      } catch {
        // Most text fields do not expose a subrole.
      }
    }

    try {
      const selected = focused.attributes.byName("AXSelectedText").value();
      if (typeof selected === "string" && selected.trim()) {
        return JSON.stringify({ kind: "selected", text: selected });
      }
    } catch {
      // The focused app does not expose selected text.
    }

    const valueAttribute = focused.attributes.byName("AXValue");
    if (valueAttribute.settable()) {
      const value = valueAttribute.value();
      if (typeof value === "string" && value.trim()) {
        return JSON.stringify({ kind: "field", text: value });
      }
    }
  } catch {
    // Raycast's selection API handles apps without a readable focused field.
  }

  return JSON.stringify({ kind: "unavailable" });
}
