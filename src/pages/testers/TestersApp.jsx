import { Routes, Route, Navigate } from "react-router-dom";
import { TestersLayout } from "./TestersLayout";
import TestersHome from "./TestersHome";
import KeyboardTester from "./KeyboardTester";
import WebcamTester from "./WebcamTester";
import AudioTester from "./AudioTester";
import MouseTester from "./MouseTester";
import ScreenTester from "./ScreenTester";
import TouchTester from "./TouchTester";
import CpuTester from "./CpuTester";
import GpuTester from "./GpuTester";
import BatteryTester from "./BatteryTester";

// Mounted at "/*" on testers.remker1.dev, or at "/testers/*" on the main site.
export default function TestersApp() {
  return (
    <TestersLayout>
      <Routes>
        <Route index element={<TestersHome />} />
        <Route path="keyboard" element={<KeyboardTester />} />
        <Route path="webcam" element={<WebcamTester />} />
        <Route path="audio" element={<AudioTester />} />
        <Route path="mouse" element={<MouseTester />} />
        <Route path="screen" element={<ScreenTester />} />
        <Route path="touch" element={<TouchTester />} />
        <Route path="cpu" element={<CpuTester />} />
        <Route path="gpu" element={<GpuTester />} />
        <Route path="battery" element={<BatteryTester />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </TestersLayout>
  );
}
