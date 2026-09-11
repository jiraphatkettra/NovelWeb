import { NextResponse } from "next/server";

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export function apiSuccess<T>(data: T, meta?: ApiResponseMeta, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(code: string, message: string, details?: unknown, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details: details || {},
      },
    },
    { status }
  );
}
