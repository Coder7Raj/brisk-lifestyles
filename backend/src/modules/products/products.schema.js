import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug.");
const price = z.number().finite().min(0).max(21_474_836.47).refine(
  (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
  "Prices can have at most two decimal places.",
);
const comparePrice = price.nullable();
const isHttpsUrl = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};
const productFields = {
  slug,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000),
  category: slug,
  price_taka: price,
  compare_at_price_taka: comparePrice,
  image_url: z
    .string()
    .trim()
    .max(2048)
    .url()
    .refine(isHttpsUrl, "Use an HTTPS image URL.")
    .nullable(),
  sizes: z.array(z.string().trim().min(1).max(20)).max(30),
  in_stock: z.boolean(),
  is_active: z.boolean(),
};

const priceConstraint = (product) =>
  product.compare_at_price_taka == null ||
  product.price_taka == null ||
  product.compare_at_price_taka >= product.price_taka;

export const createProductSchema = z
  .object({
    slug: productFields.slug,
    name: productFields.name,
    description: productFields.description.optional().default(""),
    category: productFields.category,
    price_taka: productFields.price_taka,
    compare_at_price_taka: productFields.compare_at_price_taka.optional().default(null),
    image_url: productFields.image_url.optional().default(null),
    sizes: productFields.sizes.optional().default([]),
    in_stock: productFields.in_stock.optional().default(true),
  })
  .strict()
  .refine(priceConstraint, {
    path: ["compare_at_price_taka"],
    message: "Compare-at price must be at least the regular price.",
  })
  .refine((product) => new Set(product.sizes).size === product.sizes.length, {
    path: ["sizes"],
    message: "Sizes must not contain duplicates.",
  });

export const updateProductSchema = z
  .object(productFields)
  .partial()
  .strict()
  .refine((product) => Object.keys(product).length > 0, {
    message: "Provide at least one product field to update.",
  })
  .refine(priceConstraint, {
    path: ["compare_at_price_taka"],
    message: "Compare-at price must be at least the regular price.",
  })
  .refine(
    (product) =>
      !product.sizes || new Set(product.sizes).size === product.sizes.length,
    { path: ["sizes"], message: "Sizes must not contain duplicates." },
  );

export const productIdSchema = z.string().uuid();
export const productSlugSchema = slug;
export const productListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
  category: slug.optional(),
});
