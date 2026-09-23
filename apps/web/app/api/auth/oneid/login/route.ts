import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = url.origin;

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
