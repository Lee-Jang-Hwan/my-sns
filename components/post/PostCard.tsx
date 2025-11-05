'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @file PostCard.tsx
 * @description Instagram 스타일의 게시물 카드 컴포넌트
 *
 * 주요 기능:
 * 1. Header: 프로필 이미지, 사용자명, 시간, 메뉴
 * 2. Image: 정사각형 1:1 비율
 * 3. Actions: 좋아요, 댓글, 공유, 북마크
 * 4. Content: 좋아요 수, 캡션, 댓글 미리보기
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - next/link: 프로필 링크
 * - lucide-react: 아이콘
 * - @/lib/utils: cn 유틸리티 함수
 */

interface Comment {
  id: string;
  username: string;
  content: string;
  userId?: string; // 댓글 작성자 ID (프로필 링크용)
}

interface PostCardProps {
  // Header props
  profileImage?: string; // 프로필 이미지 URL (선택)
  username: string; // 사용자명
  timeAgo: string; // 상대 시간 (예: "3시간 전")
  onMenuClick?: () => void; // 메뉴 클릭 핸들러 (선택)
  userId?: string; // 사용자 ID (프로필 링크용)
  // Image props
  imageUrl?: string; // 게시물 이미지 URL (선택)
  postId?: string; // 게시물 ID (이미지 클릭 시 상세 페이지 링크용)
  // Actions props
  isLiked?: boolean; // 좋아요 상태 (기본값: false)
  onLikeClick?: () => void; // 좋아요 클릭 핸들러 (선택, API 호출 후 호출됨)
  onLikeUpdate?: (liked: boolean, likeCount: number) => void; // 좋아요 상태 업데이트 콜백 (선택)
  onCommentClick?: () => void; // 댓글 클릭 핸들러 (선택)
  // Content props
  likeCount?: number; // 좋아요 수 (기본값: 0)
  caption?: string; // 캡션 내용 (선택)
  comments?: Comment[]; // 댓글 목록 (최신 2개만 표시)
  totalComments?: number; // 전체 댓글 수 (선택, comments.length보다 클 수 있음)
  onViewMoreComments?: () => void; // 댓글 더 보기 클릭 핸들러 (선택)
}

