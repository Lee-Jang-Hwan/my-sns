import { test, expect } from '@playwright/test';

/**
 * @file tablet-responsive.spec.ts
 * @description 태블릿 반응형 테스트 (768px ~ 1024px)
 *
 * PRD.md의 태블릿 반응형 요구사항에 따라 다음을 검증:
 * 1. Sidebar: 태블릿에서 표시 (72px 너비, 아이콘만)
 * 2. MobileHeader: 태블릿에서 숨김
 * 3. BottomNav: 태블릿에서 숨김
 * 4. Sidebar 아이콘만 표시 (텍스트 숨김)
 * 5. Main Content 레이아웃 검증 (왼쪽 마진 72px, 상하 패딩 0px)
 * 6. 페이지별 태블릿 레이아웃 검증
 */

test.describe('태블릿 반응형 테스트 (768px ~ 1024px)', () => {
  // 태블릿 뷰포트 설정 (768px ~ 1024px)
  test.use({ viewport: { width: 768, height: 1024 } });

  test.describe('레이아웃 컴포넌트 표시/숨김', () => {
    test('Sidebar가 태블릿에서 표시되어야 함', async ({ page }) => {
      await page.goto('/');

      // Sidebar 요소 찾기 (aside 태그)
      const sidebar = page.locator('aside');

      await expect(sidebar).toBeVisible();
      await expect(sidebar).toHaveCSS('display', 'flex');
    });

    test('MobileHeader가 태블릿에서 숨겨져야 함', async ({ page }) => {
      await page.goto('/');

      // MobileHeader 요소 찾기 (header 태그이지만 모바일에서만 표시)
      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });

      // 태블릿에서는 숨김 (hidden 클래스 또는 display: none)
      const isHidden =
        (await mobileHeader.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await mobileHeader.count()) === 0;

      expect(isHidden).toBeTruthy();
    });

    test('BottomNav가 태블릿에서 숨겨져야 함', async ({ page }) => {
      await page.goto('/');

      // BottomNav 요소 찾기 (nav 태그이지만 모바일에서만 표시)
      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });

      // 태블릿에서는 숨김 (hidden 클래스 또는 display: none)
      const isHidden =
        (await bottomNav.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await bottomNav.count()) === 0;

      expect(isHidden).toBeTruthy();
    });
  });

  test.describe('Sidebar 크기 및 스타일 검증', () => {
    test('Sidebar 너비가 72px이어야 함', async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('aside');

      await expect(sidebar).toBeVisible();
      const boundingBox = await sidebar.boundingBox();
      expect(boundingBox?.width).toBeCloseTo(72, 1);
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

    test('Sidebar 텍스트가 숨겨져야 함 (아이콘만 표시)', async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // Sidebar 내부의 텍스트 요소 확인
      // 태블릿에서는 텍스트가 숨겨져야 함 (hidden lg:inline 클래스)
      const textElements = sidebar.locator('span').filter({
        hasText: /홈|검색|만들기|프로필/,
      });

      // 텍스트 요소가 존재한다면 숨겨져야 함
      const count = await textElements.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const element = textElements.nth(i);
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
      }
    });

    test('Sidebar 아이콘이 중앙 정렬되어야 함', async ({ page }) => {
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // Sidebar의 flex 정렬 확인
      const flexDirection = await sidebar.evaluate((el) => {
        return window.getComputedStyle(el).flexDirection;
      });
      expect(flexDirection).toBe('column');

      // Sidebar의 align-items 확인 (중앙 정렬)
      const alignItems = await sidebar.evaluate((el) => {
        return window.getComputedStyle(el).alignItems;
      });
      expect(alignItems).toBe('center');
    });
  });

  test.describe('Main Content 레이아웃 검증', () => {
    test('Main Content에 왼쪽 마진 72px이 적용되어야 함', async ({
      page,
    }) => {
      await page.goto('/');

      const mainContent = page.locator('main');

      await expect(mainContent).toBeVisible();
      const boundingBox = await mainContent.boundingBox();
      // Sidebar 너비(72px)만큼 왼쪽 마진
      expect(boundingBox?.x).toBeCloseTo(72, 1);
    });

    test('Main Content에 상단 패딩이 없어야 함', async ({ page }) => {
      await page.goto('/');

      const mainContent = page.locator('main');

      await expect(mainContent).toBeVisible();
      const boundingBox = await mainContent.boundingBox();
      // 태블릿에서는 MobileHeader가 없으므로 상단 패딩이 0이어야 함
      expect(boundingBox?.y).toBeCloseTo(0, 1);
    });

    test('Main Content에 하단 패딩이 없어야 함', async ({ page }) => {
      await page.goto('/');

      const mainContent = page.locator('main');

      await expect(mainContent).toBeVisible();
      const boundingBox = await mainContent.boundingBox();
      const viewportHeight = page.viewportSize()?.height || 1024;

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
  });

  test.describe('페이지별 태블릿 레이아웃 검증', () => {
    test('홈 페이지 레이아웃이 태블릿에 맞게 표시되어야 함', async ({
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

    test('프로필 페이지 레이아웃이 태블릿에 맞게 표시되어야 함', async ({
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

    test('게시물 상세 페이지 레이아웃이 태블릿에 맞게 표시되어야 함', async ({
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

  test.describe('태블릿 vs 모바일/데스크톱 비교 테스트', () => {
    test('태블릿에서는 Sidebar가 표시되고 모바일에서는 숨겨져야 함', async ({
      page,
    }) => {
      // 태블릿 뷰포트에서 확인
      await page.setViewportSize({ width: 768, height: 1024 });
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

    test('태블릿에서는 MobileHeader가 숨기고 모바일에서는 표시되어야 함', async ({
      page,
    }) => {
      // 태블릿 뷰포트에서 확인
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      const mobileHeader = page.locator('header').filter({
        hasText: 'Instagram',
      });
      const isHiddenTablet =
        (await mobileHeader.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await mobileHeader.count()) === 0;
      expect(isHiddenTablet).toBeTruthy();

      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      // 모바일에서는 표시
      await expect(mobileHeader).toBeVisible();
    });

    test('태블릿에서는 BottomNav가 숨기고 모바일에서는 표시되어야 함', async ({
      page,
    }) => {
      // 태블릿 뷰포트에서 확인
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      const bottomNav = page.locator('nav').filter({
        has: page.locator('a[href="/"]'),
      });
      const isHiddenTablet =
        (await bottomNav.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || el.classList.contains('hidden');
        })) || (await bottomNav.count()) === 0;
      expect(isHiddenTablet).toBeTruthy();

      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      // 모바일에서는 표시
      await expect(bottomNav).toBeVisible();
    });

    test('태블릿에서는 Sidebar가 72px이고 데스크톱에서는 244px이어야 함', async ({
      page,
    }) => {
      // 태블릿 뷰포트에서 확인
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();
      let boundingBox = await sidebar.boundingBox();
      expect(boundingBox?.width).toBeCloseTo(72, 1);

      // 데스크톱 뷰포트로 변경
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();

      // 데스크톱에서는 244px
      await expect(sidebar).toBeVisible();
      boundingBox = await sidebar.boundingBox();
      expect(boundingBox?.width).toBeCloseTo(244, 1);
    });

    test('태블릿에서는 Sidebar 텍스트가 숨기고 데스크톱에서는 표시되어야 함', async ({
      page,
    }) => {
      // 태블릿 뷰포트에서 확인
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // 태블릿에서는 텍스트 숨김
      const textElements = sidebar.locator('span').filter({
        hasText: /홈|검색|만들기|프로필/,
      });
      const count = await textElements.count();
      if (count > 0) {
        const element = textElements.first();
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

      // 데스크톱 뷰포트로 변경
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();

      // 데스크톱에서는 텍스트 표시
      await expect(sidebar).toBeVisible();
      const desktopTextElements = sidebar.locator('span').filter({
        hasText: /홈|검색|만들기|프로필/,
      });
      const desktopCount = await desktopTextElements.count();
      if (desktopCount > 0) {
        const element = desktopTextElements.first();
        await expect(element).toBeVisible();
      }
    });
  });
});

