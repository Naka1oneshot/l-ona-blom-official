import { Skeleton } from '@/components/ui/skeleton';

const ProductCardSkeleton = () => (
  <div className="animate-in fade-in duration-300">
    <Skeleton className="aspect-[3/4] w-full mb-4" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-1/3" />
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-3.5 rounded-full" />
        ))}
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
