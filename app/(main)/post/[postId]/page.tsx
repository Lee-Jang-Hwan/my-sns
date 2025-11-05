/**
 * @file page.tsx
 * @description 게시물 상세 페이지 (Mobile 전용)
 *
 * 주요 기능:
 * 1. postId 파라미터로 게시물 상세 정보 조회
 * 2. Mobile 레이아웃 (이미지 위, 콘텐츠 아래)
 * 3. 좋아요, 댓글 작성/삭제, 게시물 삭제 기능
 * 4. Desktop에서는 PostModal 사용 (리다이렉트 또는 숨김 처리)
 *
 * @dependencies
 * - @/lib/supabase/service-role: Supabase 서비스 역할 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 * - components/post/PostDetailMobile: Mobile 게시물 상세 컴포넌트
 */

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import PostDetailMobile from '@/components/post/PostDetailMobile';

interface PageProps {
  params: Promise<{ postId: string }>;
}

interface PostData {
  id: string;
  user_id: string;
  image_url?: string;
  caption?: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    profile_image_url?: string;
  };
  like_count: number;
  is_liked: boolean;
  comments: Array<{
    id: string;
    username: string;
    content: string;
    userId?: string;
    created_at?: string;
  }>;
  total_comments: number;
}

async function fetchPost(postId: string): Promise<PostData> {
  const supabase = getServiceRoleClient();

  // 1. 게시물 조회
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('id, user_id, image_url, caption, created_at')
    .eq('id', postId)
    .single();

  if (postError) {
    if (postError.code === 'PGRST116') {
      throw new Error('게시물을 찾을 수 없습니다.');
    }
    console.error('Post query error:', postError);
    throw new Error('게시물을 불러오는데 실패했습니다.');
  }

  if (!postData) {
    throw new Error('게시물을 찾을 수 없습니다.');
  }

  // 2. 사용자 정보 조회
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', postData.user_id)
    .single();

  if (userError) {
    // PGRST116은 "no rows returned" 에러이므로 사용자가 없는 경우 (정상)
    if (userError.code !== 'PGRST116') {
      console.error('User query error:', {
        code: userError.code,
        message: userError.message,
        details: userError.details,
      });
    }
  }

  // 3. 현재 사용자 확인 (좋아요 여부 확인용)
  const { userId: clerkUserId } = await auth();
  let currentUserId: string | null = null;
  let isLiked = false;

  if (clerkUserId) {
    const { data: currentUserData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single();

    if (currentUserData) {
      currentUserId = currentUserData.id;
    }
  }

  // 4. 좋아요 수 집계 및 현재 사용자 좋아요 여부 확인
  const { data: likesData } = await supabase
    .from('likes')
    .select('user_id')
    .eq('post_id', postId);

  const likeCount = likesData?.length || 0;
  isLiked =
    currentUserId !== null &&
    likesData?.some((like) => like.user_id === currentUserId) === true;

  // 5. 댓글 전체 목록 조회
  const { data: commentsData } = await supabase
    .from('comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  // 댓글 작성자 정보 조회
  const commentUserIds = commentsData?.map((c) => c.user_id) || [];
  const { data: commentUsersData } = await supabase
    .from('users')
    .select('id, name')
    .in('id', commentUserIds);

  const commentUsersMap = new Map<string, { id: string; name: string }>();
  commentUsersData?.forEach((user) => {
    commentUsersMap.set(user.id, { id: user.id, name: user.name });
  });

  // 댓글 데이터 포맷팅
  const formattedComments =
    commentsData?.map((comment) => ({
      id: comment.id,
      username: commentUsersMap.get(comment.user_id)?.name || '알 수 없음',
      content: comment.content,
      userId: comment.user_id,
      created_at: comment.created_at,
    })) || [];

  const result = {
    id: postData.id,
    user_id: postData.user_id,
    image_url: postData.image_url || undefined,
    caption: postData.caption || undefined,
    created_at: postData.created_at,
    user: userData
      ? {
          id: userData.id,
          name: userData.name,
          profile_image_url: undefined, // users 테이블에 profile_image_url 컬럼이 없음
        }
      : {
          // 사용자 정보가 없어도 기본값 제공
          id: postData.user_id,
          name: '알 수 없음',
          profile_image_url: undefined,
        },
    like_count: likeCount,
    is_liked: isLiked,
    comments: formattedComments,
    total_comments: formattedComments.length,
  };

  // 디버깅 로그
  console.log('fetchPost: Returning data', {
    postId,
    hasUser: !!result.user,
    userName: result.user?.name,
    commentsCount: result.comments.length,
    likeCount: result.like_count,
    hasImage: !!result.image_url,
  });

  return result;
}

export default async function PostPage({ params }: PageProps) {
  const { postId } = await params;

  if (!postId) {
    redirect('/');
  }

  let postData: PostData;
  let error: string | null = null;

  try {
    postData = await fetchPost(postId);
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

  // 데이터 검증 및 디버깅
  if (!postData) {
    console.error('PostPage: postData is undefined');
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류</h1>
          <p className="text-gray-600">게시물 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 디버깅 로그
  console.log('PostPage: Rendering PostDetailMobile', {
    postId,
    hasPostData: !!postData,
    hasUser: !!postData.user,
    userName: postData.user?.name,
    commentsCount: postData.comments?.length || 0,
    likeCount: postData.like_count,
  });

  // Mobile 전용 페이지 (Desktop에서는 PostModal 사용)
  return <PostDetailMobile initialPostData={postData} postId={postId} />;
}

