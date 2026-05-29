import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { BatchProcess } from "./pages/BatchProcess/BatchProcess";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { ColorPresets } from "./pages/ColorPresets/ColorPresets";
import { Login } from "./pages/Login/Login";
import { ProcessPhoto } from "./pages/ProcessPhoto/ProcessPhoto";
import { Review } from "./pages/Review/Review";
import { TemplateEditor } from "./pages/TemplateEditor/TemplateEditor";
import { Templates } from "./pages/Templates/Templates";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/color-presets" element={<ColorPresets />} />
          <Route path="/templates/new" element={<TemplateEditor />} />
          <Route path="/templates/:id" element={<TemplateEditor />} />
          <Route path="/process" element={<ProcessPhoto />} />
          <Route path="/batch" element={<BatchProcess />} />
          <Route path="/review" element={<Review />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
