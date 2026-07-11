import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import PageTransition from "./components/PageTransition";
import Home from "./pages/Home";
import PhotographyGallery from "./pages/PhotographyGallery";
import SayHello from "./pages/SayHello";
import Admin from "./pages/Admin";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";
import TestersApp from "./pages/testers/TestersApp";
import { IS_TESTERS_HOST } from "./pages/testers/testersUtils";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Home />
            </PageTransition>
          }
        />
        <Route
          path="/photography"
          element={
            <PageTransition>
              <PhotographyGallery />
            </PageTransition>
          }
        />
        <Route
          path="/contact"
          element={
            <PageTransition>
              <SayHello />
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={<Admin />}
        />
        <Route
          path="/blog"
          element={
            <PageTransition>
              <Blog />
            </PageTransition>
          }
        />
        <Route
          path="/blog/:slug"
          element={
            <PageTransition>
              <BlogPost />
            </PageTransition>
          }
        />
        <Route path="/testers/*" element={<TestersApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          {IS_TESTERS_HOST ? (
            <Routes>
              <Route path="/*" element={<TestersApp />} />
            </Routes>
          ) : (
            <AnimatedRoutes />
          )}
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