export default function PostCard({
  profileImage,
  username,
  timeAgo,
  onMenuClick,
  userId,
  imageUrl,
  postId,
  isLiked = false,
  onLikeClick,
  onLikeUpdate,
  onCommentClick,
  likeCount = 0,
  caption,
  comments = [],
  totalComments,
  onViewMoreComments,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);

  // isLiked, likeCount prop 변경 시 state 동기화
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setCurrentLikeCount(likeCount);
  }, [likeCount]);

  // 캡션이 2줄을 초과하는지 확인
  const shouldTruncateCaption = caption && caption.length > 80; // 대략적인 2줄 기준
  const displayCaption = shouldTruncateCaption && !showFullCaption
    ? `${caption.substring(0, 80)}...`
    : caption;

  // 댓글 미리보기 (최신 2개만)
  const previewComments = comments.slice(0, 2);
  const hasMoreComments = totalComments
    ? totalComments > previewComments.length
    : comments.length > previewComments.length;

  // 좋아요 클릭 핸들러
  const handleLikeClick = async () => {
    if (!postId) return;

    // Optimistic UI 업데이트
    const previousLiked = liked;
    const previousLikeCount = currentLikeCount;
    const newLiked = !liked;
    const newLikeCount = newLiked ? currentLikeCount + 1 : Math.max(0, currentLikeCount - 1);

    // 즉시 UI 업데이트
    setIsAnimating(true);
    setLiked(newLiked);
    setCurrentLikeCount(newLikeCount);

    // 애니메이션 종료 (0.15초 후)
    setTimeout(() => {
      setIsAnimating(false);
    }, 150);

    try {
      // API 호출
      const method = newLiked ? 'POST' : 'DELETE';
      const response = await fetch('/api/likes', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 성공 시 부모 컴포넌트에 알림
      if (onLikeUpdate) {
        onLikeUpdate(newLiked, newLikeCount);
      }

      // onLikeClick 콜백 호출 (있는 경우)
      if (onLikeClick) {
        onLikeClick();
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // 실패 시 롤백
      setLiked(previousLiked);
      setCurrentLikeCount(previousLikeCount);
      // 에러 알림 (필요시 토스트 메시지 추가 가능)
    }
  };

  // 더블탭 좋아요 핸들러
  const handleDoubleClick = async () => {
    if (!postId || !imageUrl) return;

    // 이미 좋아요한 경우 더블탭 시 좋아요 취소하지 않음 (Instagram 동작)
    if (liked) return;

    // 큰 하트 애니메이션 표시
    setShowDoubleTapHeart(true);
    setTimeout(() => {
      setShowDoubleTapHeart(false);
    }, 1200);

    // 좋아요 추가 (API 호출)
    const previousLiked = liked;
    const previousLikeCount = currentLikeCount;
    const newLikeCount = currentLikeCount + 1;

    // 즉시 UI 업데이트
    setLiked(true);
    setCurrentLikeCount(newLikeCount);

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 성공 시 부모 컴포넌트에 알림
      if (onLikeUpdate) {
        onLikeUpdate(true, newLikeCount);
      }
    } catch (error) {
      console.error('Failed to add like via double tap:', error);
      // 실패 시 롤백
      setLiked(previousLiked);
      setCurrentLikeCount(previousLikeCount);
    }
  };

  // 댓글 클릭 핸들러
  const handleCommentClick = () => {
    if (onCommentClick) {
      onCommentClick();
    } else if (postId) {
      // 상세 페이지로 이동
      window.location.href = `/post/${postId}`;
    }
  };

  return (
    <article className="bg-white border border-[#dbdbdb] rounded-sm mb-4">
      {/* Header (60px) */}
      <header
        className={cn(
          'flex items-center',
          'h-[60px]',
          'px-4',
          'gap-3'
        )}
      >
        {/* 프로필 이미지 */}
        <Link
          href={userId ? `/profile/${userId}` : '/profile'}
          className="flex-shrink-0"
        >
          {profileImage ? (
            <Image
              src={profileImage}
              alt={`${username} 프로필`}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500 font-semibold">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* 사용자명과 시간 */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <Link
            href={userId ? `/profile/${userId}` : '/profile'}
            className="hover:opacity-70 transition-opacity"
          >
            <span className="text-sm font-bold text-[#262626]">
              {username}
            </span>
          </Link>
          <span className="text-xs text-[#8e8e8e]">
            {timeAgo}
          </span>
        </div>

        {/* 메뉴 버튼 */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex-shrink-0 p-2 -mr-2 hover:opacity-70 transition-opacity"
          aria-label="더보기 메뉴"
        >
          <MoreHorizontal className="w-5 h-5 text-[#262626]" />
        </button>
      </header>

      {/* Image 영역 (1:1 정사각형) */}
      <div
        className="w-full aspect-square relative bg-gray-100 overflow-hidden cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${username}의 게시물`}
            fill
            className="object-cover select-none"
            sizes="(max-width: 768px) 100vw, 630px"
            priority={false}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-sm">이미지 없음</span>
          </div>
        )}

        {/* 더블탭 큰 하트 애니메이션 */}
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart
              className="w-20 h-20 fill-[#ed4956] text-[#ed4956]"
              style={{
                animation: 'doubleTapHeart 1.2s ease-in-out',
              }}
            />
          </div>
        )}
      </div>

      {/* Actions 영역 (48px) */}
      <div className="flex items-center justify-between h-[48px] px-4">
        {/* 좌측 액션 버튼들 */}
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <button
            type="button"
            onClick={handleLikeClick}
            className="flex-shrink-0 p-0 hover:opacity-70 transition-opacity focus:outline-none"
            aria-label={liked ? '좋아요 취소' : '좋아요'}
          >
            <Heart
              className={cn(
                'w-6 h-6 transition-all duration-150',
                isAnimating && 'scale-[1.3]',
                liked
                  ? 'fill-[#ed4956] text-[#ed4956]'
                  : 'text-[#262626]'
              )}
            />
          </button>

          {/* 댓글 버튼 */}
          <button
            type="button"
            onClick={handleCommentClick}
            className="flex-shrink-0 p-0 hover:opacity-70 transition-opacity focus:outline-none"
            aria-label="댓글"
          >
            <MessageCircle className="w-6 h-6 text-[#262626]" />
          </button>

          {/* 공유 버튼 (UI만, 기능 없음) */}
          <button
            type="button"
            className="flex-shrink-0 p-0 hover:opacity-70 transition-opacity focus:outline-none cursor-not-allowed opacity-50"
            aria-label="공유 (준비 중)"
            disabled
          >
            <Send className="w-6 h-6 text-[#262626]" />
          </button>
        </div>

        {/* 우측 북마크 버튼 (UI만, 기능 없음) */}
        <button
          type="button"
          className="flex-shrink-0 p-0 hover:opacity-70 transition-opacity focus:outline-none cursor-not-allowed opacity-50"
          aria-label="북마크 (준비 중)"
          disabled
        >
          <Bookmark className="w-6 h-6 text-[#262626]" />
        </button>
      </div>

      {/* Content 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 */}
        {currentLikeCount > 0 && (
          <div className="text-sm font-bold text-[#262626]">
            좋아요 {currentLikeCount.toLocaleString()}개
          </div>
        )}

        {/* 캡션 */}
        {caption && (
          <div className="text-sm text-[#262626]">
            <Link
              href={userId ? `/profile/${userId}` : '/profile'}
              className="font-bold hover:opacity-70 transition-opacity mr-1"
            >
              {username}
            </Link>
            <span>{displayCaption}</span>
            {shouldTruncateCaption && (
              <button
                type="button"
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-[#8e8e8e] hover:opacity-70 transition-opacity ml-1"
              >
                {showFullCaption ? ' 간략히' : ' 더 보기'}
              </button>
            )}
          </div>
        )}

        {/* 댓글 더 보기 링크 */}
        {hasMoreComments && (
          <button
            type="button"
            onClick={
              onViewMoreComments ||
              (() => postId && (window.location.href = `/post/${postId}`))
            }
            className="text-sm text-[#8e8e8e] hover:opacity-70 transition-opacity"
          >
            댓글 {totalComments || comments.length}개 모두 보기
          </button>
        )}

        {/* 댓글 미리보기 (최신 2개) */}
        {previewComments.length > 0 && (
          <div className="space-y-1">
            {previewComments.map((comment) => (
              <div key={comment.id} className="text-sm text-[#262626]">
                <Link
                  href={
                    comment.userId
                      ? `/profile/${comment.userId}`
                      : '/profile'
                  }
                  className="font-bold hover:opacity-70 transition-opacity mr-1"
                >
                  {comment.username}
                </Link>
                <span>{comment.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

