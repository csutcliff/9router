export default {
  id: "openrouter",
  priority: 10,
  hasFree: true,
  alias: "openrouter",
  display: {
    name: "OpenRouter",
    icon: "router",
    color: "#F97316",
    textIcon: "OR",
    website: "https://openrouter.ai",
    notice: {
      text: "Free tier: 27+ free models, no credit card needed, 200 req/day. After  0 credit: 1,000 req/day.",
      apiKeyUrl: "https://openrouter.ai/settings/keys",
    },
  },
  category: "freeTier",
  authType: "apikey",
  authModes: ["apikey"],
  transport: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    thinkingFormat: "openai",
    headers: {
      "HTTP-Referer": "https://endpoint-proxy.local",
      "X-Title": "Endpoint Proxy",
    },
  },
  models: [
    { id: "openai/text-embedding-3-large", name: "OpenAI Text Embedding 3 Large", kind: "embedding" },
    { id: "openai/text-embedding-3-small", name: "OpenAI Text Embedding 3 Small", kind: "embedding" },
    { id: "openai/text-embedding-ada-002", name: "OpenAI Text Embedding Ada 002", kind: "embedding" },
    { id: "qwen/qwen3-embedding-8b", name: "Qwen3 Embedding 8B", kind: "embedding" },
    { id: "perplexity/pplx-embed-v1-4b", name: "Perplexity Embed V1 4B", kind: "embedding" },
    { id: "perplexity/pplx-embed-v1-0.6b", name: "Perplexity Embed V1 0.6B", kind: "embedding" },
    { id: "nvidia/llama-nemotron-embed-vl-1b-v2:free", name: "NVIDIA Nemotron Embed VL 1B V2 (Free)", kind: "embedding" },
    // OpenRouter's dedicated TTS catalog lives behind /api/v1/audio/speech,
    // not chat completions — these are real, verified-working model ids there.
    { id: "deepgram/aura-2", name: "Deepgram Aura-2 (via OpenRouter)", kind: "tts" },
    { id: "hexgrad/kokoro-82m", name: "Kokoro 82M (via OpenRouter)", kind: "tts" },
    { id: "microsoft/mai-voice-2-flash", name: "MAI Voice 2 Flash (via OpenRouter)", kind: "tts" },
    { id: "microsoft/mai-voice-2", name: "MAI Voice 2 (via OpenRouter)", kind: "tts" },
    { id: "google/gemini-3.1-flash-tts-preview", name: "Gemini 3.1 Flash TTS (via OpenRouter)", kind: "tts" },
    { id: "openai/whisper-1", name: "Whisper 1 (via OpenRouter)", params: ["language"], kind: "stt" },
    { id: "openai/gpt-4o-mini-transcribe", name: "GPT-4o Mini Transcribe (via OpenRouter)", params: ["language"], kind: "stt" },
    { id: "deepgram/nova-3", name: "Deepgram Nova-3 (via OpenRouter)", params: ["language"], kind: "stt" },
    { id: "openai/dall-e-3", name: "DALL-E 3 (via OpenRouter)", params: ["size","quality","style","response_format"], kind: "image" },
    { id: "openai/gpt-image-1", name: "GPT Image 1 (via OpenRouter)", params: ["n","size","quality","response_format"], kind: "image" },
    { id: "google/imagen-3.0-generate-002", name: "Imagen 3 (via OpenRouter)", params: ["n","size"], kind: "image" },
    { id: "black-forest-labs/FLUX.1-schnell", name: "FLUX.1 Schnell (via OpenRouter)", params: ["n","size"], kind: "image" },
    { id: "google/veo-3.1", name: "Veo 3.1 (via OpenRouter)", params: ["duration","aspect_ratio","resolution"], kind: "video" },
    { id: "openai/sora-2-pro", name: "Sora 2 Pro (via OpenRouter)", params: ["duration","aspect_ratio","resolution"], kind: "video" },
    { id: "bytedance/seedance-2.0", name: "Seedance 2.0 (via OpenRouter)", params: ["duration","aspect_ratio","resolution"], kind: "video" },
    { id: "typesafe/jev-1.13", name: "Jev 1.13", kind: "systemone" },
  ],
  serviceKinds: ["llm","embedding","tts","stt","image","imageToText","video","systemone"],
  // System One decision API (TypeSafe-compatible): https://openrouter.ai/docs/guides/community/typesafe-sdk
  systemoneConfig: {
    baseUrl: "https://openrouter.ai/api/v1/systemone",
    headers: {"HTTP-Referer":"https://endpoint-proxy.local","X-Title":"Endpoint Proxy"},
  },
  // OpenRouter's TTS/STT catalog (deepgram/aura-2, hexgrad/kokoro-82m, whisper-1,
  // etc.) lives behind the dedicated /api/v1/audio/speech and
  // /api/v1/audio/transcriptions REST endpoints — the same OpenAI-compatible
  // shape as api.openai.com, not the chat/completions + modalities:["audio"]
  // mechanism (that mechanism is a separate thing, only for audio-native chat
  // models like openai/gpt-audio; OpenRouter itself 400s if you send a
  // TTS-catalog model id to chat/completions). Route both through the generic
  // "openai" format handler, same as the openai provider itself does.
  ttsConfig: {
    baseUrl: "https://openrouter.ai/api/v1/audio/speech",
    authType: "apikey",
    authHeader: "bearer",
    format: "openai",
    defaultModel: "deepgram/aura-2",
  },
  sttConfig: {
    baseUrl: "https://openrouter.ai/api/v1/audio/transcriptions",
    authType: "apikey",
    authHeader: "bearer",
    format: "openai",
  },
  embeddingConfig: {
    baseUrl: "https://openrouter.ai/api/v1/embeddings",
    authType: "apikey",
    authHeader: "bearer",
    headers: {"HTTP-Referer":"https://endpoint-proxy.local","X-Title":"Endpoint Proxy"},
  },
  imageConfig: {
    baseUrl: "https://openrouter.ai/api/v1/images/generations",
    headers: {"HTTP-Referer":"https://endpoint-proxy.local","X-Title":"Endpoint Proxy"},
  },
  // Async video jobs (POST /videos → { id, status }, GET /videos/{id} polls).
  // Docs: https://openrouter.ai/docs/api/api-reference/videos
  videoConfig: {
    baseUrl: "https://openrouter.ai/api/v1/videos",
    headers: {"HTTP-Referer":"https://endpoint-proxy.local","X-Title":"Endpoint Proxy"},
  },
  // "openrouter-all" surfaces the full chat-model catalog (not just the free
  // subset "openrouter-free" filters to — that one's kept as-is since other
  // providers with an identically-shaped /models response, e.g. kilocode,
  // reuse it for their own free-tier listing).
  modelsFetcher: { url: "https://openrouter.ai/api/v1/models", type: "openrouter-all" },
  passthroughModels: true,
};
