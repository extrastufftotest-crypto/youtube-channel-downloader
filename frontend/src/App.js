import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="App grain">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        theme="light"
        toastOptions={{
          style: {
            borderRadius: 0,
            border: "1px solid #0A0A0A",
            fontFamily: "'IBM Plex Sans', sans-serif",
          },
        }}
      />
    </div>
  );
}

export default App;
