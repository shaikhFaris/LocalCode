import { ModeToggle } from "./mode-toggle";

export default function Navbar() {
  return (
    <div className="px-2 md:px-4 sticky top-0 w-full flex items-center justify-between py-2">
      <h2 className="font-semibold">LocalCode</h2>
      <ModeToggle />
    </div>
  );
}
