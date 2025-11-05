import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * 인증이 필요 없는 공개 경로
 * - 홈 페이지 (/)
 * - 인증 페이지 (sign-in, sign-up)
 * - 테스트 페이지 (auth-test, storage-test)
 * - 정적 파일들
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth-test(.*)",
  "/storage-test(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // 공개 경로는 인증 체크하지 않음
  if (!isPublicRoute(request)) {
    // 인증이 필요한 경로에서 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
