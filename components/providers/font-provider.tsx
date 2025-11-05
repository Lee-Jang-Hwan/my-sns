'use client';

import { useEffect } from 'react';

/**
 * @file font-provider.tsx
 * @description Pretendard 폰트를 동적으로 로드하는 프로바이더
 *
 * Next.js App Router에서는 <head> 태그를 직접 사용할 수 없으므로,
 * 클라이언트 컴포넌트에서 useEffect를 사용하여 폰트를 로드합니다.
 */

export function FontProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Pretendard 폰트가 이미 로드되었는지 확인
    if (document.querySelector('link[href*="pretendard"]')) {
      return;
    }

    // Pretendard 폰트 스타일시트 동적 추가
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // 클린업 함수
    return () => {
      const existingLink = document.querySelector(
        'link[href*="pretendard"]'
      );
      if (existingLink) {
        existingLink.remove();
      }
    };
  }, []);

  return <>{children}</>;
}

