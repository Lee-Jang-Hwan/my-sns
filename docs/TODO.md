- [x] `.cursor/` 디렉토리
  - [x] `rules/` 커서룰
  - [x] `mcp.json` MCP 서버 설정
  - [x] `dir.md` 프로젝트 디렉토리 구조
- [ ] `.github/` 디렉토리
- [ ] `.husky/` 디렉토리
- [ ] `app/` 디렉토리
  - [x] `favicon.ico` 파일
  - [ ] `not-found.tsx` 파일
  - [ ] `robots.ts` 파일
  - [ ] `sitemap.ts` 파일
  - [ ] `manifest.ts` 파일
- [x] `supabase/` 디렉토리
- [x] `public/` 디렉토리
  - [x] `icons/` 디렉토리
  - [x] `logo.png` 파일
  - [x] `og-image.png` 파일
- [x] `tsconfig.json` 파일
- [x] `.cursorignore` 파일
- [x] `.gitignore` 파일
- [ ] `.prettierignore` 파일
- [x] `.prettierrc` 파일
- [x] `eslint.config.mjs` 파일
- [x] `AGENTS.md` 파일

## 개발 기능 TODO

### 1. 홈 피드 페이지

#### 1-1. 기본 세팅

- [x] Next.js + TypeScript 프로젝트 생성
- [x] Tailwind CSS 설정 (인스타 컬러 스키마)
- [x] Clerk 인증 연동 (한국어 설정)
- [x] Supabase 프로젝트 생성 및 연동
- [x] 기본 데이터베이스 테이블 생성
  - [x] `users` 테이블
  - [x] `posts` 테이블

#### 1-2. 레이아웃 구조

- [x] Sidebar 컴포넌트 (Desktop/Tablet 반응형)
- [x] MobileHeader 컴포넌트
- [x] BottomNav 컴포넌트
- [x] (main) Route Group 및 레이아웃 통합

#### 1-3. 홈 피드 - 게시물 목록

- [ ] PostCard 컴포넌트
  - [x] Header (프로필 이미지, 사용자명, 시간, 메뉴)
  - [x] Image (정사각형 1:1 비율)
  - [x] Actions (좋아요, 댓글, 공유, 북마크)
  - [x] Content (좋아요 수, 캡션, 댓글 미리보기)
- [x] PostCardSkeleton 로딩 UI
- [x] PostFeed 컴포넌트
- [x] `/api/posts` GET API (페이지네이션)

#### 1-4. 홈 피드 - 좋아요 기능

- [x] `likes` 테이블 생성
- [ ] `/api/likes` POST/DELETE API
- [ ] 좋아요 버튼 및 애니메이션
  - [ ] 하트 클릭 애니메이션 (scale 1.3 → 1)
  - [ ] 더블탭 좋아요 (모바일)

### 2. 게시물 작성 & 댓글 기능

#### 2-1. 게시물 작성 모달

- [ ] CreatePostModal 컴포넌트 (Dialog)
- [ ] 이미지 미리보기 UI
- [ ] 텍스트 입력 필드 (캡션, 최대 2,200자)

#### 2-2. 게시물 작성 - 이미지 업로드

- [x] Supabase Storage 버킷 생성
- [ ] `/api/posts` POST API
- [ ] 파일 업로드 로직 및 검증 (최대 5MB)

#### 2-3. 댓글 기능 - UI & 작성

- [x] `comments` 테이블 생성
- [ ] CommentList 컴포넌트
- [ ] CommentForm 컴포넌트
- [ ] `/api/comments` POST API

#### 2-4. 댓글 기능 - 삭제 & 무한스크롤

- [ ] `/api/comments` DELETE API
- [ ] 댓글 삭제 버튼 (본인만 표시)
- [ ] PostFeed 무한 스크롤 (Intersection Observer)

### 3. 프로필 페이지 & 팔로우 기능

#### 3-1. 프로필 페이지 - 기본 정보

- [ ] `/profile/[userId]` 동적 라우트
- [ ] 프로필 헤더 컴포넌트
  - [ ] 아바타 (150px Desktop / 90px Mobile)
  - [ ] 사용자명, 이름
  - [ ] 통계 (게시물, 팔로워, 팔로잉)
  - [ ] 팔로우/팔로잉 버튼
- [ ] `/api/users/[userId]` GET API

#### 3-2. 프로필 페이지 - 게시물 그리드

- [ ] 3열 그리드 레이아웃 (반응형)
- [ ] `/api/posts`에 userId 파라미터 추가
- [ ] 게시물 이미지 썸네일 표시
- [ ] Hover 시 좋아요/댓글 수 표시

#### 3-3. 팔로우 기능

- [x] `follows` 테이블 생성
- [ ] `/api/follows` POST/DELETE API
- [ ] 팔로우/언팔로우 버튼 및 상태 관리
- [ ] Hover 시 "언팔로우" 표시 (빨간 테두리)

#### 3-4. 게시물 상세 모달

- [ ] PostModal 컴포넌트 (Desktop)
- [ ] `/post/[postId]` 페이지 (Mobile)
- [ ] 이미지 + 댓글 목록 레이아웃
- [ ] 댓글 스크롤 가능 영역

#### 3-5. 최종 마무리 & 배포

- [ ] 모바일/태블릿 반응형 테스트
- [ ] 에러 핸들링 및 Skeleton UI 완성
- [ ] Vercel 배포
