import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Cloud speech synthesis. The provider lives behind this single server
 * function, so swapping speech vendors later means changing this file only.
 */
export const synthesizeSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; voice: string }) => {
    const text = input.text?.slice(0, 4000) ?? "";
    if (!text.trim()) throw new Error("Nothing to read aloud.");
    return { text, voice: input.voice || "alloy" };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Speech is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: data.voice,
        response_format: "mp3",
        stream_format: "audio",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Voice service is busy — try again in a moment.");
      if (res.status === 402)
        throw new Error("Cloud voices need more AI credits on this workspace.");
      throw new Error(`Voice service error (${res.status}). ${detail.slice(0, 200)}`);
    }

    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return { audio: btoa(binary), mime: "audio/mpeg" };
  });
