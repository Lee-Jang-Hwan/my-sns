'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import CreatePostModal from '@/components/post/CreatePostModal';

/**
 * @file page.tsx
 * @description 게시물 작성 페이지
 *
 * 주요 기능:
 * 1. 페이지 로드 시 CreatePostModal 자동 오픈
 * 2. 모달 닫기 시 홈으로 리다이렉트
 * 3. 게시물 작성 성공 시 홈으로 리다이렉트 및 새로고침
 *
 * @dependencies
 * - @clerk/nextjs: 인증 상태 확인
 * - next/navigation: useRouter 훅
 * - @/components/post/CreatePostModal: 게시물 작성 모달 컴포넌트
 * - @/lib/supabase/clerk-client: Supabase 클라이언트
 */

export default function CreatePostPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 인증 확인 후 모달 열기
  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        // 로그인하지 않은 경우 홈으로 리다이렉트
        router.push('/');
        return;
      }
      // 로그인한 경우 모달 열기
      setIsModalOpen(true);
    }
  }, [isLoaded, userId, router]);

  // 모달 상태 변경 핸들러 (닫기 포함)
  const handleOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    // 모달이 닫힐 때 홈으로 리다이렉트
    if (!open) {
      router.push('/');
    }
  };

  // 게시물 작성 성공 핸들러
  const handleSuccess = () => {
    // 게시물 작성 성공 시 홈으로 리다이렉트
    router.push('/');
    // 페이지 새로고침하여 새 게시물 표시
    router.refresh();
  };

  // 로딩 중이거나 모달이 열리지 않은 경우 빈 화면
  if (!isLoaded || !isModalOpen) {
    return null;
  }

  return (
    <CreatePostModal
      open={isModalOpen}
      onOpenChange={handleOpenChange}
      onSuccess={handleSuccess}
    />
  );
}

