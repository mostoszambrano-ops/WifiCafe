import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import App from "./App";
import { Staff } from "./pages/Staff";
import "./index.css";

function isStaffPage() {
  return window.location.pathname.startsWith("/staff");
}

function Root() {
  const [page, setPage] = useState(isStaffPage() ? "staff" : "menu");

  useEffect(() => {
    const handler = () => setPage(isStaffPage() ? "staff" : "menu");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  if (page === "staff") return <Staff />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(<Root />);
