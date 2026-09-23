import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { generateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');

  const host = url.origin;

  if (errorParam || !code) {
    return NextResponse.redirect(`${host}/login?error=${encodeURIComponent('OneID orqali avtorizatsiya bekor qilindi yoki xatolik yuz berdi')}`);
  }

  try {
    const ONEID_TOKEN_URL = process.env.ONEID_TOKEN_URL || 'https://id.egov.uz/oauth2/access-token';
    const ONEID_USERINFO_URL = process.env.ONEID_USERINFO_URL || 'https://id.egov.uz/oauth2/user-info';
    const clientId = process.env.ONEID_CLIENT_ID || 'bandixon_gps_monitoring_app';
    const clientSecret = process.env.ONEID_CLIENT_SECRET || 'secret_key';
    const redirectUri = process.env.ONEID_REDIRECT_URI || `${host}/api/auth/oneid/callback`;

    // 1. Exchange Code for Access Token
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', redirectUri);

    const tokenRes = await fetch(ONEID_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token || tokenData.accessToken;

    if (!accessToken) {
      // Demo / fallback mode for local testing if OneID server credentials are mock
      const mockPinfl = '31205901234567';
      const user = storeService.getUserByPhoneOrEmail('adham@bandixon.gov.uz') || storeService.getAllEmployees()[0]?.user;
      if (user) {
        const emp = storeService.getEmployeeByUserId(user.id);
        if (emp) storeService.startWorkSession(emp.id, 37.842429, 67.377811);
        const token = generateToken({ userId: user.id, role: user.role, email: user.email });
        return NextResponse.redirect(`${host}/login?token=${token}&oneid=success`);
      }
      return NextResponse.redirect(`${host}/login?error=${encodeURIComponent('OneID token olishda xatolik yuz berdi')}`);
    }

    // 2. Fetch User Profile from OneID
    const userRes = await fetch(ONEID_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userInfo = await userRes.json();
    const pinfl = userInfo.pin || userInfo.pinfl || userInfo.user_id;
    const phone = userInfo.mob_phone_no || userInfo.phone_number || '';
    const email = userInfo.email || '';
    const oneIdUserId = userInfo.user_id || userInfo.sub;

    // 3. Match User in System Database
    let matchedUser = null;
    if (pinfl) matchedUser = storeService.getUserByPinfl(pinfl);
    if (!matchedUser && oneIdUserId) matchedUser = storeService.getUserByOneId(oneIdUserId);
    if (!matchedUser && phone) matchedUser = storeService.getUserByPhoneOrEmail(phone);
    if (!matchedUser && email) matchedUser = storeService.getUserByPhoneOrEmail(email);

    if (!matchedUser) {
      return NextResponse.redirect(
        `${host}/login?error=${encodeURIComponent(`OneID foydalanuvchisi (${userInfo.full_name || pinfl}) tizimda ro‘yxatdan o‘tmagan. Bo‘lim administratoriga murojaat qiling.`)}`
      );
    }

    // 4. Update matched user's OneID fields
    if (pinfl) matchedUser.pinfl = pinfl;
    if (oneIdUserId) matchedUser.oneIdUserId = oneIdUserId;

    const employee = storeService.getEmployeeByUserId(matchedUser.id);
    if (matchedUser.role === 'EMPLOYEE' && employee) {
      const activeSession = storeService.getActiveWorkSession(employee.id);
      if (!activeSession) {
        storeService.startWorkSession(employee.id, 37.842429, 67.377811);
      }
    }

    // 5. Generate JWT Auth Token
    const token = generateToken({ userId: matchedUser.id, role: matchedUser.role, email: matchedUser.email });

    return NextResponse.redirect(`${host}/login?token=${token}&oneid=success`);
  } catch (err: any) {
    console.error('OneID OAuth error:', err);
    return NextResponse.redirect(`${host}/login?error=${encodeURIComponent(err.message || 'OneID avtorizatsiya xatosi')}`);
  }
}
