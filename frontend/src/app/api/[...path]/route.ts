import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:5005";

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetUrl = new URL(`/api/${path.join("/")}`, BACKEND_URL);
  request.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.append(key, val));

  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  try {
    const res = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body,
    });

    const resHeaders = new Headers();
    res.headers.forEach((val, key) => resHeaders.set(key, val));

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, target: targetUrl.toString() }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
