import React from "react";
import styles from "./GlowCard.module.css";

type GlowCardProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export default function GlowCard({ className, style, children }: GlowCardProps) {
  return (
    <div className={`glow-ring ${styles.card} ${className ?? ""}`} style={style}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}


