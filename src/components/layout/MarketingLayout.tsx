import { ReactNode, useEffect, Suspense } from "react";
import { Outlet } from "react-router-dom";

interface MarketingLayoutProps {
  children?: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  useEffect(() => {
    // Ensure light theme attribute and theme-color on the public site
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute("content", "#ffffff");
  }, []);

  return (
    <div
      data-theme="light"
      className="public-site min-h-screen bg-white text-slate-900 selection:bg-blue-600/20 selection:text-blue-900 font-sans relative overflow-x-hidden"
    >
      <Suspense
        fallback={
          <div className="min-h-screen bg-white flex items-center justify-center p-10 text-slate-500 text-sm font-medium">
            Chargement…
          </div>
        }
      >
        {children || <Outlet />}
      </Suspense>
    </div>
  );
}
