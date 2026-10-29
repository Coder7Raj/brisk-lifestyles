import { Heart } from "lucide-react";
import { useState } from "react";
import ProductArt from "./ProductArt.jsx";

export default function ProductCard({
  product,
  onAdd,
  saved = false,
  onWishlistToggle,
}) {
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");
  const add = () => {
    if (product.sizes.length && !size) {
      setMessage("Choose a size first");
      return;
    }
    onAdd(product, size);
    setMessage("Added to your bag");
  };
  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-[#e4e2df] bg-white transition duration-300 hover:-translate-y-[7px] hover:shadow-[0_18px_35px_#19194318]">
      <div className="relative h-[300px] overflow-hidden bg-[#20216b] max-[1100px]:h-[260px] max-[720px]:h-[clamp(180px,58vw,280px)]">
        <ProductArt {...product} />
        <span className="absolute left-3 top-3 z-10 rounded-xl bg-[#f0c332] px-[9px] py-[5px] text-[9px] font-extrabold text-[#1c1c3f]">
          {product.badge}
        </span>
        <button
          className={`absolute right-3 top-3 z-10 grid h-[34px] w-[34px] place-items-center rounded-full border-0 bg-white text-[#4a4b81] ${saved ? "text-[#cf4563]" : ""}`}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => onWishlistToggle?.(product)}
        >
          <Heart size={16} fill={saved ? "currentColor" : "none"} />
        </button>
        <a
          className="absolute bottom-0 left-0 right-0 z-10 grid h-[35px] place-items-center bg-[#37399aeb] text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100 max-[720px]:opacity-100"
          href={`/product/${product.id}`}
        >
          View details
        </a>
      </div>
      <div className="p-3 max-[720px]:p-[9px]">
        <h3 className="mb-2 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-bold max-[720px]:text-[11px]">
          {product.name}
        </h3>
        <div className="flex items-center gap-[6px] text-sm font-extrabold text-[#202050] max-[720px]:flex-wrap max-[720px]:gap-1 max-[720px]:text-xs">
          ৳{product.price.toLocaleString("en-BD")}
          <del className="text-[10px] font-medium text-[#9494a3] max-[720px]:text-[9px]">
            ৳{product.originalPrice.toLocaleString("en-BD")}
          </del>
          <span className="rounded-[9px] bg-[#fff1c8] px-[6px] py-[3px] text-[9px] text-[#8c6910]">
            {Math.round((1 - product.price / product.originalPrice) * 100)}% off
          </span>
        </div>
        <div className="my-2 text-[10px] text-[#88899a] max-[720px]:my-[6px] max-[720px]:text-[9px]">
          In stock
        </div>
        {product.sizes.length ? (
          <select
            className="h-[39px] w-full rounded-full border border-[#888ac6] bg-white text-center text-[11px] font-bold text-[#333692] focus:outline focus:outline-2 focus:outline-[#f0c332] max-[720px]:h-[34px] max-[720px]:text-[10px]"
            aria-label={`Choose size for ${product.name}`}
            value={size}
            onChange={(event) => setSize(event.target.value)}
          >
            <option value="">Choose size</option>
            {product.sizes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        ) : (
          <button
            className="h-[39px] w-full rounded-full border-0 bg-[#353793] text-[11px] font-bold text-white max-[720px]:h-[34px] max-[720px]:text-[10px]"
            onClick={add}
          >
            Add to cart
          </button>
        )}
        {product.sizes.length > 0 && (
          <button
            className="mt-[7px] h-[39px] w-full rounded-full border-0 bg-[#353793] text-[11px] font-bold text-white max-[720px]:h-[34px] max-[720px]:text-[10px]"
            onClick={add}
          >
            Add to cart
          </button>
        )}
        <span className="sr-only" aria-live="polite">
          {message}
        </span>
      </div>
    </article>
  );
}
