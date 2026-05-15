import RecommendedProducts from '@/components/RecommendedProducts';

export default function ClientRecommendationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Recommended for You</h1>
        <p className="text-zinc-400 mt-1 text-sm">Discover insurance products tailored to your needs using our ML-driven engine.</p>
      </div>

      <RecommendedProducts />
    </div>
  );
}
