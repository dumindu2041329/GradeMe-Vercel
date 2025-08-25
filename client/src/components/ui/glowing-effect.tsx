"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { animate } from "motion/react";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.3,
    proximity = 100,
    spread = 35,
    variant = "default",
    glow = false,
    className,
    movementDuration = 0.3,
    borderWidth = 3,
    disabled = false,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number>(0);
    const deactivateTimeoutRef = useRef<number>(0);
    const isActiveRef = useRef(false);

    const handleMove = useCallback(
      (e?: MouseEvent | { x: number; y: number }) => {
        if (!containerRef.current) return;

        // Clear any existing deactivate timeout
        if (deactivateTimeoutRef.current) {
          clearTimeout(deactivateTimeoutRef.current);
          deactivateTimeoutRef.current = 0;
        }

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = e?.x ?? lastPosition.current.x;
          const mouseY = e?.y ?? lastPosition.current.y;

          if (e) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const center = [left + width * 0.5, top + height * 0.5];
          const distanceFromCenter = Math.hypot(
            mouseX - center[0],
            mouseY - center[1]
          );
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          // Check if mouse is within proximity
          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          // Only apply inactive zone if we're not already active and within proximity
          if (distanceFromCenter < inactiveRadius && !isActiveRef.current && isActive) {
            return; // Don't activate if too close to center
          }

          if (isActive) {
            isActiveRef.current = true;
            element.style.setProperty("--active", "1");

            const currentAngle =
              parseFloat(element.style.getPropertyValue("--start")) || 0;
            let targetAngle =
              (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) /
                Math.PI +
              90;

            const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
            const newAngle = currentAngle + angleDiff;

            animate(currentAngle, newAngle, {
              duration: movementDuration,
              ease: [0.16, 1, 0.3, 1],
              onUpdate: (value) => {
                element.style.setProperty("--start", String(value));
              },
            });
          } else if (isActiveRef.current) {
            // Add a small delay before deactivating to prevent flickering
            deactivateTimeoutRef.current = window.setTimeout(() => {
              if (element) {
                element.style.setProperty("--active", "0");
                isActiveRef.current = false;
              }
            }, 100);
          }
        });
      },
      [inactiveZone, proximity, movementDuration]
    );

    useEffect(() => {
      if (disabled) return;

      const handleScroll = () => handleMove();
      const handlePointerMove = (e: PointerEvent) => handleMove(e);

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.body.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (deactivateTimeoutRef.current) {
          clearTimeout(deactivateTimeoutRef.current);
        }
        window.removeEventListener("scroll", handleScroll);
        document.body.removeEventListener("pointermove", handlePointerMove);
      };
    }, [handleMove, disabled]);

    return (
      <>
        <div
          className={cn(
            "pointer-events-none absolute hidden rounded-[inherit] border-2 opacity-0 transition-opacity",
            glow && "opacity-100",
            variant === "white" && "border-white",
            disabled && "!block"
          )}
          style={{
            inset: `-${borderWidth}px`
          }}
        />
        <div
          ref={containerRef}
          style={
            {
              "--blur": `${blur}px`,
              "--spread": spread,
              "--start": "0",
              "--active": "0",
              "--glowingeffect-border-width": `${borderWidth}px`,
              "--repeating-conic-gradient-times": "5",
              "--gradient":
                variant === "white"
                  ? `radial-gradient(circle, #ffffff 15%, #ffffff80 30%, #ffffff00 40%),
                  repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  #ffffff,
                  #ffffff80 calc(25% / var(--repeating-conic-gradient-times)),
                  #ffffff calc(50% / var(--repeating-conic-gradient-times))
                )`
                  : `radial-gradient(circle, #dd7bbb 15%, #dd7bbb80 30%, #dd7bbb00 40%),
                radial-gradient(circle at 40% 40%, #d79f1e 8%, #d79f1e80 25%, #d79f1e00 35%),
                radial-gradient(circle at 60% 60%, #5a922c 15%, #5a922c80 30%, #5a922c00 40%), 
                radial-gradient(circle at 40% 60%, #4c7894 15%, #4c789480 30%, #4c789400 40%),
                repeating-conic-gradient(
                  from 236.84deg at 50% 50%,
                  #dd7bbb 0%,
                  #d79f1e calc(25% / var(--repeating-conic-gradient-times)),
                  #5a922c calc(50% / var(--repeating-conic-gradient-times)), 
                  #4c7894 calc(75% / var(--repeating-conic-gradient-times)),
                  #dd7bbb calc(100% / var(--repeating-conic-gradient-times))
                )`,
            } as React.CSSProperties
          }
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity",
            glow && "opacity-100",
            blur > 0 && "blur-[var(--blur)] ",
            className,
            disabled && "!hidden"
          )}
        >
          <div
            className={cn(
              "glow",
              "rounded-[inherit]",
              'after:content-[""] after:rounded-[inherit] after:absolute after:inset-[calc(-1.5*var(--glowingeffect-border-width))]',
              "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
              "after:[background:var(--gradient)] after:[background-attachment:fixed]",
              "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
              "after:[mask-clip:padding-box,border-box]",
              "after:[mask-composite:intersect]",
              "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
            )}
          />
        </div>
      </>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
