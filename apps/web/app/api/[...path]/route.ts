import { type NextRequest, NextResponse } from "next/server";
import { API_SERVER_URL } from "../../../lib/constants";

/**
 * Proxy hacia apps/api.
 *
 * Existe para que el navegador vea un solo origen. Railway publica web y api en
 * subdominios distintos de up.railway.app, que esta en la Public Suffix List, asi
 * que el navegador los trata como sitios diferentes: document.cookie en el dominio
 * de la web no puede leer la cookie CSRF emitida por el de la api y toda mutacion
 * respondia 403.
 *
 * Es un route handler y no un rewrite de next.config.mjs porque los rewrites se
 * compilan dentro del build, donde la URL de la api todavia no se conoce; esto se
 * resuelve en cada peticion.
 */

export const dynamic = "force-dynamic";

const HOP_BY_HOP = ["host", "connection", "content-length", "transfer-encoding"];

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const target = `${API_SERVER_URL}/${path.join("/")}${request.nextUrl.search}`;

  const requestHeaders = new Headers(request.headers);
  for (const header of HOP_BY_HOP) {
    requestHeaders.delete(header);
  }

  const init: RequestInit = {
    method: request.method,
    headers: requestHeaders,
    redirect: "manual",
    cache: "no-store",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key !== "set-cookie" && !HOP_BY_HOP.includes(key) && key !== "content-encoding") {
      responseHeaders.set(key, value);
    }
  });

  // getSetCookie conserva cada cookie por separado; Headers.get las colapsaria
  // en una sola cadena y el navegador descartaria todas menos una.
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: { path: string[] } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  return proxy(request, params.path);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return proxy(request, params.path);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return proxy(request, params.path);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  return proxy(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return proxy(request, params.path);
}
