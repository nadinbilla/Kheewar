"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Supabase belum dikonfigurasi. Kamu tetap bisa mencoba prototype tanpa akun."); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        if (name.trim().length < 2) throw new Error("Nama tampilan minimal 2 karakter.");
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: name.trim(), country_code: "ID" }, emailRedirectTo: `${window.location.origin}/avatar` },
        });
        if (signUpError) throw signUpError;
        if (data.session) window.location.href = "/avatar";
        else setMessage("Akun dibuat. Jika konfirmasi email aktif, buka emailmu untuk mengonfirmasi akun sebelum masuk.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        window.location.href = "/avatar";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally { setBusy(false); }
  }

  return <main className="auth-shell"><div className="auth-art"><Link href="/" className="brand-lockup"><span className="brand-mark">ك</span><span><strong>Kheewar</strong><small>Speak Arabic together</small></span></Link><div className="auth-art-content"><div className="eyebrow"><span className="eyebrow-dot" /> A WORLD OF CONVERSATION</div><h1>Teman baru.<br /><span>Bahasa baru.</span><br />Pengalaman nyata.</h1><p>Temukan partner percakapan, jelajahi tempat virtual, dan tumbuh bersama lewat bahasa Arab.</p><div className="auth-mini-people"><span>🇮🇩</span><span>🇪🇬</span><span>🇸🇦</span><span>🇲🇦</span><small>Belajar lintas budaya</small></div></div><div className="auth-art-footer">مَرْحَبًا بِكَ فِي عَالَمِ الْعَرَبِيَّةِ</div></div><div className="auth-form-side"><Link href="/" className="back-link"><ArrowLeft size={16} /> Kembali ke beranda</Link><div className="auth-form-wrap"><div className="auth-welcome-icon"><Sparkles size={21} /></div><h2>{mode === "signup" ? "Mulai perjalananmu" : "Selamat datang kembali"}</h2><p className="auth-subtitle">{mode === "signup" ? "Buat akun dan temukan teman latihan bahasa Arab." : "Masuk untuk bertemu partner percakapanmu."}</p><div className="auth-tabs"><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>Buat akun</button><button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>Masuk</button></div>
      {!isSupabaseConfigured && <div className="setup-callout"><CheckCircle2 size={18} /><div><strong>Prototype siap dicoba</strong><p>Backend akun belum dihubungkan. Kamu bisa langsung menjelajahi dunia 3D sebagai tamu.</p><Link href="/world" className="inline-link">Coba dunia 3D <ArrowRight size={14} /></Link></div></div>}
      <form onSubmit={handleSubmit} className="auth-form">{mode === "signup" && <label>Nama tampilan<div className="input-wrap"><Sparkles size={17} /><input autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Misalnya, Ahmad" minLength={2} maxLength={32} required /></div></label>}<label>Email<div className="input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required /></div></label><label>Kata sandi<div className="input-wrap"><LockKeyhole size={17} /><input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" minLength={8} required /></div></label>{error && <div className="form-error" role="alert">{error}</div>}{message && <div className="form-success" role="status">{message}</div>}<button className="button button-primary auth-submit" type="submit" disabled={busy || !isSupabaseConfigured}>{busy ? "Memproses..." : mode === "signup" ? "Buat akun" : "Masuk ke Kheewar"}<ArrowRight size={17} /></button></form><p className="auth-terms">Dengan melanjutkan, gunakan nama tampilan yang aman dan hormati pengguna lain di ruang percakapan.</p></div></div></main>;
}
