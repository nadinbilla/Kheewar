"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  DoorOpen,
  Globe2,
  Info,
  LogIn,
  Map,
  MapPin,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/config";
import { countries, flagFor, rooms } from "@/lib/rooms";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  AvatarPosition,
  AvatarVariant,
  ChatMessage,
  ConversationRoom,
  LocationId,
  RemoteAvatar,
  UserProfile,
} from "@/lib/types";
import VoiceChat from "@/components/VoiceChat";

const WorldScene = dynamic(() => import("@/components/WorldScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <span className="spinner" />
      <span>Membangun dunia 3D...</span>
    </div>
  ),
});

const locationLabels: Record<LocationId, string> = {
  cafe: "Kafe",
  home: "Rumah",
  office: "Kantor",
  campus: "Kampus",
  market: "Pasar",
};

const locationIcons: Record<LocationId, string> = {
  cafe: "☕",
  home: "⌂",
  office: "▤",
  campus: "▥",
  market: "♧",
};

const defaultProfile: UserProfile = {
  id: "guest",
  display_name: "Tamu Kalam",
  country_code: "ID",
  level: "A1",
  avatar_color: "#d59b71",
  avatar_variant: "female_hijab",
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "K"
  );
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function makeStarterMessage(room: ConversationRoom): ChatMessage {
  return {
    id: `guide-${room.id}`,
    user_id: "guide",
    display_name: "Kheewar",
    content: `مَرْحَبًا! ${room.mission}`,
    created_at: new Date().toISOString(),
  };
}

async function fetchProfileWithFallback(supabase: ReturnType<typeof getSupabaseBrowserClient>, userId: string) {
  if (!supabase) return null;

  const primary = await supabase
    .from("profiles")
    .select("id,display_name,country_code,level,avatar_color,avatar_variant")
    .eq("id", userId)
    .maybeSingle();

  if (!primary.error) return primary.data;

  const fallback = await supabase
    .from("profiles")
    .select("id,display_name,country_code,level,avatar_color")
    .eq("id", userId)
    .maybeSingle();

  return fallback.data ? { ...fallback.data, avatar_variant: "female_hijab" as AvatarVariant } : null;
}

async function persistProfileWithFallback(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  next: UserProfile,
) {
  if (!supabase) return { error: new Error("Supabase belum tersedia") };

  const primary = await supabase.from("profiles").upsert({
    id: next.id,
    display_name: next.display_name,
    country_code: next.country_code,
    level: next.level,
    avatar_color: next.avatar_color,
    avatar_variant: next.avatar_variant,
  });

  if (!primary.error) return primary;

  return supabase.from("profiles").upsert({
    id: next.id,
    display_name: next.display_name,
    country_code: next.country_code,
    level: next.level,
    avatar_color: next.avatar_color,
  });
}

