import { Toaster as Sonner, type ToasterProps } from "sonner"

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--colorSurface)] group-[.toaster]:text-[var(--colorText)] group-[.toaster]:border-[color:var(--colorSoftBorder)] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[var(--colorTextMuted)]",
          actionButton:
            "group-[.toast]:bg-[var(--colorCyan)] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[var(--colorSurfaceAlt)] group-[.toast]:text-[var(--colorText)]",
        },
      }}
      {...props}
    />
  )
}
