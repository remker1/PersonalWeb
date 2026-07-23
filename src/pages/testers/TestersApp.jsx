import { Routes, Route, Navigate } from "react-router-dom";
import { TestersLayout } from "./TestersLayout";
import TestersHome from "./TestersHome";
import KeyboardTester from "./KeyboardTester";
import WebcamTester from "./WebcamTester";
import AudioTester from "./AudioTester";
import TrackpadTester from "./MouseTester";
import ScreenTester from "./ScreenTester";
import TouchTester from "./TouchTester";
import BatteryTester from "./BatteryTester";
import NetworkTester from "./NetworkTester";
import DeveloperContact from "./DeveloperContact";
import { tPath } from "./testersUtils";

// Mounted at "/*" on testers.remker1.dev, or at "/testers/*" on the main site.
export default function TestersApp() {
  return (
    <TestersLayout>
      <Routes>
        <Route index element={<TestersHome />} />
        <Route path="keyboard" element={<KeyboardTester />} />
        <Route path="webcam" element={<WebcamTester />} />
        <Route path="audio" element={<AudioTester />} />
        <Route path="trackpad" element={<TrackpadTester />} />
        <Route path="mouse" element={<Navigate to={tPath("/trackpad")} replace />} />
        <Route path="screen" element={<ScreenTester />} />
        <Route path="touch" element={<TouchTester />} />
        <Route path="battery" element={<BatteryTester />} />
        <Route path="network" element={<NetworkTester />} />
        <Route path="contact" element={<DeveloperContact />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </TestersLayout>
  );
}
