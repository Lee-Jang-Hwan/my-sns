/**
 * @file page.tsx
 * @description 사용자 프로필 페이지 (동적 라우트)
 *
 * 주요 기능:
 * 1. userId 파라미터로 사용자 프로필 조회
 * 2. user_stats 뷰를 활용한 사용자 통계 표시
 * 3. 로딩 및 에러 상태 처리
 * 4. 팔로우/팔로잉 버튼 표시 (자기 자신 제외)
 * 5. 프로필 편집 버튼 표시 (자기 자신일 때만)
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @/components/profile/ProfileAvatar: 프로필 아바타 컴포넌트
 * - @/components/profile/ProfileHeader: 프로필 헤더 컴포넌트 (사용자명, 이름)
 * - @/components/profile/ProfileStats: 프로필 통계 컴포넌트 (게시물, 팔로워, 팔로잉)
 * - @/components/profile/FollowButton: 팔로우/팔로잉 버튼 컴포넌트
 * - @/components/profile/EditProfileButton: 프로필 편집 버튼 컴포넌트
 * - @/components/profile/PostGrid: 게시물 그리드 컴포넌트
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import FollowButton from '@/components/profile/FollowButton';
import EditProfileButton from '@/components/profile/EditProfileButton';
import PostGrid from '@/components/profile/PostGrid';

interface UserStats {
  user_id: string;
  clerk_id: string;
  name: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

interface PageProps {
  params: Promise<{ userId: string }>;
}

/**
 * Supabase에서 직접 사용자 프로필 조회
 */
async function fetchUserProfile(userId: string): Promise<UserStats> {
  const supabase = getServiceRoleClient();

  // userId가 UUID 형식인지 확인
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

  const { data: initialUserStats, error: userStatsError } = await userStatsQuery;
  let userStats = initialUserStats;

  // user_stats 뷰에서 사용자를 찾을 수 없는 경우, users 테이블에서 직접 확인
  if (userStatsError && userStatsError.code === 'PGRST116') {
    console.log('User not found in user_stats view, checking users table...', {
      userId,
      isUUID,
    });

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
      // users 테이블에도 없으면 에러
      console.error('User not found in users table:', {
        userId,
        isUUID,
        error: userError,
      });
      throw new Error('사용자를 찾을 수 없습니다.');
    }

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
  } else if (userStatsError) {
    // 다른 에러인 경우
    console.error('User stats query error:', userStatsError);
    throw new Error('사용자 정보를 불러오는데 실패했습니다.');
  }

  if (!userStats) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  return {
    user_id: userStats.user_id,
    clerk_id: userStats.clerk_id,
    name: userStats.name,
    posts_count: Number(userStats.posts_count) || 0,
    followers_count: Number(userStats.followers_count) || 0,
    following_count: Number(userStats.following_count) || 0,
  };
}

/**
 * 현재 사용자가 대상 사용자를 팔로우하는지 확인
 */
async function checkFollowStatus(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .single();

    if (error) {
      // PGRST116은 "no rows returned" 에러 코드 (팔로우하지 않음)
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Check follow status error:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Check follow status error:', error);
    return false;
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params;

  let userStats: UserStats;
  let error: string | null = null;

  try {
    userStats = await fetchUserProfile(userId);
  } catch (err) {
    error = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // 현재 사용자 확인 (Clerk)
  const { userId: currentClerkUserId } = await auth();

  // 현재 사용자의 Supabase user_id 조회 (팔로우 상태 확인용)
  let currentUserId: string | null = null;
  let isFollowing = false;
  let isOwnProfile = false;

  if (currentClerkUserId) {
    try {
      const supabase = getServiceRoleClient();
      const { data: initialCurrentUserData, error: currentUserError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', currentClerkUserId)
        .single();
      let currentUserData = initialCurrentUserData;

      // 사용자를 찾을 수 없는 경우 동기화 시도
      if (currentUserError || !currentUserData) {
        console.log('Current user not found, attempting to sync...');
        try {
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(currentClerkUserId);

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
              currentUserData = { id: syncedUser.id };
            }
          }
        } catch (syncErr) {
          console.error('Failed to sync current user:', syncErr);
        }
      }

      if (currentUserData) {
        currentUserId = currentUserData.id;
        // 자기 자신 프로필인지 확인
        isOwnProfile = currentUserId === userStats.user_id;

        // 자기 자신이 아닌 경우에만 팔로우 상태 확인
        if (!isOwnProfile) {
          isFollowing = await checkFollowStatus(currentUserId, userStats.user_id);
        }
      }
    } catch (err) {
      console.error('Failed to check follow status:', err);
    }
  }

  // 사용자 프로필 정보 표시
  return (
    <div className="w-full bg-white">
      <div className="px-4 py-8 max-w-[935px] mx-auto">
        {/* 기본 프로필 정보 영역 */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* 프로필 이미지 영역 */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <ProfileAvatar imageUrl={null} name={userStats.name} />
          </div>

          {/* 사용자 정보 영역 */}
          <div className="flex-1">
            {/* 사용자명 및 이름 */}
            <div className="mb-4">
              <ProfileHeader
                username={userStats.name}
                fullname={userStats.name}
              />
            </div>

            {/* 통계 정보 */}
            <div className="mb-6">
              <ProfileStats
                postsCount={userStats.posts_count}
                followersCount={userStats.followers_count}
                followingCount={userStats.following_count}
              />
            </div>

            {/* 팔로우/팔로잉 버튼 (자기 자신 제외) 또는 프로필 편집 버튼 (자기 자신일 때만) */}
            {isOwnProfile ? (
              <div className="mb-4">
                <EditProfileButton />
              </div>
            ) : (
              currentUserId && (
                <div className="mb-4">
                  <FollowButton
                    targetUserId={userStats.user_id}
                    initialIsFollowing={isFollowing}
                    currentUserId={currentUserId}
                  />
                </div>
              )
            )}

            {/* 사용자 ID (디버깅용, 추후 제거 가능) */}
            <div className="text-sm text-gray-500 mt-4">
              <p>User ID: {userStats.user_id}</p>
              <p>Clerk ID: {userStats.clerk_id}</p>
            </div>
          </div>
        </div>

        {/* 게시물 그리드 */}
        <div className="mt-8">
          <PostGrid userId={userStats.user_id} />
        </div>
      </div>
    </div>
  );
}

