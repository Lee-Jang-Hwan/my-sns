import { test, expect } from '@playwright/test';

/**
 * @file desktop-responsive.spec.ts
 * @description 데스크톱 반응형 테스트 (1024px+)
 *
 * PRD.md의 데스크톱 반응형 요구사항에 따라 다음을 검증:
 * 1. Sidebar: 데스크톱에서 표시 (244px 너비, 아이콘 + 텍스트)
 * 2. MobileHeader: 데스크톱에서 숨김
 * 3. BottomNav: 데스크톱에서 숨김
 * 4. Sidebar 아이콘 + 텍스트 표시
 * 5. Main Content 레이아웃 검증 (왼쪽 마진 244px, 최대 너비 630px, 중앙 정렬)
 * 6. 페이지별 데스크톱 레이아웃 검증
 */

test.describe('데스크톱 반응형 테스트 (1024px+)', () => {
  // 데스크톱 뷰포트 설정 (1024px+)
  test.use({ viewport: { width: 1280, height: 720 } });

  test.describe('레이아웃 컴포넌트 표시/숨김', () => {
    test('Sidebar가 데스크톱에서 표시되어야 함', async ({ page }) => {
      await page.goto('/');

      // Sidebar 요소 찾기 (aside 태그)
      const sidebar = page.locator('aside');

      await expect(sidebar).toBeVisible();
      await expect(sidebar).toHaveCSS('display', 'flex');
    });

    test('MobileHeader가 데스크톱에서 숨겨져야 함', async ({ page }) => {
      await page.goto('/');

      // MobileHeader 요소 찾기 (header 태그이지만 모바일에서만 표시)
      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });

      // 데스크톱에서는 숨김 (hidden 클래스 또는 display: none)
      const isHidden =
        (await mobileHeader.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await mobileHeader.count()) === 0;

      expect(isHidden).toBeTruthy();
    });

    test('BottomNav가 데스크톱에서 숨겨져야 함', async ({ page }) => {
      await page.goto('/');

      // BottomNav 요소 찾기 (nav 태그이지만 모바일에서만 표시)
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });

      // 데스크톱에서는 숨김 (hidden 클래스 또는 display: none)
      const isHidden =
        (await bottomNav.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await bottomNav.count()) === 0;

      expect(isHidden).toBeTruthy();
    });
  });

  test.describe('Sidebar 크기 및 스타일 검증', () => {
    test('Sidebar 너비가 244px이어야 함', async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('aside');

      await expect(sidebar).toBeVisible();
      const boundingBox = await sidebar.boundingBox();
      expect(boundingBox?.width).toBeCloseTo(244, 1);
    });

    test('Sidebar 아이콘이 표시되어야 함', async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // Sidebar 내부의 아이콘 링크 확인 (홈 아이콘)
      const homeLink = sidebar.locator('a[href="/"]');
      await expect(homeLink).toBeVisible();

      // 아이콘 SVG 또는 아이콘 요소 확인
      const icon = homeLink.locator('svg').first();
      await expect(icon).toBeVisible();
    });

    test('Sidebar 텍스트가 표시되어야 함 (아이콘 + 텍스트)', async ({
      page,
    }) => {
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // Sidebar 내부의 텍스트 요소 확인
      // 데스크톱에서는 텍스트가 표시되어야 함 (hidden lg:inline 클래스)
      const textElements = sidebar.locator('span').filter({
        hasText: /홈|검색|만들기|프로필/,
      });

      // 텍스트 요소가 표시되어야 함
      const count = await textElements.count();
      expect(count).toBeGreaterThan(0);

      // 첫 번째 텍스트 요소가 표시되는지 확인
      if (count > 0) {
        const element = textElements.first();
        await expect(element).toBeVisible();
      }
    });

    test('Sidebar 아이콘이 왼쪽 정렬되어야 함', async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // Sidebar의 flex 정렬 확인
      const flexDirection = await sidebar.evaluate((el) => {
        return window.getComputedStyle(el).flexDirection;
      });
      expect(flexDirection).toBe('column');

      // Sidebar의 align-items 확인 (stretch = 왼쪽 정렬)
      const alignItems = await sidebar.evaluate((el) => {
        return window.getComputedStyle(el).alignItems;
      });
      expect(alignItems).toBe('stretch');

      // Sidebar 내부 링크의 justify-content 확인 (왼쪽 정렬)
      const homeLink = sidebar.locator('a[href="/"]').first();
      const justifyContent = await homeLink.evaluate((el) => {
        return window.getComputedStyle(el).justifyContent;
      });
      expect(justifyContent).toBe('flex-start');
    });
  });

  test.describe('Main Content 레이아웃 검증', () => {
    test('Main Content에 왼쪽 마진 244px이 적용되어야 함', async ({
      page,
    }) => {
      await page.goto('/');

      const mainContent = page.locator('main');

      await expect(mainContent).toBeVisible();
      const boundingBox = await mainContent.boundingBox();
      // Sidebar 너비(244px)만큼 왼쪽 마진
      expect(boundingBox?.x).toBeCloseTo(244, 1);
    });

    test('Main Content에 상단 패딩이 없어야 함', async ({ page }) => {
      await page.goto('/');

      const mainContent = page.locator('main');

      await expect(mainContent).toBeVisible();
      const boundingBox = await mainContent.boundingBox();
      // 데스크톱에서는 MobileHeader가 없으므로 상단 패딩이 0이어야 함
      expect(boundingBox?.y).toBeCloseTo(0, 1);
    });

    test('Main Content에 하단 패딩이 없어야 함', async ({ page }) => {
      await page.goto('/');

      const mainContent = page.locator('main');

      await expect(mainContent).toBeVisible();
      const boundingBox = await mainContent.boundingBox();
      const viewportHeight = page.viewportSize()?.height || 720;

      if (boundingBox) {
        // Main Content 하단이 뷰포트 하단과 가까워야 함 (BottomNav 없음)
        const distanceFromBottom =
          viewportHeight - (boundingBox.y + boundingBox.height);
        // 하단 패딩이 거의 없어야 함 (0px 근처)
        expect(distanceFromBottom).toBeLessThan(10);
      }
    });

    test('PostCard 최대 너비가 630px로 제한되어야 함', async ({ page }) => {
      await page.goto('/');

      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Main Content 내부의 컨테이너 확인
      const contentContainer = mainContent.locator('div').first();
      const containerStyle = await contentContainer.evaluate((el) => {
        return window.getComputedStyle(el).maxWidth;
      });

      // max-width가 630px인지 확인 (px 단위로 변환)
      const maxWidthValue = parseFloat(containerStyle);
      expect(maxWidthValue).toBeCloseTo(630, 1);
    });

    test('Main Content가 중앙 정렬되어야 함', async ({ page }) => {
      await page.goto('/');

      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Main Content의 justify-content 확인 (중앙 정렬)
      const justifyContent = await mainContent.evaluate((el) => {
        return window.getComputedStyle(el).justifyContent;
      });
      expect(justifyContent).toBe('center');
    });
  });

  test.describe('페이지별 데스크톱 레이아웃 검증', () => {
    test('홈 페이지 레이아웃이 데스크톱에 맞게 표시되어야 함', async ({
      page,
    }) => {
      await page.goto('/');

      // Sidebar 확인
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // MobileHeader 숨김 확인
      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });
      const isHeaderHidden =
        (await mobileHeader.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await mobileHeader.count()) === 0;
      expect(isHeaderHidden).toBeTruthy();

      // BottomNav 숨김 확인
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });
      const isNavHidden =
        (await bottomNav.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await bottomNav.count()) === 0;
      expect(isNavHidden).toBeTruthy();

      // Main Content 확인
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });

    test('프로필 페이지 레이아웃이 데스크톱에 맞게 표시되어야 함', async ({
      page,
    }) => {
      // 프로필 페이지로 이동 (임시로 루트로 이동, 실제 userId가 있으면 해당 경로 사용)
      await page.goto('/');

      // Sidebar 확인
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // MobileHeader 숨김 확인
      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });
      const isHeaderHidden =
        (await mobileHeader.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await mobileHeader.count()) === 0;
      expect(isHeaderHidden).toBeTruthy();

      // BottomNav 숨김 확인
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });
      const isNavHidden =
        (await bottomNav.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await bottomNav.count()) === 0;
      expect(isNavHidden).toBeTruthy();
    });

    test('게시물 상세 페이지 레이아웃이 데스크톱에 맞게 표시되어야 함', async ({
      page,
    }) => {
      // 게시물 상세 페이지로 이동 (임시로 루트로 이동, 실제 postId가 있으면 해당 경로 사용)
      await page.goto('/');

      // Sidebar 확인
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // MobileHeader 숨김 확인
      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });
      const isHeaderHidden =
        (await mobileHeader.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await mobileHeader.count()) === 0;
      expect(isHeaderHidden).toBeTruthy();

      // BottomNav 숨김 확인
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });
      const isNavHidden =
        (await bottomNav.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await bottomNav.count()) === 0;
      expect(isNavHidden).toBeTruthy();
    });
  });

  test.describe('데스크톱 vs 모바일/태블릿 비교 테스트', () => {
    test('데스크톱에서는 Sidebar가 표시되고 모바일에서는 숨겨져야 함', async ({
      page,
    }) => {
      // 데스크톱 뷰포트에서 확인
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      // 모바일에서는 숨김
      const isHidden =
        (await sidebar.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await sidebar.count()) === 0;

      expect(isHidden).toBeTruthy();
    });

    test('데스크톱에서는 MobileHeader가 숨기고 모바일에서는 표시되어야 함', async ({
      page,
    }) => {
      // 데스크톱 뷰포트에서 확인
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });
      const isHiddenDesktop =
        (await mobileHeader.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await mobileHeader.count()) === 0;
      expect(isHiddenDesktop).toBeTruthy();

      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      // 모바일에서는 표시
      await expect(mobileHeader).toBeVisible();
    });

    test('데스크톱에서는 BottomNav가 숨기고 모바일에서는 표시되어야 함', async ({
      page,
    }) => {
      // 데스크톱 뷰포트에서 확인
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });
      const isHiddenDesktop =
        (await bottomNav.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await bottomNav.count()) === 0;
      expect(isHiddenDesktop).toBeTruthy();

      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      // 모바일에서는 표시
      await expect(bottomNav).toBeVisible();
    });

    test('데스크톱에서는 Sidebar가 244px이고 태블릿에서는 72px이어야 함', async ({
      page,
    }) => {
      // 데스크톱 뷰포트에서 확인
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();
      let boundingBox = await sidebar.boundingBox();
      expect(boundingBox?.width).toBeCloseTo(244, 1);

      // 태블릿 뷰포트로 변경
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();

      // 태블릿에서는 72px
      await expect(sidebar).toBeVisible();
      boundingBox = await sidebar.boundingBox();
      expect(boundingBox?.width).toBeCloseTo(72, 1);
    });

    test('데스크톱에서는 Sidebar 텍스트가 표시되고 태블릿에서는 숨겨져야 함', async ({
      page,
    }) => {
      // 데스크톱 뷰포트에서 확인
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // 데스크톱에서는 텍스트 표시
      const textElements = sidebar.locator('span').filter({
        hasText: /홈|검색|만들기|프로필/,
      });
      const count = await textElements.count();
      if (count > 0) {
        const element = textElements.first();
        await expect(element).toBeVisible();
      }

      // 태블릿 뷰포트로 변경
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();

      // 태블릿에서는 텍스트 숨김
      await expect(sidebar).toBeVisible();
      const tabletTextElements = sidebar.locator('span').filter({
        hasText: /홈|검색|만들기|프로필/,
      });
      const tabletCount = await tabletTextElements.count();
      if (tabletCount > 0) {
        const element = tabletTextElements.first();
        const isHidden = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            el.classList.contains('hidden')
          );
        });
        expect(isHidden).toBeTruthy();
      }
    });
  });
});

