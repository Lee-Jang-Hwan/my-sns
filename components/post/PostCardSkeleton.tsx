import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * @file PostCardSkeleton.tsx
 * @description PostCard의 로딩 상태를 표시하는 스켈레톤 UI 컴포넌트
 *
 * PostCard와 동일한 레이아웃 구조를 가지며, 각 영역을 스켈레톤으로 표시합니다.
 *
 * 주요 구성:
 * 1. Header: 프로필 이미지, 사용자명, 시간, 메뉴 버튼 스켈레톤
 * 2. Image: 1:1 정사각형 이미지 영역 스켈레톤
 * 3. Actions: 좋아요, 댓글, 공유, 북마크 버튼 스켈레톤
 * 4. Content: 좋아요 수, 캡션, 댓글 미리보기 스켈레톤
 *
 * @dependencies
 * - @/components/ui/skeleton: 스켈레톤 기본 컴포넌트
 * - @/lib/utils: cn 유틸리티 함수
 */

export default function PostCardSkeleton() {
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
        {/* 프로필 이미지 스켈레톤 */}
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />

        {/* 사용자명과 시간 스켈레톤 */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* 메뉴 버튼 스켈레톤 */}
        <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
      </header>

      {/* Image 영역 (1:1 정사각형) */}
      <div className="w-full aspect-square relative bg-gray-100 overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      {/* Actions 영역 (48px) */}
      <div className="flex items-center justify-between h-[48px] px-4">
        {/* 좌측 액션 버튼들 스켈레톤 */}
        <div className="flex items-center gap-4">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>

        {/* 우측 북마크 버튼 스켈레톤 */}
        <Skeleton className="w-6 h-6 rounded" />
      </div>

      {/* Content 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 스켈레톤 */}
        <Skeleton className="h-4 w-24" />

        {/* 캡션 스켈레톤 (2줄) */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>

        {/* 댓글 더 보기 스켈레톤 */}
        <Skeleton className="h-3.5 w-32" />

        {/* 댓글 미리보기 스켈레톤 (2줄) */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>
      </div>
    </article>
  );
}
