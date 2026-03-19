"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

const PHONE_W = 390;
const PHONE_H = 844;

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function PhoneFrame({ children, className, scale = 0.85 }: PhoneFrameProps) {
  return (
    <div
      className={className}
      style={{
        width: `${PHONE_W * scale}px`,
        height: `${PHONE_H * scale}px`,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${PHONE_W}px`,
          height: `${PHONE_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: `${PHONE_W}px`,
            height: `${PHONE_H}px`,
            borderRadius: "48px",
            background: "linear-gradient(145deg, #2a2a2a 0%, #111 50%, #1e1e1e 100%)",
            boxShadow:
              "0 0 0 1px #3d3d3d, 0 0 0 2.5px #151515, 0 40px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)",
            padding: "10px",
          }}
        >
          <div style={{ position: "absolute", right: "-3px", top: "110px", width: "3px", height: "56px", background: "#2e2e2e", borderRadius: "0 2px 2px 0" }} />
          <div style={{ position: "absolute", left: "-3px", top: "92px", width: "3px", height: "32px", background: "#2e2e2e", borderRadius: "2px 0 0 2px" }} />
          <div style={{ position: "absolute", left: "-3px", top: "136px", width: "3px", height: "56px", background: "#2e2e2e", borderRadius: "2px 0 0 2px" }} />
          <div style={{ position: "absolute", left: "-3px", top: "202px", width: "3px", height: "56px", background: "#2e2e2e", borderRadius: "2px 0 0 2px" }} />

          <div
            className="relative overflow-hidden bg-white flex flex-col"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "40px",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            <div
              className="relative shrink-0 flex items-end justify-between bg-white"
              style={{ height: "50px", paddingLeft: "28px", paddingRight: "24px", paddingBottom: "6px" }}
            >
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#000", letterSpacing: "-0.3px" }}>9:41</span>

              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "120px",
                  height: "34px",
                  background: "#000",
                  borderRadius: "20px",
                  zIndex: 20,
                }}
              />

              <div className="flex items-center" style={{ gap: "6px" }}>
                <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
                  <rect x="0" y="7.5" width="2.8" height="4.5" rx="0.8" fill="#000" />
                  <rect x="4" y="5" width="2.8" height="7" rx="0.8" fill="#000" />
                  <rect x="8" y="2.5" width="2.8" height="9.5" rx="0.8" fill="#000" />
                  <rect x="12" y="0" width="2.8" height="12" rx="0.8" fill="#000" />
                </svg>
                {/* WiFi */}
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <circle cx="8" cy="11" r="1.3" fill="#000" />
                  <path d="M5 8C6.2 6.8 9.8 6.8 11 8" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M2.5 5.5C4.8 3.2 11.2 3.2 13.5 5.5" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M0.5 3C3.8 -0.3 12.2 -0.3 15.5 3" stroke="#000" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                {/* Battery */}
                <div className="flex items-center" style={{ gap: "1px" }}>
                  <div
                    style={{
                      width: "23px",
                      height: "11px",
                      border: "1.5px solid #000",
                      borderRadius: "3px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ position: "absolute", inset: "1.5px", right: "2px", background: "#000", borderRadius: "1px" }} />
                  </div>
                  <div style={{ width: "2px", height: "5px", background: "rgba(0,0,0,0.35)", borderRadius: "0 1px 1px 0" }} />
                </div>
              </div>
            </div>

            {/* Scrollable screen content */}
            <ScrollArea className="w-full flex-1">
              <div style={{ paddingBottom: "40px", width: `${PHONE_W - 20}px` }}>
                {children}
              </div>
            </ScrollArea>

            {/* Home indicator */}
            <div
              style={{
                position: "absolute",
                bottom: "7px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "120px",
                height: "4px",
                background: "rgba(0,0,0,0.18)",
                borderRadius: "100px",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
