import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { apiRequest } from "../services/api.js";
import { useProducts } from "../services/products.jsx";

const emptyProduct = {
  slug: "",
  name: "",
  category: "",
  description: "",
  price: "",
  comparePrice: "",
  imageUrl: "",
  sizes: "",
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
  return {
    slug: slugify(form.slug || form.name),
    name: form.name.trim(),
    category: form.category,
    description: form.description.trim(),
    price_taka: price,
    compare_at_price_taka: compare,
    image_url: form.imageUrl.trim() || null,
    sizes: /fragrance|perfume|attar|scent/i.test(form.category) ? [] : form.sizes
      .toUpperCase()
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean),
    in_stock: form.inStock,
  };
}

export default function AdminDashboard({ user }) {
  const { refreshProducts } = useProducts();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderUpdating, setOrderUpdating] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [items, categoryItems, orderItems] = await Promise.all([
        apiRequest("/products/admin?limit=100"),
        apiRequest("/categories"),
        apiRequest("/orders/admin"),
      ]);
      setProducts(items);
      setCategories(categoryItems);
      setOrders(orderItems);
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
        body: JSON.stringify({ name, slug: slugify(name), description: categoryDescription.trim() }),
      });
      setCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryName("");
      setCategoryDescription("");
      setForm((current) => ({ ...current, category: category.slug, sizes: /fragrance|perfume|attar|scent/i.test(category.slug) ? "" : current.sizes }));
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
      await refreshProducts();
      setEditor(null);
      toast.success(editor === "create" ? "Product created." : "Product updated.");
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (item) => {
    if (
      !window.confirm(
        `Delete “${item.name}”? This hides it from the storefront.`,
      )
    )
      return;
    try {
      await apiRequest(`/products/${item.id}`, { method: "DELETE" });
      setProducts((current) =>
        current.filter((product) => product.id !== item.id),
      );
      await refreshProducts();
      toast.success(`${item.name} deleted.`);
    } catch (requestError) {
      toast.error(requestError.message);
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
      toast.success(
        status === "paid" ? "Order marked successful." : "Order cancelled.",
      );
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setOrderUpdating("");
    }
  };

  return (
    <div className="min-h-[75vh] bg-[#f6f6f9] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1250px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#77788d]">
              Brisk Lifestyles · Admin
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Product management
            </h1>
            <p className="mt-2 text-sm text-[#77788d]">
              Manage your catalog, pricing and availability.
            </p>
          </div>
          <button
            onClick={startCreate}
            className="rounded-full bg-[#353793] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#27296f]"
          >
            ＋ Add product
          </button>
        </div>
        <section className="mb-8 rounded-2xl border border-[#e8e7ed] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold">Customer orders</h2>
              <p className="mt-1 text-sm text-[#77788d]">
                Review order details and update pending order status.
              </p>
            </div>
            <span className="text-sm text-[#77788d]">
              {orders.filter((order) => order.status === "pending").length} pending
            </span>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-[#77788d]">Loading orders...</p>
          ) : orders.length ? (
            <div className="grid gap-3">
              {orders.map((order) => {
                const address = order.delivery_address || {};
                const statusLabel = {
                  paid: "Success",
                  cancelled: "Cancelled",
                  fulfilled: "Completed",
                  pending: "Pending",
                }[order.status] || order.status;
                return (
                  <article key={order.id} className="rounded-xl border border-[#eeedf1] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">Order {order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="mt-1 text-xs text-[#77788d]">
                          {new Date(order.created_at).toLocaleString("en-BD")} · {order.payment_method === "cod" ? "Cash on delivery" : order.payment_method}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#f4f3f8] px-3 py-1 text-xs font-semibold text-[#353793]">
                        {statusLabel}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                      <p><b>Customer:</b> {order.customer_name || order.account_name || "Customer"}</p>
                      <p><b>Email:</b> {order.email}</p>
                      <p><b>Phone:</b> {order.phone || "Not provided"}</p>
                      <p><b>Delivery:</b> {[address.address, address.city, address.postalCode].filter(Boolean).join(", ") || "Not provided"}</p>
                    </div>
                    {address.notes && <p className="mt-1 text-sm"><b>Delivery notes:</b> {address.notes}</p>}
                    <ul className="mt-3 grid gap-1 border-t border-[#eeedf1] pt-3 text-sm">
                      {order.items.map((item, index) => (
                        <li key={`${item.productId}-${index}`} className="flex flex-wrap justify-between gap-2">
                          <span>{item.name || "Product"}{item.size ? ` · Size ${item.size}` : ""} × {item.quantity}</span>
                          <span className="text-[#77788d]">{money(Number(item.unitPrice) * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeedf1] pt-3">
                      <b>Total {money(order.subtotal_taka)}</b>
                      {order.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            disabled={orderUpdating === order.id}
                            onClick={() => updateOrderStatus(order, "paid")}
                            className="rounded-full bg-[#353793] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                          >
                            Mark successful
                          </button>
                          <button
                            disabled={orderUpdating === order.id}
                            onClick={() => updateOrderStatus(order, "cancelled")}
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
            <p className="py-8 text-center text-sm text-[#77788d]">No orders yet.</p>
          )}
        </section>
        <form onSubmit={addCategory} className="mb-6 grid gap-3 rounded-2xl border border-[#e8e7ed] bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
          <input required maxLength="120" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="New category name" aria-label="New category name" className="h-11 rounded-xl border border-[#e4e3e9] px-4 text-sm" />
          <input maxLength="500" value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="Description (optional)" aria-label="Category description" className="h-11 rounded-xl border border-[#e4e3e9] px-4 text-sm" />
          <button disabled={categorySaving} className="rounded-full bg-[#353793] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{categorySaving ? "Adding..." : "Add category"}</button>
        </form>
        <div className="mb-6 grid gap-3 rounded-2xl border border-[#e8e7ed] bg-white p-4 sm:grid-cols-[1fr_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products by name or slug"
            aria-label="Search products"
            className="h-11 rounded-xl border border-[#e4e3e9] px-4 text-sm outline-none focus:border-[#353793]"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
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
                    <th className="w-[14%] px-3 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeedf1]">
                  {filtered.map((item) => (
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
                            onClick={() => remove(item)}
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
              {filtered.map((item) => (
                <li key={item.id} className="min-w-0 p-4 sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-[#eeedf1] object-cover" />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#f1f0f8] text-xl">◇</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-bold text-[#191943]">{item.name}</p>
                      <p className="mt-1 break-all text-xs text-[#85869b]">{item.slug}</p>
                      <p className="mt-1 text-xs capitalize text-[#77788d]">{item.category.replaceAll("-", " ")}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${item.is_active && item.in_stock ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
                      {!item.is_active ? "Archived" : item.in_stock ? "In stock" : "Out of stock"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <div className="text-sm">
                      <b>{money(item.price_taka)}</b>
                      {item.compare_at_price_taka != null && <span className="ml-2 text-xs text-[#85869b]"><s>{money(item.compare_at_price_taka)}</s></span>}
                      <p className="mt-1 text-xs text-[#77788d]">Sizes: {item.sizes?.length ? item.sizes.join(", ") : "—"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(item)} className="rounded-full border border-[#dedde7] px-3 py-2 text-xs font-bold hover:bg-[#f4f3f8]">Edit</button>
                      <button onClick={() => remove(item)} className="rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Delete</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
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
                      setForm({ ...form, category: event.target.value, sizes: /fragrance|perfume|attar|scent/i.test(event.target.value) ? "" : form.sizes })
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
                {!/fragrance|perfume|attar|scent/i.test(form.category) && <label className="grid gap-1.5 text-xs font-semibold text-[#55566e]">
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
                </label>}
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
      </div>
    </div>
  );
}
