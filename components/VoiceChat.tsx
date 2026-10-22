"use client";

import { LiveKitRoom, RoomAudioRenderer, StartAudio, useLocalParticipant } from "@livekit/components-react";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { isLiveKitClientConfigured } from "@/lib/config";

function VoiceControls({ onLeave }: { onLeave: () => void }) {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const [busy, setBusy] = useState(false);
  async function toggleMic() {
    setBusy(true);
    try { await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled); }
    finally { setBusy(false); }
  }
  return <div className="voice-controls"><span className="voice-connected"><span /> Audio terhubung</span><button type="button" className={`voice-control ${isMicrophoneEnabled ? "voice-control-on" : ""}`} onClick={toggleMic} disabled={busy} aria-label={isMicrophoneEnabled ? "Matikan mikrofon" : "Nyalakan mikrofon"}>{isMicrophoneEnabled ? <Mic size={17} /> : <MicOff size={17} />}{isMicrophoneEnabled ? "Mikrofon aktif" : "Mikrofon mati"}</button><button type="button" className="voice-control voice-leave" onClick={onLeave}><PhoneOff size={17} /> Akhiri</button></div>;
}

export default function VoiceChat({ roomName, onClose }: { roomName: string; onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function connect() {
      if (!isLiveKitClientConfigured) { setError("Voice chat belum aktif. Tambahkan konfigurasi LiveKit di environment variables untuk mengaktifkan audio antarpengguna."); setLoading(false); return; }
      try {
        const response = await fetch("/api/livekit/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomName }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Tidak dapat membuat token voice room.");
        if (!cancelled) { setToken(data.token); setServerUrl(data.serverUrl); }
      } catch (err) { if (!cancelled) setError(err instanceof Error ? err.message : "Gagal menghubungkan audio."); }
      finally { if (!cancelled) setLoading(false); }
    }
    void connect();
    return () => { cancelled = true; };
  }, [roomName]);

  return <div className="voice-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="voice-modal" role="dialog" aria-modal="true" aria-labelledby="voice-title"><div className="voice-modal-icon"><Volume2 size={23} /></div><h2 id="voice-title">Ruang suara</h2><p className="voice-modal-subtitle">{roomName} · Percakapan langsung dengan pengguna di ruang yang sama.</p>{loading && <div className="voice-loading"><span className="spinner" /> Menyiapkan koneksi suara...</div>}{error && <div className="form-error voice-error">{error}</div>}{token && serverUrl && <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video={false} onDisconnected={onClose}><RoomAudioRenderer /><StartAudio label="Aktifkan audio" /><VoiceControls onLeave={onClose} /></LiveKitRoom>}<button type="button" className="button button-quiet voice-close" onClick={onClose}>Tutup</button></section></div>;
}
