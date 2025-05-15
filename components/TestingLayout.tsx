// components/TestingLayout.tsx
import { ComponentChildren } from "preact";
import Header from "./Header.tsx";

export default function TestingLayout(
  { children }: { children: ComponentChildren },
) {
  return (
    <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      <div class="flex flex-1 items-center justify-center py-8">
        <div class="
          border-2 border-dashed border-gray-400 rounded-2xl
          min-w-[320px] w-1/2
          bg-white dark:bg-gray-800
          p-8
          shadow-lg
          flex flex-col items-center
        ">
          <div class="flex flex-col md:flex-row gap-6 w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
