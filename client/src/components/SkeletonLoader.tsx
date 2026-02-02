import { motion } from 'framer-motion';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    marginTop?: string | number;
    marginBottom?: string | number;
    className?: string;
}

export default function SkeletonLoader({
    width = '100%',
    height = '1em',
    borderRadius = '4px',
    marginTop = 0,
    marginBottom = 0,
    className = ''
}: SkeletonProps) {
    return (
        <motion.div
            className={className}
            style={{
                width,
                height,
                borderRadius,
                marginTop,
                marginBottom,
                backgroundColor: 'rgba(48, 54, 61, 0.5)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <motion.div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
                }}
                animate={{
                    translateX: ['-100%', '100%'],
                }}
                transition={{
                    duration: 1.5,
                    ease: 'linear',
                    repeat: Infinity,
                }}
            />
        </motion.div>
    );
}
