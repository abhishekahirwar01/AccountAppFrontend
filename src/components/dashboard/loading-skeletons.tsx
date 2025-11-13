import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function KpiSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-1/2 mb-2 animate-pulse" />
            <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProductStockSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded w-1/4 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-40 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function RecentTransactionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}