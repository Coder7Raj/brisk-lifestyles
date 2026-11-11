import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiRequest } from "../services/api.js";

const money = (value) =>
  String.fromCharCode(2547) + Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const paymentLabel = (value) =>
  value === "mobile-banking" ? "Mobile banking" : "Cash on delivery";

function Pagination({ page, count, onChange }) {
  const pages = Math.ceil(count / 10);
  if (pages <= 1) return null;
  return <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-3 text-sm">
    <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-full border px-4 py-2 disabled:opacity-40">Previous</button>
    <span className="text-[#77788d]">Page {page} of {pages}</span>
    <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-full border px-4 py-2 disabled:opacity-40">Next</button>
  </nav>;
}

export default function AccountDashboard({
  user,
  cart,
  wishlist,
  onProfileUpdated,
}) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(Boolean(user));
  const [ordersPage, setOrdersPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [cartPage, setCartPage] = useState(1);

  useEffect(() => {
    setDisplayName(user?.displayName || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user?.displayName, user?.avatarUrl]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    let active = true;
    setOrdersLoading(true);
    apiRequest("/orders/mine")
      .then((items) => {
        if (active) setOrders(items);
      })
      .catch((error) => {
        if (active) toast.error(error.message);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await apiRequest("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: displayName.trim(),
          avatarUrl: avatarUrl.trim() || null,
        }),
      });
      onProfileUpdated(result.user);
      setEditing(false);
      toast.success("Your profile has been updated.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user)
    return (
      <section className="mx-auto min-h-[55vh] max-w-3xl px-5 py-20 text-center">
        <h1 className="text-3xl font-extrabold text-[#191943]">
          Sign in to view your account
        </h1>
        <p className="mt-3 text-sm text-[#77788d]">
          Your profile, wishlist, bag and order activity are available after you
          sign in.
        </p>
        <a
          className="mt-6 inline-block rounded-full bg-[#353793] px-6 py-3 font-bold text-white"
          href="/login"
        >
          Sign in
        </a>
      </section>
    );

  return (
    <div className="mx-auto min-h-[65vh] max-w-[1100px] px-4 py-10 sm:px-7">
      <p className="text-xs text-[#77788d]">
        <a href="/">Home</a> / My account
      </p>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#77788d]">
            Your account
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#191943]">
            Welcome, {user.displayName}
          </h1>
        </div>
        {!editing && (
          <button
            onClick={() => {
              setEditing(true);
            }}
            className="rounded-full bg-[#353793] px-5 py-3 text-sm font-bold text-white"
          >
            Update profile
          </button>
        )}
      </div>

      <section className="mt-6 rounded-2xl border border-[#e8e7ed] bg-white p-5 sm:p-7">
        <h2 className="text-lg font-bold text-[#191943]">
          Profile information
        </h2>
        {editing ? (
          <form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:max-w-xl">
            <label className="grid gap-1.5 text-sm font-semibold text-[#55566e]">
              Name
              <input
                required
                minLength={2}
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-11 rounded-xl border border-[#e4e3e9] px-3 font-normal text-[#191943]"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#55566e]">
              Email (cannot be changed here)
              <input
                type="email"
                value={user.email}
                readOnly
                className="h-11 rounded-xl border border-[#e4e3e9] bg-[#f8f8fa] px-3 font-normal text-[#77788d]"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#55566e]">
              Profile image URL
              <input
                type="url"
                maxLength={2048}
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
                className="h-11 rounded-xl border border-[#e4e3e9] px-3 font-normal text-[#191943]"
              />
            </label>
            <div className="flex gap-3">
              <button
                disabled={saving}
                className="rounded-full bg-[#353793] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDisplayName(user.displayName);
                  setAvatarUrl(user.avatarUrl || "");
                }}
                className="rounded-full border border-[#dedde7] px-5 py-3 text-sm font-bold text-[#353793]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full border border-[#e8e7ed] object-cover"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#eeeff9] text-xl font-bold text-[#353793]">
                {user.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <dl className="grid gap-2 text-sm sm:grid-cols-2 sm:gap-x-12">
              <div>
                <dt className="text-xs text-[#77788d]">Name</dt>
                <dd className="font-semibold text-[#191943]">
                  {user.displayName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#77788d]">Email</dt>
                <dd className="font-semibold text-[#191943]">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#77788d]">Account type</dt>
                <dd className="font-semibold capitalize text-[#191943]">
                  {user.role}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e8e7ed] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#191943]">Wishlist</h2>
            <a
              href="/wishlist"
              className="text-sm font-semibold text-[#353793] underline"
            >
              {wishlist.length} saved
            </a>
          </div>
          {wishlist.length ? (
            <>
            <ul className="mt-4 divide-y divide-[#eeedf1]">
              {wishlist.slice((wishlistPage - 1) * 10, wishlistPage * 10).map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#eeeff9] text-xs font-bold text-[#353793]">
                      {item.name.slice(0, 1)}
                    </div>
                  )}
                  <a
                    href={`/product/${item.slug}`}
                    className="min-w-0 flex-1 truncate text-sm font-semibold text-[#191943]"
                  >
                    {item.name}
                  </a>
                  <span className="text-sm font-bold text-[#353793]">
                    {money(item.price)}
                  </span>
                </li>
              ))}
            </ul>
            <Pagination page={wishlistPage} count={wishlist.length} onChange={setWishlistPage} />
            </>
          ) : (
            <p className="mt-4 text-sm text-[#77788d]">
              Your wishlist is empty. Save items you like and they will show up
              here.
            </p>
          )}
        </section>
        <section className="rounded-2xl border border-[#e8e7ed] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#191943]">Your bag</h2>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-cart"))}
              className="text-sm font-semibold text-[#353793] underline"
            >
              {cart.length} {cart.length === 1 ? "item" : "items"}
            </button>
          </div>
          {cart.length ? (
            <>
            <ul className="mt-4 divide-y divide-[#eeedf1]">
              {cart.slice((cartPage - 1) * 10, cartPage * 10).map((item) => (
                <li
                  key={item.lineId}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="min-w-0 truncate font-semibold text-[#191943]">
                    {item.name}
                    {item.size
                      ? ` ${String.fromCharCode(183)} ${item.size}`
                      : ""}{" "}
                    ${String.fromCharCode(215)} {item.quantity || 1}
                  </span>
                  <b className="shrink-0 text-[#353793]">
                    {money(item.price * (item.quantity || 1))}
                  </b>
                </li>
              ))}
            </ul>
            <Pagination page={cartPage} count={cart.length} onChange={setCartPage} />
            </>
          ) : (
            <p className="mt-4 text-sm text-[#77788d]">
              Your bag is empty right now.
            </p>
          )}
          {cart.length > 0 && (
            <p className="mt-3 border-t border-[#eeedf1] pt-3 text-right text-sm font-bold text-[#191943]">
              Total:{" "}
              {money(
                cart.reduce(
                  (sum, item) => sum + item.price * (item.quantity || 1),
                  0,
                ),
              )}
            </p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[#e8e7ed] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#191943]">
              Orders & payments
            </h2>
            <p className="mt-1 text-xs text-[#77788d]">
              Order totals, status and saved payment method.
            </p>
          </div>
          <CreditCardIcon />
        </div>
        {ordersLoading ? (
          <p className="mt-5 text-sm text-[#77788d]">
            Loading your order history...
          </p>
        ) : orders.length ? (
          <>
          <div className="mt-4 grid gap-3">
            {orders.slice((ordersPage - 1) * 10, ordersPage * 10).map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-[#eeedf1] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b className="text-sm text-[#191943]">
                    Order {order.id.slice(0, 8).toUpperCase()}
                  </b>
                  <span className="rounded-full bg-[#f4f3f8] px-3 py-1 text-xs font-semibold capitalize text-[#353793]">
                    {{
                      paid: "Success",
                      cancelled: "Cancelled",
                      fulfilled: "Completed",
                    }[order.status] || order.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#77788d]">
                  {new Date(order.created_at).toLocaleDateString("en-BD")}{" "}
                  {String.fromCharCode(183)}{" "}
                  {paymentLabel(order.payment_method)}
                </p>
                <p className="mt-2 text-sm font-bold text-[#191943]">
                  {money(Number(order.subtotal_taka))}
                </p>
                {order.items?.length > 0 && (
                  <p className="mt-1 text-xs text-[#77788d]">
                    {order.items
                      .map(
                        (item) =>
                          `${item.name} ${String.fromCharCode(215)} ${item.quantity}`,
                      )
                      .join(", ")}
                  </p>
                )}
              </article>
            ))}
          </div>
          <Pagination page={ordersPage} count={orders.length} onChange={setOrdersPage} />
          </>
        ) : (
          <p className="mt-5 text-sm text-[#77788d]">
            No orders or payment records yet. Completed checkouts will appear
            here.
          </p>
        )}
        {!ordersLoading && orders.length > 0 && (
          <p className="mt-4 text-xs text-[#77788d]">
            This shop currently records checkout method and order status; online
            payment transactions are not processed here.
          </p>
        )}
      </section>
    </div>
  );
}

function CreditCardIcon() {
  return (
    <span aria-hidden="true" className="text-[#353793]">
      {String.fromCharCode(2547)}
    </span>
  );
}
