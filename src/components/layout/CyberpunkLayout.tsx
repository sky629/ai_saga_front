import bgImage from '../../assets/background.png';

interface CyberpunkLayoutProps {
    children: React.ReactNode;
}

export function CyberpunkLayout({ children }: CyberpunkLayoutProps) {
    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black font-pixel selection:bg-cyber-primary selection:text-black">
            {/* Background Layer */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center brightness-[0.4]"
                style={{ backgroundImage: `url(${bgImage})` }}
            />

            {/* Grid Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06)_1px,transparent_0,transparent_80px),linear-gradient(rgba(255,0,0,0.06)_1px,transparent_0,transparent_80px)] bg-[length:100%_4px,40px_100%,100%_40px]" />

            {/* Content Layer */}
            <div className="relative z-10 w-full h-full flex flex-col p-4 md:p-8">
                {children}
            </div>

            {/* Vignette & scanlines */}
            <div className="absolute inset-0 z-20 pointer-events-none pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />
        </div>
    );
}
