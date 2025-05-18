// components/TestingLayout.tsx
import { ComponentChildren } from "preact";
import Header from "./Header.tsx";

export default function TestingLayout(
  { children }: { children: ComponentChildren },
) {
  return (
    <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 my-colors-transition">
      <Header />
      <div class="flex flex-1 items-center justify-center py-8">
        <div class="
          border-2 border-dashed border-gray-400 rounded-2xl
          min-w-[320px] w-1/2
          bg-transparent
          p-8
          flex flex-col items-center
        ">
          {children}
        </div>
      </div>
    </div>
  );
}
