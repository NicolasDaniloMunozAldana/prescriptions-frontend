export default function NutrabioticsLogo() {
  return (
    <div className="flex items-center gap-2">
      {/* Cube/package icon */}
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-base font-semibold text-gray-800">Nutrabiotics</span>
    </div>
  );
}
