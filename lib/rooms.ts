import type { ConversationRoom } from "@/lib/types";

export const rooms: ConversationRoom[] = [
  {
    id: "cafe-a1",
    name: "Kafe Pemula",
    location: "cafe",
    level: "A1",
    description: "Berkenalan, memesan minuman, dan berbasa-basi.",
    mission: "Kenali partner-mu: nama, asal negara, dan minuman favoritnya.",
    people: 8,
    color: "#F4A261",
  },
  {
    id: "campus-a2",
    name: "Kampus Santai",
    location: "campus",
    level: "A2",
    description: "Bercerita tentang kuliah, jadwal, dan hobi.",
    mission: "Tanyakan jurusan, mata kuliah favorit, dan kegiatan akhir pekan.",
    people: 5,
    color: "#71B7A0",
  },
  {
    id: "home-a1",
    name: "Ruang Keluarga",
    location: "home",
    level: "A1",
    description: "Keluarga, rutinitas harian, dan rumah.",
    mission: "Ceritakan siapa saja anggota keluargamu dan rutinitas harianmu.",
    people: 3,
    color: "#D8A7E8",
  },
  {
    id: "office-b1",
    name: "Kantor Profesional",
    location: "office",
    level: "B1",
    description: "Pekerjaan, rapat, dan membuat janji.",
    mission: "Perkenalkan pekerjaanmu lalu buat janji bertemu dengan partner.",
    people: 6,
    color: "#83A8E8",
  },
  {
    id: "market-a2",
    name: "Pasar Tradisional",
    location: "market",
    level: "A2",
    description: "Belanja, bertanya harga, dan tawar-menawar.",
    mission: "Pilih satu barang, tanyakan harganya, lalu negosiasikan harga.",
    people: 4,
    color: "#E9A4A4",
  },
];

export const countries = [
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "EG", name: "Mesir", flag: "🇪🇬" },
  { code: "SA", name: "Arab Saudi", flag: "🇸🇦" },
  { code: "MA", name: "Maroko", flag: "🇲🇦" },
  { code: "JO", name: "Yordania", flag: "🇯🇴" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "US", name: "Amerika Serikat", flag: "🇺🇸" },
  { code: "GB", name: "Britania Raya", flag: "🇬🇧" },
];

export function flagFor(code: string) {
  return countries.find((country) => country.code === code)?.flag ?? "🌐";
}
