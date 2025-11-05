/**
 * @file AuthPrompt.tsx
 * @description 로그인/회원가입 프롬프트 컴포넌트
 *
 * 주요 기능:
 * 1. 로그인하지 않은 사용자에게 로그인/회원가입 UI 제공
 * 2. 탭 방식으로 로그인/회원가입 전환
 * 3. Clerk SignIn/SignUp 컴포넌트 직접 통합
 * 4. Instagram 스타일 디자인
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증 컴포넌트
 * - lucide-react: 아이콘
 */

"use client";

import { useState, useEffect } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

export default function AuthPrompt() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // 로그인 성공 시 홈으로 리다이렉트 및 페이지 새로고침
  useEffect(() => {
    if (isSignedIn) {
      // 약간의 지연을 두어 Clerk 세션이 완전히 설정되도록 함
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn]);

  // Clerk 컴포넌트 내부의 footer 링크 클릭 시 탭 전환 처리
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link) {
        const href = link.getAttribute("href");
        if (href?.includes("sign-up") || href?.includes("signup")) {
          e.preventDefault();
          setMode("signup");
        } else if (href?.includes("sign-in") || href?.includes("signin")) {
          e.preventDefault();
          setMode("signin");
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Instagram 로고 */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <Instagram className="w-16 h-16 text-[#262626]" />
          </div>
        </div>

        {/* 로그인/회원가입 카드 */}
        <div className="bg-white border border-[#dbdbdb] rounded-lg p-8 mb-4">
          {/* 탭 전환 버튼 */}
          <div className="flex mb-6 border-b border-[#dbdbdb]">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "flex-1 py-3 text-center font-semibold text-sm transition-colors",
                mode === "signin"
                  ? "text-[#262626] border-b-2 border-[#262626]"
                  : "text-[#8e8e8e] hover:text-[#262626]",
              )}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 py-3 text-center font-semibold text-sm transition-colors",
                mode === "signup"
                  ? "text-[#262626] border-b-2 border-[#262626]"
                  : "text-[#8e8e8e] hover:text-[#262626]",
              )}
            >
              회원가입
            </button>
          </div>

          {/* Clerk 인증 컴포넌트 */}
          <div className="min-h-[400px]">
            {mode === "signin" ? (
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-none border-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "border border-[#dbdbdb] rounded-lg",
                    formButtonPrimary:
                      "bg-[#0095f6] hover:bg-[#1877f2] text-sm font-semibold rounded-lg",
                    formFieldInput:
                      "border border-[#dbdbdb] rounded-lg focus:border-[#262626]",
                    footerActionLink: "text-[#0095f6] cursor-pointer",
                  },
                }}
                routing="hash"
                signUpUrl="/sign-up"
                afterSignInUrl="/"
                fallbackRedirectUrl="/"
              />
            ) : (
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-none border-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "border border-[#dbdbdb] rounded-lg",
                    formButtonPrimary:
                      "bg-[#0095f6] hover:bg-[#1877f2] text-sm font-semibold rounded-lg",
                    formFieldInput:
                      "border border-[#dbdbdb] rounded-lg focus:border-[#262626]",
                    footerActionLink: "text-[#0095f6] cursor-pointer",
                  },
                }}
                routing="hash"
                signInUrl="/sign-in"
                afterSignUpUrl="/"
                fallbackRedirectUrl="/"
              />
            )}
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="text-center">
          <p className="text-xs text-[#8e8e8e]">
            로그인하면 Instagram의 약관, 데이터 정책 및 쿠키 정책에 동의하게
            됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
