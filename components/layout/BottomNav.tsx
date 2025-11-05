'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, Heart, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @file BottomNav.tsx
 * @description Instagram 스타일의 모바일 전용 하단 네비게이션 컴포넌트
 *
 * 주요 기능:
 * 1. Mobile (<768px)에서만 표시
 * 2. 높이: 50px 고정
 * 3. 하단 고정 위치
 * 4. 5개 메뉴 아이콘: 홈, 검색, 만들기, 알림, 프로필
 *
 * @dependencies
 * - next/link: 클라이언트 사이드 네비게이션
 * - next/navigation: usePathname 훅
 * - lucide-react: 아이콘
 * - @/lib/utils: cn 유틸리티 함수
 */

interface MenuItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const menuItems: MenuItem[] = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/search', icon: Search, label: '검색' },
  { href: '/create', icon: PlusSquare, label: '만들기' },
  { href: '/activity', icon: Heart, label: '알림' },
  { href: '/profile', icon: UserCircle, label: '프로필' },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Active 상태 확인 (프로필은 /profile으로 시작하는 모든 경로 포함)
  const isActive = (href: string) => {
    if (href === '/profile') {
      return pathname.startsWith('/profile');
    }
    return pathname === href;
  };

  return (
    <nav
      className={cn(
        // Mobile에서만 표시
        'flex md:hidden',
        // 고정 위치 및 스타일
        'fixed bottom-0 left-0 right-0 z-50',
        'h-[50px]',
        'bg-white border-t border-[#dbdbdb]',
        // 레이아웃
        'flex items-center justify-around',
        'px-4'
      )}
    >
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center justify-center',
              'w-full h-full',
              'text-[#262626]',
              'transition-colors duration-150',
              // Active 상태
              active && 'text-[#262626]'
            )}
            aria-label={item.label}
          >
            <Icon
              className={cn(
                'w-6 h-6',
                'flex-shrink-0',
                active ? 'text-[#262626]' : 'text-[#262626]'
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}




