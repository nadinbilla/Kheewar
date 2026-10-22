export type LocationId = "cafe" | "home" | "office" | "campus" | "market";

export type ConversationRoom = {
  id: string;
  name: string;
  location: LocationId;
  level: "A1" | "A2" | "B1" | "B2" | "Bebas";
  description: string;
  mission: string;
  people: number;
  color: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
  is_local?: boolean;
};

export type AvatarPosition = {
  x: number;
  z: number;
};

export type RemoteAvatar = {
  id: string;
  name: string;
  country_code: string;
  x: number;
  z: number;
  color?: string;
};

export type UserProfile = {
  id: string;
  display_name: string;
  country_code: string;
  level: string;
  avatar_color: string;
};
