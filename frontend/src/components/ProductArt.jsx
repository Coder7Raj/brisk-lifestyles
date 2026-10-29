export default function ProductArt({ kind, color, name }) {
  return (
    <div
      className={`relative grid h-full w-full place-items-center overflow-hidden ${({ navy: "bg-[#17173f]", blue: "bg-[#5558ad]", gold: "bg-[#d2ad2c]", olive: "bg-[#85711f]", lavender: "bg-[#7779d1]" })[color] || "bg-[#17173f]"}`}
      role="img"
      aria-label={`${name}, illustrated product`}
    >
      <span className="absolute -right-[31px] -top-[29px] h-28 w-28 rounded-full border-[8px] border-white/15" aria-hidden="true" />
      {kind === "scent" ? (
        <svg className="relative z-[1] h-[58%] w-auto drop-shadow-[0_10px_7px_#10112b38] transition-transform duration-500 group-hover:scale-105" viewBox="0 0 100 130" aria-hidden="true">
          <rect
            x="38"
            y="12"
            width="24"
            height="16"
            rx="3"
            className="fill-[#dfbd37]"
          />
          <rect
            x="31"
            y="27"
            width="38"
            height="12"
            rx="4"
            className="fill-[#dfbd37]"
          />
          <rect
            x="18"
            y="37"
            width="64"
            height="80"
            rx="13"
            className="fill-[#f9f5e9]"
          />
          <rect
            x="25"
            y="45"
            width="50"
            height="8"
            rx="4"
            className="fill-[#e3dfd2]"
          />
        </svg>
      ) : (
        <svg className="relative z-[1] h-[63%] w-[70%] drop-shadow-[0_12px_7px_#10112b30] transition-transform duration-500 group-hover:scale-105" viewBox="0 0 160 150" aria-hidden="true">
          <path
            className="fill-[#fffdf1]"
            d="M51 20 24 37 6 58l20 18 13-13v67h82V63l13 13 20-18-18-21-27-17-16 14H67L51 20Z"
          />
          <path
            className="fill-none stroke-[#d8b530] stroke-[2.4]"
            d="M80 34v94M68 35l12 12 12-12M80 50v18m0 13v5m0 12v5m0 12v5"
          />
        </svg>
      )}
    </div>
  );
}


