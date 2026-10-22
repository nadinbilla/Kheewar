import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { isLiveKitConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isLiveKitConfigured) {
    return NextResponse.json({ error: "LiveKit belum dikonfigurasi di environment variables." }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Silakan masuk terlebih dahulu untuk menggunakan voice chat." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const roomName = typeof body.roomName === "string" ? body.roomName.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) : "kalamverse-lobby";
    if (!roomName) return NextResponse.json({ error: "Nama ruang tidak valid." }, { status: 400 });

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!apiKey || !apiSecret || !serverUrl) return NextResponse.json({ error: "Konfigurasi LiveKit tidak lengkap." }, { status: 503 });

    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: String(user.user_metadata?.display_name || user.email?.split("@")[0] || "Pembelajar").slice(0, 64),
      ttl: "1h",
    });
    token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true });
    return NextResponse.json({ token: await token.toJwt(), serverUrl });
  } catch (error) {
    console.error("LiveKit token error:", error);
    return NextResponse.json({ error: "Tidak dapat menyiapkan voice room. Periksa konfigurasi server." }, { status: 500 });
  }
}
