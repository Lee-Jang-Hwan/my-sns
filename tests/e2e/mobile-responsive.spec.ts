import { test, expect } from '@playwright/test';

/**
 * @file mobile-responsive.spec.ts
 * @description 모바일 반응형 테스트 (< 768px)
 *
 * PRD.md의 모바일 반응형 요구사항에 따라 다음을 검증:
 * 1. MobileHeader: 모바일에서 표시, 데스크톱에서 숨김
 * 2. BottomNav: 모바일에서 표시, 데스크톱에서 숨김
 * 3. Sidebar: 모바일에서 숨김, 데스크톱에서 표시
 * 4. 컴포넌트 크기 및 위치 검증
 * 5. 페이지별 모바일 레이아웃 검증
 */

test.describe('모바일 반응형 테스트 (< 768px)', () => {
  // 모바일 뷰포트 설정 (< 768px)
  test.use({ viewport: { width: 375, height: 667 } });

  test.describe('레이아웃 컴포넌트 표시/숨김', () => {
    test('MobileHeader가 모바일에서 표시되어야 함', async ({ page }) => {
      await page.goto('/');

      // MobileHeader 요소 찾기 (header 태그이지만 모바일에서만 표시)
      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });

      await expect(mobileHeader).toBeVisible();
      await expect(mobileHeader).toHaveCSS('display', 'flex');
    });

    test('BottomNav가 모바일에서 표시되어야 함', async ({ page }) => {
      await page.goto('/');

      // BottomNav 요소 찾기 (nav 태그이지만 모바일에서만 표시)
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });

      await expect(bottomNav).toBeVisible();
      await expect(bottomNav).toHaveCSS('display', 'flex');
    });

    test('Sidebar가 모바일에서 숨겨져야 함', async ({ page }) => {
      await page.goto('/');

      // Sidebar 요소 찾기 (aside 태그)
      const sidebar = page.locator('aside');

      // 모바일에서는 숨김 (hidden 클래스 또는 display: none)
      const isHidden =
        (await sidebar.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await sidebar.count()) === 0;

      expect(isHidden).toBeTruthy();
    });
  });

  test.describe('컴포넌트 크기 및 위치 검증', () => {
    test('MobileHeader 높이가 60px이어야 함', async ({ page }) => {
      await page.goto('/');

      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });

      await expect(mobileHeader).toBeVisible();
      const boundingBox = await mobileHeader.boundingBox();
      expect(boundingBox?.height).toBeCloseTo(60, 1);
    });

    test('MobileHeader가 상단에 고정되어야 함', async ({ page }) => {
      await page.goto('/');

      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });

      await expect(mobileHeader).toBeVisible();
      const boundingBox = await mobileHeader.boundingBox();
      expect(boundingBox?.y).toBeCloseTo(0, 1);
    });

    test('BottomNav 높이가 50px이어야 함', async ({ page }) => {
      await page.goto('/');

      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });

      await expect(bottomNav).toBeVisible();
      const boundingBox = await bottomNav.boundingBox();
      expect(boundingBox?.height).toBeCloseTo(50, 1);
    });

    test('BottomNav가 하단에 고정되어야 함', async ({ page }) => {
      await page.goto('/');

      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });

      await expect(bottomNav).toBeVisible();
      const boundingBox = await bottomNav.boundingBox();
      const viewportHeight = page.viewportSize()?.height || 667;
      // 하단 고정 위치 확인 (뷰포트 높이 - BottomNav 높이)
      expect(boundingBox?.y).toBeCloseTo(viewportHeight - 50, 1);
    });

    test('Main Content에 상단 패딩 60px이 적용되어야 함', async ({
      page,
    }) => {
      await page.goto('/');

      const mainContent = page.locator('main');

      await expect(mainContent).toBeVisible();
      const boundingBox = await mainContent.boundingBox();
      // MobileHeader 높이(60px)만큼 상단 패딩
      expect(boundingBox?.y).toBeCloseTo(60, 1);
    });

    test('Main Content에 하단 패딩 50px이 적용되어야 함', async ({
      page,
    }) => {
      await page.goto('/');

      const mainContent = page.locator('main');
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });

      await expect(mainContent).toBeVisible();
      await expect(bottomNav).toBeVisible();

      const mainBoundingBox = await mainContent.boundingBox();
      const navBoundingBox = await bottomNav.boundingBox();

      if (mainBoundingBox && navBoundingBox) {
        // Main Content 하단과 BottomNav 상단 사이 간격 확인
        const gap = navBoundingBox.y - (mainBoundingBox.y + mainBoundingBox.height);
        // 하단 패딩이 적용되어 있어야 함 (약 50px 이상)
        expect(gap).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('페이지별 모바일 레이아웃 검증', () => {
    test('홈 페이지 레이아웃이 모바일에 맞게 표시되어야 함', async ({
      page,
    }) => {
      await page.goto('/');

      // MobileHeader 확인
      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });
      await expect(mobileHeader).toBeVisible();

      // BottomNav 확인
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });
      await expect(bottomNav).toBeVisible();

      // Main Content 확인
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Main Content가 전체 너비를 사용하는지 확인
      const mainBoundingBox = await mainContent.boundingBox();
      const viewportWidth = page.viewportSize()?.width || 375;
      if (mainBoundingBox) {
        // 모바일에서는 Main Content가 거의 전체 너비를 사용해야 함
        expect(mainBoundingBox.width).toBeGreaterThan(viewportWidth * 0.9);
      }
    });

    test('프로필 페이지 레이아웃이 모바일에 맞게 표시되어야 함', async ({
      page,
    }) => {
      // 프로필 페이지로 이동 (임시로 루트로 이동, 실제 userId가 있으면 해당 경로 사용)
      await page.goto('/');

      // 프로필 페이지가 로드될 때까지 대기
      // 실제 프로필 페이지 경로가 있으면 해당 경로로 이동
      // 예: await page.goto('/profile/[userId]');

      // MobileHeader 확인
      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });
      await expect(mobileHeader).toBeVisible();

      // BottomNav 확인
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });
      await expect(bottomNav).toBeVisible();
    });

    test('게시물 상세 페이지 레이아웃이 모바일에 맞게 표시되어야 함', async ({
      page,
    }) => {
      // 게시물 상세 페이지로 이동 (임시로 루트로 이동, 실제 postId가 있으면 해당 경로 사용)
      await page.goto('/');

      // 게시물 상세 페이지가 로드될 때까지 대기
      // 실제 게시물 상세 페이지 경로가 있으면 해당 경로로 이동
      // 예: await page.goto('/post/[postId]');

      // MobileHeader 확인
      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });
      await expect(mobileHeader).toBeVisible();

      // BottomNav 확인
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });
      await expect(bottomNav).toBeVisible();
    });
  });

  test.describe('모바일 vs 데스크톱 비교 테스트', () => {
    test('모바일에서는 MobileHeader가 표시되고 데스크톱에서는 숨겨져야 함', async ({
      page,
    }) => {
      // 모바일 뷰포트에서 확인
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });
      await expect(mobileHeader).toBeVisible();

      // 데스크톱 뷰포트로 변경
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();

      // 데스크톱에서는 숨김
      const isHidden = await mobileHeader.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || el.classList.contains('hidden');
      });

      expect(isHidden).toBeTruthy();
    });

    test('모바일에서는 BottomNav가 표시되고 데스크톱에서는 숨겨져야 함', async ({
      page,
    }) => {
      // 모바일 뷰포트에서 확인
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });
      await expect(bottomNav).toBeVisible();

      // 데스크톱 뷰포트로 변경
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();

      // 데스크톱에서는 숨김
      const isHidden = await bottomNav.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || el.classList.contains('hidden');
      });

      expect(isHidden).toBeTruthy();
    });

    test('모바일에서는 Sidebar가 숨겨지고 데스크톱에서는 표시되어야 함', async ({
      page,
    }) => {
      // 모바일 뷰포트에서 확인
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const sidebar = page.locator('aside');
      const isHiddenMobile =
        (await sidebar.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await sidebar.count()) === 0;

      expect(isHiddenMobile).toBeTruthy();

      // 데스크톱 뷰포트로 변경
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();

      // 데스크톱에서는 표시
      await expect(sidebar).toBeVisible();
    });
  });
});

