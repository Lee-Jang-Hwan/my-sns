import Sidebar from '@/components/layout/Sidebar';
import MobileHeader from '@/components/layout/MobileHeader';
import BottomNav from '@/components/layout/BottomNav';
import { cn } from '@/lib/utils';

/**
 * @file layout.tsx
 * @description (main) Route Group 레이아웃 - Instagram 스타일 반응형 레이아웃
 *
 * 주요 기능:
 * 1. Desktop (≥1024px): Sidebar(244px) + Main Content(최대 630px, 중앙 정렬)
 * 2. Tablet (768px-1023px): Sidebar(72px) + Main Content(전체 너비)
 * 3. Mobile (<768px): MobileHeader(60px, 상단) + Main Content + BottomNav(50px, 하단)
 *
 * 레이아웃 구조:
 * - Sidebar: Desktop/Tablet에서 표시 (고정 위치, 왼쪽)
 * - MobileHeader: Mobile에서 표시 (고정 위치, 상단)
 * - BottomNav: Mobile에서 표시 (고정 위치, 하단)
 * - Main Content: 반응형 너비, 중앙 정렬
 *
 * @dependencies
 * - @/components/layout/Sidebar: Desktop/Tablet 사이드바
 * - @/components/layout/MobileHeader: Mobile 헤더
 * - @/components/layout/BottomNav: Mobile 하단 네비게이션
 * - @/lib/utils: cn 유틸리티 함수
 */

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Sidebar: Desktop/Tablet에서만 표시 */}
      <Sidebar />

      {/* MobileHeader: Mobile에서만 표시 */}
      <MobileHeader />

      {/* Main Content 영역 */}
      <main
        className={cn(
          // Desktop: Sidebar 너비만큼 왼쪽 마진
          'lg:ml-[244px]',
          // Tablet: Sidebar 너비만큼 왼쪽 마진
          'md:ml-[72px]',
          // Mobile: Header와 BottomNav 높이만큼 상하 패딩
          'pt-[60px] pb-[50px]',
          // Tablet/Desktop: 상단 패딩
          'md:pt-0 md:pb-0',
          // 공통 스타일
          'flex justify-center',
          'min-h-screen'
        )}
      >
        {/* 컨텐츠 컨테이너 */}
        <div
          className={cn(
            // Desktop: 최대 너비 630px
            'w-full max-w-[630px]',
            // 배경 및 패딩
            'bg-[#FAFAFA]',
            'px-0'
          )}
        >
          {children}
        </div>
      </main>

      {/* BottomNav: Mobile에서만 표시 */}
      <BottomNav />
    </div>
  );
}




