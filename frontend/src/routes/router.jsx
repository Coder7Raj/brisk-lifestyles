import { useEffect, useState } from "react";

const labelToPath = {
  home: "/",
  wishlist: "/wishlist",
  "sign in": "/login",
  account: "/login",
  men: "/men",
  women: "/women",
  perfumes: "/perfumes",
  offers: "/offers",
  "new arrivals": "/new-arrivals",
  reviews: "/reviews",
  punjabi: "/punjabi",
  pajama: "/pajama",
  kurti: "/kurti",
  accessories: "/accessories",
  "gift cards": "/gift-cards",
  "all categories": "/categories",
  checkout: "/checkout",
};

export function routeForLabel(label) {
  return labelToPath[label.trim().toLowerCase()] || "/categories";
}

export function useRouter() {
  const [pathname, setPathname] = useState(
    `${window.location.pathname}${window.location.search}`,
  );

  useEffect(() => {
    const handleClick = (event) => {
      if (event.defaultPrevented || !(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (
        !link ||
        link.origin !== window.location.origin ||
        !link.pathname.startsWith("/") ||
        (link.pathname === window.location.pathname &&
          link.search === window.location.search) ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        (link.target && link.target !== "_self")
      )
        return;

      event.preventDefault();
      navigateTo(`${link.pathname}${link.search}${link.hash}`);
    };
    const handlePopState = () =>
      setPathname(`${window.location.pathname}${window.location.search}`);
    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return { pathname };
}

export function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

export function resolveRoute(pathname) {
  pathname = pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/") return { type: "home", title: "Brisk Lifestyles" };
  if (pathname === "/offers")
    return { type: "offers", title: "Special offers" };
  if (pathname === "/wishlist")
    return { type: "wishlist", title: "Your wishlist" };
  if (pathname === "/reviews")
    return { type: "reviews", title: "Customer reviews" };
  if (pathname === "/login") return { type: "login", title: "Sign in" };
  if (pathname === "/register")
    return { type: "register", title: "Create account" };
  if (pathname === "/checkout") return { type: "checkout", title: "Checkout" };
  if (pathname === "/search") {
    const query =
      new URLSearchParams(window.location.search).get("q")?.trim() || "";
    return {
      type: "search",
      title: query ? `Results for “${query}”` : "Search",
      query,
    };
  }
  const productMatch = pathname.match(/^\/product\/(\d+)$/);
  if (productMatch)
    return {
      type: "product",
      title: "Product details",
      productId: Number(productMatch[1]),
    };

  const slug = pathname.replace(/^\/+|\/+$/g, "").replace(/^category\//, "");
  const label =
    Object.keys(labelToPath).find((item) => labelToPath[item] === `/${slug}`) ||
    slug.replace(/-/g, " ");
  return {
    type: "category",
    slug,
    title: label.replace(/\b\w/g, (letter) => letter.toUpperCase()),
  };
}

export function getRouteProducts(route, products, wishlist) {
  if (route.type === "search") {
    const query = route.query.toLocaleLowerCase();
    return query
      ? products.filter((item) =>
          `${item.name} ${item.category}`.toLocaleLowerCase().includes(query),
        )
      : [];
  }
  if (route.type === "wishlist") return wishlist;
  if (route.type === "offers")
    return products.filter((item) => item.originalPrice > item.price);
  if (route.type !== "category") return [];

  const key = route.slug.toLowerCase();
  if (["categories", "all-categories"].includes(key)) return products;
  if (["men", "punjabi", "pajama"].includes(key)) {
    return products.filter(
      (item) =>
        item.category.toLowerCase() ===
        (key === "pajama" ? "pajama" : "punjabi"),
    );
  }
  if (["women", "kurti", "accessories", "gift-cards"].includes(key)) {
    const category = key === "gift-cards" ? "gift card" : key;
    return products.filter((item) =>
      item.category.toLowerCase().includes(category),
    );
  }
  if (key === "perfumes")
    return products.filter((item) => item.kind === "scent");
  if (key === "new-arrivals")
    return products.filter((item) => item.badge === "New");
  return products.filter((item) => item.category.toLowerCase() === key);
}
