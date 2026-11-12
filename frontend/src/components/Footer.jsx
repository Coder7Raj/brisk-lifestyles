import { ArrowUpRight, MapPin } from "lucide-react";
import { routeForLabel } from "../routes/router.jsx";

const columns = [
  {
    title: "Shop",
    links: [
      ["Men’s collection", "Men"],
      ["Women’s collection", "Women"],
      ["Perfumes", "Perfumes"],
      ["New arrivals", "New arrivals"],
      ["Browse all categories", "All categories"],
    ],
  },
  {
    title: "Discover",
    links: [
      ["Special offers", "Offers"],
      ["Customer reviews", "Reviews"],
      ["Your wishlist", "Wishlist"],
    ],
  },
  {
    title: "Customer care",
    links: [
      ["My account", "Account"],
      ["Checkout & payment", "Checkout"],
      ["Sign in", "Sign in"],
    ],
  },
];

function Footer() {
  return (
    <footer className="mt-16 border-t border-[#e9e6df] bg-white text-[#292a49]">
      <div className="mx-auto grid max-w-[1250px] grid-cols-1 gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:gap-8 md:py-14 lg:px-0">
        <section className="max-w-sm">
          <a
            className="inline-flex w-max items-baseline gap-[5px] text-[28px] font-extrabold tracking-[-.06em] text-[#37399a]"
            href={routeForLabel("Home")}
            aria-label="Brisk Lifestyles home"
          >
            <span>Brisk</span>
            <i className="text-[17px] font-semibold not-italic text-[#d6ad2c]">
              Lifestyles
            </i>
          </a>
          <p className="mt-3 max-w-[340px] text-sm leading-6 text-[#68697b]">
            Everyday style, made for your moments. Discover thoughtful finds for
            every day and every occasion.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-[#55566c]">
            <a
              className="font-semibold text-[#37399a] transition-colors hover:text-[#292b78] hover:underline"
              href={routeForLabel("Account")}
            >
              Need help with an order? Visit your account
            </a>
            <span className="inline-flex items-center gap-2.5">
              <MapPin size={16} aria-hidden="true" />
              <span>Serving customers across Bangladesh</span>
            </span>
          </div>
        </section>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-4 text-sm font-bold text-[#20213d]">
              {column.title}
            </h2>
            <ul className="grid gap-3">
              {column.links.map(([label, route]) => (
                <li key={label}>
                  <a
                    className="text-sm text-[#68697b] transition-colors hover:text-[#37399a] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6ad2c]"
                    href={routeForLabel(route)}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-[#eeece7]">
        <div className="mx-auto flex max-w-[1250px] flex-col gap-3 px-5 py-5 text-xs text-[#77788a] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-0">
          <p>
            © {new Date().getFullYear()} Brisk Lifestyles. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>Prices in Bangladeshi taka (৳)</span>
            <span>Cash on delivery and online payment</span>
            <a
              className="inline-flex items-center gap-1 font-semibold text-[#37399a] hover:underline"
              href="#top"
            >
              Back to top <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
