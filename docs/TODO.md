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
  - [x] `likes` 테이블
  - [x] `comments` 테이블
  - [x] `follows` 테이블
  - [x] `post_stats` 뷰
  - [x] `user_stats` 뷰
  - [x] `handle_updated_at()` 트리거 함수

#### 1-2. 레이아웃 구조

- [x] Sidebar 컴포넌트 (Desktop/Tablet 반응형)
- [x] MobileHeader 컴포넌트
- [x] BottomNav 컴포넌트
- [x] (main) Route Group 및 레이아웃 통합

#### 1-3. 홈 피드 - 게시물 목록

- [x] PostCard 컴포넌트
  - [x] Header (프로필 이미지, 사용자명, 시간, 메뉴)
  - [x] Image (정사각형 1:1 비율)
  - [x] Actions (좋아요, 댓글, 공유, 북마크)
  - [x] Content (좋아요 수, 캡션, 댓글 미리보기)
- [x] PostCardSkeleton 로딩 UI
- [x] PostFeed 컴포넌트
- [x] `/api/posts` GET API (페이지네이션)
- [x] PostFeed 무한 스크롤 (Intersection Observer)

#### 1-4. 홈 피드 - 좋아요 기능

- [x] `likes` 테이블 생성
- [x] `/api/likes` POST/DELETE API
- [x] 좋아요 버튼 및 애니메이션
  - [x] 하트 클릭 애니메이션 (scale 1.3 → 1)
  - [x] 더블탭 좋아요 (모바일)

### 2. 게시물 작성 & 댓글 기능

#### 2-1. 게시물 작성 모달

- [x] CreatePostModal 컴포넌트 (Dialog)
- [x] 이미지 미리보기 UI
- [x] 텍스트 입력 필드 (캡션, 최대 2,200자)
- [x] 이미지 업로드 버튼
- [x] 게시물 작성 버튼

#### 2-2. 게시물 작성 - 이미지 업로드

- [x] Supabase Storage 버킷 생성
- [x] `/api/posts` POST API
- [x] 파일 업로드 로직 및 검증 (최대 5MB)
- [x] 이미지 형식 검증 (JPG, PNG, GIF 등)
- [x] 이미지 리사이징 (선택)

#### 2-3. 게시물 삭제 기능

- [x] PostCard 메뉴 (⋯) 버튼 기능
- [x] 게시물 삭제 확인 다이얼로그
- [x] `/api/posts/[postId]` DELETE API
- [x] 본인 게시물만 삭제 가능 검증

#### 2-4. 댓글 기능 - UI & 작성

- [x] `comments` 테이블 생성
- [ ] CommentList 컴포넌트
- [ ] CommentForm 컴포넌트
- [ ] `/api/comments` POST API
- [x] PostCard 댓글 미리보기 (최신 2개) - 이미 구현됨

#### 2-5. 댓글 기능 - 삭제

- [ ] `/api/comments/[commentId]` DELETE API
- [ ] 댓글 삭제 버튼 (본인만 표시)
- [ ] 댓글 삭제 확인 (선택)

### 3. 프로필 페이지 & 팔로우 기능

#### 3-1. 프로필 페이지 - 기본 정보

- [ ] `/profile/[userId]` 동적 라우트
- [ ] 프로필 헤더 컴포넌트
  - [ ] 아바타 (150px Desktop / 90px Mobile)
  - [ ] 사용자명, 이름
  - [ ] 통계 (게시물, 팔로워, 팔로잉)
  - [ ] 팔로우/팔로잉 버튼
  - [ ] 내 프로필인 경우 "프로필 편집" 버튼 (1차 제외)
- [ ] `/api/users/[userId]` GET API
- [ ] 사용자 통계 조회 (user_stats 뷰 활용)

#### 3-2. 프로필 페이지 - 게시물 그리드

- [ ] 3열 그리드 레이아웃 (반응형)
- [x] `/api/posts`에 userId 파라미터 추가 (이미 구현됨)
- [ ] 게시물 이미지 썸네일 표시
- [ ] Hover 시 좋아요/댓글 수 표시
- [ ] 게시물 클릭 시 상세 페이지/모달 이동

#### 3-3. 팔로우 기능

- [x] `follows` 테이블 생성
- [ ] `/api/follows` POST/DELETE API
- [ ] 팔로우/언팔로우 버튼 및 상태 관리
- [ ] Hover 시 "언팔로우" 표시 (빨간 테두리)
- [ ] 자기 자신 팔로우 방지 검증

#### 3-4. 게시물 상세 모달/페이지

- [ ] PostModal 컴포넌트 (Desktop)
- [ ] `/post/[postId]` 페이지 (Mobile)
- [ ] 이미지 + 댓글 목록 레이아웃
- [ ] 댓글 스크롤 가능 영역
- [ ] `/api/posts/[postId]` GET API
- [ ] 게시물 상세 정보 조회

### 4. 최종 마무리 & 배포

#### 4-1. 반응형 테스트

- [ ] 모바일 반응형 테스트 (< 768px)
- [ ] 태블릿 반응형 테스트 (768px ~ 1024px)
- [ ] 데스크톱 반응형 테스트 (1024px+)

#### 4-2. 에러 핸들링 & UX 개선

- [x] 에러 핸들링 완성 (PostFeed에서 에러 상태 처리 구현)
- [x] Skeleton UI 완성 (PostCardSkeleton 구현)
- [x] 로딩 상태 개선 (PostFeed에서 로딩 상태 처리)
- [x] 빈 상태 (Empty State) UI (PostFeed에서 빈 상태 처리)

#### 4-3. 배포

- [ ] Vercel 배포
- [x] 환경 변수 설정 (Supabase, Clerk 연동 완료)
- [ ] 도메인 연결 (선택)

### 5. 향후 확장 기능 (1차 MVP 제외)

- [ ] 검색 기능 (사용자, 해시태그)
- [ ] 탐색 페이지
- [ ] 릴스
- [ ] 메시지 (DM)
- [ ] 알림
- [ ] 스토리
- [ ] 동영상 지원
- [ ] 이미지 여러 장 업로드
- [ ] 공유 버튼 기능
- [ ] 북마크 기능
- [ ] 프로필 편집
- [ ] 팔로워/팔로잉 목록 모달
