import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ✅ الخلاصة

// QueryClient = المخ بتاع React Query (بيخزن البيانات والـ cache).

// QueryClientProvider = بيخلي الـ client ده متاح لكل components.

// QueryProvider = wrapper بسيط عشان تنظّم الكود وتستعمله مرة واحدة في root app.
