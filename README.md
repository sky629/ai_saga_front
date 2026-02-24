# AI Saga Front

AI Saga Front는 AI Saga 텍스트 기반 RPG 엔진을 위한 몰입형 사이버-레트로 프론트엔드 인터페이스입니다. 최신 웹 기술로 구축되었으며, 터미널에서 영감을 받은 UI, 픽셀 아트 미학, 그리고 매끄러운 AI 상호작용을 통해 향수적이면서도 미래지향적인 게임 경험을 제공합니다.

## ✨ 주요 기능

- **사이버펑크 & 레트로 미학**: CRT 터미널 효과, 네온 글로우, 픽셀 아트 요소가 결합된 시각적으로 강렬한 인터페이스.
- **로그라이크 메타 프로그레션**: 여러 회차에 걸친 유저 레벨 및 경험치(XP) 추적을 통해 영구적인 성장 체감 제공.
- **인터랙티브 주사위 메커니즘**: 유저가 직접 트리거하는 역동적인 주사위 애니메이션과 판정 전 긴장감을 높이는 준비 묘사 시스템.
- **온디맨드 일러스트 생성**: AI 내러티브 메시지에 버튼 클릭으로 픽셀 아트 일러스트 추가 (네러티브 바로 아래 표시).
- **몰입형 대시보드**: 캐릭터 스탯과 상태를 한눈에 볼 수 있는 세련된 세션 관리 대시보드.
- **강화된 에러 피드백**: API 요청 제한(429) 등 시스템 이벤트에 대한 사이버펑크 스타일의 실시간 알림 피드백.
- **반응형 디자인**: 데스크톱과 모바일 모두에서 최적의 경험을 제공하도록 설계.

## 🛠 기술 스택

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 시작하기

### 1. 요구사항
- **Node.js**: 최신 LTS 버전 권장
- **npm** 또는 **yarn**

### 2. 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/sky629/ai_saga_front.git
cd ai_saga_front

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📂 프로젝트 구조

```
src/
├── assets/         # 이미지, 아이콘 등 정적 자산
├── components/     # 재사용 가능한 UI 컴포넌트
│   ├── game/       # 게임 관련 컴포넌트 (StatusPanel, DiceResultPanel 등)
│   └── layout/     # 레이아웃 컴포넌트 (PixelLayout, PixelButton 등)
├── context/        # React Context (AuthContext 등)
├── pages/          # 페이지 컴포넌트 (Dashboard, GameSession 등)
├── services/       # API 서비스 로직
└── types/          # TypeScript 타입 정의
```

## 📄 라이선스
[MIT](LICENSE)
