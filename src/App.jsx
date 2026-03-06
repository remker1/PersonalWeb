import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PhotographyGallery from "./pages/PhotographyGallery";
import SayHello from "./pages/SayHello";
import Admin from "./pages/Admin";

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/photography" element={<PhotographyGallery />} />
            <Route path="/contact" element={<SayHello />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
