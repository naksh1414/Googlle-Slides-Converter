import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  // Handle missing authorization code
  if (!code) {
    console.error("No authorization code received");
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!, // Note: Should be server-side only
        code,
        grant_type: "authorization_code",
        redirect_uri: `${new URL(request.url).origin}/api/auth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/?error=token_exchange_failed", request.url)
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token } = tokens;
    console.log("Access token received:", access_token);
    console.log("Refresh token received:", refresh_token);
    // Redirect back to the frontend with the access token
    // Note: In production, you should handle this more securely
    return NextResponse.redirect(
      new URL(`/?token=${access_token}`, request.url)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=callback_failed", request.url)
    );
  }
}
