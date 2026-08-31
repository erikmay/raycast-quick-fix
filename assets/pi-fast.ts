// pi extension: always request OpenAI Codex "fast mode" (service_tier: priority).
// Loaded by the Raycast command via `pi -e <this file>`.
export default function fast(pi: any) {
  pi.on("before_provider_request", (event: any, ctx: any) => {
    const model = ctx.model;
    if (model?.provider !== "openai-codex") return undefined;
    const payload = event.payload;
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return undefined;
    if (payload.model !== model.id) return undefined;
    if ("service_tier" in payload) return undefined;
    return { ...payload, service_tier: "priority" };
  });
}
