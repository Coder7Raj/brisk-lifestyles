import { Heart, ShieldCheck, Truck } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-toastify";
import ProductArt from "./ProductArt.jsx";

const money = (value) => `৳${value.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ProductDetails({ product, saved, onWishlistToggle, onAdd }) {
  if (!product)
    return (
      <section className="store-page">
        <h1>Product not found</h1>
        <a href="/categories">Continue shopping</a>
      </section>
    );
  return (
    <section className="store-page">
      <p className="store-crumb">
        <a href="/">Home</a> / <a href="/categories">Shop</a> / {product.name}
      </p>
      <div className="detail-layout">
        <div className="detail-art">
          {product.image_url ? (
            <img
              className="h-full w-full object-cover"
              src={product.image_url}
              alt={product.name}
            />
          ) : (
            <ProductArt {...product} />
          )}
          <span className="detail-badge">{product.badge}</span>
        </div>
        <ProductInfo
          product={product}
          saved={saved}
          onWishlistToggle={onWishlistToggle}
          onAdd={onAdd}
        />
      </div>
      <div className="detail-extra">
        <h2>Made for the moments that matter</h2>
        <p>
          {product.name} brings considered design and everyday comfort together.
          Carefully selected for quality, easy styling and lasting wear.
        </p>
        <div>
          <span>
            <Truck size={18} /> Reliable delivery across Bangladesh
          </span>
          <span>
            <ShieldCheck size={18} /> Secure, simple checkout
          </span>
        </div>
      </div>
    </section>
  );
}

function ProductInfo({ product, saved, onWishlistToggle, onAdd }) {
  const hasSizes = product.sizes?.length > 0;
  const [size, setSize] = useState("");
  return (
    <div className="detail-info">
      <span className="detail-category">{product.category}</span>
      <h1>{product.name}</h1>
      <div className="detail-price">
        {money(product.price)}{" "}
        {product.originalPrice > product.price && (
          <del>{money(product.originalPrice)}</del>
        )}
      </div>
      <p className="detail-copy">
        A thoughtfully chosen piece for your wardrobe. Easy to wear, beautifully
        finished and ready for everyday moments or special occasions.
      </p>
      <p className="stock-line">
        <i /> {product.in_stock ? "In stock · Ready to ship" : "Out of stock"}
      </p>
      {hasSizes && (
        <fieldset className="size-picker">
          <legend>Select a size</legend>
          <div>
            {product.sizes.map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={size === option}
                className={`size-option ${size === option ? "selected" : ""}`}
                onClick={() => setSize(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {!size && (
            <small className="size-hint">
              Choose a size to add this item to your bag.
            </small>
          )}
        </fieldset>
      )}
      <button
        className="primary-action"
        disabled={!product.in_stock}
        onClick={() => {
          if (hasSizes && !size) return;
          onAdd(product, size);
        }}
      >
        {hasSizes ? "Add to bag" : "Add to bag · " + money(product.price)}
      </button>
      <button
        className={`wishlist-action ${saved ? "is-saved" : ""}`}
        onClick={() => onWishlistToggle(product)}
      >
        <Heart size={17} fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved to wishlist" : "Add to wishlist"}
      </button>
      <p className="detail-note">
        Free delivery on orders over ৳5,000 · Easy returns within 7 days
      </p>
    </div>
  );
}

export function CheckoutPage({ cart, onPlaceOrder, user }) {
  const paymentState = new URLSearchParams(window.location.search).get("payment");
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0,
  );
  const shipping = subtotal >= 5000 || !subtotal ? 0 : 80;
  const [done, setDone] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  if (done || paymentState === "success")
    return (
      <section className="store-page checkout-success">
        <div className="success-mark">✓</div>
        <p className="detail-category">ORDER RECEIVED</p>
        <h1>Thank you for your order.</h1>
        <p>We’ll contact you shortly to confirm delivery details.</p>
        <a className="primary-action" href="/">
          Continue shopping
        </a>
      </section>
    );
  if (!cart.length)
    return (
      <section className="store-page checkout-empty">
        <h1>Your bag is empty</h1>
        <p>Add something you love before checking out.</p>
        <a className="primary-action" href="/categories">
          Explore the collection
        </a>
      </section>
    );
  return (
    <section className="store-page">
      <p className="store-crumb">
        <a href="/">Home</a> / Checkout
      </p>
      <h1 className="checkout-title">Checkout</h1>
      <p className="checkout-intro">
        A few details and your favorites are on their way.
      </p>
      <form
        className="checkout-layout"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          const values = Object.fromEntries(new FormData(event.currentTarget));
          try {
            const completed = await onPlaceOrder(values);
            if (completed) setDone(true);
          } catch (error) {
            toast.error(error.message);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className="checkout-fields">
          <fieldset>
            <legend>Contact information</legend>
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                defaultValue={user?.email || ""}
                required
              />
            </label>
            <label>
              Phone number
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                pattern="[0-9+() -]{8,18}"
                required
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Delivery address</legend>
            <div className="field-grid">
              <label>
                First name
                <input name="firstName" autoComplete="given-name" required />
              </label>
              <label>
                Last name
                <input name="lastName" autoComplete="family-name" required />
              </label>
            </div>
            <label>
              Street address
              <input name="address" autoComplete="street-address" required />
            </label>
            <div className="field-grid">
              <label>
                City / district
                <input name="city" autoComplete="address-level2" required />
              </label>
              <label>
                Postal code
                <input name="postalCode" autoComplete="postal-code" required />
              </label>
            </div>
            <label>
              Delivery notes <span className="optional">Optional</span>
              <textarea
                name="notes"
                rows="3"
                placeholder="Landmark or instructions for the courier"
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Payment method</legend>
            <label className="payment-choice">
              <input type="radio" name="payment" value="cod" defaultChecked />{" "}
              Cash on delivery <span>Pay when your order arrives</span>
            </label>
            <label className="payment-choice">
              <input type="radio" name="payment" value="sslcommerz" />{" "}
              Pay online with SSLCOMMERZ{" "}
              <span>Cards, mobile banking and internet banking</span>
            </label>
          </fieldset>
        </div>
        <aside className="order-summary">
          <h2>
            Order summary{" "}
            <span>
              {cart.reduce((sum, item) => sum + (item.quantity || 1), 0)} items
            </span>
          </h2>
          <div className="summary-items">
            {cart.map((item) => (
              <div className="summary-item" key={item.lineId}>
                <div className="summary-thumb">
                  <ProductArt {...item} />
                </div>
                <div>
                  <b>{item.name}</b>
                  <small>
                    {item.size ? `Size ${item.size} · ` : ""}Qty{" "}
                    {item.quantity || 1}
                  </small>
                </div>
                <strong>{money(item.price * (item.quantity || 1))}</strong>
              </div>
            ))}
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <b>{money(subtotal)}</b>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <b>{shipping ? money(shipping) : "Free"}</b>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <b>{money(subtotal + shipping)}</b>
          </div>
          <button className="primary-action checkout-submit" type="submit" disabled={submitting}>
            {submitting ? <><span className="checkout-submit-spinner" aria-hidden="true" /> Preparing secure checkout…</> : `Place order · ${money(subtotal + shipping)}`}
          </button>
          <p className="secure-note">
            <ShieldCheck size={15} /> Your information is kept secure.
          </p>
        </aside>
      </form>
    </section>
  );
}
