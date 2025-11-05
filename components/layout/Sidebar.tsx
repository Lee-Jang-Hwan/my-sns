"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Home, Search, Plus, User, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @file Sidebar.tsx
 * @description Instagram 스타일의 반응형 Sidebar 컴포넌트
 *
 * 주요 기능:
 * 1. Desktop (≥1024px): 244px 너비, 아이콘 + 텍스트 표시
 * 2. Tablet (768px-1023px): 72px 너비, 아이콘만 표시
 * 3. Mobile (<768px): 완전히 숨김
 *
 * 메뉴 항목 (로그인한 사용자):
 * - 홈 (/)
 * - 검색 (/search)
 * - 만들기 (/create)
 * - 프로필 (/profile)
 *
 * 인증 버튼 (로그인하지 않은 사용자):
 * - 로그인 버튼 (/sign-in) - 파란색 배경
 * - 회원가입 버튼 (/sign-up) - 파란색 텍스트
 *
 * @dependencies
 * - @clerk/nextjs: useAuth 훅으로 인증 상태 확인
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
  { href: "/", icon: Home, label: "홈" },
  { href: "/search", icon: Search, label: "검색" },
  { href: "/create", icon: Plus, label: "만들기" },
  { href: "/profile", icon: User, label: "프로필" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isLoaded, userId } = useAuth();

  // 디버깅용 로그 (개발 환경에서만)
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.group("🔍 Sidebar 인증 상태");
    console.log("isLoaded:", isLoaded);
    console.log("userId:", userId);
    console.log("로그인 버튼 표시 여부:", isLoaded && !userId);
    console.groupEnd();
  }

  // Active 상태 확인 (프로필은 /profile으로 시작하는 모든 경로 포함)
  const isActive = (href: string) => {
    if (href === "/profile") {
      return pathname.startsWith("/profile");
    }
    return pathname === href;
  };

  return (
    <aside
      className={cn(
        // Mobile: 숨김
        "hidden",
        // Tablet: 72px 너비, 아이콘만, 중앙 정렬
        "md:flex md:w-[72px] md:flex-col md:items-center",
        // Desktop: 244px 너비, 아이콘 + 텍스트
        "lg:w-[244px] lg:items-stretch",
        // 공통 스타일
        "bg-white border-r border-[#dbdbdb]",
        "fixed left-0 top-0 h-screen z-50",
        "pt-4 pb-4",
        // Flex 컬럼 레이아웃
        "flex flex-col",
      )}
    >
      {/* N.Code.Flow 헤더 */}
      <div className="w-full flex justify-center items-center mb-6 px-2 md:px-0 lg:px-4">
        <h1
          className="text-xl md:text-lg lg:text-xl font-semibold text-[#262626]"
          style={{
            fontFamily:
              "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          }}
        >
          <span className="hidden md:inline lg:inline">N.Code.Flow</span>
          <span className="inline md:hidden">NCF</span>
        </h1>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <nav className="flex flex-col flex-1 gap-1 w-full md:w-auto lg:w-full px-2 md:px-0 lg:px-4">
          {isLoaded && userId ? (
            // 로그인한 사용자: 메뉴 아이템 표시
            <>
              <div className="flex flex-col gap-1 flex-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        // 기본 스타일
                        "flex items-center",
                        // Tablet: 중앙 정렬, Desktop: 왼쪽 정렬
                        "md:justify-center lg:justify-start",
                        "gap-3",
                        "px-3 py-3 md:px-0 md:py-2 lg:px-3 lg:py-3",
                        "rounded-lg",
                        "text-[#262626]",
                        "transition-colors duration-150",
                        // Hover 효과
                        "hover:bg-gray-50",
                        // Active 상태
                        active && "font-bold",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-6 h-6",
                          "flex-shrink-0",
                          "text-[#262626]",
                        )}
                      />
                      {/* Tablet에서는 텍스트 숨김, Desktop에서는 표시 */}
                      <span
                        className={cn(
                          "text-sm",
                          "hidden lg:inline",
                          active ? "font-bold" : "font-normal",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* 프로필 메뉴 하단에 UserButton 추가 (로그아웃 등 기능) */}
              <div className="mt-auto pt-4 border-t border-[#dbdbdb]">
                <div
                  className={cn(
                    "flex items-center",
                    "md:justify-center lg:justify-start",
                    "px-3 py-3 md:px-0 md:py-2 lg:px-3 lg:py-3",
                  )}
                >
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-6 h-6",
                        userButtonPopoverCard: "shadow-lg",
                      },
                    }}
                    afterSignOutUrl="/"
                  />
                  <span className="text-sm hidden lg:inline ml-3 text-[#262626]">
                    프로필 설정
                  </span>
                </div>
              </div>
            </>
          ) : isLoaded ? (
            // 로그인하지 않은 사용자: 로그인 및 회원가입 버튼 표시
            <div className="flex flex-col gap-2">
              {/* 로그인 버튼 */}
              <Link
                href="/sign-in"
                className={cn(
                  "flex items-center",
                  "md:justify-center lg:justify-start",
                  "gap-3",
                  "px-3 py-3 md:px-0 md:py-2 lg:px-3 lg:py-3",
                  "rounded-lg",
                  "bg-[#0095f6]",
                  "text-white",
                  "transition-colors duration-150",
                  "hover:bg-[#1877f2]",
                  "font-semibold",
                  "min-h-[44px]", // 최소 높이 보장
                )}
                aria-label="로그인"
              >
                <LogIn
                  className={cn("w-6 h-6", "flex-shrink-0", "text-white")}
                />
                <span className="text-sm hidden md:inline lg:inline">
                  로그인
                </span>
              </Link>

              {/* 회원가입 버튼 */}
              <Link
                href="/sign-up"
                className={cn(
                  "flex items-center",
                  "md:justify-center lg:justify-start",
                  "gap-3",
                  "px-3 py-3 md:px-0 md:py-2 lg:px-3 lg:py-3",
                  "rounded-lg",
                  "text-[#0095f6]",
                  "transition-colors duration-150",
                  "hover:bg-gray-50",
                  "font-semibold",
                  "min-h-[44px]", // 최소 높이 보장
                )}
                aria-label="회원가입"
              >
                <UserPlus
                  className={cn("w-6 h-6", "flex-shrink-0", "text-[#0095f6]")}
                />
                <span className="text-sm hidden md:inline lg:inline">
                  회원가입
                </span>
              </Link>
            </div>
          ) : // 로딩 중: 빈 상태 (또는 로딩 스켈레톤 표시 가능)
          null}
        </nav>
      </div>
    </aside>
  );
}
