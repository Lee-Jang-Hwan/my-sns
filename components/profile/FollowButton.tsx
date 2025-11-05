'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * @file FollowButton.tsx
 * @description 프로필 페이지 팔로우/팔로잉 버튼 컴포넌트
 *
 * 주요 기능:
 * 1. 팔로우/언팔로우 상태 관리
 * 2. API 호출을 통한 팔로우 상태 변경
 * 3. 로딩 및 에러 상태 처리
 * 4. PRD 디자인에 맞는 스타일링:
 *    - 미팔로우: "팔로우" 버튼, 파란색 배경 (#0095f6)
 *    - 팔로우 중: "팔로잉" 버튼, 회색 배경 (#dbdbdb)
 *    - Hover 시 (팔로우 중): "언팔로우" 텍스트, 빨간 테두리 (#ed4956)
 *
 * @dependencies
 * - @/lib/utils: cn 유틸리티 함수
 */

interface FollowButtonProps {
  /**
   * 팔로우 대상 사용자 ID (Supabase UUID)
   */
  targetUserId: string;
  /**
   * 초기 팔로우 상태 (선택적)
   * 서버 사이드에서 조회한 팔로우 상태를 전달
   */
  initialIsFollowing?: boolean;
  /**
   * 현재 사용자 ID (Supabase UUID, 선택적)
   * 자기 자신 팔로우 방지 검증에 사용
   */
  currentUserId?: string;
  /**
   * 추가 클래스명 (선택적)
   */
  className?: string;
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing = false,
  currentUserId,
  className,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleFollowToggle = async () => {
    if (isLoading) return;

    // 자기 자신 팔로우 방지 검증 (컴포넌트 레벨)
    if (currentUserId && currentUserId === targetUserId) {
      alert('자기 자신을 팔로우할 수 없습니다.');
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // 언팔로우
        const response = await fetch('/api/follows', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followingId: targetUserId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to unfollow');
        }

        setIsFollowing(false);
      } else {
        // 팔로우
        const response = await fetch('/api/follows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followingId: targetUserId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to follow');
        }

        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      // 에러 발생 시 사용자에게 알림 (추후 토스트 메시지로 개선 가능)
      alert(error instanceof Error ? error.message : '팔로우 상태 변경에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 팔로우 중일 때 hover 상태에 따라 다른 스타일 적용
  const getButtonStyles = () => {
    if (isFollowing) {
      // 팔로우 중 상태
      if (isHovering) {
        // Hover 시: 언팔로우 스타일 (빨간 테두리)
        return {
          backgroundColor: 'transparent',
          borderColor: '#ed4956',
          borderWidth: '1px',
          color: '#ed4956',
        };
      }
      // 기본: 팔로잉 스타일 (회색)
      return {
        backgroundColor: '#dbdbdb',
        borderColor: 'transparent',
        borderWidth: '1px',
        color: '#262626',
      };
    }
    // 미팔로우 상태: 팔로우 스타일 (파란색)
    return {
      backgroundColor: '#0095f6',
      borderColor: 'transparent',
      borderWidth: '1px',
      color: '#ffffff',
    };
  };

  const buttonStyles = getButtonStyles();
  const buttonText = isFollowing
    ? isHovering
      ? '언팔로우'
      : '팔로잉'
    : '팔로우';

  return (
    <button
      type="button"
      onClick={handleFollowToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isLoading}
      className={cn(
        'px-6 py-1.5 rounded-lg font-semibold text-sm transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        isFollowing && isHovering
          ? 'focus:ring-[#ed4956]'
          : 'focus:ring-[#0095f6]',
        className
      )}
      style={{
        backgroundColor: buttonStyles.backgroundColor,
        borderColor: buttonStyles.borderColor,
        borderWidth: buttonStyles.borderWidth,
        color: buttonStyles.color,
      }}
    >
      {isLoading ? '처리 중...' : buttonText}
    </button>
  );
}

