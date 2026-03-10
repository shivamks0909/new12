export function BackgroundPaths() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
            <svg className="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,0 Q50,10 100,0 T200,0" fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="0.1" />
                <path d="M0,20 Q50,30 100,20 T200,20" fill="none" stroke="rgba(59, 130, 246, 0.03)" strokeWidth="0.1" />
                <path d="M0,40 Q50,50 100,40 T200,40" fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="0.1" />
                <path d="M0,60 Q50,70 100,60 T200,60" fill="none" stroke="rgba(59, 130, 246, 0.03)" strokeWidth="0.1" />
                <path d="M0,80 Q50,90 100,80 T200,80" fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="0.1" />
            </svg>
        </div>
    );
}
