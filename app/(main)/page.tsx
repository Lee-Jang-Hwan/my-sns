/**
 * @file page.tsx
 * @description 홈 피드 페이지
 *
 * 주요 기능:
 * 1. 인증 상태에 따른 UI 분기
 * 2. 로그인하지 않은 사용자: 로그인/회원가입 UI 표시
 * 3. 로그인한 사용자: 게시물 피드 표시 (PostFeed 컴포넌트)
 * 4. 무한 스크롤을 통한 게시물 로드
 * 5. 좋아요, 댓글 등 인터랙션 지원
 *
 * @dependencies
 * - @clerk/nextjs: 인증 상태 확인
 * - components/post/PostFeed: 게시물 피드 컴포넌트
 * - components/auth/AuthPrompt: 로그인/회원가입 프롬프트 컴포넌트
 */

import { auth } from "@clerk/nextjs/server";
import PostFeed from "@/components/post/PostFeed";
import AuthPrompt from "@/components/auth/AuthPrompt";

export default async function Home() {
  const { userId } = await auth();

  // 로그인하지 않은 사용자에게는 로그인/회원가입 UI 표시
  if (!userId) {
    return <AuthPrompt />;
  }

  // 로그인한 사용자에게는 게시물 피드 표시
  return <PostFeed />;
}
