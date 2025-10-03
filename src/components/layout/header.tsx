import Logo from '@/components/logo';
import LanguageSelector from '@/components/language-selector';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4">
        <Logo />
        <LanguageSelector />
    </header>
  );
}
