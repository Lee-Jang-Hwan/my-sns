/**
 * @file page.tsx
 * @description 내 프로필 페이지 - 자신의 프로필로 리다이렉트
 *
 * 주요 기능:
 * 1. 현재 로그인한 사용자의 Clerk ID를 가져옴
 * 2. Supabase users 테이블에서 해당 사용자의 user_id 조회
 * 3. 사용자를 찾을 수 없으면 자동으로 동기화 시도
 * 4. /profile/[userId]로 리다이렉트
 *
 * @dependencies
 * - @clerk/nextjs: 인증 상태 확인
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Clerk 사용자를 Supabase에 동기화
 */
async function syncUserToSupabase(clerkUserId: string) {
  try {
    console.log('syncUserToSupabase: Fetching user from Clerk', { clerkUserId });
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);

    if (!clerkUser) {
      console.error('syncUserToSupabase: User not found in Clerk', { clerkUserId });
      throw new Error('Clerk에서 사용자를 찾을 수 없습니다.');
    }

    console.log('syncUserToSupabase: Clerk user found', {
      clerkId: clerkUser.id,
      fullName: clerkUser.fullName,
      username: clerkUser.username,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    const supabase = getServiceRoleClient();
    const userName =
      clerkUser.fullName ||
      clerkUser.username ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      'Unknown';

    console.log('syncUserToSupabase: Upserting user to Supabase', {
      clerk_id: clerkUser.id,
      name: userName,
    });

    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          clerk_id: clerkUser.id,
          name: userName,
        },
        {
          onConflict: 'clerk_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('syncUserToSupabase: Supabase sync error', {
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
      });
      throw error;
    }

    console.log('syncUserToSupabase: User synced successfully', {
      userId: data?.id,
      clerkId: data?.clerk_id,
      name: data?.name,
    });

    return data;
  } catch (error) {
    console.error('syncUserToSupabase: Error syncing user', {
      clerkUserId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export default async function ProfilePage() {
  const { userId: clerkUserId } = await auth();

  // 로그인하지 않은 경우 홈으로 리다이렉트
  if (!clerkUserId) {
    console.log('ProfilePage: No clerkUserId, redirecting to home');
    redirect('/');
  }

  console.log('ProfilePage: Looking up user in Supabase', { clerkUserId });

  // Supabase에서 현재 사용자의 user_id 조회
  const supabase = getServiceRoleClient();
  const { data: initialUserData, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkUserId)
    .single();
  let userData = initialUserData;

  // 사용자를 찾을 수 없는 경우 동기화 시도
  if (error || !userData) {
    console.log('ProfilePage: User not found in Supabase, attempting to sync...', {
      error: error?.message,
      errorCode: error?.code,
    });

    let syncedUser: { id: string } | null = null;
    try {
      // 동기화 시도
      const result = await syncUserToSupabase(clerkUserId);
      if (result && result.id) {
        syncedUser = { id: result.id };
        console.log('ProfilePage: User synced successfully', { userId: result.id });
      } else {
        console.error('ProfilePage: Sync returned no user data', { result });
      }
    } catch (syncError) {
      // 동기화 중 에러 발생
      console.error('ProfilePage: Failed to sync user:', syncError);
      
      // 동기화 실패 시 다시 한 번 users 테이블 확인 (동시성 문제 대비)
      const { data: retryUserData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();
      
      if (retryUserData) {
        console.log('ProfilePage: User found on retry', { userId: retryUserData.id });
        userData = retryUserData;
      } else {
        // 여전히 찾을 수 없으면 홈으로 리다이렉트
        console.error('ProfilePage: User still not found after sync and retry');
        redirect('/');
      }
    }

    // 동기화 성공 시 userData 업데이트
    if (syncedUser) {
      userData = syncedUser;
    }
  } else {
    console.log('ProfilePage: User found in Supabase', { userId: userData.id });
  }

  // 사용자 데이터가 없는 경우 홈으로 리다이렉트
  if (!userData?.id) {
    console.error('ProfilePage: No userData.id, redirecting to home');
    redirect('/');
  }

  // 자신의 프로필 페이지로 리다이렉트
  console.log('ProfilePage: Redirecting to profile page', { userId: userData.id });
  // 참고: redirect()는 내부적으로 NEXT_REDIRECT 에러를 throw합니다.
  // 이것은 Next.js의 정상적인 리다이렉트 메커니즘이며, 개발 환경 콘솔에 표시될 수 있지만 실제 에러가 아닙니다.
  redirect(`/profile/${userData.id}`);
}

