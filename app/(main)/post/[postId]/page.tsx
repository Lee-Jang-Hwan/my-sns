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
 * - /api/posts/[postId]: 게시물 상세 정보 조회 API
 * - components/post/PostDetailMobile: Mobile 게시물 상세 컴포넌트
 */

import { redirect } from 'next/navigation';
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/posts/${postId}`, {
    cache: 'no-store', // 서버 사이드에서 항상 최신 데이터 조회
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('게시물을 찾을 수 없습니다.');
    }
    throw new Error('게시물을 불러오는데 실패했습니다.');
  }

  return response.json();
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

  // Mobile 전용 페이지 (Desktop에서는 PostModal 사용)
  return <PostDetailMobile initialPostData={postData} postId={postId} />;
}

