export const categoryIcons = {
  Plushies: { icon: "Rabbit", background: "#e7eee8", label: "Bunny" },
  Clothing: { icon: "Shirt", background: "#e9edde", label: "Shirt" },
  Home: { icon: "House", background: "#f3ebdb", label: "House" },
  Accessories: { icon: "ShoppingBag", background: "#efe4e8", label: "Bag" },
  Other: { icon: "Shapes", background: "#ebe8f2", label: "Shapes" },
};
export const categoryVisual = (category) =>
  categoryIcons[category] || categoryIcons.Other;
