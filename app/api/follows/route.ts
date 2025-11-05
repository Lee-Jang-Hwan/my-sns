import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * @file route.ts
 * @description 팔로우 추가/삭제 API
 *
 * 주요 기능:
 * 1. POST: 팔로우 추가
 * 2. DELETE: 팔로우 삭제 (언팔로우)
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증
 * - @/lib/supabase/service-role: Supabase 클라이언트
 */

interface FollowRequest {
  followingId: string; // 팔로우할 대상 사용자 ID (Supabase UUID)
}

/**
 * POST: 팔로우 추가
 */
export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: FollowRequest = await request.json();

    if (!body.followingId || typeof body.followingId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'followingId is required' },
        { status: 400 }
      );
    }

    const { followingId } = body;

    // Supabase 클라이언트
    const supabase = getServiceRoleClient();

    // Clerk user_id를 Supabase users 테이블의 id로 변환 (팔로우하는 사람)
    const { data: followerData, error: followerError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (followerError || !followerData) {
      console.error('Follower lookup error:', followerError);
      return NextResponse.json(
        { error: 'User not found', details: 'Failed to find user in database' },
        { status: 404 }
      );
    }

    const followerId = followerData.id;

    // 팔로우 대상 사용자 존재 확인 (팔로우받는 사람)
    const { data: followingData, error: followingError } = await supabase
      .from('users')
      .select('id')
      .eq('id', followingId)
      .single();

    if (followingError || !followingData) {
      return NextResponse.json(
        { error: 'User not found', details: 'The specified user does not exist' },
        { status: 404 }
      );
    }

    // 자기 자신 팔로우 방지 검증
    if (followerId === followingId) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // 중복 팔로우 확인
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러 코드
      console.error('Check follow error:', checkError);
      return NextResponse.json(
        { error: 'Internal server error', details: checkError.message },
        { status: 500 }
      );
    }

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Conflict', details: 'Already following this user' },
        { status: 409 }
      );
    }

    // 팔로우 추가
    const { data: followData, error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert follow error:', insertError);
      return NextResponse.json(
        { error: 'Failed to add follow', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Follow added successfully',
      data: followData,
    });
  } catch (error) {
    console.error('POST /api/follows error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 팔로우 삭제 (언팔로우)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: FollowRequest = await request.json();

    if (!body.followingId || typeof body.followingId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'followingId is required' },
        { status: 400 }
      );
    }

    const { followingId } = body;

    // Supabase 클라이언트
    const supabase = getServiceRoleClient();

    // Clerk user_id를 Supabase users 테이블의 id로 변환 (팔로우 취소하는 사람)
    const { data: followerData, error: followerError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (followerError || !followerData) {
      console.error('Follower lookup error:', followerError);
      return NextResponse.json(
        { error: 'User not found', details: 'Failed to find user in database' },
        { status: 404 }
      );
    }

    const followerId = followerData.id;

    // 팔로우 관계 존재 확인
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        // 팔로우 관계가 존재하지 않음
        return NextResponse.json(
          { error: 'Not Found', details: 'Follow relationship not found' },
          { status: 404 }
        );
      }
      console.error('Check follow error:', checkError);
      return NextResponse.json(
        { error: 'Internal server error', details: checkError.message },
        { status: 500 }
      );
    }

    if (!existingFollow) {
      return NextResponse.json(
        { error: 'Not Found', details: 'Follow relationship not found' },
        { status: 404 }
      );
    }

    // 팔로우 삭제
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (deleteError) {
      console.error('Delete follow error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove follow', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Follow removed successfully',
    });
  } catch (error) {
    console.error('DELETE /api/follows error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

