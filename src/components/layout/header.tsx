import Logo from "@/components/logo";
import LanguageSelector from "@/components/language-selector";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
      <Logo />
      <LanguageSelector />
    </header>
  );
}
