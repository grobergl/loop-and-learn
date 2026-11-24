import React from "react";
import { Rabbit, Shirt, House, ShoppingBag, Shapes } from "lucide-react";
import { categoryVisual } from "./categories.js";
export function Yarn({ color = "#bd7859", className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 150"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={"knit" + color.replace("#", "")}
          width="10"
          height="9"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0l5 7 5-7"
            stroke="white"
            strokeOpacity=".23"
            strokeWidth="1.5"
          />
        </pattern>
      </defs>
      <ellipse cx="79" cy="130" rx="52" ry="7" fill="#4c493a" opacity=".07" />
      <circle cx="78" cy="76" r="48" fill={color} />
      <circle
        cx="78"
        cy="76"
        r="48"
        fill={"url(#knit" + color.replace("#", "") + ")"}
      />
      <g stroke="#fff9ec" strokeWidth="2" opacity=".6">
        <path d="M43 44q52 1 76 51M35 55q45-1 79 53M31 69q40-1 72 48M57 32q-12 51 31 91M72 28q-9 45 43 79M88 29q-3 31 38 57" />
      </g>
      <path d="M114 105q44 7 28 24t-34 2" stroke={color} strokeWidth="3" />
      <rect
        x="30"
        y="64"
        width="96"
        height="27"
        rx="3"
        transform="rotate(-18 30 64)"
        fill="#f8f2e5"
      />
      <path d="M62 70l25-8M64 76l15-5" stroke="#aa9b82" strokeWidth="2" />
    </svg>
  );
}
export function PatternArt({
  category,
  type,
  color = "#8a9b78",
  className = "",
}) {
  const chosen =
    category ||
    {
      ball: "Plushies",
      scarf: "Clothing",
      headband: "Clothing",
      coaster: "Home",
      cloth: "Home",
      pouch: "Accessories",
    }[type] ||
    "Other";
  const visual = categoryVisual(chosen),
    Icon = { Rabbit, Shirt, House, ShoppingBag, Shapes }[visual.icon];
  return (
    <svg
      viewBox="0 0 200 160"
      className={className}
      aria-hidden="true"
      data-category={chosen}
      data-project-icon={visual.icon}
    >
      <circle cx="100" cy="80" r="53" fill={color} opacity=".09" />
      <Icon
        x="62"
        y="42"
        width="76"
        height="76"
        color={color}
        strokeWidth="1.35"
      />
    </svg>
  );
}
export function HeroArt() {
  return (
    <svg viewBox="0 0 470 250" aria-hidden="true">
      <defs>
        <pattern
          id="heroGrain"
          width="9"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0l4 6 5-6"
            fill="none"
            stroke="#fff7dd"
            strokeOpacity=".25"
            strokeWidth="1.5"
          />
        </pattern>
      </defs>
      <path
        d="M22 201q25-17 48-1t40-5q8-17-12-23"
        fill="none"
        stroke="#a7ae8e"
        strokeWidth="2"
      />
      <ellipse
        cx="273"
        cy="218"
        rx="139"
        ry="13"
        fill="#83795b"
        opacity=".08"
      />
      <path d="M154 138l22 70q89 29 177-1l23-69" fill="#ceac7e" />
      <ellipse cx="265" cy="138" rx="111" ry="24" fill="#ab875d" />
      <g stroke="#f4dfbd" strokeWidth="3" opacity=".65">
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${164 + i * 20} 145l-8 61`} />
        ))}
        <path d="M165 163q100 30 201-1M171 181q94 29 189 0M177 199q89 27 177 0" />
      </g>
      <g transform="rotate(-20 316 85)">
        <rect x="311" y="14" width="7" height="142" rx="3" fill="#917458" />
        <path
          d="M314 19q-7-15 1-16t7 8"
          fill="none"
          stroke="#917458"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
      <circle cx="227" cy="113" r="57" fill="#b96f50" />
      <circle cx="227" cy="113" r="57" fill="url(#heroGrain)" />
      <g fill="none" stroke="#f5c8a0" strokeWidth="2" opacity=".7">
        <path d="M184 78q49 1 87 69M173 96q48 0 84 65M204 60q-17 67 31 109M224 57q-10 62 49 86" />
      </g>
      <circle cx="315" cy="120" r="45" fill="#91a080" />
      <circle cx="315" cy="120" r="45" fill="url(#heroGrain)" />
      <g fill="none" stroke="#e6ebcc" strokeWidth="2" opacity=".7">
        <path d="M281 90q44-1 69 52M271 107q40 0 65 50M304 77q-12 45 25 86M322 77q-7 38 36 59" />
      </g>
      <path
        d="M156 137q109 37 221-1"
        fill="none"
        stroke="#d9b889"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path d="M176 149q90 28 177 0l-3 15q-87 24-169 0z" fill="#e6cba0" />
      <path
        d="M183 173l-16 31q-36 34-83 3"
        fill="none"
        stroke="#bd7859"
        strokeWidth="3"
      />
      <path
        d="M402 73l4 9 10 1-8 6 2 10-8-5-8 5 2-10-8-6 10-1zM137 39l2 6 7 1-5 4 1 6-5-3-6 3 1-6-5-4 7-1z"
        fill="#c4a36b"
      />
      <path
        d="M396 164q16-21 22-4t-22 27q-26-17-18-26t18 3"
        fill="none"
        stroke="#b9bd9b"
        strokeWidth="2"
      />
    </svg>
  );
}
