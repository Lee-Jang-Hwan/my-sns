import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * @file route.ts
 * @description 댓글 작성 API
 *
 * 주요 기능:
 * 1. POST: 댓글 작성
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증
 * - @/lib/supabase/service-role: Supabase 클라이언트
 */

interface CommentRequest {
  postId: string;
  content: string;
}

const MAX_COMMENT_LENGTH = 2200; // 최대 댓글 길이 (PRD.md 기준)

/**
 * POST: 댓글 작성
 */
export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: CommentRequest = await request.json();

    // 요청 본문 검증
    if (!body.postId || typeof body.postId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'postId is required' },
        { status: 400 }
      );
    }

    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'content is required' },
        { status: 400 }
      );
    }

    const { postId, content } = body;

    // 댓글 내용 검증
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', details: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          details: `댓글은 최대 ${MAX_COMMENT_LENGTH}자까지 입력 가능합니다.`,
        },
        { status: 400 }
      );
    }

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
        {
          error: 'Post not found',
          details: 'The specified post does not exist',
        },
        { status: 404 }
      );
    }

    // 댓글 저장
    const { data: commentData, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: trimmedContent,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert comment error:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to create comment',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comment created successfully',
      data: commentData,
    });
  } catch (error) {
    console.error('POST /api/comments error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

