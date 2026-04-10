import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const DEFAULT_API_BASE = "http://localhost:7999/api/v1";

const ProductsPage = () => {
  const navigate = useNavigate();
  const apiBase = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  }, []);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const pageSize = 100;
        const firstUrl = new URL(`${apiBase}/products`);
        firstUrl.searchParams.set("page", "1");
        firstUrl.searchParams.set("page_size", String(pageSize));
        firstUrl.searchParams.set("is_active", "true");

        const firstRes = await fetch(firstUrl.toString());
        if (!firstRes.ok) {
          throw new Error(`Failed to load products (${firstRes.status})`);
        }

        const firstJson = await firstRes.json();
        const firstPageProducts = Array.isArray(firstJson?.data) ? firstJson.data : [];
        const totalPages = Number(firstJson?.total_pages || 1) || 1;

        const allProducts = [...firstPageProducts];
        for (let page = 2; page <= totalPages; page += 1) {
          const pageUrl = new URL(`${apiBase}/products`);
          pageUrl.searchParams.set("page", String(page));
          pageUrl.searchParams.set("page_size", String(pageSize));
          pageUrl.searchParams.set("is_active", "true");

          const res = await fetch(pageUrl.toString());
          if (!res.ok) {
            throw new Error(`Failed to load products (${res.status})`);
          }

          const json = await res.json();
          const data = Array.isArray(json?.data) ? json.data : [];
          allProducts.push(...data);
        }

        if (!cancelled) setProducts(allProducts);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const formatPrice = (value) => {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return `₹${numberValue.toFixed(0)}`;
    return "₹12";
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

  const openProductDetails = (productId) => {
    if (!productId) return;
    navigate(`/product/${encodeURIComponent(String(productId))}`);
  };

  return (
    <div className="font-sans min-h-screen bg-[#F8F9FB] text-slate-800">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        
        {/* Hide Scrollbar Styles */}
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />

        {/* Top Category Tags */}
        <div className="flex overflow-x-auto gap-4 mb-10 items-center py-4 px-2 -mx-2 hide-scrollbar scroll-smooth">
          {["All Categories", "Deals", "Fresh Milk", "Ice Cream", "Health & Wellness", "Ghee & Butter", "Curd", "Sweets"].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  flex-shrink-0 px-6 py-2.5 rounded-full text-[14px] font-medium transition-colors duration-300 ease-in-out select-none border-4 border-solid border-black outline-none ring-0 shadow-none
                  ${isActive 
                    ? "bg-black text-white" 
                    : "bg-white text-black hover:bg-black hover:text-white"
                  }
                `}
              >
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Filter Header & Toggle */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg text-slate-800">Filter Products</h2>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] text-sm font-semibold text-[#6C5DD3] hover:shadow-[0_8px_20px_rgba(108,93,211,0.15)] transition-shadow"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Filters
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 relative">
          
          {/* Mobile Filter Overlay */}
          {isFilterOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
              onClick={() => setIsFilterOpen(false)}
            />
          )}

          {/* Left Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-[#F8F9FB] p-6 overflow-y-auto shadow-2xl transition-transform duration-300 ease-out flex flex-col gap-6
            lg:static lg:w-[280px] lg:flex-shrink-0 lg:p-0 lg:bg-transparent lg:shadow-none lg:translate-x-0 lg:z-auto
            ${isFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between lg:hidden mb-2">
              <h3 className="font-bold text-xl text-slate-800">Filters</h3>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-500 hover:bg-slate-100 shadow-sm"
              >
                ✕
              </button>
            </div>
            
            {/* Price Range */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-base text-slate-800">Price Range</h3>
                <button className="text-xs text-slate-400 hover:text-[#6C5DD3] transition-colors font-medium">Reset</button>
              </div>
              <p className="text-xs text-slate-400 mb-6 font-medium">The average price is $300</p>
              
              <div className="relative pt-8 pb-4">
                {/* Mock Chart */}
                <svg className="w-full h-12 text-[#E7E5F8] fill-current absolute top-0" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d="M0,40 L0,30 L10,35 L20,20 L30,30 L40,10 L50,5 L60,30 L70,35 L80,15 L90,25 L100,20 L100,40 Z"></path>
                </svg>
                {/* Slider Base */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full relative z-10">
                  <div className="h-full bg-[#6C5DD3] w-[60%] rounded-full absolute left-[10%]"></div>
                  {/* Thumbs */}
                  <div className="w-4 h-4 bg-white border-2 border-[#6C5DD3] rounded-full absolute top-1/2 -translate-y-1/2 left-[10%] shadow-md cursor-pointer hover:scale-110 transition-transform">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2.5 py-1 rounded-md font-semibold after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">$20</div>
                  </div>
                  <div className="w-4 h-4 bg-white border-2 border-[#6C5DD3] rounded-full absolute top-1/2 -translate-y-1/2 left-[70%] shadow-md cursor-pointer hover:scale-110 transition-transform">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2.5 py-1 rounded-md font-semibold after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">$1130</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Star Rating */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
              <h3 className="font-bold text-base mb-4 text-slate-800">Star Rating</h3>
              <div className="flex justify-between items-center cursor-pointer group">
                <div className="flex text-amber-400 text-sm gap-1 group-hover:scale-105 transition-transform">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span className="text-slate-200">★</span>
                </div>
                <span className="text-xs text-slate-400 font-medium group-hover:text-[#6C5DD3] transition-colors">4 Stars & up</span>
              </div>
            </div>

            {/* Brand */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-base text-slate-800">Brand</h3>
                <button className="text-xs text-slate-400 hover:text-[#6C5DD3] transition-colors font-medium">Reset</button>
              </div>
              
              <div className="space-y-4">
                {[
                  { name: "Adidas", active: true },
                  { name: "Columbia", active: true },
                  { name: "Demix", active: true },
                  { name: "New Balance", active: true },
                  { name: "Nike", active: true },
                  { name: "Xiaomi", active: true },
                  { name: "Asics", active: false },
                ].map((brand) => (
                  <label key={brand.name} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${brand.active ? 'bg-[#6C5DD3]/10 text-[#6C5DD3]' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'}`}>
                        {brand.name[0]}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${brand.active ? 'text-slate-800' : 'text-slate-600 group-hover:text-slate-800'}`}>{brand.name}</span>
                    </div>
                    <div className={`w-[22px] h-[22px] rounded-[6px] border-[1.5px] flex items-center justify-center transition-all duration-200 ${brand.active ? 'bg-[#6C5DD3] border-[#6C5DD3] shadow-sm scale-110' : 'border-slate-300 group-hover:border-[#6C5DD3] bg-white group-hover:bg-white'}`}>
                      {brand.active && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <button className="text-xs text-[#6C5DD3] mt-6 font-bold hover:text-indigo-800 transition-colors">See all Brands...</button>
            </div>

            {/* Delivery Options */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
               <h3 className="font-bold text-base mb-4 text-slate-800">Delivery Options</h3>
               <div className="flex bg-slate-100/80 rounded-2xl p-1 relative">
                 <button className="flex-1 py-2.5 bg-[#6C5DD3] text-white rounded-xl text-sm font-semibold shadow-[0_4px_12px_rgba(108,93,211,0.25)] transition-transform hover:scale-[1.02]">Standard</button>
                 <button className="flex-1 py-2.5 text-slate-600 hover:text-slate-800 rounded-xl text-sm font-semibold transition-colors">Pick Up</button>
               </div>
            </div>
            
            {/* Apply Button for Mobile */}
            <div className="lg:hidden mt-4">
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-4 bg-[#6C5DD3] text-white rounded-2xl font-bold shadow-[0_8px_20px_rgba(108,93,211,0.3)] active:scale-95 transition-transform"
              >
                Apply Filters
              </button>
            </div>

          </div>

          {/* Main Content Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading products...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No products found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product, index) => {
                  // Just mocking variation based on index for the UI demo like in the image
                  const isSpecialCard = index % 5 === 4; 
                  const hasTopItem = index % 3 === 0;
                  const bgClass = isSpecialCard ? "bg-[#6C5DD3]" : "bg-white";
                  const textClass = isSpecialCard ? "text-white" : "text-slate-800";
                  
                  return (
                    <div 
                      key={product.id || index}
                      className={`group rounded-[24px] overflow-hidden ${bgClass} shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_12px_30px_rgb(0,0,0,0.08)] cursor-pointer flex flex-col`}
                      onClick={() => openProductDetails(product.id)}
                    >
                      {/* Image Area */}
                      <div className={`relative h-64 p-6 flex flex-col justify-end items-center ${isSpecialCard ? '' : 'bg-[#F4F5F8]'} m-3 rounded-[18px] overflow-hidden`}>
                        <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm text-slate-300 hover:text-red-500 hover:shadow-md transition-all z-20 group-hover:scale-110">
                          <svg className="w-4 h-4 fill-current transition-colors" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                        
                        {/* Soft overlay gradient on image hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none rounded-[18px]"></div>
                        
                        <img 
                          src={getImageSrc(product)} 
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500 ease-out mix-blend-multiply"
                          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop"; }}
                        />

                        <div className="relative z-20 w-full flex justify-center mt-auto">
                           {hasTopItem && !isSpecialCard && (
                            <div className="bg-amber-400 text-slate-900 text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-[0_4px_10px_rgba(251,191,36,0.3)] transform translate-y-7 group-hover:translate-y-5 transition-transform duration-300">
                              Top item
                            </div>
                           )}
                        </div>
                        
                        {isSpecialCard && (
                          <div className="flex gap-2 absolute top-6 left-6 z-10">
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-1 rounded-full text-white text-[10px] font-semibold">
                               <img src="https://i.pravatar.cc/100?img=1" className="w-4 h-4 rounded-full"/> 4.7/5 ⭐
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className={`px-5 pb-6 pt-3 text-center flex-1 flex flex-col justify-end`}>
                        <h4 className={`font-bold text-[15px] mb-4 line-clamp-2 leading-relaxed ${textClass}`}>
                          {product.name || "Premium Product"}
                        </h4>
                        
                        <div className="flex items-center justify-center gap-3 mt-auto">
                          {index % 2 === 0 && !isSpecialCard && (
                            <span className="text-slate-400 text-[13px] line-through font-semibold">
                              ₹{(Number(product.price || 12) * 1.4).toFixed(0)}
                            </span>
                          )}
                          <div className={`px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-300 group-hover:scale-105 border ${isSpecialCard ? 'border-transparent text-white bg-white/20 backdrop-blur-md' : 'border-transparent bg-slate-900 text-white group-hover:bg-[#6C5DD3] group-hover:shadow-[0_4px_12px_rgba(108,93,211,0.3)]'}`}>
                            {formatPrice(product.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductsPage;