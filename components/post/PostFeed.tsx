'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import { formatTimeAgo } from '@/lib/utils/time';
import { cn } from '@/lib/utils';

/**
 * @file PostFeed.tsx
 * @description 게시물 피드 컴포넌트 - 무한 스크롤 및 PostCard 렌더링
 *
 * 주요 기능:
 * 1. PostCard 컴포넌트들을 렌더링
 * 2. Intersection Observer를 사용한 무한 스크롤 (10개씩)
 * 3. PostCardSkeleton을 로딩 상태에 표시
 * 4. 에러 상태 및 빈 상태 처리
 *
 * @dependencies
 * - components/post/PostCard: 게시물 카드 컴포넌트
 * - components/post/PostCardSkeleton: 로딩 스켈레톤
 * - lib/utils/time: 시간 포맷팅 유틸리티
 * - lib/utils: cn 유틸리티 함수
 */

interface Comment {
  id: string;
  username: string;
  content: string;
  userId?: string;
  created_at: string;
}

interface Post {
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
  like_count?: number;
  is_liked?: boolean;
  comments?: Comment[];
  total_comments?: number;
}

interface PostFeedProps {
  userId?: string; // 특정 사용자의 게시물만 필터링 (프로필 페이지용)
  initialPosts?: Post[]; // 초기 게시물 데이터 (SSR/SSG용)
}

interface ApiResponse {
  posts: Post[];
  hasMore: boolean;
  page: number;
}

export default function PostFeed({ userId, initialPosts }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPosts ? 1 : 0);
  const observerTarget = useRef<HTMLDivElement>(null);

  // API 호출 함수
  const fetchPosts = useCallback(
    async (pageNum: number, isInitial = false): Promise<ApiResponse | null> => {
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '10',
        });

        if (userId) {
          params.append('userId', userId);
        }

        const response = await fetch(`/api/posts?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();
        return data;
      } catch (err) {
        console.error('Failed to fetch posts:', err);
        setError(err instanceof Error ? err.message : '게시물을 불러오는데 실패했습니다.');
        return null;
      }
    },
    [userId]
  );

  // 초기 데이터 로드
  useEffect(() => {
    if (!initialPosts) {
      const loadInitialPosts = async () => {
        setLoading(true);
        setError(null);
        const data = await fetchPosts(1, true);

        if (data) {
          setPosts(data.posts);
          setHasMore(data.hasMore);
          setPage(1);
        }

        setLoading(false);
      };

      loadInitialPosts();
    }
  }, [initialPosts, fetchPosts]);

  // 추가 게시물 로드
  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    const data = await fetchPosts(nextPage);

    if (data) {
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    }

    setLoadingMore(false);
  }, [page, hasMore, loadingMore, fetchPosts]);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMorePosts();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadMorePosts]);

  // 좋아요 업데이트 핸들러
  const handleLikeUpdate = useCallback(
    (postId: string, liked: boolean, likeCount: number) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: liked,
                like_count: likeCount,
              }
            : post
        )
      );
    },
    []
  );

  // Post 데이터를 PostCard props로 변환
  const mapPostToCardProps = (post: Post) => {
    const comments =
      post.comments?.slice(0, 2).map((comment) => ({
        id: comment.id,
        username: comment.username,
        content: comment.content,
        userId: comment.userId,
      })) || [];

    return {
      postId: post.id,
      userId: post.user_id,
      username: post.user?.name || '알 수 없음',
      profileImage: post.user?.profile_image_url,
      timeAgo: formatTimeAgo(post.created_at),
      imageUrl: post.image_url,
      caption: post.caption,
      likeCount: post.like_count || 0,
      isLiked: post.is_liked || false,
      comments,
      totalComments: post.total_comments || post.comments?.length || 0,
      onLikeUpdate: (liked: boolean, likeCount: number) =>
        handleLikeUpdate(post.id, liked, likeCount),
    };
  };

  // 에러 상태
  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-[#8e8e8e] text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setPage(0);
            setHasMore(true);
            fetchPosts(1, true).then((data) => {
              if (data) {
                setPosts(data.posts);
                setHasMore(data.hasMore);
                setPage(1);
              }
            });
          }}
          className="text-[#0095f6] text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 초기 로딩 상태
  if (loading) {
    return (
      <div className="max-w-[630px] mx-auto">
        {Array.from({ length: 3 }).map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // 빈 상태
  if (posts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-[#8e8e8e] text-sm">게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full',
        'max-w-[630px]',
        'mx-auto',
        'bg-[#fafafa]',
        'min-h-screen',
        'py-4'
      )}
    >
      {/* 게시물 목록 */}
      <div>
        {posts.map((post) => (
          <PostCard key={post.id} {...mapPostToCardProps(post)} />
        ))}
      </div>

      {/* 추가 로딩 스켈레톤 */}
      {loadingMore && (
        <div>
          {Array.from({ length: 2 }).map((_, index) => (
            <PostCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Intersection Observer 타겟 */}
      <div ref={observerTarget} className="h-1" aria-hidden="true" />

      {/* 더 이상 불러올 데이터가 없을 때 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-[#8e8e8e] text-sm">모든 게시물을 불러왔습니다.</p>
        </div>
      )}
    </div>
  );
}
