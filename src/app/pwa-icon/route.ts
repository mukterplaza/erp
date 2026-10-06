import { ImageResponse } from "next/og";
import { createElement } from "react";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const requestedSize = request.nextUrl.searchParams.get("size");

  if (
    requestedSize !== "180" &&
    requestedSize !== "192" &&
    requestedSize !== "512"
  ) {
    return new Response("Unsupported icon size", { status: 400 });
  }

  const size = Number(requestedSize);
  const fontSize = Math.round(size * 0.19);

  const icon = createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617",
      },
    },
    createElement(
      "div",
      {
        style: {
          width: "78%",
          height: "78%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: Math.round(size * 0.16),
          backgroundColor: "#10b981",
          color: "#020617",
          fontSize,
          fontWeight: 800,
          letterSpacing: "-0.06em",
        },
      },
      "INSAF"
    )
  );

  return new ImageResponse(icon, {
    width: size,
    height: size,
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}