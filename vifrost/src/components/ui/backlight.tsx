import { useId, type ReactElement } from "react"

type BacklightProps = {
  children?: ReactElement
  className?: string
  blur?: number
}

export function Backlight({ blur = 20, children, className }: BacklightProps) {
  const id = useId()

  return (
    <div className={className}>
      <svg width="0" height="0" aria-hidden="true">
        <filter id={id} y="-150%" x="-150%" width="400%" height="400%">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={blur}
            result="blurred"
          ></feGaussianBlur>
          <feColorMatrix
            type="saturate"
            in="blurred"
            values="4"
          ></feColorMatrix>
          <feComposite in="SourceGraphic" operator="over"></feComposite>
        </filter>
      </svg>

      <div style={{ filter: `url(#${id})` }}>{children}</div>
    </div>
  )
}
