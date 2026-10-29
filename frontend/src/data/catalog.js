const shirt = (id, name, price, color, category = "Punjabi") => ({
  id,
  name,
  price,
  originalPrice: Math.round((price * 1.2) / 10) * 10,
  color,
  category,
  kind: "shirt",
  badge: id % 4 === 0 ? "New" : "Best seller",
  sizes: ["S", "M", "L", "XL"],
});
const scent = (id, name, price, color, category = "Fragrance") => ({
  id,
  name,
  price,
  originalPrice: Math.round((price * 1.15) / 10) * 10,
  color,
  category,
  kind: "scent",
  badge: id % 3 === 0 ? "New" : "Best seller",
  sizes: [],
});

export const products = [
  shirt(1, "Festive Gold Punjabi", 4250, "gold"),
  shirt(2, "Everyday Indigo Punjabi", 2450, "blue"),
  scent(3, "Oud Noir Eau de Parfum", 2850, "navy"),
  shirt(4, "Classic Ivory Punjabi", 2650, "blue"),
  shirt(5, "Linen Sand Punjabi", 2950, "olive"),
  shirt(6, "Deep Blue Punjabi", 3650, "blue"),
  shirt(7, "Amber Occasion Punjabi", 2950, "olive"),
  shirt(8, "Golden Hour Punjabi", 4250, "gold"),
  scent(9, "Amber Oud Eau de Parfum", 1250, "olive"),
  scent(10, "Fresh Citrus Eau de Parfum", 1950, "lavender"),
  scent(11, "Rose Musk Eau de Parfum", 2450, "blue"),
  scent(12, "Velvet Bloom Eau de Parfum", 2850, "navy"),
  shirt(13, "New Season Sand Punjabi", 2950, "olive"),
  shirt(14, "Pure Cotton Punjabi", 1150, "gold"),
  shirt(15, "Sunshine Punjabi", 950, "gold"),
  shirt(16, "Midnight Blue Punjabi", 3950, "navy"),
];

export const categories = [
  { name: "Punjabi", detail: "Festive and everyday", color: "navy" },
  { name: "Pajama", detail: "Pair with any punjabi", color: "blue" },
  { name: "Kurti", detail: "For women", color: "navy" },
  { name: "Perfumes", detail: "EDP, EDT and attar", color: "olive" },
  { name: "Men", detail: "Full range", color: "navy" },
  { name: "Women", detail: "Full range", color: "gold" },
  { name: "Accessories", detail: "The finishing touches", color: "lavender" },
  { name: "New arrivals", detail: "Freshly added styles", color: "blue" },
  { name: "Offers", detail: "A little something extra", color: "gold" },
  { name: "Gift cards", detail: "A thoughtful surprise", color: "olive" },
];
