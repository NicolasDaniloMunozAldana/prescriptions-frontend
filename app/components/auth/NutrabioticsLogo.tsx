import Image from "next/image";

export default function NutrabioticsLogo() {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/Nutrabiotics_Logo.svg"
        alt="Nutrabiotics"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className="text-base font-semibold text-gray-800">Nutrabiotics</span>
    </div>
  );
}
