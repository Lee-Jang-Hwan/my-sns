/**
 * @file check-env.ts
 * @description 환경 변수 확인 유틸리티
 *
 * 개발 중 환경 변수가 제대로 설정되었는지 확인하는 데 사용됩니다.
 */

/**
 * Clerk 환경 변수가 설정되어 있는지 확인
 */
export function checkClerkEnv(): {
  isValid: boolean;
  missing: string[];
} {
  const required = [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
  ];

  const missing: string[] = [];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Supabase 환경 변수가 설정되어 있는지 확인
 */
export function checkSupabaseEnv(): {
  isValid: boolean;
  missing: string[];
} {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing: string[] = [];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * 모든 필수 환경 변수가 설정되어 있는지 확인
 */
export function checkAllEnv(): {
  isValid: boolean;
  clerk: { isValid: boolean; missing: string[] };
  supabase: { isValid: boolean; missing: string[] };
} {
  const clerk = checkClerkEnv();
  const supabase = checkSupabaseEnv();

  return {
    isValid: clerk.isValid && supabase.isValid,
    clerk,
    supabase,
  };
}

