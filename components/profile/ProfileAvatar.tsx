import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * @file ProfileAvatar.tsx
 * @description 프로필 페이지용 반응형 아바타 컴포넌트
 *
 * 주요 기능:
 * 1. 반응형 크기: 90px (Mobile) / 150px (Desktop)
 * 2. 원형 모양
 * 3. 이미지가 있을 경우 Next.js Image 컴포넌트 사용
 * 4. 이미지가 없을 경우 이름의 첫 글자 표시 (fallback)
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - @/lib/utils: cn 유틸리티 함수
 */

interface ProfileAvatarProps {
  /**
   * 프로필 이미지 URL (선택적)
   * 없을 경우 이름의 첫 글자가 표시됩니다.
   */
  imageUrl?: string | null;
  /**
   * 사용자 이름 (필수)
   * 이미지가 없을 경우 첫 글자가 표시됩니다.
   */
  name: string;
  /**
   * 추가 클래스명 (선택적)
   */
  className?: string;
}

export default function ProfileAvatar({
  imageUrl,
  name,
  className,
}: ProfileAvatarProps) {
  // 이름의 첫 글자 (대문자)
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        // 기본 크기 (Mobile): 90px
        'w-[90px] h-[90px]',
        // Desktop 크기: 150px
        'md:w-[150px] md:h-[150px]',
        // 원형 모양
        'rounded-full',
        // 기본 배경색 (이미지 없을 경우)
        'bg-gray-200',
        // 중앙 정렬
        'flex items-center justify-center',
        // 오버플로우 숨김 (원형 유지)
        'overflow-hidden',
        // flex-shrink 방지
        'flex-shrink-0',
        className
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`${name} 프로필`}
          width={150}
          height={150}
          className="w-full h-full object-cover rounded-full"
          sizes="(max-width: 768px) 90px, 150px"
          priority
        />
      ) : (
        <span
          className={cn(
            // 텍스트 크기 반응형
            'text-2xl md:text-4xl',
            // 텍스트 색상
            'text-gray-400',
            // 폰트 굵기
            'font-semibold',
            // 선택 불가
            'select-none'
          )}
        >
          {initial}
        </span>
      )}
    </div>
  );
}

