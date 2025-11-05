'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @file Sidebar.tsx
 * @description Instagram 스타일의 반응형 Sidebar 컴포넌트
 *
 * 주요 기능:
 * 1. Desktop (≥1024px): 244px 너비, 아이콘 + 텍스트 표시
 * 2. Tablet (768px-1023px): 72px 너비, 아이콘만 표시
 * 3. Mobile (<768px): 완전히 숨김
 *
 * 메뉴 항목:
 * - 홈 (/)
 * - 검색 (/search)
 * - 만들기 (/create)
 * - 프로필 (/profile)
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
  { href: '/create', icon: Plus, label: '만들기' },
  { href: '/profile', icon: User, label: '프로필' },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Active 상태 확인 (프로필은 /profile으로 시작하는 모든 경로 포함)
  const isActive = (href: string) => {
    if (href === '/profile') {
      return pathname.startsWith('/profile');
    }
    return pathname === href;
  };

  return (
    <aside
      className={cn(
        // Mobile: 숨김
        'hidden',
        // Tablet: 72px 너비, 아이콘만, 중앙 정렬
        'md:flex md:w-[72px] md:flex-col md:items-center',
        // Desktop: 244px 너비, 아이콘 + 텍스트
        'lg:w-[244px] lg:items-stretch',
        // 공통 스타일
        'bg-white border-r border-[#dbdbdb]',
        'fixed left-0 top-0 h-screen z-50',
        'pt-4 pb-4'
      )}
    >
      <nav className="flex flex-col gap-1 w-full md:w-auto lg:w-full px-2 md:px-0 lg:px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // 기본 스타일
                'flex items-center',
                // Tablet: 중앙 정렬, Desktop: 왼쪽 정렬
                'md:justify-center lg:justify-start',
                'gap-3',
                'px-3 py-3 md:px-0 md:py-2 lg:px-3 lg:py-3',
                'rounded-lg',
                'text-[#262626]',
                'transition-colors duration-150',
                // Hover 효과
                'hover:bg-gray-50',
                // Active 상태
                active && 'font-bold'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6',
                  'flex-shrink-0',
                  'text-[#262626]'
                )}
              />
              {/* Tablet에서는 텍스트 숨김, Desktop에서는 표시 */}
              <span
                className={cn(
                  'text-sm',
                  'hidden lg:inline',
                  active ? 'font-bold' : 'font-normal'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

