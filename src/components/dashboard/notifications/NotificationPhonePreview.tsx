"use client";


const BASE_W = 260;
const BASE_H = 520;

interface NotificationPhonePreviewProps {
    title: string;
    message: string;
    imageUrl?: string;
    scale?: number;
}

export function NotificationPhonePreview({ title, message, imageUrl, scale = 0.5 }: NotificationPhonePreviewProps) {
    const hasContent = title.trim() || message.trim();

    return (
        <div className="flex flex-col items-center gap-2 select-none">
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Live Preview</p>

            {/* Scaled container */}
            <div style={{ width: BASE_W * scale, height: BASE_H * scale, position: "relative", flexShrink: 0 }}>
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: BASE_W,
                        height: BASE_H,
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                    }}
                >
                    {/* Phone shell */}
                    <div className="relative w-[260px] h-[520px] rounded-[2.4rem] border-[6px] border-[#1a1a1a] bg-[#111] shadow-[0_0_0_1.5px_#3a3a3a,0_20px_50px_rgba(0,0,0,0.45)]">

                        {/* Side buttons */}
                        <div className="absolute -right-[7px] top-[80px] w-[3.5px] h-[44px] bg-[#2a2a2a] rounded-r-md" />
                        <div className="absolute -left-[7px] top-[68px] w-[3.5px] h-[28px] bg-[#2a2a2a] rounded-l-md" />
                        <div className="absolute -left-[7px] top-[104px] w-[3.5px] h-[48px] bg-[#2a2a2a] rounded-l-md" />
                        <div className="absolute -left-[7px] top-[160px] w-[3.5px] h-[48px] bg-[#2a2a2a] rounded-l-md" />

                        {/* Screen */}
                        <div className="w-full h-full rounded-[1.9rem] overflow-hidden bg-[#0a0a0a]">
                            <div className="w-full h-full bg-gradient-to-b from-[#1c2535] via-[#1a1f2e] to-[#111827] relative flex flex-col">

                                {/* Status bar */}
                                <div className="flex items-end justify-between px-5 pt-3 pb-1 shrink-0">
                                    <span className="text-[11px] font-bold text-white/90 tracking-tight">9:41</span>
                                    <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[80px] h-[24px] bg-[#000] rounded-[12px] z-10" />
                                    <div className="flex items-center gap-1">
                                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                                            <rect x="0" y="5" width="2" height="4" rx="0.5" fill="white" fillOpacity="0.9" />
                                            <rect x="3" y="3.5" width="2" height="5.5" rx="0.5" fill="white" fillOpacity="0.9" />
                                            <rect x="6" y="2" width="2" height="7" rx="0.5" fill="white" fillOpacity="0.9" />
                                            <rect x="9" y="0" width="2" height="9" rx="0.5" fill="white" fillOpacity="0.9" />
                                        </svg>
                                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                                            <path d="M6 7.5C6.41 7.5 6.75 7.84 6.75 8.25S6.41 9 6 9 5.25 8.66 5.25 8.25 5.59 7.5 6 7.5Z" fill="white" fillOpacity="0.9" />
                                            <path d="M3.8 5.2C4.8 4.2 7.2 4.2 8.2 5.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.1" strokeLinecap="round" />
                                            <path d="M1.6 3C3.4 1.2 8.6 1.2 10.4 3" stroke="white" strokeOpacity="0.9" strokeWidth="1.1" strokeLinecap="round" />
                                        </svg>
                                        <div className="flex items-center">
                                            <div className="w-[16px] h-[8px] rounded-[2px] border border-white/60 relative">
                                                <div className="absolute inset-[1px] right-[2px] bg-white/80 rounded-[1px]" />
                                            </div>
                                            <div className="w-[1.5px] h-[4px] bg-white/40 rounded-r-sm ml-[1px]" />
                                        </div>
                                    </div>
                                </div>

                                {/* Lock time */}
                                <div className="flex flex-col items-center mt-4 mb-4 shrink-0">
                                    <span className="text-[34px] font-thin text-white tracking-tight leading-none">9:41</span>
                                    <span className="text-[11px] text-white/70 mt-1 font-light tracking-wide">Thursday, February 26</span>
                                </div>

                                {/* Notification card */}
                                <div className="mx-3 shrink-0">
                                    {hasContent ? (
                                        <div className="rounded-2xl bg-white/[0.14] backdrop-blur-md border border-white/[0.12] overflow-hidden shadow-lg">
                                            <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
                                                <div className="w-5 h-5 rounded-[5px] bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center shrink-0">
                                                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                                        <path d="M2 8.5C3.5 6 5.5 4.5 9 4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                                                        <circle cx="5.5" cy="3" r="1.2" fill="white" />
                                                    </svg>
                                                </div>
                                                <span className="text-[10px] font-semibold text-white/90 uppercase tracking-widest flex-1">SAHEL JEDDAH</span>
                                                <span className="text-[9px] text-white/50">now</span>
                                            </div>
                                            <div className="px-3 pb-3 flex gap-2.5">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[12px] font-semibold text-white leading-snug truncate">
                                                        {title || <span className="text-white/40 italic">Notification title</span>}
                                                    </p>
                                                    <p className="text-[11px] text-white/70 leading-snug mt-0.5 line-clamp-2">
                                                        {message || <span className="text-white/30 italic">Notification message...</span>}
                                                    </p>
                                                </div>
                                                {imageUrl && (
                                                    <img src={imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0"
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl bg-white/[0.08] border border-white/[0.08] px-4 py-5 flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round">
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>
                                            </div>
                                            <p className="text-[10px] text-white/30 text-center">Start typing to see<br />your notification preview</p>
                                        </div>
                                    )}
                                </div>

                                {/* Faded cards */}
                                <div className="mx-3 mt-2 space-y-2 opacity-30 pointer-events-none">
                                    <div className="h-[52px] rounded-2xl bg-white/10 border border-white/10" />
                                    <div className="h-[44px] rounded-2xl bg-white/8 border border-white/8" />
                                </div>

                                {/* Bottom */}
                                <div className="mt-auto pb-4 flex flex-col items-center gap-3">
                                    <div className="w-[80px] h-[4px] bg-white/25 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
