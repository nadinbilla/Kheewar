import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BookOpenCheck,
  Globe2,
  MapPin,
  Mic2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/config";

const features = [
  { icon: Users, title: "Teman bicara sungguhan", text: "Latihan berpasangan dengan pengguna lain, bukan percakapan AI." },
  { icon: MapPin, title: "Lokasi 3D interaktif", text: "Jelajahi kafe, kampus, rumah, kantor, dan pasar virtual." },
  { icon: Mic2, title: "Berlatih lewat suara", text: "Gunakan mikrofon untuk membangun kelancaran berbicara." },
  { icon: BookOpenCheck, title: "Misi Maharah Kalam", text: "Skenario kontekstual, kosakata, dan tujuan belajar yang jelas." },
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav page-wrap">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark">ك</span>
          <span><strong>Kheewar</strong><small>Speak Arabic together</small></span>
        </Link>
        <div className="nav-links"><a href="#fitur">Fitur</a><a href="#cara-kerja">Cara kerja</a><Link href="/login">Masuk</Link></div>
        <Link href="/avatar" className="button button-primary nav-cta">Buat Avatar <ArrowRight size={16} /></Link>
      </nav>

      <section className="hero page-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> VIRTUAL WORLD · MAHARAH KALAM</div>
          <h1>Bahasa Arab jadi hidup saat kamu <span>bertemu.</span></h1>
          <p className="hero-lead">Masuki dunia 3D, temui teman dari berbagai negara, dan latih percakapan bahasa Arab dalam situasi sehari-hari. Belajar bersama manusia sungguhan—bukan chatbot.</p>
          <div className="hero-actions">
            <Link href="/avatar" className="button button-primary button-large"><Sparkles size={17} /> Buat Avatar 3D <ArrowRight size={17} /></Link>
            <Link href="/login" className="button button-quiet button-large">Buat akun</Link>
          </div>
          <div className="hero-trust"><span><Users size={15} /> Percakapan antarpengguna</span><span><ShieldCheck size={15} /> Ruang belajar aman</span></div>
        </div>
        <div className="hero-art" aria-label="Pratinjau dunia virtual 3D">
          <div className="art-glow" />
          <div className="world-window">
            <div className="world-window-top"><span className="window-dots"><i /><i /><i /></span><span className="world-live"><span /> WORLD PREVIEW</span><span className="mini-weather">☀ 26°</span></div>
            <div className="scene-preview">
              <div className="scene-sky" />
              <div className="scene-sun" />
              <div className="scene-building building-back"><span /><span /><span /></div>
              <div className="scene-building building-front"><span /><span /><span /></div>
              <div className="scene-tree tree-one"><i /><b /></div><div className="scene-tree tree-two"><i /><b /></div>
              <div className="scene-path" />
              <div className="scene-avatar avatar-one"><i /><b /><em /></div><div className="scene-avatar avatar-two"><i /><b /><em /></div>
              <div className="avatar-tag tag-one"><span className="tiny-flag">🇮🇩</span> Ahmad <i>●</i></div>
              <div className="avatar-tag tag-two"><span className="tiny-flag">🇪🇬</span> Yusuf <i>●</i></div>
              <div className="scene-place-label"><MapPin size={13} /> AL-MAHA CAFE</div>
              <div className="scene-chat-bubble">السَّلَامُ عَلَيْكُمْ <span>•••</span></div>
              <div className="scene-controls"><span>W</span><span>A</span><span>S</span><span>D</span><small>MOVE</small></div>
            </div>
            <div className="world-window-bottom"><span><span className="online-dot" /> 18 learners online</span><span><AudioLines size={14} /> Voice enabled</span></div>
          </div>
          <div className="floating-card float-mission"><span className="float-icon"><BookOpenCheck size={17} /></span><span><small>DAILY MISSION</small><strong>Kenali teman barumu</strong></span><span className="mission-check">✓</span></div>
          <div className="floating-card float-level"><span className="level-ring">A1</span><span><small>YOUR JOURNEY</small><strong>Beginner Arabic</strong><em>Level 1 of 8</em></span></div>
        </div>
      </section>

      <section className="stats-strip page-wrap"><div><strong>01</strong><span>dunia virtual</span></div><div><strong>05</strong><span>lokasi percakapan</span></div><div><strong>∞</strong><span>topik bersama</span></div><div><strong>2+</strong><span>orang per percakapan</span></div></section>

      <section id="fitur" className="features-section page-wrap">
        <div className="section-heading"><div className="eyebrow">BELAJAR DENGAN CARA BARU</div><h2>Bukan menghafal dialog.<br /><span>Jalani percakapannya.</span></h2><p>Setiap fitur dirancang untuk mendorong interaksi nyata dan membuat latihan berbicara terasa alami.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, text }, index) => <article className="feature-card" key={title}><div className={`feature-icon feature-icon-${index}`}><Icon size={21} /></div><h3>{title}</h3><p>{text}</p><span className="feature-index">0{index + 1}</span></article>)}</div>
      </section>

      <section id="cara-kerja" className="how-section"><div className="page-wrap how-inner"><div className="how-copy"><div className="eyebrow">MULAI DALAM TIGA LANGKAH</div><h2>Temukan partner.<br /><span>Mulai berbicara.</span></h2><p>Pilih lokasi, temukan partner yang sesuai dengan levelmu, lalu selesaikan misi percakapan bersama.</p><Link href="/world" className="button button-primary">Coba prototype <ArrowRight size={16} /></Link></div><div className="steps-list"><div className="step-item"><span className="step-number">01</span><div><strong>Pilih tempat dan level</strong><p>Kafe pemula, kampus menengah, atau ruang percakapan bebas.</p></div><Globe2 size={20} /></div><div className="step-item"><span className="step-number">02</span><div><strong>Bertemu pengguna lain</strong><p>Gunakan ruang publik atau undang teman untuk berlatih berdua.</p></div><Users size={20} /></div><div className="step-item"><span className="step-number">03</span><div><strong>Berbicara, bukan membaca skrip</strong><p>Ikuti misi sebagai panduan, tetapi tentukan sendiri jawabanmu.</p></div><Mic2 size={20} /></div></div></div></section>

      <section className="final-cta page-wrap"><div className="cta-orb">ك</div><div><div className="eyebrow">YUK, MULAI BERBICARA</div><h2>Bahasa tumbuh lewat percakapan.</h2><p>Masuk ke dunia Kheewar dan mulai perjalanan Maharah Kalam-mu.</p></div><Link href="/world" className="button button-primary button-large">Masuk dunia <ArrowRight size={17} /></Link></section>
      <footer className="landing-footer page-wrap"><Link href="/" className="brand-lockup"><span className="brand-mark">ك</span><span><strong>Kheewar</strong><small>Speak Arabic together</small></span></Link><p>Dirancang untuk latihan bahasa Arab antarmanusia.</p><span>© 2026 Kheewar · Prototype</span></footer>
      {!isSupabaseConfigured && <div className="demo-notice"><span className="online-dot" /> Mode demo aktif · Backend belum dikonfigurasi</div>}
    </main>
  );
}
