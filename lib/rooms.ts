import type { ConversationRoom } from "@/lib/types";

export const rooms: ConversationRoom[] = [
  {
    id: "cafe-a1",
    name: "Kafe Pemula",
    location: "cafe",
    level: "A1",
    description: "Perkenalan ringan, memesan minuman, dan berbasa-basi santai dengan partner baru.",
    mission: "Kenali partner-mu: nama, asal negara, dan minuman favoritnya.",
    people: 8,
    color: "#F4A261",
    mood: "Cozy cafe · warm ambience",
    starterPhrase: {
      arabic: "مَرْحَبًا، مَا اسْمُكَ؟",
      latin: "Marḥaban, mā ismuka?",
      translation: "Halo, siapa namamu?",
    },
  },
  {
    id: "campus-a2",
    name: "Kampus Santai",
    location: "campus",
    level: "A2",
    description: "Bercerita tentang jurusan, kelas favorit, jadwal kuliah, dan hobi setelah belajar.",
    mission: "Tanyakan jurusan, mata kuliah favorit, dan kegiatan akhir pekan partner-mu.",
    people: 5,
    color: "#71B7A0",
    mood: "Student lounge · collaborative",
    starterPhrase: {
      arabic: "مَا تَخَصُّصُكَ فِي الْجَامِعَةِ؟",
      latin: "Mā takhaṣṣuṣuka fī al-jāmi‘ah?",
      translation: "Apa jurusanmu di kampus?",
    },
  },
  {
    id: "home-a1",
    name: "Ruang Keluarga",
    location: "home",
    level: "A1",
    description: "Menceritakan keluarga, rumah, dan rutinitas harian dengan nuansa akrab.",
    mission: "Ceritakan siapa saja anggota keluargamu dan satu rutinitas harianmu.",
    people: 3,
    color: "#D8A7E8",
    mood: "Family room · friendly",
    starterPhrase: {
      arabic: "كَمْ عَدَدُ أَفْرَادِ أُسْرَتِكَ؟",
      latin: "Kam ‘adadu afrādi usratika?",
      translation: "Ada berapa anggota keluargamu?",
    },
  },
  {
    id: "office-b1",
    name: "Kantor Profesional",
    location: "office",
    level: "B1",
    description: "Berlatih memperkenalkan pekerjaan, membuat janji, dan berdiskusi singkat secara profesional.",
    mission: "Perkenalkan pekerjaanmu lalu ajukan janji pertemuan sederhana.",
    people: 6,
    color: "#83A8E8",
    mood: "Professional hub · focused",
    starterPhrase: {
      arabic: "مَا عَمَلُكَ؟",
      latin: "Mā ‘amaluka?",
      translation: "Apa pekerjaanmu?",
    },
  },
  {
    id: "market-a2",
    name: "Pasar Tradisional",
    location: "market",
    level: "A2",
    description: "Belajar bertanya harga, memilih barang, dan menawar dengan ekspresi yang alami.",
    mission: "Pilih satu barang, tanyakan harganya, lalu negosiasikan harga dengan sopan.",
    people: 4,
    color: "#E9A4A4",
    mood: "Traditional souq · lively",
    starterPhrase: {
      arabic: "بِكَمْ هٰذَا؟",
      latin: "Bikam hādhā?",
      translation: "Berapa harga ini?",
    },
  },
];

export const countries = [
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "EG", name: "Mesir", flag: "🇪🇬" },
  { code: "SA", name: "Arab Saudi", flag: "🇸🇦" },
  { code: "MA", name: "Maroko", flag: "🇲🇦" },
  { code: "JO", name: "Yordania", flag: "🇯🇴" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "TR", name: "Turki", flag: "🇹🇷" },
  { code: "GB", name: "Britania Raya", flag: "🇬🇧" },
  { code: "US", name: "Amerika Serikat", flag: "🇺🇸" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Jerman", flag: "🇩🇪" },
  { code: "NL", name: "Belanda", flag: "🇳🇱" },
  { code: "JP", name: "Jepang", flag: "🇯🇵" },
];

export function flagFor(code: string) {
  return countries.find((country) => country.code === code)?.flag ?? "🌐";
}
