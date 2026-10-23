"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import {
  ArrowRight, AudioLines, BookOpen, Check, ChevronDown, CircleHelp, Compass, DoorOpen, Globe2,
  Info, LogIn, Map, MapPin, MessageCircle, Mic, MoreHorizontal, Send, Settings2, ShieldCheck,
  Sparkles, Users, X,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/config";
import { countries, flagFor, rooms } from "@/lib/rooms";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AvatarPosition, ChatMessage, LocationId, RemoteAvatar, UserProfile } from "@/lib/types";
import VoiceChat from "@/components/VoiceChat";

const WorldScene = dynamic(() => import("@/components/WorldScene"), { ssr: false, loading: () => <div className="scene-loading"><span className="spinner" /><span>Membangun dunia 3D...</span></div> });

const locationLabels: Record<LocationId, string> = { cafe: "Kafe", home: "Rumah", office: "Kantor", campus: "Kampus", market: "Pasar" };
const locationIcons: Record<LocationId, string> = { cafe: "☕", home: "⌂", office: "▤", campus: "▥", market: "♧" };
const starterMessages: ChatMessage[] = [
  { id: "welcome-1", user_id: "guide", display_name: "Kheewar", content: "مَرْحَبًا! Mulai dengan menyapa partner-mu dalam bahasa Arab. 🌿", created_at: new Date().toISOString() },
];
const defaultProfile: UserProfile = { id: "guest", display_name: "Tamu Kalam", country_code: "ID", level: "A1", avatar_color: "#d59b71" };

function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "K"; }
function formatTime(date: string) { return new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }); }

