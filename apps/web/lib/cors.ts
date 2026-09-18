import { NextResponse } from 'next/server';

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
}

export function handleCorsOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export function jsonWithCors(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(),
  });
}
