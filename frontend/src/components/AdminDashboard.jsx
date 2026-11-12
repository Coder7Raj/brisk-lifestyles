import {
  Ban,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Package,
  Plus,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { apiRequest } from "../services/api.js";
import { useProducts } from "../services/products.jsx";

function Pagination({ page, count, onChange }) {
  const pages = Math.ceil(count / 10);
  if (pages <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-center gap-3 text-sm"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-full border px-4 py-2 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-[#77788d]">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="rounded-full border px-4 py-2 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

const emptyProduct = {
  slug: "",
  name: "",
  category: "",
  description: "",
  price: "",
  comparePrice: "",
  imageUrl: "",
  sizes: "",
  stockBySize: {},
  inStock: true,
};
const money = (taka) =>
  `৳${Number(taka || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toForm = (item) => ({
  slug: item.slug,
  name: item.name,
  category: item.category,
  description: item.description || "",
  price: String(item.price_taka),
  comparePrice:
    item.compare_at_price_taka == null
      ? ""
      : String(item.compare_at_price_taka),
  imageUrl: item.image_url || "",
  sizes: (item.sizes || []).join(", "),
  stockBySize: item.stock_by_size || {},
  inStock: item.in_stock,
});
const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function payloadFrom(form) {
  const price = Number(Number(form.price).toFixed(2));
  const compare = form.comparePrice.trim()
    ? Number(Number(form.comparePrice).toFixed(2))
    : null;
  if (!Number.isFinite(price) || price < 0)
    throw new Error("Enter a valid product price.");
  if (compare != null && (!Number.isFinite(compare) || compare < price))
    throw new Error("Compare-at price must be at least the regular price.");
  const sizes = /fragrance|perfume|attar|scent/i.test(form.category)
    ? []
    : form.sizes
        .toUpperCase()
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean);
  return {
    slug: slugify(form.slug || form.name),
    name: form.name.trim(),
    category: form.category,
    description: form.description.trim(),
    price_taka: price,
    compare_at_price_taka: compare,
    image_url: form.imageUrl.trim() || null,
    sizes,
    stock_by_size: Object.fromEntries(
      sizes.map((size) => [size, Number(form.stockBySize[size] || 0)]),
    ),
    in_stock: form.inStock,
  };
}

export default function AdminDashboard({
  user,
  adminNavOpen,
  onAdminNavClose,
}) {
  const { refreshProducts } = useProducts();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [userSearch, setUserSearch] = useState("");
  const [orderUpdating, setOrderUpdating] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setProductPage(1);
    setOrderPage(1);
    try {
      const [items, categoryItems, orderItems, userItems, dashboardStats] =
        await Promise.all([
          apiRequest("/products/admin?limit=100"),
          apiRequest("/categories"),
          apiRequest("/orders/admin"),
          apiRequest("/auth/users"),
          apiRequest("/orders/admin/stats"),
        ]);
      setProducts(items);
      setCategories(categoryItems);
      setOrders(orderItems);
      setUsers(userItems);
      setStats(dashboardStats);
      setForm((current) =>
        current.category || !categoryItems.length
          ? current
          : { ...current, category: categoryItems[0].slug },
      );
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user?.role]);

  const filtered = useMemo(
    () =>
      products.filter(
        (item) =>
          (categoryFilter === "all" || item.category === categoryFilter) &&
          `${item.name} ${item.slug} ${item.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, categoryFilter, query],
  );
  const pagedProducts = filtered.slice(
    (productPage - 1) * 10,
    productPage * 10,
  );
  const pagedOrders = orders.slice((orderPage - 1) * 10, orderPage * 10);
  const filteredUsers = users.filter((account) =>
    `${account.display_name} ${account.email}`
      .toLowerCase()
      .includes(userSearch.toLowerCase()),
  );

  if (!user)
    return (
      <section className="mx-auto min-h-[60vh] max-w-3xl px-5 py-20 text-center">
        <h1 className="text-3xl font-bold">Admin sign in required</h1>
        <p className="mt-3 text-[#77788d]">
          Sign in with an administrator account to manage products.
        </p>
        <a
          className="mt-6 inline-block rounded-full bg-[#353793] px-6 py-3 font-bold text-white"
          href="/login"
        >
          Sign in
        </a>
      </section>
    );
  if (user.role !== "admin")
    return (
      <section className="mx-auto min-h-[60vh] max-w-3xl px-5 py-20 text-center">
        <h1 className="text-3xl font-bold">Access restricted</h1>
        <p className="mt-3 text-[#77788d]">
          This page is available to administrator accounts only.
        </p>
        <a className="mt-6 inline-block text-[#353793] underline" href="/">
          Return to the store
        </a>
      </section>
    );

  const addCategory = async (event) => {
    event.preventDefault();
    setCategorySaving(true);
    try {
      const name = categoryName.trim();
      const category = await apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug: slugify(name),
          description: categoryDescription.trim(),
        }),
      });
      setCategories((current) =>
        [...current, category].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setCategoryName("");
      setCategoryDescription("");
      setForm((current) => ({
        ...current,
        category: category.slug,
        sizes: /fragrance|perfume|attar|scent/i.test(category.slug)
          ? ""
          : current.sizes,
      }));
      toast.success(`${category.name} category added.`);
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setCategorySaving(false);
    }
  };

  const startCreate = () => {
    setEditor("create");
    setForm({ ...emptyProduct, category: categories[0]?.slug || "" });
  };
  const startEdit = (item) => {
    setEditor(item);
    setForm(toForm(item));
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = payloadFrom(form);
      const saved =
        editor === "create"
          ? await apiRequest("/products", {
              method: "POST",
              body: JSON.stringify(payload),
            })
          : await apiRequest(`/products/${editor.id}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            });
      setProducts((current) =>
        editor === "create"
          ? [saved, ...current]
          : current.map((item) => (item.id === saved.id ? saved : item)),
      );
      setProductPage(1);
      await refreshProducts();
      setStats(await apiRequest("/orders/admin/stats"));
      setEditor(null);
      toast.success(
        editor === "create" ? "Product created." : "Product updated.",
      );
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!deleteTarget || deleting) return;
    const item = deleteTarget;
    setDeleting(true);
    try {
      await apiRequest(`/products/${item.id}`, { method: "DELETE" });
      setProducts((current) =>
        current.filter((product) => product.id !== item.id),
      );
      setProductPage(1);
      await refreshProducts();
      setStats(await apiRequest("/orders/admin/stats"));
      toast.success(`${item.name} deleted.`);
      setDeleteTarget(null);
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setDeleting(false);
    }
  };

  const updateOrderStatus = async (order, status) => {
    setOrderUpdating(order.id);
    try {
      const updated = await apiRequest(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) =>
        current.map((item) =>
          item.id === updated.id ? { ...item, status: updated.status } : item,
        ),
      );
      setOrderConfirmation(null);
      toast.success(
        status === "paid" ? "Order marked successful." : "Order cancelled.",
      );
      setUsers(await apiRequest("/auth/users"));
      setStats(await apiRequest("/orders/admin/stats"));
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setOrderUpdating("");
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-[60] overflow-hidden bg-[#f7f7f9]">
      {adminNavOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={onAdminNavClose}
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-[#17173f]/30 lg:hidden"
        />
      )}
      <aside
        className={`fixed bottom-0 left-0 top-16 z-40 w-[min(16rem,85vw)] border-r border-[#e7e7eb] bg-white px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${adminNavOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#9293a2]">
          Workspace
        </p>
        <nav aria-label="Admin sections" className="grid gap-1">
          {[
            ["dashboard", "Dashboard", LayoutDashboard],
            ["products", "Products", Package],
            ["orders", "Customer orders", ClipboardList],
            ["users", "Users", UsersRound],
          ].map(([view, label, Icon]) => (
            <button
              key={view}
              type="button"
              onClick={() => {
                setActiveView(view);
                onAdminNavClose?.();
              }}
              aria-current={activeView === view ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm transition ${activeView === view ? "bg-[#f0f0f7] font-semibold text-[#353793]" : "text-[#55566c] hover:bg-[#f7f7f9] hover:text-[#353793]"}`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="mt-7 border-t border-[#eeedf1] pt-5">
          <p className="px-3 text-xs leading-5 text-[#77788d]">
            Keep your catalog and orders up to date.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveView("products");
              onAdminNavClose?.();
              startCreate();
            }}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#353793] px-4 text-sm font-semibold text-white transition hover:bg-[#292b78]"
          >
            <Plus size={17} /> Add product
          </button>
        </div>
      </aside>
      <div
        role="region"
        aria-label="Admin dashboard content"
        className="h-full overflow-y-auto px-4 py-6 sm:px-6 lg:ml-64 lg:px-8"
      >
        <div className="mx-auto max-w-[1250px]">
          <div
            id="catalog"
            className="mb-8 flex flex-wrap items-end justify-between gap-4"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#77788d]">
                Brisk Lifestyles · Admin
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {activeView === "dashboard"
                  ? "Dashboard"
                  : activeView === "orders"
                    ? "Customer orders"
                    : activeView === "users"
                      ? "Users"
                      : "Products"}
              </h1>
              <p className="mt-2 text-sm text-[#77788d]">
                {activeView === "orders"
                  ? "Review and manage customer orders."
                  : activeView === "users"
                    ? "View account profiles and purchase activity."
                    : "Manage your catalog, pricing and availability."}
              </p>
            </div>
            {(activeView === "dashboard" || activeView === "products") && (
              <button
                onClick={startCreate}
                className="rounded-full bg-[#353793] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#27296f]"
              >
                ＋ Add product
              </button>
            )}
          </div>
          {activeView === "dashboard" && (
            <section
              aria-label="Store overview"
              className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <article className="flex min-h-32 items-center justify-between rounded-2xl border border-[#e8e7ed] bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm text-[#77788d]">Total products</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#20213d]">
                    {stats ? stats.total_products : "..."}
                  </p>
                  <p className="mt-1 text-xs text-[#77788d]">In your catalog</p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f0f0f7] text-[#353793]">
                  <Package size={22} />
                </span>
              </article>
              <article className="flex min-h-32 items-center justify-between rounded-2xl border border-[#e8e7ed] bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm text-[#77788d]">Total payments</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#20213d]">
                    {stats
                      ? `BDT ${Number(stats.total_payments).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`
                      : "Loading..."}
                  </p>
                  <p className="mt-1 text-xs text-[#77788d]">
                    Paid and fulfilled orders
                  </p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CreditCard size={22} />
                </span>
              </article>
              <article className="flex min-h-32 items-center justify-between rounded-2xl border border-[#e8e7ed] bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm text-[#77788d]">Cancelled orders</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#20213d]">
                    {stats ? stats.cancelled_orders : "..."}
                  </p>
                  <p className="mt-1 text-xs text-[#77788d]">
                    All-time cancelled
                  </p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                  <Ban size={22} />
                </span>
              </article>
              <article className="flex min-h-32 items-center justify-between rounded-2xl border border-[#e8e7ed] bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm text-[#77788d]">Total users</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#20213d]">
                    {stats ? stats.total_users : "..."}
                  </p>
                  <p className="mt-1 text-xs text-[#77788d]">
                    Registered accounts
                  </p>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                  <UsersRound size={22} />
                </span>
              </article>
            </section>
          )}
          {(activeView === "dashboard" || activeView === "orders") && (
            <section
              id="orders"
              className="mb-8 scroll-mt-5 rounded-2xl border border-[#e8e7ed] bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold">Customer orders</h2>
                  <p className="mt-1 text-sm text-[#77788d]">
                    Review order details and update pending order status.
                  </p>
                </div>
                <span className="text-sm text-[#77788d]">
                  {orders.filter((order) => order.status === "pending").length}{" "}
                  pending
                </span>
              </div>
              {loading ? (
                <p className="py-8 text-center text-sm text-[#77788d]">
                  Loading orders...
                </p>
              ) : orders.length ? (
                <div className="grid gap-3">
                  {pagedOrders.map((order) => {
                    const address = order.delivery_address || {};
                    const statusLabel =
                      {
                        paid: "Success",
                        cancelled: "Cancelled",
                        fulfilled: "Completed",
                        pending: "Pending",
                      }[order.status] || order.status;
                    return (
                      <article
                        key={order.id}
                        className="rounded-xl border border-[#eeedf1] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">
                              Order {order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="mt-1 text-xs text-[#77788d]">
                              {new Date(order.created_at).toLocaleString(
                                "en-BD",
                              )}{" "}
                              ·{" "}
                              {order.payment_method === "cod"
                                ? "Cash on delivery"
                                : order.payment_method}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#f4f3f8] px-3 py-1 text-xs font-semibold text-[#353793]">
                            {statusLabel}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                          <p>
                            <b>Customer:</b>{" "}
                            {order.customer_name ||
                              order.account_name ||
                              "Customer"}
                          </p>
                          <p>
                            <b>Email:</b> {order.email}
                          </p>
                          <p>
                            <b>Phone:</b> {order.phone || "Not provided"}
                          </p>
                          <p>
                            <b>Delivery:</b>{" "}
                            {[address.address, address.city, address.postalCode]
                              .filter(Boolean)
                              .join(", ") || "Not provided"}
                          </p>
                        </div>
                        {address.notes && (
                          <p className="mt-1 text-sm">
                            <b>Delivery notes:</b> {address.notes}
                          </p>
                        )}
                        <ul className="mt-3 grid gap-1 border-t border-[#eeedf1] pt-3 text-sm">
                          {order.items.map((item, index) => (
                            <li
                              key={`${item.productId}-${index}`}
                              className="flex flex-wrap justify-between gap-2"
                            >
                              <span>
                                {item.name || "Product"}
                                {item.size ? ` · Size ${item.size}` : ""} ×{" "}
                                {item.quantity}
                              </span>
                              <span className="text-[#77788d]">
                                {money(Number(item.unitPrice) * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeedf1] pt-3">
                          <b>Total {money(order.subtotal_taka)}</b>
                          {order.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                disabled={orderUpdating === order.id}
                                onClick={() =>
                                  setOrderConfirmation({ order, status: "paid" })
                                }
                                className="rounded-full bg-[#353793] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                              >
                                Mark successful
                              </button>
                              <button
                                disabled={orderUpdating === order.id}
                                onClick={() =>
                                  setOrderConfirmation({
                                    order,
                                    status: "cancelled",
                                  })
                                }
                                className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-60"
                              >
                                Cancel order
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-[#77788d]">
                  No orders yet.
                </p>
              )}
              {!loading && orders.length > 0 && (
                <Pagination
                  page={orderPage}
                  count={orders.length}
                  onChange={setOrderPage}
                />
              )}
            </section>
          )}
          {(activeView === "dashboard" || activeView === "products") && (
            <div className="space-y-1">
              <form
                id="categories"
                onSubmit={addCategory}
                className="mb-6 scroll-mt-5 grid gap-3 rounded-2xl border border-[#e8e7ed] bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  required
                  maxLength="120"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="New category name"
                  aria-label="New category name"
                  className="h-11 rounded-xl border border-[#e4e3e9] px-4 text-sm"
                />
                <input
                  maxLength="500"
                  value={categoryDescription}
                  onChange={(event) =>
                    setCategoryDescription(event.target.value)
                  }
                  placeholder="Description (optional)"
                  aria-label="Category description"
                  className="h-11 rounded-xl border border-[#e4e3e9] px-4 text-sm"
                />
                <button
                  disabled={categorySaving}
                  className="rounded-full bg-[#353793] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {categorySaving ? "Adding..." : "Add category"}
                </button>
              </form>
              <div className="mb-6 grid gap-3 rounded-2xl border border-[#e8e7ed] bg-white p-4 sm:grid-cols-[1fr_220px]">
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setProductPage(1);
                  }}
                  placeholder="Search products by name or slug"
                  aria-label="Search products"
                  className="h-11 rounded-xl border border-[#e4e3e9] px-4 text-sm outline-none focus:border-[#353793]"
                />
                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setProductPage(1);
                  }}
                  aria-label="Filter by category"
                  className="h-11 rounded-xl border border-[#e4e3e9] bg-white px-4 text-sm"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4 flex items-center justify-between text-sm text-[#77788d]">
                <span>{products.length} products</span>
                <button
                  onClick={load}
                  className="font-semibold text-[#353793] hover:underline"
                >
                  Refresh list
                </button>
              </div>
              {loading ? (
                <div className="rounded-2xl border border-[#e8e7ed] bg-white p-12 text-center text-sm text-[#77788d]">
                  Loading products…
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-[#e8e7ed] bg-white p-12 text-center text-sm text-[#77788d]">
                  {products.length
                    ? "No products match your search."
                    : "No products yet. Add your first product to get started."}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[#e8e7ed] bg-white shadow-sm">
                  <div className="hidden lg:block">
                    <table className="w-full table-fixed text-left text-sm">
                      <thead className="bg-[#f9f9fb] text-[11px] uppercase tracking-wider text-[#77788d]">
                        <tr>
                          <th className="w-[34%] px-4 py-4">Product</th>
                          <th className="w-[14%] px-3 py-4">Category</th>
                          <th className="w-[13%] px-3 py-4">Price</th>
                          <th className="w-[12%] px-3 py-4">Sizes</th>
                          <th className="w-[13%] px-3 py-4">Status</th>
                          <th className="w-[14%] px-3 py-4 text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eeedf1]">
                        {pagedProducts.map((item) => (
                          <tr key={item.id} className="hover:bg-[#fbfbfd]">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt=""
                                    className="h-12 w-12 rounded-xl border border-[#eeedf1] object-cover"
                                  />
                                ) : (
                                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#f1f0f8] text-xl">
                                    ◇
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-[#191943]">
                                    {item.name}
                                  </p>
                                  <p className="mt-1 max-w-[270px] truncate text-xs text-[#85869b]">
                                    {item.slug} ·{" "}
                                    {item.description || "No description"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 capitalize">
                              {item.category.replaceAll("-", " ")}
                            </td>
                            <td className="px-4 py-4">
                              <b>{money(item.price_taka)}</b>
                              {item.compare_at_price_taka != null && (
                                <p className="mt-1 text-xs text-[#85869b]">
                                  <s>{money(item.compare_at_price_taka)}</s>
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-4 text-[#77788d]">
                              {item.sizes?.length ? item.sizes.join(", ") : "—"}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.is_active && item.in_stock ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}
                              >
                                {!item.is_active
                                  ? "Archived"
                                  : item.in_stock
                                    ? "In stock"
                                    : "Out of stock"}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => startEdit(item)}
                                  className="rounded-full border border-[#dedde7] px-3 py-2 text-xs font-bold hover:bg-[#f4f3f8]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  className="rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="divide-y divide-[#eeedf1] lg:hidden">
                    {pagedProducts.map((item) => (
                      <li key={item.id} className="min-w-0 p-4 sm:p-5">
                        <div className="flex min-w-0 items-start gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-xl border border-[#eeedf1] object-cover"
                            />
                          ) : (
                            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#f1f0f8] text-xl">
                              ◇
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-bold text-[#191943]">
                              {item.name}
                            </p>
                            <p className="mt-1 break-all text-xs text-[#85869b]">
                              {item.slug}
                            </p>
                            <p className="mt-1 text-xs capitalize text-[#77788d]">
                              {item.category.replaceAll("-", " ")}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${item.is_active && item.in_stock ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}
                          >
                            {!item.is_active
                              ? "Archived"
                              : item.in_stock
                                ? "In stock"
                                : "Out of stock"}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                          <div className="text-sm">
                            <b>{money(item.price_taka)}</b>
                            {item.compare_at_price_taka != null && (
                              <span className="ml-2 text-xs text-[#85869b]">
                                <s>{money(item.compare_at_price_taka)}</s>
                              </span>
                            )}
                            <p className="mt-1 text-xs text-[#77788d]">
                              Sizes:{" "}
                              {item.sizes?.length ? item.sizes.join(", ") : "—"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="rounded-full border border-[#dedde7] px-3 py-2 text-xs font-bold hover:bg-[#f4f3f8]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!loading && filtered.length > 0 && (
                <Pagination
                  page={productPage}
                  count={filtered.length}
                  onChange={setProductPage}
                />
              )}
            </div>
          )}
          {activeView === "users" && (
            <section
              aria-labelledby="users-heading"
              className="rounded-2xl border border-[#e8e7ed] bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 id="users-heading" className="text-xl font-extrabold">
                    Users
                  </h2>
                  <p className="mt-1 text-sm text-[#77788d]">
                    Registered accounts and their order activity.
                  </p>
                </div>
                <label className="grid gap-1 text-xs font-semibold text-[#55566c]">
                  Search users
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Name or email"
                    className="h-10 w-full rounded-xl border border-[#e4e3e9] px-3 text-sm font-normal sm:w-64"
                  />
                </label>
              </div>
              <p className="mb-3 text-xs text-[#77788d]">
                Showing {filteredUsers.length} of {users.length} accounts
              </p>
              {loading ? (
                <p className="py-10 text-center text-sm text-[#77788d]">
                  Loading users…
                </p>
              ) : filteredUsers.length ? (
                <ul className="grid gap-3">
                  {filteredUsers.map((account) => (
                    <li
                      key={account.id}
                      className="flex min-w-0 flex-col gap-4 rounded-xl border border-[#eeedf1] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f0f0f7] text-sm font-bold text-[#353793]">
                          {(account.display_name || "U")
                            .slice(0, 1)
                            .toUpperCase()}
                          {account.avatar_url && (
                            <img
                              src={account.avatar_url}
                              alt=""
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#292a49]">
                            {account.display_name}
                          </p>
                          <p className="truncate text-xs text-[#77788d]">
                            {account.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${account.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {account.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="rounded-full bg-[#f4f3f8] px-3 py-1 text-xs font-semibold capitalize text-[#55566c]">
                          {account.role}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${Number(account.products_purchased) ? "bg-indigo-50 text-[#353793]" : "bg-slate-100 text-slate-600"}`}
                        >
                          {Number(account.products_purchased)
                            ? `${account.products_purchased} ${Number(account.products_purchased) === 1 ? "item" : "items"} purchased`
                            : "No purchases"}
                        </span>
                        <span className="text-xs text-[#77788d]">
                          {account.order_count}{" "}
                          {Number(account.order_count) === 1
                            ? "order"
                            : "orders"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-10 text-center text-sm text-[#77788d]">
                  No users match your search.
                </p>
              )}
            </section>
          )}{" "}
          {editor && (
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-[#17173f66] p-0 sm:items-center sm:p-5"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setEditor(null);
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-editor-title"
                className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#77788d]">
                      Catalog
                    </p>
                    <h2
                      id="product-editor-title"
                      className="mt-1 text-2xl font-extrabold"
                    >
                      {editor === "create" ? "Add a product" : "Edit product"}
                    </h2>
                  </div>
                  <button
                    aria-label="Close form"
                    onClick={() => setEditor(null)}
                    className="rounded-full bg-[#f3f2f7] px-3 py-2 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["name", "Product name", "text", true],
                    ["slug", "URL slug", "text", true],
                    ["price", "Price (৳)", "number", true],
                    ["comparePrice", "Compare-at price (৳)", "number", false],
                    ["imageUrl", "Image URL (HTTPS)", "url", false],
                  ].map(([key, label, type, required]) => (
                    <label
                      key={key}
                      className={`grid gap-1.5 text-xs font-semibold text-[#55566e] ${key === "imageUrl" ? "sm:col-span-2" : ""}`}
                    >
                      {label}
                      <input
                        required={required}
                        type={type}
                        min={type === "number" ? "0" : undefined}
                        step={type === "number" ? "0.01" : undefined}
                        value={form[key]}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [key]: event.target.value,
                            ...(key === "name" &&
                            editor === "create" &&
                            !form.slug
                              ? { slug: slugify(event.target.value) }
                              : {}),
                          })
                        }
                        className="h-11 rounded-xl border border-[#e4e3e9] px-3 text-sm font-normal text-[#191943] outline-none focus:border-[#353793]"
                      />
                    </label>
                  ))}
                  <label className="grid gap-1.5 text-xs font-semibold text-[#55566e]">
                    Category
                    <select
                      required
                      value={form.category}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          category: event.target.value,
                          sizes: /fragrance|perfume|attar|scent/i.test(
                            event.target.value,
                          )
                            ? ""
                            : form.sizes,
                        })
                      }
                      className="h-11 rounded-xl border border-[#e4e3e9] bg-white px-3 text-sm font-normal text-[#191943]"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!/fragrance|perfume|attar|scent/i.test(form.category) && (
                    <label className="grid gap-1.5 text-xs font-semibold text-[#55566e]">
                      <div className="flex">
                        Sizes{" "}
                        <span className="text-[11px] font-normal text-[#85869b]">
                          ( Separate sizes with commas )
                        </span>
                      </div>
                      <input
                        value={form.sizes}
                        onChange={(event) =>
                          setForm({ ...form, sizes: event.target.value })
                        }
                        placeholder="S, M, L, XL"
                        className="h-11 rounded-xl border border-[#e4e3e9] px-3 text-sm font-normal text-[#191943]"
                      />
                    </label>
                  )}
                  {!/fragrance|perfume|attar|scent/i.test(form.category) &&
                    form.sizes
                      .split(",")
                      .map((value) => value.trim().toUpperCase())
                      .filter(Boolean)
                      .map((size) => (
                        <label
                          key={size}
                          className="grid gap-1.5 text-xs font-semibold text-[#55566e]"
                        >
                          Quantity for size {size}
                          <input
                            type="number"
                            min="0"
                            max="100000"
                            step="1"
                            value={form.stockBySize[size] ?? 0}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                stockBySize: {
                                  ...form.stockBySize,
                                  [size]: event.target.value,
                                },
                              })
                            }
                            className="h-11 rounded-xl border border-[#e4e3e9] px-3 text-sm font-normal text-[#191943]"
                          />
                        </label>
                      ))}
                  <label className="grid gap-1.5 text-xs font-semibold text-[#55566e] sm:col-span-2">
                    Description
                    <textarea
                      rows="3"
                      maxLength="5000"
                      value={form.description}
                      onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                      }
                      className="rounded-xl border border-[#e4e3e9] p-3 text-sm font-normal text-[#191943] outline-none focus:border-[#353793]"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(event) =>
                        setForm({ ...form, inStock: event.target.checked })
                      }
                      className="h-4 w-4 accent-[#353793]"
                    />{" "}
                    Available in stock
                  </label>
                  <div className="flex justify-end gap-3 border-t border-[#eeedf1] pt-5 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setEditor(null)}
                      className="rounded-full border border-[#dedde7] px-5 py-3 text-sm font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={saving}
                      className="rounded-full bg-[#353793] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {saving
                        ? "Saving…"
                        : editor === "create"
                          ? "Create product"
                          : "Save changes"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
          {deleteTarget && (
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-[#17173f]/50 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !deleting)
                  setDeleteTarget(null);
              }}
            >
              <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-product-title"
                aria-describedby="delete-product-description"
                className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-8"
              >
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-xl text-red-600">
                  <Ban size={22} aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-red-600">
                  Delete product
                </p>
                <h2 id="delete-product-title" className="mt-2 text-2xl font-extrabold text-[#20213d]">
                  Are you sure?
                </h2>
                <p id="delete-product-description" className="mt-3 break-words text-sm leading-6 text-[#77788d]">
                  Delete <span className="font-bold text-[#292a49]">{deleteTarget.name}</span>? This product will be hidden from your storefront.
                </p>
                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setDeleteTarget(null)}
                    className="rounded-full border border-[#dedde7] px-5 py-3 text-sm font-bold text-[#55566c] transition hover:bg-[#f7f7f9] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={remove}
                    className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    {deleting ? "Deleting…" : "Confirm delete"}
                  </button>
                </div>
              </section>
            </div>
          )}
          {orderConfirmation && (
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-[#17173f]/50 p-4 backdrop-blur-sm"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !orderUpdating)
                  setOrderConfirmation(null);
              }}
            >
              <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="order-confirmation-title"
                aria-describedby="order-confirmation-description"
                className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-8"
              >
                <div
                  className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${orderConfirmation.status === "cancelled" ? "bg-red-50 text-red-600" : "bg-indigo-50 text-[#353793]"}`}
                >
                  {orderConfirmation.status === "cancelled" ? (
                    <Ban size={22} aria-hidden="true" />
                  ) : (
                    <CreditCard size={22} aria-hidden="true" />
                  )}
                </div>
                <p
                  className={`text-xs font-bold uppercase tracking-[.16em] ${orderConfirmation.status === "cancelled" ? "text-red-600" : "text-[#353793]"}`}
                >
                  Update order
                </p>
                <h2
                  id="order-confirmation-title"
                  className="mt-2 text-2xl font-extrabold text-[#20213d]"
                >
                  {orderConfirmation.status === "cancelled"
                    ? "Cancel this order?"
                    : "Mark as successful?"}
                </h2>
                <p
                  id="order-confirmation-description"
                  className="mt-3 break-words text-sm leading-6 text-[#77788d]"
                >
                  Order {orderConfirmation.order.id.slice(0, 8).toUpperCase()} for{" "}
                  <span className="font-bold text-[#292a49]">
                    {orderConfirmation.order.customer_name ||
                      orderConfirmation.order.account_name ||
                      "Customer"}
                  </span>
                  {orderConfirmation.status === "cancelled"
                    ? " will be cancelled."
                    : " will be marked as successful."}
                </p>
                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={Boolean(orderUpdating)}
                    onClick={() => setOrderConfirmation(null)}
                    className="rounded-full border border-[#dedde7] px-5 py-3 text-sm font-bold text-[#55566c] transition hover:bg-[#f7f7f9] disabled:opacity-60"
                  >
                    Keep order
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(orderUpdating)}
                    onClick={() =>
                      updateOrderStatus(
                        orderConfirmation.order,
                        orderConfirmation.status,
                      )
                    }
                    className={`rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm transition disabled:cursor-wait disabled:opacity-60 ${orderConfirmation.status === "cancelled" ? "bg-red-600 hover:bg-red-700" : "bg-[#353793] hover:bg-[#292b78]"}`}
                  >
                    {orderUpdating
                      ? "Updating…"
                      : orderConfirmation.status === "cancelled"
                        ? "Confirm cancellation"
                        : "Confirm successful"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
