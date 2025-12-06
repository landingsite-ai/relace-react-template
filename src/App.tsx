import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";

// Exposes navigate function for parent iframe communication
function NavigationHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[NavigationHandler] Setting up landingsite:navigate listener");

    // Listen for navigation requests from parent iframe
    const handleNavigate = (event: CustomEvent<{ path: string }>) => {
      console.log(
        "[NavigationHandler] Received landingsite:navigate event:",
        event.detail
      );
      if (event.detail?.path) {
        console.log(
          "[NavigationHandler] Calling navigate() with path:",
          event.detail.path
        );
        navigate(event.detail.path);
      }
    };

    window.addEventListener(
      "landingsite:navigate",
      handleNavigate as EventListener
    );

    return () => {
      console.log(
        "[NavigationHandler] Cleaning up landingsite:navigate listener"
      );
      window.removeEventListener(
        "landingsite:navigate",
        handleNavigate as EventListener
      );
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <>
      <NavigationHandler />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
