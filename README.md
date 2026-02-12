# AI Saga Front

AI Saga Front is the immersive cyber-retro frontend interface for the AI Saga text-based RPG engine. Built with modern web technologies, it delivers a nostalgic yet futuristic gaming experience through a terminal-inspired UI, pixel art aesthetics, and seamless AI interactions.

## 🌟 Features

-   **Cyberpunk & Retro Aesthetics**: A visually striking interface combining CRT terminal effects, neon glows, and pixel art elements.
-   **Immersive Dashboard**: View and manage your game sessions with a sleek, session-centric dashboard displaying character stats and status.
-   **Dynamic Game Sessions**: Engage in AI-driven adventures with a chat-like interface that supports rich text and dynamic content.
-   **Character & Scenario Creation**: Intuitive modals for selecting scenarios and crafting unique characters to start your journey.
-   **Google Authentication**: Secure and easy sign-in integration.
-   **Responsive Design**: optimized for various screen sizes, ensuring a great experience on both desktop and mobile.

## 🛠 Tech Stack

-   **Framework**: [React 19](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management & Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
-   **Routing**: [React Router DOM](https://reactrouter.com/)
-   **HTTP Client**: [Axios](https://axios-http.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Utilities**: `clsx`, `tailwind-merge`

## 🚀 Getting Started

### Prerequisites

-   Node.js (Latest LTS recommended)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/sky629/ai_saga_front.git
    cd ai_saga_front
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Running the Application

1.  Start the development server:
    ```bash
    npm run dev
    ```

2.  Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

To build the application for production deployment:

```bash
npm run build
```

The output will be in the `dist` directory.

## 📂 Project Structure

```
src/
├── assets/         # Static assets (images, icons)
├── components/     # Reusable UI components
│   ├── common/     # Generic components (ErrorBoundary, etc.)
│   ├── game/       # Game-specific components (StatusPanel, MessageHistory, etc.)
│   └── layout/     # Layout components (CyberpunkLayout, RetroWindow, etc.)
├── context/        # React Contexts (AuthContext)
├── pages/          # Page components (Dashboard, GameSession, Login, etc.)
├── services/       # API services (gameService)
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
