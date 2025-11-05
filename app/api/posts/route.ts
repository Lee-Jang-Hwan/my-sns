import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import sharp from 'sharp';

/**
 * @file route.ts
 * @description 게시물 목록 조회 및 작성 API
 *
 * GET 주요 기능:
 * 1. 게시물 목록 조회 (페이지네이션)
 * 2. 특정 사용자의 게시물 필터링 (userId 파라미터)
 * 3. 좋아요 수 및 현재 사용자 좋아요 여부
 * 4. 댓글 최신 2개 및 총 개수
 * 5. 작성자 정보 (users 테이블 JOIN)
 *
 * POST 주요 기능:
 * 1. 이미지 파일 업로드 (Supabase Storage)
 * 2. 게시물 데이터 저장 (posts 테이블)
 * 3. 파일 검증 (이미지 파일, 최대 5MB)
 * 4. 캡션 검증 (최대 2,200자)
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증
 * - @/lib/supabase/service-role: Supabase 클라이언트
 */

interface PostRow {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
  } | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const userId = searchParams.get('userId') || null;

    // 페이지네이션 계산
    const offset = (page - 1) * limit;

    // Supabase 클라이언트 (RLS 비활성화 상태이므로 service-role 사용)
    const supabase = getServiceRoleClient();

    // 현재 Clerk 사용자 확인 (좋아요 여부 확인용)
    const { userId: clerkUserId } = await auth();
    let currentUserId: string | null = null;

    if (clerkUserId) {
      // Clerk user_id를 Supabase users 테이블의 id로 변환
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .single();

      if (userData) {
        currentUserId = userData.id;
      }
    }

    // 1. 게시물 목록 조회 (users JOIN)
    let postsQuery = supabase
      .from('posts')
      .select(
        `
        id,
        user_id,
        image_url,
        caption,
        created_at,
        users!posts_user_id_fkey (
          id,
          name
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // userId 필터링 (특정 사용자의 게시물만)
    if (userId) {
      postsQuery = postsQuery.eq('user_id', userId);
    }

    const { data: postsData, error: postsError } = await postsQuery;

    if (postsError) {
      console.error('Posts query error:', postsError);
      return NextResponse.json(
        { error: '게시물을 불러오는데 실패했습니다.', details: postsError.message },
        { status: 500 }
      );
    }

    if (!postsData || postsData.length === 0) {
      return NextResponse.json({
        posts: [],
        hasMore: false,
        page,
      });
    }

    const postIds = postsData.map((post) => post.id);

    // 2. 좋아요 수 집계 및 현재 사용자 좋아요 여부 확인
    let likesQuery = supabase
      .from('likes')
      .select('post_id, user_id')
      .in('post_id', postIds);

    const { data: likesData, error: likesError } = await likesQuery;

    if (likesError) {
      console.error('Likes query error:', likesError);
    }

    // 좋아요 수 계산 및 현재 사용자 좋아요 여부 확인
    const likeCountsMap = new Map<string, number>();
    const userLikesSet = new Set<string>();

    likesData?.forEach((like) => {
      // 좋아요 수 집계
      const count = likeCountsMap.get(like.post_id) || 0;
      likeCountsMap.set(like.post_id, count + 1);

      // 현재 사용자 좋아요 여부 확인
      if (currentUserId && like.user_id === currentUserId) {
        userLikesSet.add(like.post_id);
      }
    });

    // 3. 댓글 최신 2개 조회 (각 게시물당)
    const commentsPromises = postIds.map((postId) =>
      supabase
        .from('comments')
        .select(
          `
          id,
          post_id,
          user_id,
          content,
          created_at,
          users!comments_user_id_fkey (
            id,
            name
          )
        `
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(2)
    );

    const commentsResults = await Promise.all(commentsPromises);

    // 4. 댓글 총 개수 조회 (한 번의 쿼리로 모든 댓글 가져와서 집계)
    const { data: allCommentsData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    // 댓글 데이터 구조화
    const commentsMap = new Map<string, CommentRow[]>();
    commentsResults.forEach((result, index) => {
      if (result.data) {
        commentsMap.set(postIds[index], result.data as CommentRow[]);
      }
    });

    // 댓글 총 개수 맵 (JavaScript에서 집계)
    const commentCountsMap = new Map<string, number>();
    allCommentsData?.forEach((comment) => {
      const count = commentCountsMap.get(comment.post_id) || 0;
      commentCountsMap.set(comment.post_id, count + 1);
    });

    // 다음 페이지 존재 여부 확인
    const nextPageQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .range(offset + limit, offset + limit);

    if (userId) {
      nextPageQuery.eq('user_id', userId);
    }

    const { count: nextPageCount } = await nextPageQuery;
    const hasMore = (nextPageCount || 0) > 0;

    // 응답 데이터 변환
    const posts = postsData.map((post: PostRow) => {
      const comments = commentsMap.get(post.id) || [];
      const formattedComments = comments.map((comment) => ({
        id: comment.id,
        username: comment.user?.name || '알 수 없음',
        content: comment.content,
        userId: comment.user_id,
        created_at: comment.created_at,
      }));

      return {
        id: post.id,
        user_id: post.user_id,
        image_url: post.image_url || undefined,
        caption: post.caption || undefined,
        created_at: post.created_at,
        user: post.user
          ? {
              id: post.user.id,
              name: post.user.name,
              profile_image_url: undefined, // users 테이블에 profile_image_url 컬럼 없음
            }
          : undefined,
        like_count: likeCountsMap.get(post.id) || 0,
        is_liked: userLikesSet.has(post.id),
        comments: formattedComments,
        total_comments: commentCountsMap.get(post.id) || 0,
      };
    });

    return NextResponse.json({
      posts,
      hasMore,
      page,
    });
  } catch (error) {
    console.error('Posts API error:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: 게시물 작성
 */
export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // FormData 파싱
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const caption = (formData.get('caption') as string) || '';

    // 파일 검증
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Bad Request', details: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미지 파일 타입 검증
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Bad Request', details: '이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (최대 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Bad Request', details: '파일 크기는 최대 5MB입니다.' },
        { status: 400 }
      );
    }

    // 캡션 길이 검증 (최대 2,200자)
    const MAX_CAPTION_LENGTH = 2200;
    if (caption.length > MAX_CAPTION_LENGTH) {
      return NextResponse.json(
        { error: 'Bad Request', details: '캡션은 최대 2,200자까지 입력 가능합니다.' },
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

    // Storage 버킷 이름 (환경 변수 또는 기본값)
    const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'uploads';

    // 이미지 리사이징 (1080x1080 정사각형, JPEG, 품질 80%)
    let resizedBuffer: Buffer;
    let uploadBlob: Blob;
    let contentType = 'image/jpeg';

    try {
      // File을 ArrayBuffer로 변환
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // sharp로 리사이징 (1080x1080 정사각형, cover 모드, 중앙 기준)
      resizedBuffer = await sharp(buffer)
        .resize(1080, 1080, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // 리사이징된 Buffer를 Blob으로 변환
      uploadBlob = new Blob([resizedBuffer], { type: 'image/jpeg' });

      console.log('Image resized:', {
        originalSize: imageFile.size,
        resizedSize: resizedBuffer.length,
        reduction: `${Math.round((1 - resizedBuffer.length / imageFile.size) * 100)}%`,
      });
    } catch (resizeError) {
      console.error('Image resize error:', resizeError);
      // 리사이징 실패 시 원본 이미지 사용 (fallback)
      uploadBlob = imageFile;
      contentType = imageFile.type;
    }

    // 파일명 생성 (타임스탬프 + 랜덤 문자열, 리사이징 후 항상 JPEG)
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = `${clerkUserId}/${fileName}`;

    // Supabase Storage에 이미지 업로드
    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, uploadBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image', details: uploadError.message },
        { status: 500 }
      );
    }

    // Storage 공개 URL 생성
    const { data: urlData } = supabase.storage.from(storageBucket).getPublicUrl(filePath);
    const imageUrl = urlData.publicUrl;

    // posts 테이블에 데이터 저장
    const { data: postData, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        caption: caption.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert post error:', insertError);
      // Storage 파일 삭제 시도 (선택)
      await supabase.storage.from(storageBucket).remove([filePath]);
      return NextResponse.json(
        { error: 'Failed to create post', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post: {
        id: postData.id,
        user_id: postData.user_id,
        image_url: postData.image_url,
        caption: postData.caption,
        created_at: postData.created_at,
      },
    });
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
