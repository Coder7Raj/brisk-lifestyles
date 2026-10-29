import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { routeForLabel } from "../routes/router.jsx";

const links = [
  ["Men", routeForLabel("Men")],
  ["Women", routeForLabel("Women")],
  ["Perfumes", routeForLabel("Perfumes")],
  ["Offers", routeForLabel("Offers")],
  ["New arrivals", routeForLabel("New arrivals")],
  ["Reviews", routeForLabel("Reviews")],
];
export default function Header({
  cartCount,
  wishlistCount,
  user,
  onCart,
  onSearch,
  onLogout,
}) {
  const [more, setMore] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => setAvatarFailed(false), [user?.avatarUrl]);
  return (
    <>
      <div className="hidden">
        Complimentary delivery on selected orders{" "}
        <a href={routeForLabel("Offers")}>Explore offers</a>
      </div>
      <header className="border-b border-[#e9e6df] bg-white px-[max(calc((100%-1250px)/2),7.4%)] max-[1100px]:px-[1%]">
        <div className="mx-auto grid h-[76px] max-w-[1250px] grid-cols-[1fr_minmax(280px,560px)_36px_40px_auto] items-center gap-[18px] max-[720px]:h-[64px] max-[720px]:grid-cols-[1fr_40px] max-[720px]:gap-2">
          <a
            className="inline-flex w-max items-baseline gap-[5px] text-[30px] font-extrabold tracking-[-.06em] text-[#37399a] max-[720px]:text-[22px]"
            href={routeForLabel("Home")}
            aria-label="Brisk Lifestyles home"
          >
            <span>Brisk</span>
            <i className="text-[18px] font-semibold text-[#e2b52a] max-[720px]:text-[13px]">
              Lifestyles
            </i>
          </a>
          <form
            className="flex h-[54px] items-center rounded-[30px] border border-[#e6e5eb] px-[18px] text-[#85869b] max-[720px]:hidden"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(e.currentTarget.elements.query.value);
            }}
          >
            <input
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#85869b] max-[720px]:text-[10px]"
              name="query"
              defaultValue={
                new URLSearchParams(window.location.search).get("q") || ""
              }
              placeholder="Search punjabi, perfume..."
              aria-label="Search products"
            />
            <button
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#353793] hover:bg-[#f3f2f8]"
              aria-label="Search"
              type="submit"
            >
              <Search size={17} />
            </button>
          </form>
          <a
            href={routeForLabel("Wishlist")}
            className="flex items-center gap-1 border-0 bg-transparent text-[#17173f] max-[720px]:hidden"
            aria-label="Wishlist"
          >
            <Heart size={18} />
            <span>{wishlistCount}</span>
          </a>
          <div className="relative max-[720px]:hidden">
            <button
              className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-[#e4e2df] bg-white text-[#37399a] max-[720px]:h-8 max-[720px]:w-8"
              aria-label={
                user
                  ? `Account for ${user.displayName}`
                  : "Sign in or create an account"
              }
              aria-expanded={accountOpen}
              aria-haspopup="dialog"
              onClick={() => setAccountOpen((open) => !open)}
            >
              {user?.avatarUrl && !avatarFailed ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.displayName} profile`}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <UserRound size={19} />
              )}
            </button>
            {accountOpen && (
              <div
                className="absolute right-0 top-[calc(100%+10px)] z-[50] grid w-[min(290px,88vw)] gap-2 rounded-2xl border border-[#e6e4e1] bg-white p-4 text-sm shadow-[0_16px_40px_#17173f25]"
                role="dialog"
                aria-label="Account options"
              >
                <button
                  className="absolute right-3 top-3 text-[#77788d]"
                  aria-label="Close account menu"
                  onClick={() => setAccountOpen(false)}
                >
                  <X size={17} />
                </button>
                {user ? (
                  <>
                    <b className="pr-7">{user.displayName}</b>
                    <span className="text-xs text-[#77788d]">{user.email}</span>
                    <button
                      className="mt-2 rounded-full bg-[#353793] px-4 py-2.5 font-semibold text-white"
                      onClick={() => {
                        setAccountOpen(false);
                        onLogout?.();
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <b>Welcome to Brisk Lifestyles</b>
                    <span className="text-xs text-[#77788d]">
                      Sign in or create an account to get started.
                    </span>
                    <a
                      className="mt-2 rounded-full bg-[#353793] px-4 py-2.5 text-center font-semibold text-white"
                      href={routeForLabel("Sign in")}
                      onClick={() => setAccountOpen(false)}
                    >
                      Sign in
                    </a>
                    <a
                      className="rounded-full border border-[#353793] px-4 py-2.5 text-center font-semibold text-[#353793]"
                      href="/register"
                      onClick={() => setAccountOpen(false)}
                    >
                      Create account
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            className="flex h-[54px] items-center gap-2.5 rounded-full bg-[#333799] px-6 text-[15px] text-white max-[720px]:hidden"
            onClick={onCart}
          >
            <ShoppingBag size={16} />
            <span>Cart</span>
            <b className="grid h-[17px] w-[17px] place-items-center rounded-full bg-[#f0c332] text-[10px] text-[#17173f]">
              {cartCount}
            </b>
          </button>
          <button
            className="hidden h-10 w-10 place-items-center rounded-full bg-[#333799] text-white max-[720px]:grid"
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      <nav
        className="sticky top-0 z-20 border-b border-[#e7e4dc] bg-[#fbfaf7]"
        aria-label="Shop categories"
      >
        <div
          className={`mx-auto flex min-h-[60px] max-w-[1250px] items-center gap-[30px] px-[10px] font-semibold text-[#191943] max-[1100px]:gap-[21px] max-[1100px]:px-[1%] max-[720px]:hidden max-[720px]:min-h-0 max-[720px]:flex-col max-[720px]:items-stretch max-[720px]:gap-0 max-[720px]:py-[10px] ${mobile ? "!flex" : ""}`}
        >
          {mobile && (
            <div className="hidden max-[720px]:grid max-[720px]:gap-3 max-[720px]:border-b max-[720px]:border-[#e5e2ee] max-[720px]:px-2 max-[720px]:pb-4">
              <div className="flex items-center gap-3 rounded-2xl bg-[#eeeff9] p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white bg-white text-[#37399a]">
                  {user?.avatarUrl && !avatarFailed ? (
                    <img src={user.avatarUrl} alt={`${user.displayName} profile`} className="h-full w-full object-cover" onError={() => setAvatarFailed(true)} />
                  ) : <UserRound size={22} />}
                </div>
                <div className="min-w-0 flex-1">
                  {user ? <><b className="block truncate text-sm text-[#191943]">{user.displayName}</b><span className="text-xs text-[#77788d]">{user.email}</span></> : <><b className="block text-sm text-[#191943]">Welcome to Brisk Lifestyles</b><span className="text-xs text-[#77788d]">Sign in to access your account.</span></>}
                </div>
                {user ? <button className="rounded-full border border-[#353793] px-3 py-2 text-xs font-semibold text-[#353793]" onClick={() => { setMobile(false); onLogout?.(); }}>Sign out</button> : <a className="rounded-full bg-[#353793] px-4 py-2.5 text-xs font-semibold text-white" href={routeForLabel("Sign in")} onClick={() => setMobile(false)}>Sign in</a>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-[#353793] px-3 py-3 text-sm font-semibold text-white" onClick={() => { setMobile(false); onCart(); }}><ShoppingBag size={17} />Cart <b className="grid h-5 w-5 place-items-center rounded-full bg-[#f0c332] text-[11px] text-[#17173f]">{cartCount}</b></button>
                <a className="flex items-center justify-center gap-2 rounded-xl bg-[#353793] px-3 py-3 text-sm font-semibold text-white" href={routeForLabel("Wishlist")} onClick={() => setMobile(false)}><Heart size={17} />Wishlist <b className="grid h-5 w-5 place-items-center rounded-full bg-[#f0c332] text-[11px] text-[#17173f]">{wishlistCount}</b></a>
              </div>
              <form className="flex h-11 items-center rounded-full border border-[#e6e5eb] bg-white px-4 text-[#85869b]" onSubmit={(e) => { e.preventDefault(); onSearch(e.currentTarget.elements.query.value); setMobile(false); }}>
                <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#85869b]" name="query" defaultValue={new URLSearchParams(window.location.search).get("q") || ""} placeholder="Search punjabi, perfume..." aria-label="Search products" />
                <button className="grid h-8 w-8 place-items-center rounded-full text-[#353793]" aria-label="Search" type="submit"><Search size={17} /></button>
              </form>
            </div>
          )}
          {links.map(([label, href]) => (
            <a
              className="text-[15px] text-[#191943] hover:text-[#37399a] max-[720px]:px-[6px] max-[720px]:py-[10px]"
              key={label}
              href={href}
              onClick={() => setMobile(false)}
            >
              {label}
            </a>
          ))}
          <div className="relative">
            <button
              className="flex items-center gap-1 border-0 bg-transparent text-[15px] font-semibold text-[#191943] hover:text-[#37399a] max-[720px]:px-[6px] max-[720px]:py-[10px]"
              aria-expanded={more}
              onClick={() => setMore(!more)}
            >
              More <ChevronDown size={14} />
            </button>
            {more && (
              <div className="absolute right-0 top-[calc(100%+14px)] z-30 grid min-w-[190px] rounded-[14px] border border-[#ebe8e1] bg-white p-[9px] shadow-[0_14px_35px_#17173f18] max-[720px]:static max-[720px]:border-0 max-[720px]:pl-[15px] max-[720px]:shadow-none">
                {[
                  ["Punjabi", routeForLabel("Punjabi")],
                  ["Pajama", routeForLabel("Pajama")],
                  ["Kurti", routeForLabel("Kurti")],
                  ["Accessories", routeForLabel("Accessories")],
                  ["Gift cards", routeForLabel("Gift cards")],
                  ["All categories", routeForLabel("All categories")],
                ].map(([label, href]) => (
                  <a
                    className="rounded-lg px-3 py-2.5 text-[15px] text-[#191943] hover:bg-[#f5f4fa] hover:text-[#37399a]"
                    key={label}
                    href={href}
                    onClick={() => setMore(false)}
                  >
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
