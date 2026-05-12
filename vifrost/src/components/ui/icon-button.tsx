import { type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function IconButton({
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "grid h-9 w-9 place-items-center !p-0 rounded-md border border-[color:var(--colorSoftBorder)] bg-[var(--colorStatCard)] text-[var(--colorText)] transition-colors hover:border-[color:var(--colorAccentBorder)] hover:bg-[var(--colorCyanDim)] hover:text-[var(--colorCyan)]",
        className,
      )}
      {...rest}
    />
  )
}
