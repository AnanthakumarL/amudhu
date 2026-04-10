import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import IceCreamSlider from "../components/IceCreamSlider.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const StarRating = () => (
  <div className="flex gap-1 text-yellow-400 mb-2 text-sm">
    ★ ★ ★ ★ ★
  </div>
);

const HomePage = () => {
  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoadingProducts(true);
        setProductsError("");

        const url = new URL(`${apiBase}/products`);
        url.searchParams.set("page", "1");
        url.searchParams.set("page_size", "12");
        url.searchParams.set("is_active", "true");

        const res = await fetch(url.toString());
        if (!res.ok) {
          throw new Error(`Failed to load products (${res.status})`);
        }

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) setProducts(data);
      } catch (e) {
        if (!cancelled) setProductsError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const homeProducts = useMemo(() => {
    return products.slice(0, 3);
  }, [products]);

  const formatPrice = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return `₹${numberValue.toFixed(0)}`;
    return "₹12"; // Default fallback like in mockup
  };

  const getImageSrc = (product) => {
    const url = product?.image_url;
    if (url) {
      if (/^https?:\/\//i.test(url)) return url;
      try {
        const origin = new URL(apiBase).origin;
        return origin + (url.startsWith("/") ? url : `/${url}`);
      } catch {
        return url;
      }
    }
    return "assets/images/frame_25.png";
  };

  return (
    <div className="font-['Outfit'] min-h-screen bg-[#FCFBFA] text-[#1B4D3E] overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-6 py-20 flex flex-col items-center justify-center overflow-hidden min-h-[85vh]">
        <h1 className="text-[4rem] md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tight text-[#38D4DF] leading-none mb-10 text-center z-10 drop-shadow-sm whitespace-nowrap">
          Head Pack Ice Cream
        </h1>

        <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between z-10 relative">
          
          {/* Left Column */}
          <div className="md:w-1/4 flex flex-col items-center md:items-start text-center md:text-left mb-10 md:mb-0">
            <img src="/assets/images/gemini_generated_image_ye9le1ye9le1ye9l_2.png" alt="Small ice cream cup" className="w-[120px] mb-4 drop-shadow-lg object-contain mix-blend-multiply" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1570197781417-0c7f3c15ca7c?q=80&w=200&auto=format&fit=crop" }} />
            <h3 className="font-bold text-lg mb-2 capitalize text-black">Let's Do a Hand Pack Good!</h3>
            <p className="text-xs text-gray-500 mb-8 max-w-[200px] leading-relaxed">
              We focus heavily on providing high quality ingredients that create unique tastes and leave a lasting impression.
            </p>
            <div className="flex gap-1 items-center">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-yellow-200 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-red-200 border-2 border-white"></div>
              </div>
              <div className="ml-2">
                <div className="font-bold text-sm text-black">4M+</div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase">Satisfied Customers</div>
              </div>
            </div>
          </div>

          {/* Center Column - Giant Ice Cream */}
          <div className="md:w-2/4 flex justify-center z-20">
            <img src="/assets/images/image_comp.png" alt="Giant Ice Cream" className="w-full max-w-[450px] drop-shadow-2xl hover:scale-105 transition-transform duration-500 object-contain mix-blend-multiply" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1555507034-71eec820e107?q=80&w=600&auto=format&fit=crop" }} />
          </div>

          {/* Right Column */}
          <div className="md:w-1/4 flex flex-col items-center md:items-end text-center md:text-right mt-10 md:mt-0">
            <p className="text-sm text-gray-500 mb-8 max-w-[220px] leading-relaxed">
              Italian, whole sugar, real cream, eggs and heavy cream are also common ingredients in ice cream recipes...
            </p>
            <div className="relative mb-6">
              <div className="absolute -top-4 -left-4 bg-yellow-400 text-black text-[10px] font-bold p-2 rounded-full rotate-[-15deg] z-10 w-12 h-12 flex items-center justify-center text-center leading-tight border-2 border-white shadow-md">BEST SELLER</div>
              <img src="/assets/images/frame_25.png" alt="Kid eating ice cream" className="rounded-xl w-[180px] h-[120px] object-cover shadow-lg" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1516054178556-96eb113b2ce2?q=80&w=400&auto=format&fit=crop" }} />
            </div>
            <button className="bg-[#0A4D3C] text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-wider shadow-xl hover:bg-[#134E39] hover:-translate-y-1 transition">
              Find Out Shop
            </button>
          </div>

        </div>
      </section>

      {/* Marquee Banner 1 */}
      <div className="bg-[#FDE293] py-3 overflow-hidden whitespace-nowrap border-y-2 border-[#1B4D3E]/10">
        <div className="inline-block animate-[marquee_20s_linear_infinite]">
          {[1,2,3,4,5,6,7,8,9,10].map((_, i) => (
            <span key={i} className="text-[#1B4D3E] font-black text-lg tracking-widest uppercase mx-6 flex-inline items-center gap-6">
              Ice Cream Palor <span className="text-[#FF6B35] text-2xl mx-6">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Examine Our Brand Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase text-black mb-4 md:mb-0">Examine our brand</h2>
          <p className="text-xs text-gray-500 max-w-[300px] text-right">
            Welcome to our product website, where we invite you to thoroughly examine our brand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="bg-[#F8F5EE] rounded-2xl p-8 flex justify-center items-center h-[300px] mb-6 relative">
              <img src="/assets/images/image_comp.png" alt="Chocolate Milk" className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=400&auto=format&fit=crop" }} />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-black text-sm uppercase text-black">World's Best <br/> Chocolate Milk</h4>
              </div>
              <div className="font-black text-2xl text-[#164E3E]">₹120</div>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="bg-[#F3F9FC] rounded-2xl p-8 flex justify-center items-center h-[300px] mb-6 relative">
              <div className="absolute top-4 left-4 bg-[#FF6B35] text-white text-[10px] font-bold p-2 rounded-lg z-10 w-12 h-12 flex items-center justify-center text-center leading-tight shadow-md">CLASSIC MILK</div>
              <img src="/assets/images/gemini_generated_image_ye9le1ye9le1ye9l_2.png" alt="Classic Milk" className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=400&auto=format&fit=crop" }} />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-black text-sm uppercase text-black">The Classics- <br/> 2%, Whole, Skim</h4>
              </div>
              <div className="font-black text-2xl text-[#164E3E]">₹120</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="bg-[#FAF9FF] rounded-2xl p-8 flex justify-center items-center h-[300px] mb-6 relative">
              <img src="/assets/images/frame_25.png" alt="Hand-Scooped" className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1570197781417-0c7f3c15ca7c?q=80&w=400&auto=format&fit=crop" }} />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <h4 className="font-black text-sm uppercase text-black">Hand-Scooped In <br/> Wooster Ohio</h4>
              </div>
              <div className="font-black text-2xl text-[#164E3E]">₹12</div>
            </div>
          </div>
        </div>
      </section>

      {/* Classic Milk Section */}
      <section className="bg-[#F8F5EE] py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-6 -left-6 bg-[#FF6B35] text-white text-[12px] font-bold p-3 rounded-2xl z-20 w-16 h-16 flex items-center justify-center text-center shadow-md">CLASSIC MILK</div>
            
            {/* Main Lifestyle Image */}
            <img src="https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=800&auto=format&fit=crop" alt="Kid drinking milk" className="rounded-[40px] shadow-2xl w-[90%] h-[400px] object-cover ml-auto" />
            
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-black uppercase text-[#38D4DF] mb-6 leading-tight">
              The Classics—<br/> 2%, Whole, Skim
            </h2>
            <p className="text-sm text-gray-500 mb-10 max-w-sm leading-relaxed font-semibold">
              If you're looking for old-fashioned milk, this is it. It's sun filtered, uncreamed product. Scoop off the cream and enjoy a wholesome, tasty treat, or break it up and shake well to distribute back into the milk. Look for the green cap in your local grocery store!
            </p>
            <button className="bg-[#0A4D3C] text-white px-8 py-3 rounded-full font-bold uppercase text-xs tracking-wider shadow-xl hover:bg-[#134E39] hover:-translate-y-1 transition">
              Find Out Shop
            </button>
          </div>
        </div>
      </section>

      {/* Marquee Banner 2 */}
      <div className="bg-[#FDE293] py-3 overflow-hidden whitespace-nowrap border-y-2 border-[#1B4D3E]/10">
        <div className="inline-block animate-[marquee_20s_linear_infinite]">
          {[1,2,3,4,5,6,7,8,9,10].map((_, i) => (
            <span key={i} className="text-[#1B4D3E] font-black text-lg tracking-widest uppercase mx-6 flex-inline items-center gap-6">
              Dairy Firm <span className="text-[#FF6B35] text-2xl mx-6">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="bg-[#FCFBFA] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-black uppercase text-black mb-4">Costumer Reviews</h2>
              <p className="text-xs text-gray-500 max-w-sm">
                Your reviews not only help us to improve but also guide fellow dairy enthusiasts in finding the perfect companion for their journey.
              </p>
            </div>
            <div className="flex gap-4 mt-6 md:mt-0">
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100">←</button>
              <button className="w-10 h-10 rounded-full border border-gray-300 bg-[#0A4D3C] text-white flex items-center justify-center hover:bg-[#134E39]">→</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
              <div>
                <StarRating />
                <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-8">
                  "I stumbled upon this dairy website while searching for a new journal, and I must say, I'm thoroughly impressed. The selection of diaries is diverse, catering to various tastes and needs."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-500 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?img=1" alt="Avatar 1" />
                </div>
                <h5 className="font-bold text-sm text-black">Julia Cohen</h5>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
              <div>
                <StarRating />
                <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-8">
                  "I ended up choosing one of their leather-bound journals, and the quality exceeded my expectations. The craftsmanship is impeccable, and the pages are smooth."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl font-bold text-red-500 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?img=5" alt="Avatar 2" />
                </div>
                <h5 className="font-bold text-sm text-black">Mikael Jaksed</h5>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
              <div>
                <StarRating />
                <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-8">
                  "I highly recommend this dairy website to anyone in search of quality journals and a seamless shopping experience. I'm thrilled with my purchase and will certainly return for more in the future."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl font-bold text-yellow-500 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?img=8" alt="Avatar 3" />
                </div>
                <h5 className="font-bold text-sm text-black">John Walkerson</h5>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer variant="green" />
    </div>
  );
};
export default HomePage;
