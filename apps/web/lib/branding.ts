import { API_SERVER_URL } from "./constants";

export interface PublicBranding {
  name: string;
  branding: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string | null;
    faviconUrl: string | null;
  } | null;
}

/** Publico, sin sesion: hasta /login necesita mostrar el nombre/colores de la escuela. */
export async function getPublicBranding(): Promise<PublicBranding | null> {
  try {
    const response = await fetch(`${API_SERVER_URL}/organization/branding`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublicBranding;
  } catch {
    return null;
  }
}
