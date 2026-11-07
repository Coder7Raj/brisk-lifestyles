import { routeForLabel } from "../routes/router.jsx";

function Footer() {
  return (
      <footer className="bg-[#17173f] px-[max(calc((100%-1250px)/2),7.4%)] pb-[25px] pt-9 text-white max-[1100px]:px-[5%] max-[720px]:pt-7">
        <a
          className="inline-flex w-max items-baseline gap-[5px] text-[30px] font-extrabold tracking-[-.06em] text-white max-[720px]:text-[22px]"
          href="#top"
        >
          <span>Brisk</span>
          <i className="text-[18px] font-semibold text-[#e2b52a] max-[720px]:text-[13px]">
            Lifestyles
          </i>
        </a>
        <p className="my-3 text-xs text-[#c6c6db]">
          Everyday style, made for your moments.
        </p>
        <div className="my-[22px] flex gap-[23px] text-[11px] max-[720px]:flex-wrap max-[720px]:gap-[14px]">
          <a href={routeForLabel("All categories")}>Shop</a>
          <a href={routeForLabel("Offers")}>Offers</a>
          <a href={routeForLabel("Reviews")}>Customer care</a>
          <a href="#top">Back to top ?</a>
        </div>
        <small className="text-[10px] text-[#a4a4c3]">
          ? 2025 Brisk Lifestyles ? Prices shown in Bangladeshi taka
        </small>
      </footer>
  );
}

export default Footer;
