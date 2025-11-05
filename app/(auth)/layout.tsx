/**
 * @file layout.tsx
 * @description 인증 페이지 레이아웃
 *
 * 주요 기능:
 * 1. 인증 페이지(sign-in, sign-up) 전용 레이아웃
 * 2. Sidebar, MobileHeader, BottomNav 제외
 * 3. 깔끔한 인증 UI를 위한 최소 레이아웃
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {children}
    </div>
  );
}

