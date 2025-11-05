'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Heart, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @file MobileHeader.tsx
 * @description Instagram 스타일의 모바일 전용 Header 컴포넌트
 *
 * 주요 기능:
 * 1. Mobile (<768px)에서만 표시
 * 2. 높이: 60px 고정
 * 3. 구성: 로고 + 알림 + DM + 프로필 아이콘
 *
 * @dependencies
 * - next/link: 클라이언트 사이드 네비게이션
 * - @clerk/nextjs: 인증 상태 관리 및 UserButton
 * - lucide-react: 아이콘
 * - @/lib/utils: cn 유틸리티 함수
 */

export default function MobileHeader() {
  return (
    <header
      className={cn(
        // Mobile에서만 표시
        'flex md:hidden',
        // 고정 위치 및 스타일
        'fixed top-0 left-0 right-0 z-50',
        'h-[60px]',
        'bg-white border-b border-[#dbdbdb]',
        // 레이아웃
        'flex items-center justify-between',
        'px-4'
      )}
    >
      {/* 로고 */}
      <Link href="/" className="flex items-center">
        <span className="text-xl font-bold text-[#262626]">Instagram</span>
      </Link>

      {/* 우측 아이콘 버튼들 */}
      <div className="flex items-center gap-4">
        <SignedIn>
          {/* 알림 아이콘 */}
          <button
            type="button"
            className="p-2 text-[#262626] hover:opacity-70 transition-opacity"
            aria-label="알림"
          >
            <Heart className="w-6 h-6" />
          </button>

          {/* DM 아이콘 */}
          <button
            type="button"
            className="p-2 text-[#262626] hover:opacity-70 transition-opacity"
            aria-label="메시지"
          >
            <Send className="w-6 h-6" />
          </button>

          {/* 프로필 - Clerk UserButton */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-6 h-6',
              },
            }}
          />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="px-4 py-2 text-sm font-semibold text-[#0095f6] hover:opacity-70 transition-opacity"
            >
              로그인
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}