export default function WorldExperience() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [demoMode, setDemoMode] = useState(!isSupabaseConfigured);
  const [activeRoomId, setActiveRoomId] = useState(rooms[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([makeStarterMessage(rooms[0])]);
  const [draft, setDraft] = useState("");
  const [remotePlayers, setRemotePlayers] = useState<RemoteAvatar[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMission, setShowMission] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<RemoteAvatar | null>(null);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"demo" | "connecting" | "online" | "offline">(
    isSupabaseConfigured ? "connecting" : "demo",
  );

  const positionRef = useRef<AvatarPosition>({ x: 0, z: 2 });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastPresenceUpdateRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const room = rooms.find((item) => item.id === activeRoomId) ?? rooms[0];
  const country = countries.find((item) => item.code === profile.country_code) ?? countries[0];
  const pendingRoom = rooms.find((item) => item.id === pendingRoomId) ?? null;

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      setDemoMode(true);
      return;
    }

    let mounted = true;
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (!mounted) return;
        setUser(data.user);

        if (data.user) {
          const fallbackName = String(
            data.user.user_metadata?.display_name || data.user.email?.split("@")[0] || "Pembelajar",
          );
          const savedProfile = await fetchProfileWithFallback(supabase, data.user.id);
          if (!mounted) return;

          setProfile(
            savedProfile
              ? { ...defaultProfile, ...savedProfile }
              : { ...defaultProfile, id: data.user.id, display_name: fallbackName },
          );
          setDemoMode(false);
        }
        setAuthReady(true);
      })
      .catch(() => {
        if (mounted) {
          setAuthReady(true);
          setDemoMode(true);
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(defaultProfile);
        setDemoMode(true);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    setMessages([makeStarterMessage(room)]);
  }, [room.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendAvatarPosition = useCallback(
    (nextPosition: AvatarPosition) => {
      positionRef.current = nextPosition;
      if (channelRef.current && user && !demoMode) {
        const avatarPayload = {
          id: user.id,
          name: profile.display_name,
          country_code: profile.country_code,
          x: nextPosition.x,
          z: nextPosition.z,
          color: profile.avatar_color,
          avatar_variant: profile.avatar_variant,
        };
        void channelRef.current.send({ type: "broadcast", event: "avatar", payload: avatarPayload });
        const now = Date.now();
        if (now - lastPresenceUpdateRef.current > 1200) {
          lastPresenceUpdateRef.current = now;
          void channelRef.current.track({
            user_id: user.id,
            name: profile.display_name,
            country_code: profile.country_code,
            x: nextPosition.x,
            z: nextPosition.z,
            color: profile.avatar_color,
            avatar_variant: profile.avatar_variant,
            online_at: new Date().toISOString(),
          });
        }
      }
    },
    [demoMode, profile.avatar_color, profile.avatar_variant, profile.country_code, profile.display_name, user],
  );

  useEffect(() => {
    if (!supabase || !user || demoMode) {
      channelRef.current = null;
      setConnectionStatus("demo");
      setRemotePlayers([]);
      return;
    }

    let alive = true;
    setConnectionStatus("connecting");

    const channel = supabase.channel(`world:${activeRoomId}`, {
      config: { broadcast: { self: false }, presence: { key: user.id } },
    });
    channelRef.current = channel;

    const applyPresence = () => {
      const state = channel.presenceState<{
        user_id?: string;
        name?: string;
        country_code?: string;
        x?: number;
        z?: number;
        color?: string;
        avatar_variant?: AvatarVariant;
      }>();

      const next: RemoteAvatar[] = [];
      Object.entries(state).forEach(([key, metas]) => {
        if (key === user.id) return;
        metas.forEach((meta) =>
          next.push({
            id: key,
            name: meta.name || "Teman belajar",
            country_code: meta.country_code || "ID",
            x: Number(meta.x ?? 0),
            z: Number(meta.z ?? -1),
            color: meta.color,
            avatar_variant: meta.avatar_variant ?? "female_hijab",
          }),
        );
      });
      if (alive) setRemotePlayers(next);
    };

    channel.on("presence", { event: "sync" }, applyPresence);
    channel.on("broadcast", { event: "avatar" }, ({ payload }) => {
      if (!alive || !payload?.id || payload.id === user.id) return;
      setRemotePlayers((current) => {
        const avatar: RemoteAvatar = {
          id: String(payload.id),
          name: String(payload.name || "Teman belajar"),
          country_code: String(payload.country_code || "ID"),
          x: Number(payload.x || 0),
          z: Number(payload.z || 0),
          color: String(payload.color || "#8a9de0"),
          avatar_variant: (payload.avatar_variant as AvatarVariant | undefined) ?? "female_hijab",
        };
        return current.some((item) => item.id === avatar.id)
          ? current.map((item) => (item.id === avatar.id ? avatar : item))
          : [...current, avatar];
      });
    });
    channel.on("broadcast", { event: "chat" }, ({ payload }) => {
      if (!alive || !payload?.id || payload.user_id === user.id) return;
      setMessages((current) =>
        current.some((item) => item.id === payload.id) ? current : [...current, payload as ChatMessage].slice(-60),
      );
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        if (alive) setConnectionStatus("online");
        await channel.track({
          user_id: user.id,
          name: profile.display_name,
          country_code: profile.country_code,
          x: positionRef.current.x,
          z: positionRef.current.z,
          color: profile.avatar_color,
          avatar_variant: profile.avatar_variant,
          online_at: new Date().toISOString(),
        });
        applyPresence();
        const { data } = await supabase
          .from("conversation_messages")
          .select("id,user_id,display_name,content,created_at")
          .eq("room_id", activeRoomId)
          .order("created_at", { ascending: true })
          .limit(40);
        if (alive && data?.length) {
          setMessages(data.map((message) => ({ ...message, is_local: message.user_id === user.id })));
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        if (alive) setConnectionStatus("offline");
      }
    });

    return () => {
      alive = false;
      if (channelRef.current === channel) channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [
    activeRoomId,
    demoMode,
    profile.avatar_color,
    profile.avatar_variant,
    profile.country_code,
    profile.display_name,
    supabase,
    user,
  ]);

  const updateProfile = async (next: UserProfile) => {
    setProfile(next);
    setShowProfile(false);
    if (supabase && user && !demoMode) {
      const { error } = await persistProfileWithFallback(supabase, { ...next, id: user.id });
      setNotice(error ? "Profil diperbarui, tetapi database belum mengikuti kolom avatar terbaru." : "Profil berhasil disimpan.");
    } else {
      setNotice("Profil demo diperbarui untuk sesi ini.");
    }
    window.setTimeout(() => setNotice(""), 3200);
  };

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (content.length > 500) {
      setNotice("Pesan maksimal 500 karakter.");
      return;
    }

    const message: ChatMessage = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      user_id: user?.id ?? "guest",
      display_name: profile.display_name,
      content,
      created_at: new Date().toISOString(),
      is_local: true,
    };

    setMessages((current) => [...current, message].slice(-60));
    setDraft("");

    if (channelRef.current && user && !demoMode) {
      const { error } = await supabase!
        .from("conversation_messages")
        .insert({ room_id: activeRoomId, user_id: user.id, display_name: profile.display_name, content });
      if (!error) {
        await channelRef.current.send({ type: "broadcast", event: "chat", payload: message });
      }
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setDemoMode(true);
    setProfile(defaultProfile);
    setShowProfile(false);
    setNotice("Kamu telah keluar. Sekarang kembali ke mode demo.");
  }

  function requestRoomChange(roomId: string) {
    if (roomId === activeRoomId) return;
    setShowWorldMap(false);
    setPendingRoomId(roomId);
  }

  function confirmRoomChange() {
    if (!pendingRoomId) return;
    setActiveRoomId(pendingRoomId);
    setPendingRoomId(null);
    setShowWorldMap(false);
    setShowMobileChat(false);
  }

  function openInvite(player: RemoteAvatar) {
    setInviteTarget(player);
  }

  const learningCount = rooms.filter((item) => item.level.startsWith("A")).length;

  return (
    <main className="world-app">
      <header className="world-topbar">
        <Link href="/" className="world-brand">
          <span className="brand-mark">ك</span>
          <span>
            <strong>Kheewar</strong>
            <small>LEARNING WORLD</small>
          </span>
        </Link>

        <div className="world-breadcrumb">
          <span>World</span>
          <ArrowRight size={13} />
          <strong>{room.name}</strong>
          <span className="breadcrumb-pill">{room.level}</span>
        </div>

        <div className="topbar-actions">
          <button className="button button-quiet topbar-map-button" onClick={() => setShowWorldMap(true)}>
            <Map size={15} /> Peta dunia
          </button>
          <span className={`connection-pill connection-${connectionStatus}`}>
            <i />
            {connectionStatus === "online"
              ? "Online"
              : connectionStatus === "connecting"
                ? "Menghubungkan"
                : connectionStatus === "offline"
                  ? "Offline"
                  : "Demo mode"}
          </span>
          <button className="icon-button" onClick={() => setShowHelp(true)} aria-label="Bantuan">
            <CircleHelp size={19} />
          </button>
          <button className="profile-chip" onClick={() => setShowProfile(true)}>
            <span className="profile-avatar" style={{ background: profile.avatar_color }}>
              {initials(profile.display_name)}
            </span>
            <span className="profile-chip-name">{profile.display_name}</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>

      <div className="world-layout">
        <aside className="world-sidebar left-sidebar">
          <div className="sidebar-section-heading">
            <span>YOUR WORLD</span>
            <button className="icon-button small" onClick={() => setShowWorldMap(true)} aria-label="Peta dunia">
              <Map size={15} />
            </button>
          </div>

          <div className="left-sidebar-card active-world-card">
            <div>
              <strong>Jelajahi dunia</strong>
              <small>{rooms.length} lokasi percakapan bertema</small>
            </div>
            <span className="active-world-badge">{rooms.length}</span>
          </div>

          <div className="world-quick-links">
            <button type="button"><Users size={16} /> Teman</button>
            <button type="button"><BookOpen size={16} /> Misi belajar</button>
          </div>

          <div className="sidebar-section-heading tighter">
            <span>LOKASI & RUANG</span>
            <strong>{String(rooms.length).padStart(2, "0")}</strong>
          </div>

          <div className="room-list">
            {rooms.map((item) => {
              const isActive = item.id === activeRoomId;
              return (
                <button
                  key={item.id}
                  className={`room-list-item ${isActive ? "active" : ""}`}
                  onClick={() => requestRoomChange(item.id)}
                >
                  <span className="room-list-icon" style={{ background: `${item.color}26` }}>
                    {locationIcons[item.location]}
                  </span>
                  <span className="room-list-copy">
                    <strong>{item.name}</strong>
                    <small>
                      {item.level} · {item.people} belajar
                    </small>
                  </span>
                  <span className="room-list-status" style={{ background: isActive ? item.color : undefined }} />
                </button>
              );
            })}
          </div>

          <div className="progress-card">
            <div className="progress-card-icon">
              <Sparkles size={16} />
            </div>
            <strong>Speak a little more.</strong>
            <p>Setiap percakapan adalah satu langkah maju dalam maharah kalam.</p>
            <div className="progress-bar"><span style={{ width: `${Math.min(100, learningCount * 18)}%` }} /></div>
            <small>{learningCount} dari 8 misi mingguan</small>
          </div>
        </aside>

        <section className="world-main">
          <div className="world-scene-header">
            <div>
              <span className="scene-eyebrow">
                <span className="eyebrow-dot" /> VIRTUAL SPACE · {locationLabels[room.location].toUpperCase()}
              </span>
              <h1>{room.name}</h1>
              <p>{room.description}</p>
            </div>
            <div className="scene-header-actions">
              <button className="scene-action-button" onClick={() => setShowMission((value) => !value)}>
                <BookOpen size={15} /> <span>Misi</span>
              </button>
              <button className="scene-action-button" onClick={() => setShowWorldMap(true)}>
                <Compass size={15} /> <span>Peta</span>
              </button>
              <button className="scene-action-button" onClick={() => setShowHelp(true)}>
                <MoreHorizontal size={15} />
              </button>
            </div>
          </div>

          <div className="scene-frame">
            <div className="scene-overlay-top">
              <div className="scene-live-badge">
                <span className="online-dot" />
                {demoMode ? "LOCAL PREVIEW" : connectionStatus === "online" ? "LIVE ROOM" : "CONNECTING"}
              </div>
              <div className="scene-population">
                <Users size={14} /> {remotePlayers.length + 1} di ruang ini
              </div>
            </div>

            <WorldScene
              location={room.location}
              displayName={profile.display_name}
              countryFlag={flagFor(profile.country_code)}
              avatarColor={profile.avatar_color}
              avatarVariant={profile.avatar_variant}
              remotePlayers={remotePlayers}
              onPositionChange={sendAvatarPosition}
            />

            <div className="scene-location-chip">
              <span>{locationIcons[room.location]}</span>
              <div>
                <small>YOU ARE AT</small>
                <strong>{room.name}</strong>
              </div>
              <MapPin size={15} />
            </div>

            <div className="scene-help-chip">
              <span className="keycap">W</span>
              <span className="keycap">A</span>
              <span className="keycap">S</span>
              <span className="keycap">D</span>
              <span className="scene-help-text">untuk bergerak</span>
            </div>

            <button className="scene-fullscreen" onClick={() => setShowWorldMap(true)} aria-label="Pilih lokasi">
              <Map size={16} />
            </button>
          </div>

          <div className="world-bottom-bar">
            <div className="bottom-status">
              <span className="status-avatar" style={{ background: profile.avatar_color }}>{initials(profile.display_name)}</span>
              <div>
                <strong>
                  {profile.display_name} <span className="you-label">YOU</span>
                </strong>
                <small>
                  {country.flag} {country.name} · Level {profile.level} · {profile.avatar_variant === "female_hijab" ? "Avatar Hijab" : "Avatar Ikhwan"}
                </small>
              </div>
            </div>
            <div className="bottom-microcopy">
              <span className="online-dot" />
              {demoMode ? "Kamu sedang menjelajahi mode demo" : `Mood ruang: ${room.mood}`}
            </div>
            <div className="bottom-actions">
              <button className="button button-voice" onClick={() => setShowVoice(true)}>
                <Mic size={16} /> Mulai voice
              </button>
              <button className="button button-primary" onClick={() => setShowMobileChat(true)}>
                <MessageCircle size={16} /> Chat <span className="chat-mobile-count">{messages.length}</span>
              </button>
            </div>
          </div>

          <div className="world-learning-strip">
            <div className="learning-strip-icon"><BookOpen size={17} /></div>
            <div>
              <strong>Latihan Maharah Kalam</strong>
              <p>{room.mission}</p>
            </div>
            <button onClick={() => setShowMission((value) => !value)}>
              {showMission ? "Sembunyikan" : "Lihat misi"} <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <aside className={`world-sidebar right-sidebar ${showMobileChat ? "mobile-chat-open" : ""}`}>
          <div className="right-panel-header">
            <div>
              <span className="sidebar-label">CONVERSATION ROOM</span>
              <h2>Ruang percakapan</h2>
            </div>
            <button className="icon-button mobile-close" onClick={() => setShowMobileChat(false)} aria-label="Tutup chat">
              <X size={18} />
            </button>
            <button className="icon-button" onClick={() => setShowHelp(true)} aria-label="Info ruang">
              <Info size={17} />
            </button>
          </div>

          <div className="conversation-room-summary">
            <div className="conversation-room-icon" style={{ background: `${room.color}26` }}>{locationIcons[room.location]}</div>
            <div>
              <strong>{room.name}</strong>
              <small>{room.level} · {room.people} pengguna biasanya</small>
            </div>
            <span className="privacy-dot" title="Ruang publik"><Globe2 size={14} /></span>
          </div>

          <div className="people-section">
            <div className="panel-section-heading">
              <strong>Di ruang ini</strong>
              <span>{remotePlayers.length + 1} pengguna</span>
            </div>
            <div className="people-stack">
              <div className="person-row person-row-me">
                <span className="person-avatar" style={{ background: profile.avatar_color }}>{initials(profile.display_name)}</span>
                <span className="person-copy">
                  <strong>{profile.display_name} <i>YOU</i></strong>
                  <small>{country.flag} {country.name}</small>
                </span>
                <span className="person-online" />
              </div>

              {remotePlayers.slice(0, 4).map((player) => (
                <div className="person-row" key={player.id}>
                  <span className="person-avatar" style={{ background: player.color || "#8a9de0" }}>{initials(player.name)}</span>
                  <span className="person-copy">
                    <strong>{player.name}</strong>
                    <small>{flagFor(player.country_code)} Partner belajar</small>
                  </span>
                  <button className="person-invite-button" onClick={() => openInvite(player)}>Ajak</button>
                  <span className="person-online" />
                </div>
              ))}

              {remotePlayers.length === 0 && (
                <div className="empty-people">
                  <Users size={16} />
                  <span>
                    {demoMode
                      ? "Mode demo: hanya kamu yang aktif. Masuk dengan akun Supabase agar terhubung dengan pengguna lain."
                      : "Belum ada partner. Bagikan ruang ini atau tunggu pengguna lain."}
                  </span>
                </div>
              )}
            </div>
          </div>

          {showMission && (
            <div className="mission-card">
              <div className="mission-top">
                <span className="mission-icon"><Sparkles size={15} /></span>
                <span>YOUR CONVERSATION MISSION</span>
                <button className="icon-button small" onClick={() => setShowMission(false)} aria-label="Sembunyikan misi">
                  <X size={14} />
                </button>
              </div>
              <strong>{room.mission}</strong>
              <div className="mission-phrase">
                <span>TRY SAYING</span>
                <p>{room.starterPhrase.arabic}</p>
                <small>{room.starterPhrase.latin} · {room.starterPhrase.translation}</small>
              </div>
              <button
                className="mission-done-button"
                onClick={() => setNotice("Bagus! Gunakan kalimat ini untuk membuka percakapan dengan partner sungguhan.")}
              >
                <Check size={15} /> Tandai sebagai panduan
              </button>
            </div>
          )}

          <div className="chat-section">
            <div className="chat-heading">
              <div>
                <strong>Pesan ruang</strong>
                <small>Gunakan untuk membuka percakapan</small>
              </div>
              <span className="chat-heading-live"><i /> LIVE</span>
            </div>

            <div className="chat-messages" aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${message.is_local ? "chat-message-mine" : message.user_id === "guide" ? "chat-message-guide" : ""}`}
                >
                  <div className="chat-message-meta">
                    <strong>{message.display_name}</strong>
                    <time>{formatTime(message.created_at)}</time>
                  </div>
                  <p>{message.content}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-compose" onSubmit={sendMessage}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Tulis pesan dalam bahasa Arab..."
                maxLength={500}
                aria-label="Pesan chat"
              />
              <button type="submit" disabled={!draft.trim()} aria-label="Kirim pesan">
                <Send size={16} />
              </button>
            </form>
            <div className="chat-footnote">
              <ShieldCheck size={13} /> Saling menghormati. Jangan bagikan data pribadi.
            </div>
          </div>

          <div className="right-panel-footer">
            <button onClick={() => setShowVoice(true)}>
              <AudioLines size={16} />
              <span>
                <strong>Voice conversation</strong>
                <small>Berbicara langsung dengan partner</small>
              </span>
              <ArrowRight size={15} />
            </button>
          </div>
        </aside>
      </div>

      {showProfile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfile(false)}
          onSave={updateProfile}
          user={user}
          onSignOut={signOut}
        />
      )}
      {showVoice && <VoiceChat roomName={activeRoomId} onClose={() => setShowVoice(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showWorldMap && (
        <WorldMapModal
          activeRoomId={activeRoomId}
          onClose={() => setShowWorldMap(false)}
          onSelectRoom={requestRoomChange}
        />
      )}
      {inviteTarget && <InviteModal player={inviteTarget} onClose={() => setInviteTarget(null)} />}
      {pendingRoom && (
        <RoomEntryModal room={pendingRoom} onClose={() => setPendingRoomId(null)} onConfirm={confirmRoomChange} />
      )}
      {notice && (
        <div className="toast-notice" role="status">
          <Check size={16} /> {notice}
          <button onClick={() => setNotice("")} aria-label="Tutup notifikasi">
            <X size={14} />
          </button>
        </div>
      )}

      {!authReady && <div className="demo-notice"><span className="online-dot" /> Mengecek sesi pembelajar...</div>}
    </main>
  );
}

function ProfileModal({
  profile,
  onClose,
  onSave,
  user,
  onSignOut,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  user: User | null;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(profile.display_name);
  const [countryCode, setCountryCode] = useState(profile.country_code);
  const [level, setLevel] = useState(profile.level);
  const [color, setColor] = useState(profile.avatar_color);
  const [avatarVariant, setAvatarVariant] = useState<AvatarVariant>(profile.avatar_variant);
  const colors = ["#d59b71", "#8b9ce5", "#7eb59c", "#c78bb4", "#d2b35f", "#739db9"];

  return (
    <div className="voice-modal-backdrop" role="presentation" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="voice-modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <button className="modal-close-button" onClick={onClose} aria-label="Tutup">
          <X size={18} />
        </button>
        <div className="profile-modal-avatar" style={{ background: color }}>{initials(name)}</div>
        <h2 id="profile-title">Profil pembelajar</h2>
        <p className="voice-modal-subtitle">Tampilkan identitas yang akan terlihat oleh partner percakapanmu.</p>

        <form
          className="profile-edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim().length < 2) return;
            onSave({
              ...profile,
              display_name: name.trim(),
              country_code: countryCode,
              level,
              avatar_color: color,
              avatar_variant: avatarVariant,
            });
          }}
        >
          <label>
            Nama tampilan
            <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={32} required />
          </label>
          <label>
            Negara asal
            <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
              {countries.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.flag} {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Level bahasa Arab
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="A1">A1 · Pemula</option>
              <option value="A2">A2 · Dasar</option>
              <option value="B1">B1 · Menengah</option>
              <option value="B2">B2 · Menengah lanjut</option>
            </select>
          </label>

          <div className="profile-color-label">Gaya avatar</div>
          <div className="avatar-variant-grid">
            <button
              type="button"
              className={avatarVariant === "female_hijab" ? "selected" : ""}
              onClick={() => setAvatarVariant("female_hijab")}
            >
              <strong>Perempuan berhijab</strong>
              <small>Islami, ramah, dan cocok untuk maharah kalam</small>
            </button>
            <button
              type="button"
              className={avatarVariant === "male_modest" ? "selected" : ""}
              onClick={() => setAvatarVariant("male_modest")}
            >
              <strong>Laki-laki sopan</strong>
              <small>Kemeja dan celana panjang dengan style stylized</small>
            </button>
          </div>

          <div className="profile-color-label">Warna avatar</div>
          <div className="avatar-color-options">
            {colors.map((item) => (
              <button
                key={item}
                type="button"
                className={color === item ? "selected" : ""}
                style={{ background: item }}
                onClick={() => setColor(item)}
                aria-label={`Pilih warna ${item}`}
              >
                {color === item && <Check size={15} />}
              </button>
            ))}
          </div>
          <button type="submit" className="button button-primary profile-save">
            Simpan profil <ArrowRight size={16} />
          </button>
        </form>

        {user ? (
          <button className="signout-button" onClick={onSignOut}>
            <DoorOpen size={15} /> Keluar dari akun
          </button>
        ) : (
          <p className="profile-demo-note">Mode tamu · Perubahan hanya tersimpan di sesi ini.</p>
        )}
      </section>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="voice-modal-backdrop" role="presentation" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="voice-modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div className="voice-modal-icon"><CircleHelp size={23} /></div>
        <h2 id="help-title">Panduan dunia 3D</h2>
        <p className="voice-modal-subtitle">Berjalan, bertemu partner, dan mulai latihan percakapan bahasa Arab.</p>
        <div className="help-list">
          <div>
            <span className="help-key-group"><i>W</i><i>A</i><i>S</i><i>D</i></span>
            <p><strong>Bergerak</strong><small>Gunakan keyboard atau kontrol sentuh di HP.</small></p>
          </div>
          <div>
            <span className="help-round-icon"><Users size={18} /></span>
            <p><strong>Temui partner</strong><small>Masuk ke lokasi yang sama, lalu mulai percakapan lewat chat atau voice.</small></p>
          </div>
          <div>
            <span className="help-round-icon"><Mic size={18} /></span>
            <p><strong>Voice chat</strong><small>Gunakan LiveKit untuk percakapan antarmanusia secara langsung.</small></p>
          </div>
          <div>
            <span className="help-round-icon"><BookOpen size={18} /></span>
            <p><strong>Ikuti misi</strong><small>Gunakan misi sebagai pembuka, lalu lanjutkan percakapan secara alami.</small></p>
          </div>
        </div>
        <button className="button button-primary voice-close" onClick={onClose}>Mengerti</button>
      </section>
    </div>
  );
}

function WorldMapModal({
  activeRoomId,
  onClose,
  onSelectRoom,
}: {
  activeRoomId: string;
  onClose: () => void;
  onSelectRoom: (roomId: string) => void;
}) {
  return (
    <div className="voice-modal-backdrop" role="presentation" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="voice-modal world-map-modal" role="dialog" aria-modal="true" aria-labelledby="map-title">
        <button className="modal-close-button" onClick={onClose} aria-label="Tutup">
          <X size={18} />
        </button>
        <h2 id="map-title">Peta Kheewar</h2>
        <p className="voice-modal-subtitle">Pilih lokasi terbaik untuk topik percakapanmu.</p>
        <div className="world-map-grid">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`world-map-card ${room.id === activeRoomId ? "active" : ""}`}
              onClick={() => onSelectRoom(room.id)}
            >
              <span className="world-map-badge" style={{ background: room.color }}>{locationIcons[room.location]}</span>
              <strong>{room.name}</strong>
              <small>{room.level} · {locationLabels[room.location]}</small>
              <p>{room.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function InviteModal({ player, onClose }: { player: RemoteAvatar; onClose: () => void }) {
  return (
    <div className="voice-modal-backdrop" role="presentation" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="voice-modal invite-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title">
        <button className="modal-close-button" onClick={onClose} aria-label="Tutup">
          <X size={18} />
        </button>
        <div className="invite-card-head">
          <span className="invite-people-icon"><Users size={18} /></span>
          <h2 id="invite-title">Talk Invitation</h2>
        </div>
        <div className="invite-player-avatar">{initials(player.name)}</div>
        <p className="invite-player-name">{player.name}</p>
        <small className="invite-player-country">{flagFor(player.country_code)} partner belajar siap diajak ngobrol</small>
        <p className="invite-copy">Undang partner ini untuk memulai percakapan bahasa Arab di ruangan yang sama.</p>
        <div className="invite-actions">
          <button className="button button-quiet" onClick={onClose}>Cancel</button>
          <button className="button button-primary" onClick={onClose}>Talk</button>
        </div>
      </section>
    </div>
  );
}

function RoomEntryModal({
  room,
  onClose,
  onConfirm,
}: {
  room: ConversationRoom;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="voice-modal-backdrop" role="presentation" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="voice-modal invite-modal" role="dialog" aria-modal="true" aria-labelledby="room-enter-title">
        <button className="modal-close-button" onClick={onClose} aria-label="Tutup">
          <X size={18} />
        </button>
        <div className="invite-card-head">
          <span className="invite-people-icon"><MapPin size={18} /></span>
          <h2 id="room-enter-title">{room.name}</h2>
        </div>
        <p className="invite-copy room-enter-copy">Masuk ke {locationLabels[room.location]} ini?</p>
        <small className="invite-player-country">{room.level} · {room.description}</small>
        <div className="invite-actions">
          <button className="button button-quiet" onClick={onClose}>No</button>
          <button className="button button-primary" onClick={onConfirm}>Yes</button>
        </div>
      </section>
    </div>
  );
}
