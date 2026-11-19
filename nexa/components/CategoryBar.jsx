"use client";

export const CATEGORIES = [
  { id: "all", label: "Top Stories" },
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business & Finance" },
  { id: "science", label: "Science" },
  { id: "sports", label: "Sports" },
  { id: "entertainment", label: "Culture & Arts" },
  { id: "health", label: "Health" },
];

export default function CategoryBar({
  selectedCategory,
  onSelectCategory,
}) {
  return (
    <div className="w-full bg-white/90 backdrop-blur-sm border-b border-[#e1ece5] py-2 fixed top-[64px] left-0 right-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <nav className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar py-0.5 scroll-smooth">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#eaf5ee] text-[#16834f] border border-[#a7ccb5] shadow-xs"
                    : "text-[#455c50] hover:text-[#112117] hover:bg-[#f0f5f2] border border-transparent"
                }`}
              >
                {cat.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#16834f] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}