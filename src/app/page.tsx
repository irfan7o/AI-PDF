import Header from '@/components/layout/header';
import StyleAnalyzer from '@/components/style-analyzer';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1">
        <StyleAnalyzer />
      </main>
    </div>
  );
}
