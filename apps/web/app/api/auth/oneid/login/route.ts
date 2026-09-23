import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const ONEID_AUTHORIZE_URL = process.env.ONEID_AUTHORIZE_URL || 'https://id.egov.uz/oauth2/authorize';
  const clientId = process.env.ONEID_CLIENT_ID || 'bandixon_gps_monitoring_app';
  
  const url = new URL(request.url);
  const host = url.origin;
  const redirectUri = process.env.ONEID_REDIRECT_URI || `${host}/api/auth/oneid/callback`;

  const authorizeUrl = `${ONEID_AUTHORIZE_URL}?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=id,email,phone,pin`;

  return NextResponse.redirect(authorizeUrl);
}
