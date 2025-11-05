'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * @file CommentForm.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * 주요 기능:
 * 1. 댓글 입력 필드 ("댓글 달기..." 플레이스홀더)
 * 2. Enter 키 또는 "게시" 버튼으로 제출
 * 3. 입력 검증 (빈 내용, 공백만 있는 경우 방지)
 * 4. 제출 중 상태 관리
 * 5. 에러 처리
 *
 * @dependencies
 * - @/components/ui/button: Button 컴포넌트
 * - @/components/ui/input: Input 컴포넌트
 * - lib/utils: cn 유틸리티 함수
 */

interface CommentFormProps {
  postId: string; // 댓글을 작성할 게시물 ID
  onSubmit?: (content: string) => Promise<void>; // 제출 핸들러 (향후 API 연동용)
  onSuccess?: () => void; // 성공 시 콜백
  className?: string; // 추가 스타일링
  disabled?: boolean; // 비활성화 상태
}

const MAX_COMMENT_LENGTH = 2200; // 최대 댓글 길이 (PRD.md 참고: 캡션과 동일)

export default function CommentForm({
  postId,
  onSubmit,
  onSuccess,
  className,
  disabled = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 입력 내용 변경 핸들러
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value.length <= MAX_COMMENT_LENGTH) {
      setContent(value);
      setError(null); // 입력 시 에러 초기화
    }
  };

  // 제출 가능 여부 확인
  const canSubmit = content.trim().length > 0 && !isSubmitting && !disabled;

  // 제출 핸들러
  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }

    // 검증
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      setError('댓글을 입력해주세요.');
      return;
    }

    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      setError(`댓글은 ${MAX_COMMENT_LENGTH}자 이하로 입력해주세요.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(trimmedContent);
      } else {
        // onSubmit이 없으면 기본 동작 (향후 API 연동 시 사용)
        console.log('Comment submitted:', { postId, content: trimmedContent });
      }

      // 성공 처리
      setContent(''); // 입력 필드 초기화
      onSuccess?.(); // 성공 콜백 호출
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '댓글 작성에 실패했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enter 키 핸들러 (Enter 제출, Shift+Enter는 줄바꿈)
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) {
        handleSubmit();
      }
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* 에러 메시지 (입력 필드 위에 표시) */}
      {error && (
        <div className="px-4 pt-2 pb-1">
          <p className="text-xs text-[#ed4956]">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t border-[#dbdbdb]"
      >
        {/* 입력 필드 */}
        <Input
          type="text"
          placeholder="댓글 달기..."
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSubmitting}
          maxLength={MAX_COMMENT_LENGTH}
          className={cn(
            'flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0',
            'text-sm text-[#262626] placeholder:text-[#8e8e8e]',
            'bg-transparent px-0',
            error && 'text-[#ed4956]'
          )}
        />

        {/* 게시 버튼 */}
        <Button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'px-0 py-0 h-auto font-semibold text-sm min-w-fit',
            'text-[#0095f6] hover:text-[#0095f6]/70',
            'disabled:text-[#8e8e8e] disabled:cursor-not-allowed disabled:opacity-50',
            'bg-transparent hover:bg-transparent',
            'focus-visible:ring-0'
          )}
        >
          {isSubmitting ? '게시 중...' : '게시'}
        </Button>
      </form>
    </div>
  );
}

