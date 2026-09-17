import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/proxy-drive-image?id=FILE_ID
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing file id", { status: 400 });
  }

  try {
    // Try high-resolution Google thumbnail CDN first
    const googleUrl = `https://lh3.googleusercontent.com/d/${id}=s2400`;
    const res = await fetch(googleUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Fallback to uc?export=download
    const fallbackRes = await fetch(`https://drive.google.com/uc?export=download&id=${id}`);
    if (fallbackRes.ok) {
      const contentType = fallbackRes.headers.get("content-type") || "image/jpeg";
      const buffer = await fallbackRes.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new NextResponse("Failed to fetch image from Google Drive", { status: 502 });
  } catch (error) {
    console.error("Proxy Google Drive image error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
