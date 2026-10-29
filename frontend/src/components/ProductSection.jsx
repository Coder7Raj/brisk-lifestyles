import ProductCard from "./ProductCard.jsx";

export default function ProductSection({
  id,
  title,
  subtitle,
  products,
  onAdd,
  hideHeader = false,
  wishlist = [],
  onWishlistToggle,
}) {
  return (
    <section
      className="mx-auto max-w-[1250px] px-0 pb-2 pt-[45px] max-[1100px]:mx-[1%] max-[720px]:pt-[33px]"
      id={id}
    >
      {!hideHeader && (
        <div className="mb-5 flex items-end justify-between max-[720px]:mb-[14px]">
          <div>
            <h2 className="m-0 text-[27px] font-extrabold leading-[1.15] tracking-[-.04em] text-[#1a1a43] max-[720px]:text-[22px]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-[5px] text-xs text-[#77788d] max-[720px]:text-[10px]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-4 gap-4 max-[768px]:grid-cols-3 max-[720px]:grid-cols-2 max-[720px]:gap-[11px]">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={onAdd}
            saved={wishlist.some((item) => item.id === product.id)}
            onWishlistToggle={onWishlistToggle}
          />
        ))}
      </div>
    </section>
  );
}
