

import { useTRPC } from "@/trpc/client";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Client } from "./client";
import { Suspense } from "react";

export default function Home() {
  const query = getQueryClient()
  void query.prefetchQuery(trpc.createAi.queryOptions({text: 'sairah'}))
  

    
  return (
<HydrationBoundary state={dehydrate(query)}>
  <Suspense>
    <Client/>
  </Suspense>
</HydrationBoundary>
  );
}
