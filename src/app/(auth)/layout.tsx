import { Doodles, Logo } from "@/components/ui/doodles";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bd-paper bd-margin flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <Doodles className="h-10 w-24" />
        </div>
        {children}
      </div>
    </div>
  );
}
