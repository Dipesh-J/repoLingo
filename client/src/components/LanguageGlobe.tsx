import { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';

const LANGUAGES = [
    'English', 'Español', '中文', 'हिन्दी', 'العربية',
    '日本語', 'Português', 'Русский', 'Deutsch', 'Français',
    '한국어', 'Italiano'
];

export default function LanguageGlobe() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const phiRef = useRef(0);
    const [orbitAngle, setOrbitAngle] = useState(0);

    // Animate orbiting languages
    useEffect(() => {
        let animationId: number;
        const animate = () => {
            setOrbitAngle((prev) => (prev + 0.1) % 360);
            animationId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationId);
    }, []);

    // Initialize globe
    useEffect(() => {
        let width = 0;
        const onResize = () => {
            if (canvasRef.current) {
                width = canvasRef.current.offsetWidth;
            }
        };
        window.addEventListener('resize', onResize);
        onResize();

        if (!canvasRef.current) return;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 0,
            theta: 0.3,
            dark: 1,
            diffuse: 3,
            mapSamples: 16000,
            mapBrightness: 1.2,
            baseColor: [0.1, 0.4, 0.2],
            markerColor: [0.57, 0.87, 0.52],
            glowColor: [0.2, 0.5, 0.3],
            markers: [
                { location: [40.7128, -74.006], size: 0.05 },
                { location: [40.4168, -3.7038], size: 0.05 },
                { location: [39.9042, 116.4074], size: 0.05 },
                { location: [28.6139, 77.2090], size: 0.05 },
                { location: [24.7136, 46.6753], size: 0.05 },
                { location: [35.6762, 139.6503], size: 0.05 },
                { location: [-23.5505, -46.6333], size: 0.05 },
                { location: [55.7558, 37.6173], size: 0.05 },
                { location: [52.5200, 13.4050], size: 0.05 },
                { location: [48.8566, 2.3522], size: 0.05 },
                { location: [37.5665, 126.9780], size: 0.05 },
                { location: [41.9028, 12.4964], size: 0.05 },
            ],
            onRender: (state) => {
                phiRef.current += 0.005;
                state.phi = phiRef.current;
                state.width = width * 2;
                state.height = width * 2;
            },
        });

        setTimeout(() => {
            if (canvasRef.current) {
                canvasRef.current.style.opacity = '1';
            }
        }, 100);

        return () => {
            globe.destroy();
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '500px',
            aspectRatio: '1',
        }}>
            {/* Globe Canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    transition: 'opacity 1s ease',
                    contain: 'layout paint size',
                    position: 'relative',
                    zIndex: 1,
                }}
            />

            {/* Orbiting Language Labels - Outer Ring */}
            {LANGUAGES.slice(0, 6).map((lang, index) => {
                const baseAngle = (index / 6) * 360;
                const currentAngle = (baseAngle + orbitAngle) % 360;
                const radians = (currentAngle * Math.PI) / 180;
                const radius = 48;
                const x = 50 + radius * Math.cos(radians);
                const y = 50 + radius * Math.sin(radians);

                return (
                    <span
                        key={lang}
                        style={{
                            position: 'absolute',
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)',
                            padding: '6px 14px',
                            background: 'rgba(147, 222, 133, 0.15)',
                            border: '1px solid rgba(147, 222, 133, 0.4)',
                            borderRadius: '100px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'rgba(147, 222, 133, 1)',
                            whiteSpace: 'nowrap',
                            zIndex: 2,
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        {lang}
                    </span>
                );
            })}

            {/* Inner Ring - Opposite direction */}
            {LANGUAGES.slice(6).map((lang, index) => {
                const baseAngle = (index / 6) * 360 + 30;
                const currentAngle = (baseAngle - orbitAngle * 0.7 + 360) % 360;
                const radians = (currentAngle * Math.PI) / 180;
                const radius = 32;
                const x = 50 + radius * Math.cos(radians);
                const y = 50 + radius * Math.sin(radians);

                return (
                    <span
                        key={lang}
                        style={{
                            position: 'absolute',
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)',
                            padding: '5px 12px',
                            background: 'rgba(147, 222, 133, 0.1)',
                            border: '1px solid rgba(147, 222, 133, 0.3)',
                            borderRadius: '100px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'rgba(147, 222, 133, 0.8)',
                            whiteSpace: 'nowrap',
                            zIndex: 2,
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        {lang}
                    </span>
                );
            })}
        </div>
    );
}
