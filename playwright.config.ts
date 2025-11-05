import { defineConfig, devices } from '@playwright/test';

/**
 * @file playwright.config.ts
 * @description Playwright 테스트 설정 파일
 *
 * 주요 설정:
 * - 모바일 반응형 테스트를 위한 뷰포트 설정
 * - Next.js 개발 서버 기반 테스트 실행
 * - 모바일 (< 768px) 및 데스크톱 (≥ 768px) 브레이크포인트 테스트
 */

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 }, // 모바일 뷰포트 (< 768px)
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 }, // 태블릿 뷰포트 (768px)
      },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }, // 데스크톱 뷰포트 (≥ 1024px)
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

