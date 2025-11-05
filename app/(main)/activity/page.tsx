/**
 * @file page.tsx
 * @description 알림 페이지 (1차 MVP 제외 기능)
 *
 * 현재는 임시 페이지로 구현되어 있으며,
 * 향후 좋아요, 댓글, 팔로우 등 알림 기능이 추가될 예정입니다.
 *
 * @dependencies
 * - @clerk/nextjs: 인증 상태 확인
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ActivityPage() {
  const { userId } = await auth();

  // 로그인하지 않은 경우 홈으로 리다이렉트
  if (!userId) {
    redirect('/');
  }

  return (
    <div className="w-full bg-white min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold text-[#262626] mb-2">알림</h1>
        <p className="text-[#8e8e8e]">
          알림 기능은 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}

