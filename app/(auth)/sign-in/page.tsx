/**
 * @file page.tsx
 * @description 로그인 페이지
 *
 * 주요 기능:
 * 1. Clerk SignIn 컴포넌트를 사용한 로그인 UI
 * 2. 한국어 로컬라이제이션 지원
 * 3. 로그인 성공 시 홈으로 리다이렉트
 * 4. 이미 로그인한 사용자는 홈으로 리다이렉트
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증 컴포넌트
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';

export default async function SignInPage() {
  // 이미 로그인한 사용자는 홈으로 리다이렉트
  const { userId } = await auth();
  if (userId) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-none border border-[#dbdbdb] rounded-lg',
              headerTitle: 'text-[#262626] text-2xl font-semibold',
              headerSubtitle: 'text-[#8e8e8e] text-sm',
              socialButtonsBlockButton:
                'border border-[#dbdbdb] rounded-lg hover:bg-gray-50',
              formButtonPrimary:
                'bg-[#0095f6] hover:bg-[#1877f2] text-sm font-semibold rounded-lg',
              formFieldInput:
                'border border-[#dbdbdb] rounded-lg focus:border-[#262626] focus:ring-0',
              footerActionLink: 'text-[#0095f6] cursor-pointer hover:underline',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}

