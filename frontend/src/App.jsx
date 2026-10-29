import { ArrowRight, Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Header from "./components/Header.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import ProductArt from "./components/ProductArt.jsx";
import ProductSection from "./components/ProductSection.jsx";
import { CheckoutPage, ProductDetails } from "./components/StorePages.jsx";
import { categories, products } from "./data/catalog.js";
import {
  getRouteProducts,
  navigateTo,
  resolveRoute,
  routeForLabel,
  useRouter,
} from "./routes/router.jsx";
import { apiRequest } from "./services/api.js";

function RoutePage({
  route,
  products: items,
  wishlist,
  onAdd,
  onWishlistToggle,
  user,
  onAuthenticated,
  cart,
  onPlaceOrder,
}) {
  const [sortOrder, setSortOrder] = useState("featured");
  const sortedProducts = [...items].sort((a, b) =>
    sortOrder === "price-asc"
      ? a.price - b.price
      : sortOrder === "price-desc"
        ? b.price - a.price
        : 0,
  );

  if (route.type === "login")
    return <Login user={user} onAuthenticated={onAuthenticated} />;
  if (route.type === "register")
    return <Register user={user} onAuthenticated={onAuthenticated} />;
  if (route.type === "product") {
    const product = products.find((item) => item.id === route.productId);
    return (
      <ProductDetails
        product={product}
        saved={wishlist.some((item) => item.id === product?.id)}
        onWishlistToggle={onWishlistToggle}
        onAdd={onAdd}
      />
    );
  }
  if (route.type === "checkout")
    return <CheckoutPage cart={cart} user={user} onPlaceOrder={onPlaceOrder} />;
  if (route.type === "reviews")
    return (
      <div className="mx-auto min-h-[55vh] max-w-[1250px] px-0 py-8 max-[1100px]:mx-[5%]">
        <p className="text-xs text-[#77788d]">
          <a href={routeForLabel("Home")}>Home</a> / Customer reviews
        </p>
        <h1 className="mt-8 text-3xl font-extrabold">Customer reviews</h1>
        <p className="mt-2 text-sm text-[#77788d]">
          What customers say about Brisk Lifestyles.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Comfortable fabric and a clean fit.", "Classic cotton punjabi"],
            ["The scent lasts through the evening.", "Oud Noir eau de parfum"],
            ["Lovely detailing, true to size.", "Embroidered kurti"],
          ].map(([quote, item]) => (
            <article
              key={item}
              className="rounded-2xl border border-[#e3e2e9] bg-white p-5"
            >
              <p className="text-[#e0b52c]" aria-label="5 out of 5 stars">
                ★★★★★
              </p>
              <p className="my-3 text-sm">“{quote}”</p>
              <b className="text-xs">{item}</b>
            </article>
          ))}
        </div>
      </div>
    );

  const isEmptyWishlist = route.type === "wishlist" && !items.length;
  const subtitle =
    route.type === "wishlist"
      ? `${items.length} saved ${items.length === 1 ? "item" : "items"}`
      : route.type === "search"
        ? `${items.length} ${items.length === 1 ? "result" : "results"} for “${route.query}”`
        : route.type === "offers"
          ? "Products priced below their previous price."
          : `${items.length} ${items.length === 1 ? "product" : "products"} in this collection.`;
  return (
    <div className="mx-auto min-h-[55vh] max-w-[1250px] px-0 pb-10 pt-8 max-[1100px]:mx-[1%]">
      <p className="text-xs text-[#77788d]">
        <a href={routeForLabel("Home")}>Home</a> / {route.title}
      </p>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-7 text-[30px] font-extrabold tracking-tight">
            {route.title}
          </h1>
          <p className="mt-1 text-xs text-[#77788d]">
            {isEmptyWishlist
              ? "Your saved favorites will appear here."
              : subtitle}
          </p>
        </div>
        {!isEmptyWishlist && (
          <label className="flex items-center gap-2 text-xs font-semibold">
            Sort by price
            <select
              className="h-10 rounded-full border border-[#e3e0d8] bg-white px-4 text-xs"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sort products by price"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        )}
      </div>
      {sortedProducts.length ? (
        <ProductSection
          id={route.slug || route.type}
          title={route.title}
          hideHeader
          products={sortedProducts}
          onAdd={onAdd}
          wishlist={wishlist}
          onWishlistToggle={onWishlistToggle}
        />
      ) : (
        <p className="py-12 text-center text-sm text-[#77788d]">
          {isEmptyWishlist
            ? "Your wishlist is empty."
            : route.type === "search"
              ? `No products found for “${route.query}”. Try another search.`
              : "There are no products in this category yet."}
        </p>
      )}
    </div>
  );
}

function App() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("brisk-wishlist") || "[]");
    } catch {
      return [];
    }
  });
  const { pathname } = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [heroSlide, setHeroSlide] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const route = resolveRoute(pathname.split("?")[0]);
  const routeProducts = getRouteProducts(route, products, wishlist);
  useEffect(() => {
    apiRequest("/auth/me")
      .then((result) => setUser(result.user))
      .catch(() => setUser(null));
  }, []);
  useEffect(() => {
    localStorage.setItem("brisk-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);
  useEffect(() => {
    document.title =
      route.type === "home"
        ? "Punjabi, perfume and everyday style | Brisk Lifestyles"
        : `${route.title} | Brisk Lifestyles`;
    const description =
      route.type === "wishlist"
        ? "Your saved favorites at Brisk Lifestyles."
        : route.type === "offers"
          ? "Shop special offers on Punjabi styles and fragrances at Brisk Lifestyles."
          : route.type === "category"
            ? `Shop ${route.title.toLowerCase()} at Brisk Lifestyles in Bangladesh.`
            : "Discover Punjabi, pajama, kurti and fragrances at Brisk Lifestyles. Shop everyday and festive styles in Bangladesh.";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    const privateRoute = ["wishlist", "login", "register", "search"].includes(
      route.type,
    );
    document
      .querySelector('meta[name="robots"]')
      ?.setAttribute(
        "content",
        privateRoute ? "noindex,nofollow" : "index,follow",
      );
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical)
      canonical.href = `${window.location.origin}${window.location.pathname}`;
  }, [pathname, route.title, route.type]);
  const reviewTrack = useRef(null);
  const pointerStart = useRef(null);
  useEffect(() => {
    if (route.type !== "home") return undefined;
    const timer = window.setInterval(
      () => setHeroSlide((n) => (n + 1) % 3),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [route.type]);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const track = reviewTrack.current;
    if (!track) return;
    let paused = false;
    const timer = window.setInterval(() => {
      if (!paused && track.scrollWidth > track.clientWidth) {
        track.scrollLeft += 1;
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2)
          track.scrollLeft = 0;
      }
    }, 24);
    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
    };
    track.addEventListener("pointerdown", pause);
    window.addEventListener("pointerup", resume);
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);
    return () => {
      window.clearInterval(timer);
      track.removeEventListener("pointerdown", pause);
      window.removeEventListener("pointerup", resume);
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
    };
  }, []);
  const addToCart = (product, size) => {
    const existing = cart.find(
      (item) => item.id === product.id && item.size === size,
    );
    let notice = `${product.name} added to bag`;
    if (existing && existing.quantity >= 10)
      notice = `You can add up to 10 of ${product.name} per size.`;
    else if (existing)
      notice = `${product.name} is already in your cart. Quantity increased to ${existing.quantity + 1}.`;
    setCart((current) => {
      const match = current.find(
        (item) => item.id === product.id && item.size === size,
      );
      if (!match)
        return [
          ...current,
          { ...product, size, quantity: 1, lineId: `${product.id}-${size}` },
        ];
      if (match.quantity >= 10) return current;
      return current.map((item) =>
        item.lineId === match.lineId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
    setToast(notice);
    window.setTimeout(() => setToast(""), 2400);
  };
  const changeQuantity = (lineId, change) =>
    setCart((current) =>
      current.flatMap((item) => {
        if (item.lineId !== lineId) return [item];
        const quantity = (item.quantity || 1) + change;
        return quantity > 0 ? [{ ...item, quantity }] : [];
      }),
    );
  const toggleWishlist = (product) =>
    setWishlist((current) =>
      current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [...current, product],
    );
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const total = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0,
  );
  const placeOrder = () => setCart([]);
  const section = (id, title, subtitle, items) => (
    <ProductSection
      id={id}
      title={title}
      subtitle={subtitle}
      products={items}
      onAdd={addToCart}
      wishlist={wishlist}
      onWishlistToggle={toggleWishlist}
    />
  );

  return (
    <div id="top">
      <Header
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        user={user}
        onCart={() => setCartOpen(true)}
        onLogout={async () => {
          try {
            await apiRequest("/auth/logout", { method: "POST" });
            setUser(null);
            setToast("You have signed out.");
          } catch (error) {
            setToast(error.message);
          }
          window.setTimeout(() => setToast(""), 2400);
        }}
        onSearch={(query) => {
          const normalized = query.trim();
          if (normalized)
            navigateTo(`/search?q=${encodeURIComponent(normalized)}`);
        }}
      />
      <main>
        {route.type !== "home" ? (
          <RoutePage
            route={route}
            products={routeProducts}
            wishlist={wishlist}
            onAdd={addToCart}
            onWishlistToggle={toggleWishlist}
            user={user}
            onAuthenticated={setUser}
            cart={cart}
            onPlaceOrder={placeOrder}
          />
        ) : (
          <>
            {/* <section
              className={`relative flex h-[430px] items-center overflow-hidden bg-[#20216b] px-[max(calc((100%-1250px)/2), 2%)] text-white transition-colors duration-700 max-[1100px]:h-[420px] max-[1100px]:px-[2%] max-[720px]:h-auto max-[720px]:min-h-[680px] max-[720px]:items-stretch max-[720px]:px-[2%] max-[720px]:pb-[20px] max-[720px]:pt-8 max-[390px]:min-h-[690px] ${heroSlide === 1 ? "bg-[#31347e]" : heroSlide === 2 ? "bg-[#282858]" : ""}`}
            >
              <div
                className="relative z-[2] w-[59%] animate-hero-in motion-reduce:animate-none max-[1100px]:w-[50%] max-[720px]:w-full"
                key={heroSlide}
              >
                <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#d8ba53]">
                  {
                    [
                      "Made for your moments",
                      "A little more color",
                      "Style for every story",
                    ][heroSlide]
                  }
                </span>
                <h1 className="my-5 text-[clamp(40px,5.2vw,69px)] font-extrabold leading-[1.04] tracking-[-.055em] max-[1100px]:text-[clamp(38px,4.8vw,56px)] max-[720px]:my-4 max-[720px]:text-[clamp(32px,8vw,46px)]">
                  {
                    [
                      <>
                        Kurti, sets and
                        <br />
                        <em className="not-italic text-[#f0c332]">
                          everyday favorites.
                        </em>
                      </>,
                      <>
                        Find your
                        <br />
                        <em className="not-italic text-[#f0c332]">
                          festive feeling.
                        </em>
                      </>,
                      <>
                        A scent that
                        <br />
                        <em className="not-italic text-[#f0c332]">
                          stays with you.
                        </em>
                      </>,
                    ][heroSlide]
                  }
                </h1>
                <p className="mb-6 mt-0 max-w-[390px] text-sm text-[#dfdff4] max-[720px]:mb-5 max-[720px]:max-w-[310px] max-[720px]:text-xs">
                  {
                    [
                      "Printed, embroidered and three-piece styles in comfortable cotton.",
                      "Thoughtful details and vibrant looks for the moments that matter.",
                      "Discover woody, floral and fresh fragrances for every day.",
                    ][heroSlide]
                  }
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <a
                    className="inline-flex items-center justify-center gap-[7px] rounded-full bg-[#f0c332] px-5 py-3 text-xs font-bold text-[#22224c] transition hover:bg-[#ffda55] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#f0c332]"
                    href={routeForLabel(
                      heroSlide === 2 ? "Perfumes" : "Punjabi",
                    )}
                  >
                    Shop collection
                  </a>
                  <a
                    className="inline-flex items-center justify-center gap-[7px] rounded-full border border-white/60 px-5 py-3 text-xs font-bold text-white transition hover:bg-white hover:text-[#20216b]"
                    href={routeForLabel("All categories")}
                  >
                    Explore categories
                  </a>
                </div>
              </div>

              <div
                className="absolute right-[7%] top-[54px] h-[330px] w-[48%] max-[1100px]:right-[4%] max-[1100px]:top-[60px] max-[1100px]:h-[300px] max-[1100px]:w-[42%] max-[720px]:bottom-[54px] max-[720px]:left-[8%] max-[720px]:right-[8%] max-[720px]:top-auto max-[720px]:h-[205px] max-[720px]:w-[90%] max-[720px]:opacity-100 max-[390px]:bottom-[58px] max-[390px]:h-[190px]"
                aria-hidden="true"
              >
                <div className="group absolute left-[6%] top-[60px] h-[255px] w-[31%] overflow-hidden rounded-[22px] border-2 border-[#cdb23c] p-[5px] max-[720px]:top-5 max-[720px]:h-[140px] max-[720px]:rounded-[13px]">
                  <ProductArt
                    kind={heroSlide === 2 ? "scent" : "shirt"}
                    color={heroSlide === 1 ? "gold" : "blue"}
                    name="Brisk collection"
                  />
                </div>
                <div className="group absolute left-[37%] top-[85px] h-[255px] w-[31%] overflow-hidden rounded-[22px] border-2 border-[#cdb23c] p-[5px] max-[720px]:top-9 max-[720px]:h-[140px] max-[720px]:rounded-[13px]">
                  <ProductArt kind="shirt" color="blue" name="Indigo style" />
                </div>
                <div className="group absolute left-[68%] top-[38px] h-[255px] w-[31%] overflow-hidden rounded-[22px] border-2 border-[#cdb23c] p-[5px] max-[720px]:top-2 max-[720px]:h-[140px] max-[720px]:rounded-[13px]">
                  <ProductArt
                    kind={heroSlide === 2 ? "scent" : "shirt"}
                    color="gold"
                    name="Golden style"
                  />
                </div>
                <span className="absolute -right-[150px] -bottom-[125px] h-[270px] w-[270px] rounded-full border-[24px] border-[#f1ce4655]" />
              </div>

              <div
                className="absolute bottom-[13px] left-1/2 flex -translate-x-1/2 items-center gap-[7px] max-[720px]:bottom-[19px]"
                aria-label={`Slide ${heroSlide + 1} of 3`}
              >
                {[0, 1, 2].map((slide) => (
                  <button
                    key={slide}
                    className={`h-[9px] rounded-full border-0 bg-white/40 p-0 transition-all ${slide === heroSlide ? "!w-[26px] bg-[#f0c332]" : "w-[9px]"}`}
                    aria-label={`Go to slide ${slide + 1}`}
                    onClick={() => setHeroSlide(slide)}
                  />
                ))}
              </div>
            </section> */}
            <section
              className={`relative isolate flex min-h-[430px] items-center overflow-hidden bg-[#20216b] text-white transition-colors duration-700 ${
                heroSlide === 1
                  ? "bg-[#31347e]"
                  : heroSlide === 2
                    ? "bg-[#282858]"
                    : ""
              }`}
            >
              {/* Main content container */}
              <div
                className="relative mx-auto flex min-h-[430px] w-full max-w-[1330px] items-center px-6 py-10 max-[1100px]:min-h-[420px] max-[1100px]:px-5
      max-[720px]:min-h-0 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:px-4 max-[720px]:pb-0 max-[720px]:pt-8"
              >
                {/* Text content */}
                <div
                  key={heroSlide}
                  className="
        relative z-10 w-[56%] min-w-0
        animate-hero-in motion-reduce:animate-none
        max-[1100px]:w-[54%]
        max-[1100px]:pr-2
        max-[720px]:w-full
        max-[720px]:pr-0
      "
                >
                  <span
                    className="
          inline-block rounded-full border border-white/15
          bg-white/10 px-2 py-1.5
          text-[10px] font-bold uppercase tracking-[.1em]
          text-[#d8ba53]
        "
                  >
                    {
                      [
                        "Made for your moments",
                        "A little more color",
                        "Style for every story",
                      ][heroSlide]
                    }
                  </span>

                  <h1
                    className="
          my-5 text-[clamp(38px,4.8vw,66px)]
          font-extrabold leading-[1.06] tracking-[-.055em]
          max-[1100px]:text-[clamp(34px,4.4vw,50px)]
          max-[720px]:my-4
          max-[720px]:max-w-[560px]
          max-[720px]:text-[clamp(32px,7.5vw,46px)]
          max-[390px]:text-[32px]
        "
                  >
                    {
                      [
                        <>
                          Kurti, sets and
                          <br />
                          <em className="not-italic text-[#f0c332]">
                            everyday favorites.
                          </em>
                        </>,
                        <>
                          Find your
                          <br />
                          <em className="not-italic text-[#f0c332]">
                            festive feeling.
                          </em>
                        </>,
                        <>
                          A scent that
                          <br />
                          <em className="not-italic text-[#f0c332]">
                            stays with you.
                          </em>
                        </>,
                      ][heroSlide]
                    }
                  </h1>

                  <p
                    className="
          mb-6 mt-0 max-w-[390px]
          text-sm leading-6 text-[#dfdff4]
          max-[720px]:mb-5
          max-[720px]:max-w-[420px]
          max-[720px]:text-[13px]
          max-[390px]:text-xs
        "
                  >
                    {
                      [
                        "Printed, embroidered and three-piece styles in comfortable cotton.",
                        "Thoughtful details and vibrant looks for the moments that matter.",
                        "Discover woody, floral and fresh fragrances for every day.",
                      ][heroSlide]
                    }
                  </p>

                  {/* Responsive action buttons */}
                  <div className="flex flex-wrap items-center gap-2 max-[390px]:gap-3">
                    <a
                      className="
            inline-flex min-h-11 items-center justify-center
            rounded-full bg-[#f0c332] px-2 py-3
            text-center text-xs font-bold text-[#22224c]
            transition-colors hover:bg-[#ffda55]
            focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-[#f0c332]
            max-[390px]:px-4
          "
                      href={routeForLabel(
                        heroSlide === 2 ? "Perfumes" : "Punjabi",
                      )}
                    >
                      Shop collection
                    </a>

                    <a
                      className="
            inline-flex min-h-11 items-center justify-center
            rounded-full border border-white/60 px-5 py-3
            text-center text-xs font-bold text-white
            transition-colors hover:bg-white hover:text-[#20216b]
            focus-visible:outline focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-white
            max-[390px]:px-4
          "
                      href={routeForLabel("All categories")}
                    >
                      Explore categories
                    </a>
                  </div>
                </div>

                {/* Product artwork */}
                <div
                  className="
        pointer-events-none absolute right-[3%] top-1/2
        h-[330px] w-[43%] -translate-y-1/2
        max-[1100px]:right-[2%]
        max-[1100px]:h-[290px]
        max-[1100px]:w-[42%]
        max-[720px]:relative
        max-[720px]:right-auto
        max-[720px]:top-auto
        max-[720px]:my-7
        max-[720px]:h-[205px]
        max-[720px]:w-full
        max-[720px]:translate-y-0
        max-[390px]:mt-6
        max-[390px]:h-[180px]
      "
                  aria-hidden="true"
                >
                  {/* Left card */}
                  <div
                    className="
          absolute left-[2%] top-[60px]
          h-[255px] w-[31%] overflow-hidden
          rounded-[22px] border-2 border-[#cdb23c] p-[5px]
          max-[1100px]:top-[45px]
          max-[1100px]:h-[230px]
          max-[720px]:top-[30px]
          max-[720px]:h-[150px]
          max-[720px]:rounded-[14px]
          max-[390px]:top-[28px]
          max-[390px]:h-[135px]
        "
                  >
                    <ProductArt
                      kind={heroSlide === 2 ? "scent" : "shirt"}
                      color={heroSlide === 1 ? "gold" : "blue"}
                      name="Brisk collection"
                    />
                  </div>

                  {/* Center card */}
                  <div
                    className="
          absolute left-[34.5%] top-[85px]
          h-[255px] w-[31%] overflow-hidden
          rounded-[22px] border-2 border-[#cdb23c] p-[5px]
          max-[1100px]:top-[65px]
          max-[1100px]:h-[230px]
          max-[720px]:top-[43px]
          max-[720px]:h-[150px]
          max-[720px]:rounded-[14px]
          max-[390px]:top-[38px]
          max-[390px]:h-[135px]
        "
                  >
                    <ProductArt kind="shirt" color="blue" name="Indigo style" />
                  </div>

                  {/* Right card */}
                  <div
                    className="
          absolute left-[67%] top-[38px]
          h-[255px] w-[31%] overflow-hidden
          rounded-[22px] border-2 border-[#cdb23c] p-[5px]
          max-[1100px]:top-[30px]
          max-[1100px]:h-[230px]
          max-[720px]:top-[18px]
          max-[720px]:h-[150px]
          max-[720px]:rounded-[14px]
          max-[390px]:top-[15px]
          max-[390px]:h-[135px]
        "
                  >
                    <ProductArt
                      kind={heroSlide === 2 ? "scent" : "shirt"}
                      color="gold"
                      name="Golden style"
                    />
                  </div>

                  {/* Decorative circle */}
                  <span
                    className="
          absolute -bottom-[125px] -right-[100px]
          h-[270px] w-[270px] rounded-full
          border-[24px] border-[#f1ce4655]
          max-[720px]:-bottom-[125px]
          max-[720px]:-right-[70px]
          max-[720px]:h-[210px]
          max-[720px]:w-[210px]
        "
                  />
                </div>

                {/* Slide indicators */}
                <div
                  className="pt-8 absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-[7px] max-[720px]:bottom-3 "
                  role="group"
                  aria-label="Hero slides"
                >
                  {[0, 1, 2].map((slide) => (
                    <button
                      key={slide}
                      type="button"
                      className={`h-[9px] rounded-full border-0 p-0 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
            ${
              slide === heroSlide
                ? "!w-[26px] bg-[#f0c332]"
                : "w-[9px] bg-white/40 hover:bg-white/70"
            }
          `}
                      aria-label={`Go to slide ${slide + 1}`}
                      aria-current={slide === heroSlide ? "true" : undefined}
                      onClick={() => setHeroSlide(slide)}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section
              className="mx-auto max-w-[1250px] px-0 pt-[43px] max-[1100px]:mx-[5%] max-[720px]:pt-[33px]"
              id="categories"
            >
              <div className="mb-5 flex items-end justify-between max-[720px]:mb-[14px]">
                <div>
                  <h2 className="m-0 text-[27px] font-extrabold tracking-[-.04em] text-[#1a1a43] max-[720px]:text-[22px]">
                    Shop by category
                  </h2>
                  <p className="mt-1 text-xs text-[#77788d]">
                    Find your everyday and occasion favorites
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3 max-[720px]:grid-cols-3 max-[720px]:gap-[9px] max-[390px]:grid-cols-2">
                {categories.map((category) => (
                  <a
                    href={routeForLabel(category.name)}
                    className={`category-tile group relative isolate flex h-[155px] flex-col justify-end overflow-hidden rounded-2xl p-4 text-white transition duration-300 hover:-translate-y-1 hover:shadow-lg max-[1100px]:h-[140px] max-[720px]:h-[125px] max-[720px]:p-3 ${{ navy: "bg-gradient-to-br from-[#272852] to-[#121434]", blue: "bg-gradient-to-br from-[#676bc0] to-[#323481]", gold: "bg-gradient-to-br from-[#e2c048] to-[#b68e19]", olive: "bg-gradient-to-br from-[#a38c31] to-[#6b5811]", lavender: "bg-gradient-to-br from-[#9697e6] to-[#6668c9]" }[category.color]}`}
                    key={category.name}
                  >
                    <span className="absolute -right-[22px] -top-[34px] -z-10 h-[95px] w-[95px] rounded-full border-4 border-white/20 transition-transform group-hover:scale-125" />
                    <b className="text-[15px] leading-tight max-[720px]:text-[13px]">
                      {category.name}
                    </b>
                    <small className="mt-1 text-[10px] text-white/80 max-[720px]:text-[9px]">
                      {category.detail}
                    </small>
                    <span className="mt-2 flex items-center gap-1 text-[10px] text-[#f0c332] max-[720px]:text-[9px]">
                      Shop now <ArrowRight size={13} />
                    </span>
                  </a>
                ))}
              </div>
            </section>
            {section(
              "bestsellers",
              "Best sellers",
              "Ranked by popularity in the catalog.",
              products
                .filter((product) => product.badge === "Best seller")
                .slice(0, 4),
            )}
            <section
              className="mx-auto mt-[44px] grid max-w-[1250px] grid-cols-2 gap-[18px] max-[1100px]:mx-[5%] max-[720px]:mt-[34px] max-[720px]:grid-cols-1 max-[720px]:gap-3"
              id="offers"
            >
              <a
                href={routeForLabel("Offers")}
                className="promo group relative isolate h-[205px] overflow-hidden rounded-[20px] bg-[#363993] p-[26px_30px] text-white transition duration-300 hover:-translate-y-1 hover:shadow-lg max-[720px]:h-[170px] max-[720px]:p-5"
              >
                <span
                  className="absolute -right-[28px] -top-[68px] -z-10 h-[145px] w-[145px] rounded-full border-[18px] border-white/20"
                  aria-hidden="true"
                />
                <span className="text-[11px] opacity-75">
                  Seasonal favorites
                </span>
                <h2 className="my-2 text-2xl font-extrabold leading-[1.08] tracking-tight">
                  Festive punjabi
                </h2>
                <p className="mb-3.5 text-[11px] text-[#d8d8ef]">
                  Selected styles at a lower price than before.
                </p>
                <b className="inline-flex items-center gap-1.5 rounded-full bg-[#f0c332] px-3.5 py-[9px] text-[10px] text-[#17173f]">
                  Shop offers <ArrowRight size={14} />
                </b>
              </a>
              <a
                href={routeForLabel("Perfumes")}
                className="promo group relative isolate h-[205px] overflow-hidden rounded-[20px] bg-[#17173f] p-[26px_30px] text-white transition duration-300 hover:-translate-y-1 hover:shadow-lg max-[720px]:h-[170px] max-[720px]:p-5"
              >
                <span
                  className="absolute -right-[28px] -top-[68px] -z-10 h-[145px] w-[145px] rounded-full border-[18px] border-white/20"
                  aria-hidden="true"
                />
                <span className="text-[11px] opacity-75">Fragrance edit</span>
                <h2 className="my-2 text-2xl font-extrabold leading-tight">
                  Find your scent
                </h2>
                <p className="mb-3.5 text-[11px] text-[#d8d8ef]">
                  Browse eau de parfum, toilette and attar.
                </p>
                <b className="inline-flex items-center gap-1.5 rounded-full bg-[#f0c332] px-3.5 py-[9px] text-[10px] text-[#17173f]">
                  Shop perfumes <ArrowRight size={14} />
                </b>
              </a>
            </section>
            {section(
              "punjabi",
              "Punjabi edit",
              "From daily wear to festive jacquard.",
              products.slice(4, 8),
            )}
            {section(
              "scents",
              "Signature scents",
              "Woody, floral and fresh fragrances.",
              products.slice(8, 12),
            )}
            {section(
              "arrivals",
              "New arrivals",
              "Fresh picks, just added to the collection.",
              products.slice(12, 16),
            )}
            {section(
              "specials",
              "Special offers",
              "Only products priced below their previous price.",
              products.slice(1, 5),
            )}
            <section
              className="mt-[54px] bg-[#eeeff9] px-[max(calc((100%-1250px)/2),7.4%)] py-[42px] pb-[50px] max-[1100px]:px-[5%] max-[720px]:mt-10 max-[720px]:py-8"
              id="reviews"
            >
              <div className="mb-5 flex items-end justify-between max-[720px]:mb-[14px]">
                <div>
                  <h2 className="m-0 text-[27px] font-extrabold tracking-[-.04em] text-[#1a1a43] max-[720px]:text-[21px]">
                    What customers say
                  </h2>
                  <p className="mt-1 text-xs text-[#77788d]">
                    Sample reviews for design preview only. Replace with real
                    customer reviews before launch.
                  </p>
                </div>
              </div>
              <div
                className="flex cursor-grab gap-[15px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-y] active:cursor-grabbing"
                ref={reviewTrack}
                onPointerDown={(event) => {
                  pointerStart.current = {
                    x: event.clientX,
                    scroll: event.currentTarget.scrollLeft,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (pointerStart.current)
                    event.currentTarget.scrollLeft =
                      pointerStart.current.scroll -
                      (event.clientX - pointerStart.current.x);
                }}
                onPointerUp={() => {
                  pointerStart.current = null;
                }}
              >
                {[
                  [
                    "Comfortable fabric and a clean fit.",
                    "Classic cotton punjabi",
                  ],
                  [
                    "The scent lasts through the evening.",
                    "Cool Noir eau de parfum, 50 ml",
                  ],
                  [
                    "Lovely detailing, true to size.",
                    "Embroidered kurti, ivory",
                  ],
                ].map(([quote, title]) => (
                  <article
                    className="w-[min(460px,80vw)] shrink-0 select-none rounded-[14px] border border-[#e3e2e9] border-t-2 border-t-[#e0b72f] bg-white p-4 max-[720px]:w-[84vw] max-[720px]:p-[13px]"
                    key={title}
                  >
                    <div
                      className="text-[13px] tracking-[2px] text-[#e0b52c]"
                      aria-label="5 out of 5 stars"
                    >
                      â˜…â˜…â˜…â˜…â˜…
                    </div>
                    <p className="my-2 min-h-[34px] text-xs text-[#45455f] max-[720px]:min-h-0">
                      â€œSample review: {quote}â€
                    </p>
                    <b className="block text-[11px]">Sample customer</b>
                    <a
                      className="mt-1 block text-[11px] text-[#717299] underline"
                      href={routeForLabel("Reviews")}
                    >
                      {title}
                    </a>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <button
        className={`fixed bottom-[26px] right-[26px] z-[14] grid h-[50px] w-[50px] place-items-center rounded-full bg-[#37399a] text-[25px] text-white shadow-lg transition duration-300 max-[720px]:bottom-[18px] max-[720px]:right-4 max-[720px]:h-11 max-[720px]:w-11 ${showTop ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0"}`}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>
      <footer className="bg-[#17173f] px-[max(calc((100%-1250px)/2),7.4%)] pb-[25px] pt-9 text-white max-[1100px]:px-[5%] max-[720px]:pt-7">
        <a
          className="inline-flex w-max items-baseline gap-[5px] text-[30px] font-extrabold tracking-[-.06em] text-white max-[720px]:text-[22px]"
          href="#top"
        >
          <span>Brisk</span>
          <i className="text-[18px] font-semibold text-[#e2b52a] max-[720px]:text-[13px]">
            Lifestyles
          </i>
        </a>
        <p className="my-3 text-xs text-[#c6c6db]">
          Everyday style, made for your moments.
        </p>
        <div className="my-[22px] flex gap-[23px] text-[11px] max-[720px]:flex-wrap max-[720px]:gap-[14px]">
          <a href={routeForLabel("All categories")}>Shop</a>
          <a href={routeForLabel("Offers")}>Offers</a>
          <a href={routeForLabel("Reviews")}>Customer care</a>
          <a href="#top">Back to top â†‘</a>
        </div>
        <small className="text-[10px] text-[#a4a4c3]">
          Â© 2025 Brisk Lifestyles Â· Prices shown in Bangladeshi taka
        </small>
      </footer>
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#17173f] px-[17px] py-3 text-xs text-white shadow-xl"
          role="status"
        >
          <Check size={16} />
          {toast}
        </div>
      )}
      {cartOpen && (
        <div
          className="fixed inset-0 z-[40] flex justify-end bg-[#0e0f2b]/50"
          onClick={(event) => {
            if (event.target === event.currentTarget) setCartOpen(false);
          }}
        >
          <aside
            className="flex h-full w-[min(440px,100%)] flex-col bg-[#fbfaf7] p-[26px] shadow-[-8px_0_30px_#0c0c251a]"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-[#e5e3e1] pb-5">
              <div>
                <span className="inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#d8ba53]">
                  Your selection
                </span>
                <h2 className="mt-1 text-[25px] font-bold">
                  Your bag{" "}
                  <small className="text-sm text-[#888]">({cartCount})</small>
                </h2>
              </div>
              <button
                aria-label="Close cart"
                onClick={() => setCartOpen(false)}
              >
                <X />
              </button>
            </div>
            {cart.length ? (
              <>
                <div className="flex-1 overflow-auto">
                  {cart.map((item) => (
                    <article
                      className="grid grid-cols-[75px_minmax(0,1fr)_auto] items-center gap-[13px] border-b border-[#e6e4e2] py-4"
                      key={item.lineId}
                    >
                      <div className="h-20 overflow-hidden rounded-[9px]">
                        <ProductArt {...item} />
                      </div>
                      <div className="flex flex-col gap-[5px] text-xs">
                        <b className="font-bold">{item.name}</b>
                        <span>
                          {item.size ? `Size ${item.size} Â· ` : ""}In stock
                        </span>
                        <strong className="text-[13px]">
                          ৳
                          {(item.price * (item.quantity || 1)).toLocaleString(
                            "en-BD",
                          )}
                        </strong>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-[#dedde4] bg-white p-1">
                        <button
                          className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f2f1f7]"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => changeQuantity(item.lineId, -1)}
                        >
                          <Minus size={15} />
                        </button>
                        <span
                          className="min-w-5 text-center text-xs font-bold"
                          aria-live="polite"
                        >
                          {item.quantity || 1}
                        </span>
                        <button
                          className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f2f1f7] disabled:opacity-40"
                          aria-label={`Increase quantity of ${item.name}`}
                          disabled={(item.quantity || 1) >= 10}
                          onClick={() => changeQuantity(item.lineId, 1)}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3 pt-[17px] text-sm">
                  <span>Subtotal</span>
                  <strong>৳{total.toLocaleString("en-BD")}</strong>
                  <small className="col-span-2 text-[10px] text-[#828395]">
                    Delivery charges are calculated at checkout.
                  </small>
                  <button
                    className="col-span-2 mt-2 flex h-[46px] items-center justify-center gap-2 rounded-full border-0 bg-[#353793] font-bold text-white"
                    onClick={() => {
                      setCartOpen(false);
                      navigateTo("/checkout");
                    }}
                  >
                    Continue to checkout <ArrowRight size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-[#353793]">
                <ShoppingBag size={34} />
                <h3 className="mb-0 mt-4 text-xl font-bold text-[#1a1a43]">
                  Your bag is waiting
                </h3>
                <p className="mb-5 text-xs text-[#77788d]">
                  Add a favorite and it will show up here.
                </p>
                <button
                  className="inline-flex items-center justify-center gap-[7px] rounded-full bg-[#f0c332] px-5 py-3 text-xs font-bold text-[#22224c] transition hover:bg-[#ffda55] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#f0c332]"
                  onClick={() => setCartOpen(false)}
                >
                  Explore the edit <Plus size={15} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;
