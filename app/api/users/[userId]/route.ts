import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * @file route.ts
 * @description 사용자 프로필 정보 조회 API
 *
 * GET 주요 기능:
 * 1. user_stats 뷰에서 사용자 정보 및 통계 조회
 * 2. userId는 Supabase UUID 또는 clerk_id 지원
 * 3. 사용자 통계: 게시물 수, 팔로워 수, 팔로잉 수
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 클라이언트 (RLS 비활성화)
 */

interface UserStatsRow {
  user_id: string;
  clerk_id: string;
  name: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 (RLS 비활성화 상태이므로 service-role 사용)
    const supabase = getServiceRoleClient();

    // userId가 UUID 형식인지 확인 (UUID는 36자, 하이픈 포함)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    );

    let userStatsQuery;

    if (isUUID) {
      // UUID로 조회 (Supabase user_id)
      userStatsQuery = supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
    } else {
      // clerk_id로 조회
      userStatsQuery = supabase
        .from('user_stats')
        .select('*')
        .eq('clerk_id', userId)
        .single();
    }

    let { data: userStats, error: userStatsError } = await userStatsQuery;

    // user_stats 뷰에서 사용자를 찾을 수 없는 경우, users 테이블에서 직접 확인
    if (userStatsError && userStatsError.code === 'PGRST116') {
      console.log('User not found in user_stats view, checking users table...');
      
      // users 테이블에서 직접 조회 시도
      let userQuery;
      if (isUUID) {
        userQuery = supabase
          .from('users')
          .select('id, clerk_id, name, profile_image_url')
          .eq('id', userId)
          .single();
      } else {
        userQuery = supabase
          .from('users')
          .select('id, clerk_id, name, profile_image_url')
          .eq('clerk_id', userId)
          .single();
      }

      const { data: userData, error: userError } = await userQuery;

      if (userError || !userData) {
        // users 테이블에도 없으면 동기화 시도 (clerk_id인 경우만)
        if (!isUUID) {
          try {
            const { userId: currentClerkUserId } = await auth();
            // 현재 로그인한 사용자이고, 조회하려는 사용자가 자신인 경우에만 동기화 시도
            if (currentClerkUserId === userId) {
              const client = await clerkClient();
              const clerkUser = await client.users.getUser(userId);

              if (clerkUser) {
                const { data: syncedUser } = await supabase
                  .from('users')
                  .upsert(
                    {
                      clerk_id: clerkUser.id,
                      name:
                        clerkUser.fullName ||
                        clerkUser.username ||
                        clerkUser.emailAddresses[0]?.emailAddress ||
                        'Unknown',
                    },
                    {
                      onConflict: 'clerk_id',
                    }
                  )
                  .select()
                  .single();

                if (syncedUser) {
                  // 동기화 성공 후 user_stats 뷰에서 다시 조회
                  const retryQuery = supabase
                    .from('user_stats')
                    .select('*')
                    .eq('user_id', syncedUser.id)
                    .single();

                  const { data: retryStats } = await retryQuery;
                  if (retryStats) {
                    userStats = retryStats;
                    userStatsError = null;
                  } else {
                    // 뷰에 아직 반영되지 않았으면 직접 통계 계산
                    const { count: postsCount } = await supabase
                      .from('posts')
                      .select('id', { count: 'exact', head: true })
                      .eq('user_id', syncedUser.id);

                    const { count: followersCount } = await supabase
                      .from('follows')
                      .select('id', { count: 'exact', head: true })
                      .eq('following_id', syncedUser.id);

                    const { count: followingCount } = await supabase
                      .from('follows')
                      .select('id', { count: 'exact', head: true })
                      .eq('follower_id', syncedUser.id);

                    userStats = {
                      user_id: syncedUser.id,
                      clerk_id: syncedUser.clerk_id,
                      name: syncedUser.name,
                      profile_image_url: syncedUser.profile_image_url,
                      posts_count: postsCount || 0,
                      followers_count: followersCount || 0,
                      following_count: followingCount || 0,
                    };
                    userStatsError = null;
                  }
                }
              }
            }
          } catch (syncError) {
            console.error('Failed to sync user in API:', syncError);
          }
        }

        // 여전히 사용자를 찾을 수 없는 경우
        if (!userStats) {
          return NextResponse.json(
            { error: '사용자를 찾을 수 없습니다.' },
            { status: 404 }
          );
        }
      } else {
        // users 테이블에는 있지만 user_stats 뷰에 없는 경우 (통계 직접 계산)
        const { count: postsCount } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userData.id);

        const { count: followersCount } = await supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userData.id);

        const { count: followingCount } = await supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userData.id);

        userStats = {
          user_id: userData.id,
          clerk_id: userData.clerk_id,
          name: userData.name,
          profile_image_url: userData.profile_image_url,
          posts_count: postsCount || 0,
          followers_count: followersCount || 0,
          following_count: followingCount || 0,
        };
        userStatsError = null;
      }
    } else if (userStatsError) {
      // 다른 에러인 경우
      console.error('User stats query error:', userStatsError);
      return NextResponse.json(
        {
          error: '사용자 정보를 불러오는데 실패했습니다.',
          details: userStatsError.message,
        },
        { status: 500 }
      );
    }

    if (!userStats) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 응답 데이터 포맷팅
    const response: UserStatsRow = {
      user_id: userStats.user_id,
      clerk_id: userStats.clerk_id,
      name: userStats.name,
      posts_count: Number(userStats.posts_count) || 0,
      followers_count: Number(userStats.followers_count) || 0,
      following_count: Number(userStats.following_count) || 0,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


