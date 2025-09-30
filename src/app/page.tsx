import StyleAnalyzer from '@/components/style-analyzer';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex flex-1 items-center justify-center">
        <StyleAnalyzer />
      </main>
    </div>
  );
}
