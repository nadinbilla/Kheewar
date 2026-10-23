"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Globe2, RotateCw, Search, Sparkles, UserRound, WandSparkles } from "lucide-react";
import { countries, flagFor } from "@/lib/rooms";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  initialAppearance, normalizeAppearance, outfitColors, readDemoProfile, skinTones, writeDemoProfile,
  type AvatarAppearance, type AvatarHeadwear, type AvatarOutfit,
} from "@/lib/avatar-options";
import type { UserProfile } from "@/lib/types";
import "./avatar.css";

const AvatarPreview = dynamic(() => import("@/components/avatar/AvatarPreview"), {
  ssr: false,
  loading: () => <div className="avatar-studio-loading">Menyiapkan avatar 3D...</div>,
});

const defaultName = "Tamu Kalam";
const defaultProfile: UserProfile = {
  id: "guest",
  display_name: defaultName,
  country_code: "ID",
  level: "A1",
  ...initialAppearance,
};

export default function AvatarPage() {
  const router = useRouter();
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [countryQuery, setCountryQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticatedId, setAuthenticatedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedCountry = countries.find((c) => c.code === profile.country_code) ?? countries[0];
  const countriesFiltered = countries.filter((c) => `${c.name} ${c.code}`.toLowerCase().includes(countryQuery.toLowerCase()));

  useEffect(() => {
    let alive = true;
    const saved = readDemoProfile();
    if (saved) {
      setProfile(prev => ({
        ...prev,
        display_name: typeof saved.display_name === "string" ? saved.display_name : prev.display_name,
        country_code: typeof saved.country_code === "string" ? saved.country_code : prev.country_code,
        level: typeof saved.level === "string" ? saved.level : prev.level,
        ...normalizeAppearance(saved as Partial<AvatarAppearance>),
      }));
    }
    if (!client) { setLoading(false); return; }
    client.auth.getUser().then(async ({ data }) => {
      if (!alive) return;
      const user = data.user;
      if (!user) { setLoading(false); return; }
      setAuthenticatedId(user.id);
      const { data: remote, error: queryError } = await client
        .from("profiles")
        .select("id,display_name,country_code,level,avatar_color,avatar_variant,skin_tone,avatar_headwear,avatar_outfit")
        .eq("id", user.id)
        .maybeSingle();
      if (!alive) return;
      if (remote && !queryError) {
        setProfile({ ...defaultProfile, ...remote, ...normalizeAppearance(remote), id: user.id });
      } else {
        // Skema lama tetap dapat dibuka; migrasi tetap diperlukan untuk menyimpan field baru.
        const fallback = await client.from("profiles")
          .select("id,display_name,country_code,level,avatar_color,avatar_variant")
          .eq("id", user.id).maybeSingle();
        if (!alive) return;
        setProfile(prev => ({
          ...prev, ...(fallback.data ?? {}),
          display_name: fallback.data?.display_name ?? String(user.user_metadata?.display_name || user.email?.split("@")[0] || defaultName),
          id: user.id,
          ...normalizeAppearance(fallback.data ?? {}),
        }));
      }
      setLoading(false);
    }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [client]);

  function changeAppearance(patch: Partial<AvatarAppearance>) {
    setProfile(current => ({ ...current, ...normalizeAppearance({ ...current, ...patch }) }));
  }

  function chooseVariant(variant: AvatarAppearance["avatar_variant"]) {
    changeAppearance({ avatar_variant: variant, avatar_headwear: variant === "female_hijab" ? "hijab" : "peci" });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setNotice("");
    const cleanName = profile.display_name.trim();
    if (cleanName.length < 2 || cleanName.length > 24) {
      setError("Nama harus terdiri dari 2 sampai 24 karakter.");
      return;
    }
    setSaving(true);
    const cleanProfile: UserProfile = { ...profile, display_name: cleanName, ...normalizeAppearance(profile) };
    try {
      if (client && authenticatedId) {
        const { error: saveError } = await client.from("profiles").upsert({
          id: authenticatedId,
          display_name: cleanProfile.display_name,
          country_code: cleanProfile.country_code,
          level: cleanProfile.level,
          avatar_color: cleanProfile.avatar_color,
          avatar_variant: cleanProfile.avatar_variant,
          skin_tone: cleanProfile.skin_tone,
          avatar_headwear: cleanProfile.avatar_headwear,
          avatar_outfit: cleanProfile.avatar_outfit,
        });
        if (saveError) throw new Error(`Database belum dapat menyimpan avatar. Jalankan migrasi supabase/avatar_creator_upgrade.sql. Detail: ${saveError.message}`);
        setNotice("Avatar tersimpan di akunmu.");
      } else {
        writeDemoProfile(cleanProfile);
        setNotice("Avatar demo tersimpan di browser ini.");
      }
      router.push("/world");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Avatar gagal disimpan.");
    } finally { setSaving(false); }
  }

  return (
    <main className="avatar-editor-shell">
      <header className="avatar-editor-header">
        <Link className="avatar-editor-brand" href="/"><span>ك</span><strong>Kheewar</strong><small>Avatar Studio</small></Link>
        <div className="avatar-editor-header-actions">
          <Link href="/world"><ArrowLeft size={16}/> Kembali ke dunia</Link>
          <span className="avatar-editor-badge"><Sparkles size={13}/> 3D CHARACTER CREATOR</span>
        </div>
      </header>
      <div className="avatar-editor-content">
        <div className="avatar-editor-intro">
          <p className="avatar-editor-overline"><WandSparkles size={14}/> MAKE IT YOURS</p>
          <h1>Buat Avatar <span>Kheewar-mu</span></h1>
          <p>Pilih penampilan, tulis namamu, lalu mulai bertemu teman belajar bahasa Arab dari seluruh dunia.</p>
        </div>
        <form className="avatar-editor-grid" onSubmit={save}>
          <section className="avatar-editor-stage" aria-label="Pratinjau avatar 3D">
            <div className="avatar-stage-top"><span className="avatar-live-dot"/> PREVIEW 3D <span>✨ KHEEWAR WORLD</span></div>
            <div className="avatar-stage-nametag"><span>{flagFor(profile.country_code)}</span><div><strong>{profile.display_name || defaultName}</strong><small>{selectedCountry.name}</small></div></div>
            <AvatarPreview appearance={profile}/>
            <div className="avatar-stage-hint"><RotateCw size={14}/> Geser untuk memutar · Scroll atau cubit untuk zoom</div>
            <div className="avatar-stage-language"><strong>السَّلَامُ عَلَيْكُمْ</strong><em>As-salāmu ‘alaikum</em><span>Semoga keselamatan menyertaimu.</span></div>
          </section>

          <section className="avatar-editor-settings">
            <div className="avatar-settings-head"><span><UserRound size={17}/></span><div><h2>Personalisasi avatarmu</h2><p>Semua perubahan tampil langsung di karakter 3D.</p></div></div>
            <div className="avatar-setting-section">
              <h3><span>1</span> Identitas</h3>
              <label className="avatar-field">Nama tampilan <span className="avatar-input-wrap"><input value={profile.display_name} onChange={e => setProfile(p => ({...p,display_name:e.target.value}))} maxLength={24} minLength={2} required placeholder="Misalnya Nadin Adelia"/><small>{profile.display_name.length}/24</small></span></label>
              <label className="avatar-field">Negara asal <span className="avatar-input-wrap avatar-search"><Search size={17}/><input value={countryQuery} onChange={e => setCountryQuery(e.target.value)} placeholder="Cari negara..."/></span></label>
              <div className="avatar-countries">
                {countriesFiltered.length ? countriesFiltered.map(c => <button type="button" key={c.code} onClick={() => setProfile(p => ({...p,country_code:c.code}))} className={profile.country_code === c.code ? "selected" : ""}><span>{c.flag}</span><strong>{c.code}</strong>{c.name}{profile.country_code === c.code && <Check size={14}/>}</button>) : <p>Tidak ada negara yang sesuai.</p>}
              </div>
            </div>
            <div className="avatar-setting-section">
              <h3><span>2</span> Karakter dan kulit</h3>
              <div className="avatar-small-label">Gaya karakter</div>
              <div className="avatar-pill-row"><button type="button" className={profile.avatar_variant === "male_modest" ? "selected" : ""} onClick={() => chooseVariant("male_modest")}>Laki-laki</button><button type="button" className={profile.avatar_variant === "female_hijab" ? "selected" : ""} onClick={() => chooseVariant("female_hijab")}>Perempuan</button></div>
              <div className="avatar-small-label">Warna kulit</div>
              <div className="avatar-swatch-row">{skinTones.map(color => <button key={color} type="button" className={`avatar-swatch ${profile.skin_tone === color ? "selected" : ""}`} aria-label={`Warna kulit ${color}`} style={{background:color}} onClick={() => changeAppearance({skin_tone:color})}>{profile.skin_tone === color && <Check size={17}/>}</button>)}</div>
            </div>
            <div className="avatar-setting-section">
              <h3><span>3</span> Gaya berpakaian</h3>
              <div className="avatar-small-label">{profile.avatar_variant === "female_hijab" ? "Model hijab" : "Penutup kepala"}</div>
              <div className="avatar-pill-row">{(profile.avatar_variant === "female_hijab" ? [{v:"hijab",label:"Hijab"},{v:"khimar",label:"Khimar"}] : [{v:"none",label:"Tanpa peci"},{v:"peci",label:"Peci"}]).map(option => <button type="button" key={option.v} className={profile.avatar_headwear === option.v ? "selected" : ""} onClick={() => changeAppearance({avatar_headwear: option.v as AvatarHeadwear})}>{option.label}</button>)}</div>
              <div className="avatar-small-label">Pakaian</div>
              <div className="avatar-pill-row">{([{v:"casual",label:"Santai"},{v:"formal",label:"Formal"},{v:"traditional",label:"Tradisional"}] as {v:AvatarOutfit;label:string}[]).map(option => <button key={option.v} type="button" className={profile.avatar_outfit === option.v ? "selected" : ""} onClick={() => changeAppearance({avatar_outfit:option.v})}>{option.label}</button>)}</div>
              <div className="avatar-small-label">Warna pakaian</div>
              <div className="avatar-swatch-row">{outfitColors.map(color => <button key={color} type="button" className={`avatar-swatch ${profile.avatar_color === color ? "selected" : ""}`} aria-label={`Warna pakaian ${color}`} style={{background:color}} onClick={() => changeAppearance({avatar_color:color})}>{profile.avatar_color === color && <Check size={17}/>}</button>)}</div>
            </div>
            <div className="avatar-setting-section">
              <h3><span>4</span> Level bahasa Arab</h3>
              <div className="avatar-level-grid">{([{code:"A1",name:"Pemula",desc:"Salam dan kosakata"},{code:"A2",name:"Dasar",desc:"Dialog sehari-hari"},{code:"B1",name:"Menengah",desc:"Cerita dan opini"},{code:"B2",name:"Mahir",desc:"Diskusi lanjutan"}]).map(level => <button type="button" key={level.code} className={profile.level === level.code ? "selected" : ""} onClick={() => setProfile(p => ({...p,level:level.code}))}><strong>{level.name}</strong><small>{level.code} · {level.desc}</small></button>)}</div>
            </div>
            {error && <div className="avatar-editor-error" role="alert">{error}</div>}
            {notice && <div className="avatar-editor-success" role="status">{notice}</div>}
            <div className="avatar-editor-footer"><p><CircleHelp size={15}/> {authenticatedId ? "Perubahan tersimpan di akun Supabase kamu." : "Mode demo: disimpan hanya di browser ini."}</p><button type="submit" disabled={saving || loading}>{saving ? "Menyimpan..." : "Simpan & Masuk Dunia"} <ArrowRight size={18}/></button></div>
          </section>
        </form>
      </div>
    </main>
  );
}
