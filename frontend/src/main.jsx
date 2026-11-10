import React from "react";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.jsx";
import { ProductsProvider } from "./services/products.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProductsProvider>
      <App />
      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </ProductsProvider>
  </React.StrictMode>,
);