export default function WorldExperience() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [demoMode, setDemoMode] = useState(!isSupabaseConfigured);
  const [activeRoomId, setActiveRoomId] = useState(rooms[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [draft, setDraft] = useState("");
  const [remotePlayers, setRemotePlayers] = useState<RemoteAvatar[]>([]);
  const positionRef = useRef<AvatarPosition>({ x: 0, z: 2 });
  const [showProfile, setShowProfile] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMission, setShowMission] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [notice, setNotice] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"demo" | "connecting" | "online" | "offline">(isSupabaseConfigured ? "connecting" : "demo");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastPresenceUpdateRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const room = rooms.find((item) => item.id === activeRoomId) ?? rooms[0];
  const country = countries.find((item) => item.code === profile.country_code) ?? countries[0];

  useEffect(() => {
    if (!supabase) { setAuthReady(true); setDemoMode(true); return; }
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      if (data.user) {
        const fallbackName = String(data.user.user_metadata?.display_name || data.user.email?.split("@")[0] || "Pembelajar");
        const { data: savedProfile } = await supabase.from("profiles").select("id,display_name,country_code,level,avatar_color").eq("id", data.user.id).maybeSingle();
        if (!mounted) return;
        setProfile(savedProfile ? { ...defaultProfile, ...savedProfile } : { ...defaultProfile, id: data.user.id, display_name: fallbackName });
        setDemoMode(false);
      }
      setAuthReady(true);
    }).catch(() => { if (mounted) { setAuthReady(true); setDemoMode(true); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (!session?.user) { setProfile(defaultProfile); setDemoMode(true); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  const sendAvatarPosition = useCallback((nextPosition: AvatarPosition) => {
    positionRef.current = nextPosition;
    if (channelRef.current && user && !demoMode) {
      const avatarPayload = { id: user.id, name: profile.display_name, country_code: profile.country_code, x: nextPosition.x, z: nextPosition.z, color: profile.avatar_color };
      void channelRef.current.send({ type: "broadcast", event: "avatar", payload: avatarPayload });
      const now = Date.now();
      if (now - lastPresenceUpdateRef.current > 1200) {
        lastPresenceUpdateRef.current = now;
        void channelRef.current.track({ user_id: user.id, name: profile.display_name, country_code: profile.country_code, x: nextPosition.x, z: nextPosition.z, color: profile.avatar_color, online_at: new Date().toISOString() });
      }
    }
  }, [user, demoMode, profile.display_name, profile.country_code, profile.avatar_color]);

  useEffect(() => {
    if (!supabase || !user || demoMode) {
      channelRef.current = null;
      setConnectionStatus("demo");
      setRemotePlayers([]);
      return;
    }
    let alive = true;
    setConnectionStatus("connecting");
    const channel = supabase.channel(`world:${activeRoomId}`, { config: { broadcast: { self: false }, presence: { key: user.id } } });
    channelRef.current = channel;
    const applyPresence = () => {
      const state = channel.presenceState<{ user_id?: string; name?: string; country_code?: string; x?: number; z?: number; color?: string }>();
      const next: RemoteAvatar[] = [];
      Object.entries(state).forEach(([key, metas]) => {
        if (key === user.id) return;
        metas.forEach((meta) => next.push({ id: key, name: meta.name || "Teman belajar", country_code: meta.country_code || "ID", x: Number(meta.x ?? 0), z: Number(meta.z ?? -1), color: meta.color }));
      });
      if (alive) setRemotePlayers(next);
    };
    channel.on("presence", { event: "sync" }, applyPresence);
    channel.on("broadcast", { event: "avatar" }, ({ payload }) => {
      if (!alive || !payload?.id || payload.id === user.id) return;
      setRemotePlayers((current) => {
        const avatar: RemoteAvatar = { id: String(payload.id), name: String(payload.name || "Teman belajar"), country_code: String(payload.country_code || "ID"), x: Number(payload.x || 0), z: Number(payload.z || 0), color: String(payload.color || "#8a9de0") };
        return current.some((item) => item.id === avatar.id) ? current.map((item) => item.id === avatar.id ? avatar : item) : [...current, avatar];
      });
    });
    channel.on("broadcast", { event: "chat" }, ({ payload }) => {
      if (!alive || !payload?.id || payload.user_id === user.id) return;
      setMessages((current) => current.some((item) => item.id === payload.id) ? current : [...current, payload as ChatMessage].slice(-60));
    });
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        if (alive) setConnectionStatus("online");
        await channel.track({ user_id: user.id, name: profile.display_name, country_code: profile.country_code, x: positionRef.current.x, z: positionRef.current.z, color: profile.avatar_color, online_at: new Date().toISOString() });
        applyPresence();
        const { data } = await supabase.from("conversation_messages").select("id,user_id,display_name,content,created_at").eq("room_id", activeRoomId).order("created_at", { ascending: true }).limit(40);
        if (alive && data?.length) setMessages(data.map((message) => ({ ...message, is_local: message.user_id === user.id })));
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        if (alive) setConnectionStatus("offline");
      }
    });
    return () => {
      alive = false;
      if (channelRef.current === channel) channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [supabase, user, demoMode, activeRoomId, profile.display_name, profile.country_code, profile.avatar_color]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  const updateProfile = async (next: UserProfile) => {
    setProfile(next);
    setShowProfile(false);
    if (supabase && user && !demoMode) {
      const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: next.display_name, country_code: next.country_code, level: next.level, avatar_color: next.avatar_color });
      if (error) setNotice("Profil berubah di sesi ini, tetapi belum tersimpan ke database.");
      else setNotice("Profil berhasil disimpan.");
    } else setNotice("Profil demo diperbarui untuk sesi ini.");
    window.setTimeout(() => setNotice(""), 3200);
  };

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (content.length > 500) { setNotice("Pesan maksimal 500 karakter."); return; }
    const message: ChatMessage = { id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, user_id: user?.id ?? "guest", display_name: profile.display_name, content, created_at: new Date().toISOString(), is_local: true };
    setMessages((current) => [...current, message].slice(-60));
    setDraft("");
    if (channelRef.current && user && !demoMode) {
      const { error } = await supabase!.from("conversation_messages").insert({ room_id: activeRoomId, user_id: user.id, display_name: profile.display_name, content });
      if (error) setNotice("Pesan tampil di sesi ini, tetapi belum tersimpan. Pastikan SQL dan kebijakan Supabase sudah diterapkan.");
      await channelRef.current.send({ type: "broadcast", event: "chat", payload: message });
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setProfile(defaultProfile); setDemoMode(true); setShowProfile(false);
    setNotice("Kamu telah keluar. Sekarang menggunakan mode demo.");
    window.setTimeout(() => setNotice(""), 3000);
  }

  if (!authReady) return <main className="world-bootstrap"><span className="spinner" /><p>Menyiapkan ruang belajarmu...</p></main>;

  return <main className="world-app">
    <header className="world-topbar"><Link href="/" className="world-brand"><span className="brand-mark">ك</span><span><strong>Kheewar</strong><small>LEARNING WORLD</small></span></Link><div className="world-breadcrumb"><span>World</span><ArrowRight size={13} /><strong>{locationLabels[room.location]}</strong><span className="breadcrumb-pill">{room.level}</span></div><div className="topbar-actions"><span className={`connection-pill connection-${connectionStatus}`}><i />{connectionStatus === "online" ? "Online" : connectionStatus === "connecting" ? "Menghubungkan" : connectionStatus === "offline" ? "Offline" : "Demo mode"}</span><button className="icon-button" onClick={() => setShowHelp(true)} aria-label="Bantuan"><CircleHelp size={19} /></button><button className="profile-chip" onClick={() => setShowProfile(true)}><span className="profile-avatar" style={{ background: profile.avatar_color }}>{initials(profile.display_name)}</span><span className="profile-chip-name">{profile.display_name}</span><ChevronDown size={14} /></button></div></header>

    {isSupabaseConfigured && !user && !demoMode && <div className="auth-gate"><div className="auth-gate-card"><div className="auth-welcome-icon"><Users size={22} /></div><h2>Masuk ke dunia bersama</h2><p>Login untuk memakai profilmu dan bertemu pengguna lain secara real-time. Kamu juga bisa mencoba demo lokal terlebih dahulu.</p><div className="gate-actions"><Link href="/login" className="button button-primary"><LogIn size={16} /> Masuk / Daftar</Link><button className="button button-quiet" onClick={() => setDemoMode(true)}>Coba sebagai tamu</button></div></div></div>}

    <div className="world-layout">
      <aside className="world-sidebar left-sidebar"><div className="sidebar-label">YOUR WORLD <button className="icon-button small" aria-label="Pengaturan dunia" onClick={() => setShowHelp(true)}><Settings2 size={15} /></button></div><button className="world-nav-item active"><Compass size={17} /><span>Jelajahi dunia</span><span className="nav-count">5</span></button><button className="world-nav-item" onClick={() => setNotice("Daftar teman akan tersedia setelah fitur pertemanan diaktifkan.")}><Users size={17} /><span>Teman</span><span className="nav-count muted-count">{remotePlayers.length}</span></button><button className="world-nav-item" onClick={() => setShowMission((value) => !value)}><BookOpen size={17} /><span>Misi belajar</span><span className="nav-dot" /></button><div className="sidebar-divider" /><div className="sidebar-label">LOKASI & RUANG <span className="sidebar-label-count">05</span></div><div className="room-list">{rooms.map((item) => <button key={item.id} onClick={() => { setActiveRoomId(item.id); setMessages(starterMessages); setShowMobileChat(false); }} className={`room-item ${activeRoomId === item.id ? "selected" : ""}`}><span className="room-emoji" style={{ background: `${item.color}22` }}>{locationIcons[item.location]}</span><span className="room-item-copy"><strong>{item.name}</strong><small>{item.level} · {item.people} belajar</small></span>{activeRoomId === item.id && <span className="room-selected-dot" />}</button>)}</div><div className="sidebar-spacer" /><div className="sidebar-bottom-card"><div className="sidebar-bottom-icon"><Sparkles size={17} /></div><strong>Speak a little more.</strong><p>Setiap percakapan adalah satu langkah maju.</p><div className="progress-line"><span style={{ width: "36%" }} /></div><small>3 dari 8 misi minggu ini</small></div><button className="sidebar-footer-link" onClick={() => setShowHelp(true)}><ShieldCheck size={15} /> Panduan komunitas</button></aside>

      <section className="world-main"><div className="world-scene-header"><div><div className="scene-eyebrow"><span className="online-dot" /> VIRTUAL SPACE <span>/</span> {locationLabels[room.location].toUpperCase()}</div><h1>{room.name} <span className="room-title-level">{room.level}</span></h1><p>{room.description}</p></div><div className="scene-header-actions"><button className="scene-action-button" onClick={() => setShowMission((value) => !value)}><BookOpen size={15} /> <span>Misi</span></button><button className="scene-action-button" onClick={() => setShowHelp(true)}><MoreHorizontal size={17} /></button></div></div>
        <div className="scene-frame"><div className="scene-overlay-top"><div className="scene-live-badge"><span className="online-dot" /> {demoMode ? "LOCAL PREVIEW" : connectionStatus === "online" ? "LIVE ROOM" : "CONNECTING"}</div><div className="scene-population"><Users size={14} /> {remotePlayers.length + 1} di ruang ini</div></div><WorldScene location={room.location} displayName={profile.display_name} countryFlag={flagFor(profile.country_code)} avatarColor={profile.avatar_color} remotePlayers={remotePlayers} onPositionChange={sendAvatarPosition} /><div className="scene-location-chip"><span>{locationIcons[room.location]}</span><div><small>YOU ARE AT</small><strong>{locationLabels[room.location]}</strong></div><MapPin size={15} /></div><div className="scene-help-chip"><span className="keycap">W</span><span className="keycap">A</span><span className="keycap">S</span><span className="keycap">D</span><span className="scene-help-text">untuk bergerak</span></div><button className="scene-fullscreen" onClick={() => setShowHelp(true)} aria-label="Kontrol dunia"><Map size={16} /></button></div>
        <div className="world-bottom-bar"><div className="bottom-status"><span className="status-avatar" style={{ background: profile.avatar_color }}>{initials(profile.display_name)}</span><div><strong>{profile.display_name} <span className="you-label">YOU</span></strong><small>{country.flag} {country.name} · Level {profile.level}</small></div></div><div className="bottom-microcopy"><span className="online-dot" /> {demoMode ? "Kamu sedang menjelajahi mode demo" : "Kamu berada di ruang publik"}</div><div className="bottom-actions"><button className="button button-voice" onClick={() => setShowVoice(true)}><Mic size={16} /> Mulai voice</button><button className="button button-primary" onClick={() => setShowMobileChat(true)}><MessageCircle size={16} /> Chat <span className="chat-mobile-count">{messages.length}</span></button></div></div>
        <div className="world-learning-strip"><div className="learning-strip-icon"><BookOpen size={17} /></div><div><strong>Latihan Maharah Kalam</strong><p>Gunakan bahasa Arab sebisamu. Kamu boleh membuka petunjuk jika membutuhkan bantuan.</p></div><button onClick={() => setShowMission((value) => !value)}>{showMission ? "Sembunyikan" : "Lihat misi"} <ArrowRight size={14} /></button></div>
      </section>

      <aside className={`world-sidebar right-sidebar ${showMobileChat ? "mobile-chat-open" : ""}`}><div className="right-panel-header"><div><span className="sidebar-label">CONVERSATION ROOM</span><h2>Ruang percakapan</h2></div><button className="icon-button mobile-close" onClick={() => setShowMobileChat(false)} aria-label="Tutup chat"><X size={18} /></button><button className="icon-button" onClick={() => setShowHelp(true)} aria-label="Info ruang"><Info size={17} /></button></div><div className="conversation-room-summary"><div className="conversation-room-icon" style={{ background: `${room.color}26` }}>{locationIcons[room.location]}</div><div><strong>{room.name}</strong><small>{room.level} · {room.people} pengguna biasanya</small></div><span className="privacy-dot" title="Ruang publik"><Globe2 size={14} /></span></div><div className="people-section"><div className="panel-section-heading"><strong>Di ruang ini</strong><span>{remotePlayers.length + 1} pengguna</span></div><div className="people-stack"><div className="person-row"><span className="person-avatar" style={{ background: profile.avatar_color }}>{initials(profile.display_name)}</span><span className="person-copy"><strong>{profile.display_name} <i>YOU</i></strong><small>{country.flag} {country.name}</small></span><span className="person-online" /></div>{remotePlayers.slice(0, 4).map((player) => <div className="person-row" key={player.id}><span className="person-avatar" style={{ background: player.color || "#8a9de0" }}>{initials(player.name)}</span><span className="person-copy"><strong>{player.name}</strong><small>{flagFor(player.country_code)} Partner belajar</small></span><span className="person-online" /></div>)}{remotePlayers.length === 0 && <div className="empty-people"><Users size={16} /><span>{demoMode ? "Mode demo: hanya kamu yang aktif." : "Belum ada partner. Bagikan ruang ini atau tunggu pengguna lain."}</span></div>}</div></div>
        {showMission && <div className="mission-card"><div className="mission-top"><span className="mission-icon"><Sparkles size={15} /></span><span>YOUR CONVERSATION MISSION</span><button className="icon-button small" onClick={() => setShowMission(false)} aria-label="Sembunyikan misi"><X size={14} /></button></div><strong>{room.mission}</strong><div className="mission-phrase"><span>TRY SAYING</span><p>مَرْحَبًا، مَا اسْمُكَ؟</p><small>Marḥaban, mā ismuka? · Halo, siapa namamu?</small></div><button className="mission-done-button" onClick={() => setNotice("Bagus! Setelah partner tersedia, selesaikan misi ini lewat percakapan langsung.")}><Check size={15} /> Tandai sebagai panduan</button></div>}
        <div className="chat-section"><div className="chat-heading"><div><strong>Pesan ruang</strong><small>Gunakan untuk membuka percakapan</small></div><span className="chat-heading-live"><i /> LIVE</span></div><div className="chat-messages" aria-live="polite">{messages.map((message) => <div key={message.id} className={`chat-message ${message.is_local ? "chat-message-mine" : message.user_id === "guide" ? "chat-message-guide" : ""}`}><div className="chat-message-meta"><strong>{message.display_name}</strong><time>{formatTime(message.created_at)}</time></div><p>{message.content}</p></div>)}<div ref={chatEndRef} /></div><form className="chat-compose" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tulis pesan dalam bahasa Arab..." maxLength={500} aria-label="Pesan chat" /><button type="submit" disabled={!draft.trim()} aria-label="Kirim pesan"><Send size={16} /></button></form><div className="chat-footnote"><ShieldCheck size={13} /> Saling menghormati. Jangan bagikan data pribadi.</div></div>
        <div className="right-panel-footer"><button onClick={() => setShowVoice(true)}><AudioLines size={16} /><span><strong>Voice conversation</strong><small>Berbicara langsung dengan partner</small></span><ArrowRight size={15} /></button></div>
      </aside>
    </div>

    {showProfile && <ProfileModal profile={profile} onClose={() => setShowProfile(false)} onSave={updateProfile} user={user} onSignOut={signOut} />}
    {showVoice && <VoiceChat roomName={activeRoomId} onClose={() => setShowVoice(false)} />}
    {showHelp && <div className="voice-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setShowHelp(false); }}><section className="voice-modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><div className="voice-modal-icon"><CircleHelp size={23} /></div><h2 id="help-title">Panduan dunia 3D</h2><p className="voice-modal-subtitle">Bergerak, bertemu, dan mulai berbicara.</p><div className="help-list"><div><span className="help-key-group"><i>W</i><i>A</i><i>S</i><i>D</i></span><p><strong>Bergerak</strong><small>Gunakan tombol W, A, S, D atau panah pada keyboard.</small></p></div><div><span className="help-round-icon"><Users size={18} /></span><p><strong>Bertemu partner</strong><small>Masuk ke ruang yang sama dengan pengguna lain. Di mode demo, avatar lain belum tersambung.</small></p></div><div><span className="help-round-icon"><Mic size={18} /></span><p><strong>Voice chat</strong><small>Butuh login dan konfigurasi LiveKit untuk audio sungguhan. Chat teks tersedia pada demo lokal.</small></p></div><div><span className="help-round-icon"><BookOpen size={18} /></span><p><strong>Ikuti misi</strong><small>Gunakan misi sebagai pemantik, bukan skrip yang harus dihafal.</small></p></div></div><button className="button button-primary voice-close" onClick={() => setShowHelp(false)}>Mengerti</button></section></div>}
    {notice && <div className="toast-notice" role="status"><Check size={16} /> {notice}<button onClick={() => setNotice("")} aria-label="Tutup notifikasi"><X size={14} /></button></div>}
  </main>;
}

function ProfileModal({ profile, onClose, onSave, user, onSignOut }: { profile: UserProfile; onClose: () => void; onSave: (profile: UserProfile) => void; user: User | null; onSignOut: () => void }) {
  const [name, setName] = useState(profile.display_name);
  const [countryCode, setCountryCode] = useState(profile.country_code);
  const [level, setLevel] = useState(profile.level);
  const [color, setColor] = useState(profile.avatar_color);
  const colors = ["#d59b71", "#8b9ce5", "#7eb59c", "#c78bb4", "#d2b35f", "#739db9"];
  return <div className="voice-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="voice-modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button className="modal-close-button" onClick={onClose} aria-label="Tutup"><X size={18} /></button><div className="profile-modal-avatar" style={{ background: color }}>{initials(name)}</div><h2 id="profile-title">Profil pembelajar</h2><p className="voice-modal-subtitle">Tampilkan identitas yang ingin dilihat partner percakapanmu.</p><form className="profile-edit-form" onSubmit={(event) => { event.preventDefault(); if (name.trim().length < 2) return; onSave({ ...profile, display_name: name.trim(), country_code: countryCode, level, avatar_color: color }); }}><label>Nama tampilan<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={32} required /></label><label>Negara asal<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>{countries.map((item) => <option key={item.code} value={item.code}>{item.flag} {item.name}</option>)}</select></label><label>Level bahasa Arab<select value={level} onChange={(event) => setLevel(event.target.value)}><option value="A1">A1 · Pemula</option><option value="A2">A2 · Dasar</option><option value="B1">B1 · Menengah</option><option value="B2">B2 · Menengah lanjut</option></select></label><div className="profile-color-label">Warna avatar</div><div className="avatar-color-options">{colors.map((item) => <button key={item} type="button" className={color === item ? "selected" : ""} style={{ background: item }} onClick={() => setColor(item)} aria-label={`Pilih warna ${item}`}>{color === item && <Check size={15} />}</button>)}</div><button type="submit" className="button button-primary profile-save">Simpan profil <ArrowRight size={16} /></button></form>{user ? <button className="signout-button" onClick={onSignOut}><DoorOpen size={15} /> Keluar dari akun</button> : <p className="profile-demo-note">Mode tamu · Perubahan hanya tersimpan di sesi ini.</p>}</section></div>;
}
