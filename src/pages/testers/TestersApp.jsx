import { Routes, Route, Navigate } from "react-router-dom";
import { TestersLayout } from "./TestersLayout";
import TestersHome from "./TestersHome";
import KeyboardTester from "./KeyboardTester";
import WebcamTester from "./WebcamTester";
import AudioTester from "./AudioTester";

// Mounted at "/*" on testers.remker1.dev, or at "/testers/*" on the main site.
export default function TestersApp() {
  return (
    <TestersLayout>
      <Routes>
        <Route index element={<TestersHome />} />
        <Route path="keyboard" element={<KeyboardTester />} />
        <Route path="webcam" element={<WebcamTester />} />
        <Route path="audio" element={<AudioTester />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </TestersLayout>
  );
}
