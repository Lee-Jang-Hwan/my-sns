'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils/time';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import CommentList, { Comment } from '@/components/comment/CommentList';
import CommentForm from '@/components/comment/CommentForm';

/**
 * @file PostModal.tsx
 * @description 게시물 상세 모달 컴포넌트 (Desktop 전용)
 *
 * 주요 기능:
 * 1. 게시물 상세 정보 표시 (이미지 + 댓글)
 * 2. 좋아요 기능
 * 3. 댓글 작성 및 삭제
 * 4. 게시물 삭제 (본인 게시물만)
 *
 * 레이아웃:
 * - 왼쪽 50%: 이미지 (정사각형 비율)
 * - 오른쪽 50%: 헤더 + 댓글 목록 + 액션 버튼 + 좋아요 수 + 캡션 + 댓글 입력 폼
 *
 * @dependencies
 * - @clerk/nextjs: useAuth hook
 * - next/image: 이미지 최적화
 * - components/comment/CommentList: 댓글 목록
 * - components/comment/CommentForm: 댓글 입력 폼
 */

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
  comments: Comment[];
  total_comments: number;
}

interface PostModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostModal({
  postId,
  open,
  onOpenChange,
}: PostModalProps) {
  const { userId: clerkUserId } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [postData, setPostData] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 현재 사용자 ID 조회 (clerk_id로 Supabase users 테이블에서 조회)
  useEffect(() => {
    if (!clerkUserId || !open) {
      setCurrentUserId(null);
      return;
    }

    const fetchCurrentUserId = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerkUserId)
          .single();

        if (error) {
          console.error('Failed to fetch current user ID:', error);
          return;
        }

        if (data) {
          setCurrentUserId(data.id);
        }
      } catch (err) {
        console.error('Failed to fetch current user ID:', err);
      }
    };

    fetchCurrentUserId();
  }, [clerkUserId, open, supabase]);

  // 게시물 데이터 로드
  useEffect(() => {
    if (!open || !postId) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/posts/${postId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('게시물을 찾을 수 없습니다.');
          } else {
            setError('게시물을 불러오는데 실패했습니다.');
          }
          return;
        }

        const data: PostData = await response.json();
        setPostData(data);
        setLiked(data.is_liked);
        setLikeCount(data.like_count);
        setComments(data.comments || []);
      } catch (err) {
        console.error('Failed to fetch post:', err);
        setError('게시물을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [open, postId]);

  // 좋아요 클릭 핸들러
  const handleLikeClick = async () => {
    if (!postId) return;

    const previousLiked = liked;
    const previousLikeCount = likeCount;
    const newLiked = !liked;
    const newLikeCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);

    setIsAnimating(true);
    setLiked(newLiked);
    setLikeCount(newLikeCount);

    setTimeout(() => {
      setIsAnimating(false);
    }, 150);

    try {
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
    } catch (error) {
      console.error('Failed to toggle like:', error);
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);
    }
  };

  // 댓글 작성 핸들러
  const handleCommentSubmit = async (content: string) => {
    if (!postId) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, content }),
      });

      if (!response.ok) {
        throw new Error('댓글 작성에 실패했습니다.');
      }

      // 댓글 목록 새로고침
      const postResponse = await fetch(`/api/posts/${postId}`);
      if (postResponse.ok) {
        const data: PostData = await postResponse.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
      throw err;
    }
  };

  // 댓글 삭제 핸들러
  const handleCommentDelete = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('댓글 삭제에 실패했습니다.');
      }

      // 댓글 목록 새로고침
      const postResponse = await fetch(`/api/posts/${postId}`);
      if (postResponse.ok) {
        const data: PostData = await postResponse.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // 게시물 삭제 핸들러
  const handlePostDelete = async () => {
    if (!postId) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('게시물 삭제에 실패했습니다.');
      }

      // 모달 닫기
      onOpenChange(false);
      // 페이지 새로고침 (게시물 목록 업데이트)
      window.location.reload();
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const isOwnPost =
    postData && currentUserId && postData.user_id === currentUserId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-5xl w-full h-[90vh] p-0 gap-0',
          'bg-white',
          'flex flex-row',
          'hidden md:flex' // Desktop 전용
        )}
      >
        {/* 왼쪽: 이미지 영역 (50%) */}
        <div className="flex-1 flex items-center justify-center bg-black">
          {postData?.image_url ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={postData.image_url}
                alt={postData.caption || '게시물 이미지'}
                width={800}
                height={800}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          ) : loading ? (
            <div className="w-full h-full bg-gray-100 animate-pulse" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">이미지 없음</span>
            </div>
          )}
        </div>

        {/* 오른쪽: 콘텐츠 영역 (50%) */}
        <div className="flex-1 flex flex-col bg-white">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[#8e8e8e]">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[#ed4956]">{error}</p>
            </div>
          ) : !postData ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-[#8e8e8e]">게시물을 찾을 수 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 헤더 */}
              <header className="flex items-center h-[60px] px-4 border-b border-[#dbdbdb]">
                {/* 프로필 이미지 */}
                <Link
                  href={
                    postData.user_id
                      ? `/profile/${postData.user_id}`
                      : '/profile'
                  }
                  className="flex-shrink-0"
                >
                  {postData.user?.profile_image_url ? (
                    <Image
                      src={postData.user.profile_image_url}
                      alt={`${postData.user.name} 프로필`}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-500 font-semibold">
                        {postData.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </Link>

                {/* 사용자명과 시간 */}
                <div className="flex-1 flex flex-col justify-center min-w-0 ml-3">
                  <Link
                    href={
                      postData.user_id
                        ? `/profile/${postData.user_id}`
                        : '/profile'
                    }
                    className="hover:opacity-70 transition-opacity"
                  >
                    <span className="text-sm font-bold text-[#262626]">
                      {postData.user?.name || '알 수 없음'}
                    </span>
                  </Link>
                  <span className="text-xs text-[#8e8e8e]">
                    {formatTimeAgo(postData.created_at)}
                  </span>
                </div>

                {/* 메뉴 버튼 (본인 게시물만) */}
                {isOwnPost && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex-shrink-0 p-2 -mr-2 hover:opacity-70 transition-opacity focus:outline-none"
                        aria-label="더보기 메뉴"
                      >
                        <MoreHorizontal className="w-5 h-5 text-[#262626]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-[#ed4956] focus:text-[#ed4956] cursor-pointer"
                      >
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </header>

              {/* 댓글 목록 (스크롤 가능) */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="px-4 py-4">
                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-4 mb-2">
                  <button
                    type="button"
                    onClick={handleLikeClick}
                    className="hover:opacity-70 transition-opacity focus:outline-none"
                    aria-label={liked ? '좋아요 취소' : '좋아요'}
                  >
                    <Heart
                      className={cn(
                        'w-6 h-6 transition-transform',
                        liked && 'fill-[#ed4956] text-[#ed4956]',
                        isAnimating && 'scale-125'
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    className="hover:opacity-70 transition-opacity focus:outline-none"
                    aria-label="댓글"
                    disabled
                  >
                    <MessageCircle className="w-6 h-6 text-[#262626]" />
                  </button>
                  <button
                    type="button"
                    className="hover:opacity-70 transition-opacity focus:outline-none"
                    aria-label="공유 (준비 중)"
                    disabled
                  >
                    <Send className="w-6 h-6 text-[#262626]" />
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    className="hover:opacity-70 transition-opacity focus:outline-none"
                    aria-label="북마크 (준비 중)"
                    disabled
                  >
                    <Bookmark className="w-6 h-6 text-[#262626]" />
                  </button>
                </div>

                {/* 좋아요 수 및 댓글 수 */}
                {(likeCount > 0 || (postData?.total_comments ?? 0) > 0) && (
                  <div className="flex items-center gap-4 text-sm font-bold text-[#262626] mb-2">
                    {likeCount > 0 && (
                      <span>좋아요 {likeCount.toLocaleString()}개</span>
                    )}
                    {(postData?.total_comments ?? 0) > 0 && (
                      <span>댓글 {(postData?.total_comments ?? 0).toLocaleString()}개</span>
                    )}
                  </div>
                )}

                {/* 캡션 */}
                {postData.caption && (
                  <div className="text-sm text-[#262626] mb-4">
                    <Link
                      href={
                        postData.user_id
                          ? `/profile/${postData.user_id}`
                          : '/profile'
                      }
                      className="font-bold hover:opacity-70 transition-opacity mr-1"
                    >
                      {postData.user?.name || '알 수 없음'}
                    </Link>
                    <span>{postData.caption}</span>
                  </div>
                )}

                  {/* 댓글 목록 */}
                  <CommentList
                    comments={comments}
                    currentUserId={currentUserId || undefined}
                    onDeleteClick={handleCommentDelete}
                  />
                </div>
              </div>

              {/* 댓글 입력 폼 */}
              <CommentForm
                postId={postId}
                onSubmit={handleCommentSubmit}
                className="border-t border-[#dbdbdb]"
              />
            </>
          )}
        </div>

        {/* 게시물 삭제 확인 다이얼로그 */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                게시물을 삭제하시겠어요?
              </DialogTitle>
              <DialogDescription className="text-center">
                이 게시물을 삭제하면 복구할 수 없습니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1 sm:flex-none"
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handlePostDelete();
                  setIsDeleteDialogOpen(false);
                }}
                className="flex-1 sm:flex-none"
              >
                삭제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

