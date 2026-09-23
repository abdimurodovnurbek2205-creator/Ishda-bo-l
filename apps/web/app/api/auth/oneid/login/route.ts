import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getPublicHost(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const hostHeader = request.headers.get('host');
  if (hostHeader && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1')) {
    return `https://${hostHeader}`;
  }
  const url = new URL(request.url);
  if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
    return url.origin;
  }
  return 'https://ishda-bol-gps.onrender.com';
}

export async function GET(request: Request) {
  const host = getPublicHost(request);

  const clientId = process.env.ONEID_CLIENT_ID;
  const ONEID_AUTHORIZE_URL = process.env.ONEID_AUTHORIZE_URL || 'https://sso.egov.uz/sso/oauth/Authorization.do';
  const redirectUri = process.env.ONEID_REDIRECT_URI || `${host}/api/auth/oneid/callback`;

  // If real official OneID client_id is set in env variables, redirect to e-Gov SSO endpoint
  if (clientId) {
    const authorizeUrl = `${ONEID_AUTHORIZE_URL}?response_type=one_code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=id,email,phone,pin`;
    return NextResponse.redirect(authorizeUrl);
  }

  // Demo / local test mode: if client_id is not yet configured, seamlessly authenticate
  return NextResponse.redirect(`${host}/api/auth/oneid/callback?code=demo_auth_code`);
}
