// OpenRouter TTS model listing.
//
// Synthesis itself is NOT handled here — openrouter is deliberately absent
// from ttsProviders/index.js's SPECIAL_ADAPTERS, so it goes through the
// generic synthesizeViaConfig() dispatcher using ttsConfig.format: "openai"
// (see providers/registry/openrouter.js). That dispatcher POSTs directly to
// OpenRouter's OpenAI-compatible /v1/audio/speech endpoint, which is what
// deepgram/aura-2, hexgrad/kokoro-82m, microsoft/mai-voice-2, etc. actually
// live behind. An earlier version of this file routed everything through
// /v1/chat/completions with modalities:["text","audio"] instead — that only
// works for OpenRouter's audio-native chat models (openai/gpt-audio and
// friends), not its dedicated TTS catalog, which OpenRouter itself rejects
// with "is a text-to-speech model and cannot be used with the chat/completions
// endpoint" when sent that way.
//
// This file now only supplies the live model list for the TTS setup UI's
// "fetch available models" action (GET /api/media-providers/tts/voices),
// mirroring fetchGeminiVoices's shape.
export async function fetchOpenRouterTtsModels(apiKey) {
  if (!apiKey) return [];
  const res = await fetch("https://openrouter.ai/api/v1/models?output_modalities=speech", {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  if (!res.ok) return [];
  const { data } = await res.json().catch(() => ({ data: [] }));
  return (data || []).map((m) => ({
    voice_id: m.id,
    name: m.name || m.id,
    // OpenRouter's speech models don't carry per-language voice metadata the
    // way Gemini's prebuilt voice list does — leave these blank rather than
    // guess.
    labels: { language: "", gender: "" },
  }));
}
