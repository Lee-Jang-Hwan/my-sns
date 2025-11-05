import { cn } from '@/lib/utils';

/**
 * @file ProfileHeader.tsx
 * @description 프로필 페이지 헤더 컴포넌트 (사용자명, 이름 부분)
 *
 * 주요 기능:
 * 1. 사용자명(username) 표시: 큰 글씨, Bold
 * 2. 이름(fullname) 표시: 작은 글씨, 일반 굵기
 * 3. PRD 디자인에 맞는 레이아웃:
 *    - username: 아바타 옆 상단
 *    - fullname: username 아래
 * 4. 반응형 스타일링
 *
 * @dependencies
 * - @/lib/utils: cn 유틸리티 함수
 */

interface ProfileHeaderProps {
  /**
   * 사용자명 (username)
   * 현재는 name 필드를 사용하지만, 향후 분리 가능하도록 구조화
   */
  username: string;
  /**
   * 이름 (fullname)
   * 현재는 name 필드를 사용하지만, 향후 분리 가능하도록 구조화
   */
  fullname?: string;
  /**
   * 추가 클래스명 (선택적)
   */
  className?: string;
}

export default function ProfileHeader({
  username,
  fullname,
  className,
}: ProfileHeaderProps) {
  // fullname이 없으면 username을 사용
  const displayFullname = fullname || username;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 사용자명 (username) - 큰 글씨, Bold */}
      <h1
        className={cn(
          // 기본 크기 (Mobile)
          'text-xl',
          // Desktop 크기
          'md:text-2xl lg:text-3xl',
          // 폰트 굵기: Bold
          'font-bold',
          // 텍스트 색상
          'text-[#262626]',
          // 마진 바텀
          'mb-1 md:mb-2'
        )}
      >
        {username}
      </h1>

      {/* 이름 (fullname) - 작은 글씨, 일반 굵기 */}
      {displayFullname && displayFullname !== username && (
        <p
          className={cn(
            // 기본 크기 (Mobile)
            'text-sm',
            // Desktop 크기
            'md:text-base',
            // 폰트 굵기: 일반
            'font-normal',
            // 텍스트 색상
            'text-[#262626]'
          )}
        >
          {displayFullname}
        </p>
      )}
    </div>
  );
}

