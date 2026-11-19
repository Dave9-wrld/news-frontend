export default function LoadingSkeleton() {
  return (
    <div className="w-full space-y-8 animate-pulse">
      <div className="h-72 sm:h-96 rounded-2xl bg-[#f0f5f2] border border-[#e1ece5]" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-80 rounded-xl bg-white border border-[#e1ece5] flex flex-col justify-between p-4 sm:p-5 shadow-xs">
            <div className="h-44 rounded-lg bg-[#f0f5f2] w-full mb-4" />
            <div className="space-y-2.5">
              <div className="h-3.5 bg-[#e1ece5] rounded w-3/4" />
              <div className="h-3.5 bg-[#e1ece5]/70 rounded w-1/2" />
            </div>

            <div className="h-3.5 bg-[#e1ece5]/50 rounded w-1/3 mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
