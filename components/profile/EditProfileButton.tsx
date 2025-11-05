'use client';

import { useClerk } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

/**
 * @file EditProfileButton.tsx
 * @description 프로필 페이지 프로필 편집 버튼 컴포넌트
 *
 * 주요 기능:
 * 1. Clerk의 프로필 편집 모달 열기
 * 2. 자기 자신 프로필일 때만 표시
 * 3. PRD 디자인에 맞는 스타일링:
 *    - 회색 테두리, 흰색 배경
 *    - "프로필 편집" 텍스트
 *    - 팔로우 버튼과 유사한 크기 및 스타일
 *
 * @dependencies
 * - @clerk/nextjs: useClerk 훅
 * - @/lib/utils: cn 유틸리티 함수
 */

interface EditProfileButtonProps {
  /**
   * 추가 클래스명 (선택적)
   */
  className?: string;
}

export default function EditProfileButton({
  className,
}: EditProfileButtonProps) {
  const { openUserProfile } = useClerk();

  const handleEditProfile = () => {
    openUserProfile();
  };

  return (
    <button
      type="button"
      onClick={handleEditProfile}
      className={cn(
        'px-6 py-1.5 rounded-lg font-semibold text-sm transition-all duration-200',
        'bg-white border border-[#dbdbdb] text-[#262626]',
        'hover:bg-gray-50',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0095f6]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      프로필 편집
    </button>
  );
}

