"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState("fadeIn");
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setTransitionStage("fadeOut");
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage("fadeIn");
        prevPathname.current = pathname;
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={
        transitionStage === "fadeIn"
          ? "animate-fade-up"
          : "opacity-0"
      }
      style={{ animationDuration: transitionStage === "fadeIn" ? "300ms" : "200ms" }}
    >
      {displayChildren}
    </div>
  );
}
