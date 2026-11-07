import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "./api.js";

const ProductsContext = createContext(null);
const colors = ["navy", "blue", "gold", "olive", "lavender"];

function mapProduct(product) {
  const price = Number(product.price_paisa) / 100;
  const originalPrice =
    product.compare_at_price_paisa == null
      ? price
      : Number(product.compare_at_price_paisa) / 100;
  const kind = /fragrance|perfume|attar|scent/i.test(product.category)
    ? "scent"
    : "shirt";
  const colorIndex =
    [...product.category].reduce(
      (sum, letter) => sum + letter.charCodeAt(0),
      0,
    ) % colors.length;
  return {
    ...product,
    price,
    originalPrice,
    kind,
    color: colors[colorIndex],
    badge: !product.in_stock
      ? "Out of stock"
      : originalPrice > price
        ? "Sale"
        : "In stock",
  };
}

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const [productItems, categoryItems] = await Promise.all([
        apiRequest("/products?limit=100"),
        apiRequest("/categories"),
      ]);
      setProducts(productItems.map(mapProduct));
      setCategories(categoryItems);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  return (
    <ProductsContext.Provider
      value={{ products, categories, loading, error, refreshProducts }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context)
    throw new Error("useProducts must be used inside ProductsProvider");
  return context;
}
