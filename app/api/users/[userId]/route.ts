import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

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

    const { data: userStats, error: userStatsError } = await userStatsQuery;

    if (userStatsError) {
      console.error('User stats query error:', userStatsError);

      // 사용자를 찾을 수 없는 경우
      if (userStatsError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

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


