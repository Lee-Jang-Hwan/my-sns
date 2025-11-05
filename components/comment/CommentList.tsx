"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils/time";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * @file CommentList.tsx
 * @description 댓글 목록 컴포넌트
 *
 * 주요 기능:
 * 1. 댓글 목록 렌더링
 * 2. 사용자명, 댓글 내용, 시간 표시
 * 3. 프로필 링크
 * 4. 빈 상태 처리
 * 5. 스크롤 가능한 영역
 *
 * @dependencies
 * - next/link: 프로필 링크
 * - lib/utils/time: formatTimeAgo 함수
 * - lib/utils: cn 유틸리티 함수
 */

export interface Comment {
  id: string;
  username: string;
  content: string;
  userId?: string; // 프로필 링크용
  created_at?: string; // 시간 표시용
}

interface CommentListProps {
  comments: Comment[];
  currentUserId?: string; // 본인 댓글 확인용 (선택, 향후 삭제 기능용)
  onDeleteClick?: (commentId: string) => void; // 삭제 핸들러 (선택, 향후 사용)
  className?: string; // 추가 스타일링
}

export default function CommentList({
  comments,
  currentUserId,
  onDeleteClick,
  className,
}: CommentListProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );

  // 빈 상태
  if (comments.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center py-8 px-4", className)}
      >
        <p className="text-sm text-[#8e8e8e]">아직 댓글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {comments.map((comment) => {
        const isOwnComment = currentUserId && comment.userId === currentUserId;

        return (
          <div key={comment.id} className="flex items-start gap-2 py-1">
            {/* 사용자명과 댓글 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5 flex-wrap">
                <Link
                  href={
                    comment.userId ? `/profile/${comment.userId}` : "/profile"
                  }
                  className="font-bold text-sm text-[#262626] hover:opacity-70 transition-opacity flex-shrink-0"
                >
                  {comment.username}
                </Link>
                <span className="text-sm text-[#262626] break-words">
                  {comment.content}
                </span>
              </div>
              {/* 시간 표시 */}
              {comment.created_at && (
                <div className="mt-0.5">
                  <span className="text-xs text-[#8e8e8e]">
                    {formatTimeAgo(comment.created_at)}
                  </span>
                </div>
              )}
            </div>

            {/* 삭제 메뉴 버튼 (본인 댓글인 경우에만 표시) */}
            {isOwnComment && onDeleteClick && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity focus:outline-none"
                    aria-label="댓글 메뉴"
                  >
                    <MoreHorizontal className="w-4 h-4 text-[#262626]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCommentId(comment.id);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-[#ed4956] focus:text-[#ed4956] cursor-pointer"
                  >
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      })}

      {/* 댓글 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              댓글을 삭제하시겠어요?
            </DialogTitle>
            <DialogDescription className="text-center">
              이 댓글을 삭제하면 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedCommentId(null);
              }}
              className="flex-1 sm:flex-none"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedCommentId && onDeleteClick) {
                  onDeleteClick(selectedCommentId);
                }
                setIsDeleteDialogOpen(false);
                setSelectedCommentId(null);
              }}
              className="flex-1 sm:flex-none"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
