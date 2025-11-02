import { Layout } from "@stellar/design-system";
import { Routes, Route, Outlet } from "react-router-dom";

const AppLayout: React.FC = () => (
  <main>
    <Layout.Header projectId="Stellar Motors" projectTitle="Stellar Motors" />
    <Outlet />
    <Layout.Footer>
      <span>
        © {new Date().getFullYear()} Stellar Motors. Licensed under the{" "}
        <a
          href="http://www.apache.org/licenses/LICENSE-2.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Apache License, Version 2.0
        </a>
        .
      </span>
    </Layout.Footer>
  </main>
);

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<div>Home</div>} />
      </Route>
    </Routes>
  );
}

export default App;
