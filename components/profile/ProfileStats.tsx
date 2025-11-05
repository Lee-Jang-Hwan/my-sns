import { cn } from '@/lib/utils';

/**
 * @file ProfileStats.tsx
 * @description 프로필 페이지 통계 컴포넌트 (게시물, 팔로워, 팔로잉)
 *
 * 주요 기능:
 * 1. 게시물 수, 팔로워 수, 팔로잉 수를 표시
 * 2. PRD 디자인에 맞는 레이아웃:
 *    - 숫자는 Bold, 큰 글씨
 *    - 라벨은 작은 글씨, 회색
 *    - 가로로 나열 (gap 사용)
 * 3. 반응형 스타일링
 * 4. 숫자 포맷팅 (천 단위 콤마)
 *
 * @dependencies
 * - @/lib/utils: cn 유틸리티 함수
 */

interface ProfileStatsProps {
  /**
   * 게시물 수
   */
  postsCount: number;
  /**
   * 팔로워 수
   */
  followersCount: number;
  /**
   * 팔로잉 수
   */
  followingCount: number;
  /**
   * 추가 클래스명 (선택적)
   */
  className?: string;
}

/**
 * 숫자를 포맷팅하는 헬퍼 함수
 * 천 단위 콤마 추가
 */
function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

export default function ProfileStats({
  postsCount,
  followersCount,
  followingCount,
  className,
}: ProfileStatsProps) {
  return (
    <div className={cn('flex gap-8', className)}>
      {/* 게시물 수 */}
      <div className="flex items-center">
        <span className="font-semibold text-[#262626]">
          {formatNumber(postsCount)}
        </span>
        <span className="ml-1 text-gray-600">게시물</span>
      </div>

      {/* 팔로워 수 */}
      <div className="flex items-center">
        <span className="font-semibold text-[#262626]">
          {formatNumber(followersCount)}
        </span>
        <span className="ml-1 text-gray-600">팔로워</span>
      </div>

      {/* 팔로잉 수 */}
      <div className="flex items-center">
        <span className="font-semibold text-[#262626]">
          {formatNumber(followingCount)}
        </span>
        <span className="ml-1 text-gray-600">팔로잉</span>
      </div>
    </div>
  );
}


