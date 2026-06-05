import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders children only after the component has mounted on the client.
 * Used to gate browser-only libraries (three.js / echarts) out of SSR,
 * replacing Next's `dynamic(..., { ssr: false })`.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return <>{mounted ? children : fallback}</>;
}
