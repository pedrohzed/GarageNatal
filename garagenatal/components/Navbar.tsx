"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Sun, Moon, Search } from "lucide-react";
import { useCart } from "./CartContext";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount, setIsCartOpen } = useCart();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("garagenatal_theme");
    if (savedMode === "light") {
      setIsLightMode(true);
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    if (isLightMode) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("garagenatal_theme", "dark");
      setIsLightMode(false);
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("garagenatal_theme", "light");
      setIsLightMode(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/loja?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/loja");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative w-128 h-36">
                <Image
                  src="/logo.png"
                  alt="GarageNatal Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Center: Search Bar (Absolutely Centered) */}
          <form onSubmit={handleSearch} className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 w-full max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-[#333] rounded-lg leading-5 bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-[#222] text-sm transition-all"
                placeholder="Buscar tênis..."
              />
            </div>
          </form>

          {/* Right: Theme Toggle + Cart */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {mounted && (
              <button 
                onClick={toggleTheme}
                className="p-2 text-white hover:text-primary transition-colors cursor-pointer"
                title="Alternar Tema"
              >
                {isLightMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
            )}

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-white hover:text-primary transition-colors cursor-pointer"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-black bg-primary rounded-full transform translate-x-1/4 -translate-y-1/4">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar (below header on small screens) */}
      <div className="sm:hidden bg-[#121212] py-2 px-4 border-t border-[#2a2a2a]">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 border border-[#333] rounded-lg leading-5 bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
            placeholder="Buscar tênis..."
          />
        </form>
      </div>
    </header>
  );
}
