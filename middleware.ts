import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/update-session";

export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|glb|gltf|bin|ktx2|hdr)$).*)"],
};
