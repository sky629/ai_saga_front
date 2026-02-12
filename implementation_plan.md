# 프론트엔드 구현 계획

## 목표 설명 (Goal Description)
AI Saga 텍스트 기반 MUD 게임을 위한 최신 반응형 웹 프론트엔드를 구축합니다. Vite, React, TypeScript를 사용하여 SPA(Single Page Application)로 개발하며, 기존 FastAPI 백엔드와 연동합니다.

## 사용자 검토 필요사항 (User Review Required)
> [!IMPORTANT]
> - **디자인 컨셉**: "게임 같은 UI"를 목표로 합니다. AI 세계관에 어울리는 **다크 모드 + 터미널/Retro SF 스타일** 또는 **고전 RPG 스타일**을 제안합니다.
> - **기술 스택**: 빠르고 유연한 스타일링을 위해 **Tailwind CSS**를 확정하여 진행하겠습니다. (Styled-components보다 테마 적용이 빠름)
> - **인증 흐름**: 백엔드에 정의된 구글 OAuth 2.0 흐름을 따릅니다.
> - **API 통신**: REST 엔드포인트(`/api/v1/game/*`)를 직접 사용합니다.

## 변경 제안 (Proposed Changes)

### [NEW] 프론트엔드 프로젝트 구조 (Frontend Project Structure)
루트 디렉토리에 새로운 프로젝트를 초기화합니다.

#### 기술 스택 (Technologies)
- **빌드 도구**: Vite
- **프레임워크**: React with TypeScript
- **스타일링**: **Tailwind CSS** (게임 UI 테마 적용 용이)
- **라우팅**: React Router DOM
- **상태 관리/쿼리**: React Query (TanStack Query) + Context API
- **아이콘**: Lucide React
- **HTTP 클라이언트**: Axios

#### 디자인 전략 (Design Strategy - Game Like)
- **컨셉**: **픽셀 아트 스큐어모피즘 (Pixel Art Skeuomorphic)**. 도트 그래픽으로 그려진 레트로 컴퓨터 방을 배경으로 하고, 모니터 화면에도 8-bit/16-bit 스타일의 UI를 구현합니다.
- **배경**: **도트(Pixel Art) 감성**의 컴퓨터 방 일러스트.
- **화면 효과**:
    - **CRT 효과**: 스캔라인, 화면 곡률(Curvature), 비네팅(Vignetting) 처리.
    - **텍스트**: `Press Start 2P` 등의 **비트맵/도트 폰트** 필수 사용.
    - **글로우**: 화면 발광 효과.
- **UI 요소**: 투박한 도트 테두리, 각진 버튼, 픽셀 아이콘 등 **완벽한 도트 그래픽** 지향.

#### 주요 컴포넌트 (Key Components)
1.  **인증 (Authentication)**
    - **Auth Flow (Open Spot Style)**:
        - `Login`: 백엔드 `/api/v1/auth/google/login`으로 리다이렉트 (프론트엔드 처리 없음).
        - `Callback`: 백엔드가 구글 인증 후 프론트엔드 `/auth/login/success`로 리다이렉트.
        - `Token Handling`: URL에서 `access_token` 추출, `refresh_token`은 HttpOnly 쿠키로 자동 관리.
    - `AuthContext`: 토큰 파싱 및 상태 관리.
    - `LoginSuccess`: 리다이렉트된 URL에서 토큰을 추출하고 메인으로 이동하는 페이지.

2.  **게임 인터페이스 (Game Interface)**
    - `Dashboard`: 캐릭터 목록 확인 및 새 게임 시작.
    - `GameSession`: 메인 게임 화면.
        - `MessageHistory`: 스크롤 가능한 대화형 인터페이스 (채팅창 형태).
        - `ActionInput`: 플레이어 입력창 또는 선택지 버튼.
        - `StatusPanel`: 캐릭터 상태창 (HP, 인벤토리, 위치).

## 검증 계획 (Verification Plan)

### 자동화 테스트 (Automated Tests)
- **프론트엔드 빌드 테스트**: `npm run build`를 실행하여 빌드 성공 여부를 확인합니다.
- (추후 계획) Playwright 또는 Cypress를 이용한 E2E 테스트 도입.

### 수동 검증 (Manual Verification)
1.  **환경 설정**:
    - 백엔드 실행: `./run_local.sh` (또는 `uvicorn` 명령어).
    - 프론트엔드 실행: `npm run dev`.
2.  **인증 흐름**:
    - "Google 로그인" 버튼 클릭.
    - 구글 로그인 페이지로 이동 확인.
    - 로그인 성공 후 토큰 저장 및 메인 화면 이동 확인.
3.  **게임 흐름**:
    - 캐릭터 생성.
    - 시나리오 선택 및 게임 세션 시작.
    - 초기 내러티브(Narrative) 표시 확인.
    - 행동 입력 (예: "주변을 둘러본다") 및 전송.
    - 게임 마스터의 응답 및 상태 업데이트 확인.
