import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * @file route.ts
 * @description 게시물 삭제 API
 *
 * 주요 기능:
 * 1. 게시물 삭제 (본인 게시물만)
 * 2. Storage에서 이미지 파일 삭제
 * 3. 본인 게시물 검증
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증
 * - @/lib/supabase/service-role: Supabase 클라이언트
 */

interface DeletePostParams {
  postId: string;
}

/**
 * DELETE: 게시물 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<DeletePostParams> }
) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 경로 파라미터 추출 (Next.js 15)
    const { postId } = await params;

    if (!postId || typeof postId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', details: 'postId is required' },
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

    // 게시물 존재 확인 및 조회 (image_url 포함)
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('id, user_id, image_url')
      .eq('id', postId)
      .single();

    if (postError) {
      if (postError.code === 'PGRST116') {
        // 게시물이 존재하지 않음
        return NextResponse.json(
          { error: 'Not Found', details: 'Post not found' },
          { status: 404 }
        );
      }
      console.error('Post query error:', postError);
      return NextResponse.json(
        { error: 'Internal server error', details: postError.message },
        { status: 500 }
      );
    }

    if (!postData) {
      return NextResponse.json(
        { error: 'Not Found', details: 'Post not found' },
        { status: 404 }
      );
    }

    // 본인 게시물인지 검증
    if (postData.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', details: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Storage 버킷 이름 (환경 변수 또는 기본값)
    const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'uploads';

    // Storage에서 이미지 파일 삭제 (이미지 URL이 있는 경우)
    if (postData.image_url) {
      try {
        // Storage URL에서 파일 경로 추출
        // URL 형식: https://[project].supabase.co/storage/v1/object/public/uploads/[clerk_id]/[filename]
        const url = new URL(postData.image_url);
        const pathParts = url.pathname.split('/');
        const uploadsIndex = pathParts.indexOf('uploads');

        if (uploadsIndex !== -1 && uploadsIndex < pathParts.length - 1) {
          // '/uploads/' 이후의 경로 추출
          const filePath = pathParts.slice(uploadsIndex + 1).join('/');

          // Storage에서 파일 삭제
          const { error: storageError } = await supabase.storage
            .from(storageBucket)
            .remove([filePath]);

          if (storageError) {
            console.error('Storage delete error:', storageError);
            // Storage 삭제 실패해도 게시물 삭제는 진행
          } else {
            console.log('Storage file deleted:', filePath);
          }
        } else {
          console.warn('Could not extract file path from image_url:', postData.image_url);
        }
      } catch (urlError) {
        console.error('Error parsing image URL:', urlError);
        // URL 파싱 실패해도 게시물 삭제는 진행
      }
    }

    // posts 테이블에서 게시물 삭제
    // CASCADE 설정으로 인해 관련된 likes, comments도 자동 삭제됨
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId); // 추가 보안: 본인 게시물만 삭제

    if (deleteError) {
      console.error('Delete post error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete post', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/posts/[postId] error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

