import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * @file route.ts
 * @description 좋아요 추가/삭제 API
 *
 * 주요 기능:
 * 1. POST: 좋아요 추가
 * 2. DELETE: 좋아요 삭제
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증
 * - @/lib/supabase/service-role: Supabase 클라이언트
 */

interface LikeRequest {
  postId: string;
}

/**
 * POST: 좋아요 추가
 */
export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: LikeRequest = await request.json();

    if (!body.postId || typeof body.postId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'postId is required' },
        { status: 400 }
      );
    }

    const { postId } = body;

    // Supabase 클라이언트
    const supabase = getServiceRoleClient();

    // Clerk user_id를 Supabase users 테이블의 id로 변환
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !userData) {
      console.error('User lookup error:', userError);
      return NextResponse.json(
        { error: 'User not found', details: 'Failed to find user in database' },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // 게시물 존재 확인
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !postData) {
      return NextResponse.json(
        { error: 'Post not found', details: 'The specified post does not exist' },
        { status: 404 }
      );
    }

    // 중복 좋아요 확인
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러 코드
      console.error('Check like error:', checkError);
      return NextResponse.json(
        { error: 'Internal server error', details: checkError.message },
        { status: 500 }
      );
    }

    if (existingLike) {
      return NextResponse.json(
        { error: 'Conflict', details: 'Already liked this post' },
        { status: 409 }
      );
    }

    // 좋아요 추가
    const { data: likeData, error: insertError } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert like error:', insertError);
      return NextResponse.json(
        { error: 'Failed to add like', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Like added successfully',
      data: likeData,
    });
  } catch (error) {
    console.error('POST /api/likes error:', error);
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
 * DELETE: 좋아요 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: LikeRequest = await request.json();

    if (!body.postId || typeof body.postId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'postId is required' },
        { status: 400 }
      );
    }

    const { postId } = body;

    // Supabase 클라이언트
    const supabase = getServiceRoleClient();

    // Clerk user_id를 Supabase users 테이블의 id로 변환
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (userError || !userData) {
      console.error('User lookup error:', userError);
      return NextResponse.json(
        { error: 'User not found', details: 'Failed to find user in database' },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // 좋아요 존재 확인
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        // 좋아요가 존재하지 않음
        return NextResponse.json(
          { error: 'Not Found', details: 'Like not found' },
          { status: 404 }
        );
      }
      console.error('Check like error:', checkError);
      return NextResponse.json(
        { error: 'Internal server error', details: checkError.message },
        { status: 500 }
      );
    }

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Not Found', details: 'Like not found' },
        { status: 404 }
      );
    }

    // 좋아요 삭제
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Delete like error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove like', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Like removed successfully',
    });
  } catch (error) {
    console.error('DELETE /api/likes error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
