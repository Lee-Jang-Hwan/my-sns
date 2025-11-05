"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @file PostGrid.tsx
 * @description 프로필 페이지 게시물 그리드 컴포넌트
 *
 * 주요 기능:
 * 1. 3열 그리드 레이아웃 (반응형)
 * 2. 게시물 이미지 썸네일 표시 (1:1 정사각형)
 * 3. `/api/posts` API 호출 (userId 파라미터 사용)
 * 4. 로딩 및 에러 상태 처리
 * 5. Hover 시 좋아요/댓글 수 표시
 * 6. 게시물 클릭 시 상세 페이지로 이동
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - next/link: 클라이언트 사이드 네비게이션
 * - lucide-react: 아이콘 (Heart, MessageCircle)
 * - @/lib/utils: cn 유틸리티 함수
 */

interface Post {
  id: string;
  user_id: string;
  image_url?: string;
  caption?: string;
  created_at: string;
  like_count?: number;
  total_comments?: number;
}

interface PostGridProps {
  /**
   * 게시물을 필터링할 사용자 ID (Supabase UUID)
   */
  userId: string;
  /**
   * 추가 클래스명 (선택적)
   */
  className?: string;
}

export default function PostGrid({ userId, className }: PostGridProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: "1",
          limit: "50", // 프로필 페이지에서는 모든 게시물 가져오기
          userId: userId,
        });

        const response = await fetch(`/api/posts?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setError(
          err instanceof Error
            ? err.message
            : "게시물을 불러오는데 실패했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPosts();
    }
  }, [userId]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="grid grid-cols-3 gap-0.5 md:gap-1">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="aspect-square bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={cn("w-full py-8 px-4", className)}>
        <p className="text-center text-[#8e8e8e] text-sm">{error}</p>
      </div>
    );
  }

  // 빈 상태
  if (posts.length === 0) {
    return (
      <div className={cn("w-full py-16 px-4", className)}>
        <p className="text-center text-[#8e8e8e] text-sm">게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* 3열 그리드 레이아웃 */}
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="aspect-square relative bg-gray-100 overflow-hidden cursor-pointer group"
          >
            {post.image_url && !failedImages.has(post.id) ? (
              <>
                <Image
                  src={post.image_url}
                  alt={post.caption || "게시물 이미지"}
                  fill
                  className="object-cover group-hover:opacity-75 transition-opacity"
                  sizes="(max-width: 768px) 33vw, 33vw"
                  priority={false}
                  onError={() => {
                    setFailedImages((prev) => new Set(prev).add(post.id));
                  }}
                />
                {/* Hover 오버레이 - 좋아요/댓글 수 표시 */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex items-center gap-6 text-white">
                    {/* 좋아요 */}
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-5 h-5 fill-white" />
                      <span className="text-base font-bold">
                        {post.like_count || 0}
                      </span>
                    </div>
                    {/* 댓글 */}
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-5 h-5 text-white" />
                      <span className="text-base font-bold">
                        {post.total_comments || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-400 text-xs">이미지 없음</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
