import { useCallback, useRef, useState } from "react"
import "./AuthPenguin.css"

// ported from the operator-supplied mockup. only the penguin is reused:
// eyes cover when a password field is focused, peek when the password is
// revealed, and gaze-track the caret of whatever identity field is focused.

const EYE_MAX_X = 48
const EYE_MAX_Y = 20
const BEAK_MAX_X = 30
const BEAK_MAX_Y = 12
const BEAK_MAX_ROT = 8 // degrees

export interface Gaze {
  nx: number // [-1, 1]
  ny: number // [-1, 1]
}

type Mode = "idle" | "covered" | "peeking"

// measure caret pixel offset with a shared canvas (no DOM mirror node).
let measureCtx: CanvasRenderingContext2D | null = null
function caretFraction(input: HTMLInputElement): number {
  const style = getComputedStyle(input)
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d")
  if (!measureCtx) return 0
  measureCtx.font = style.font || `${style.fontSize} ${style.fontFamily}`
  // selectionStart is unsupported on type=email/number/url/color/range:
  // chrome returns null, firefox throws. fall back to caret-at-end.
  let pos = input.value.length
  try {
    const sel = input.selectionStart
    if (sel !== null && sel !== undefined) pos = sel
  } catch {
    // intentional: keep value.length fallback
  }
  const upToCaret = input.value.substring(0, pos)
  const caretX = measureCtx.measureText(upToCaret).width
  const padL = parseFloat(style.paddingLeft) || 0
  const padR = parseFloat(style.paddingRight) || 0
  const innerW = input.clientWidth - padL - padR
  return innerW > 0 ? Math.min(caretX / innerW, 1) : 0
}

/**
 * Drives the penguin. Spread `identityField` onto username/email-style
 * inputs, `passwordField` onto password inputs, and render <AuthPenguin
 * {...penguin} />. `revealed` + `toggleReveal` back a show/hide button.
 */
export function useAuthPenguin() {
  const [mode, setMode] = useState<Mode>("idle")
  const [gaze, setGaze] = useState<Gaze | null>(null)
  const [revealed, setRevealed] = useState(false)
  const passwordFocused = useRef(false)

  const trackGaze = useCallback((el: HTMLInputElement) => {
    const frac = caretFraction(el)
    // empty (frac=0) still reads strongly left; typical typing reaches
    // center around frac=0.33 and clamps full-right by frac=0.71.
    const nx = Math.max(-1, Math.min(1, frac * 2.6 - 0.85))
    setGaze({ nx, ny: 0.35 })
  }, [])

  const identityField = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      setMode("idle")
      trackGaze(e.currentTarget)
    },
    onBlur: () => {
      if (!passwordFocused.current) setGaze(null)
    },
    onInput: (e: React.FormEvent<HTMLInputElement>) =>
      trackGaze(e.currentTarget),
    onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) =>
      trackGaze(e.currentTarget),
    onClick: (e: React.MouseEvent<HTMLInputElement>) =>
      trackGaze(e.currentTarget),
    onSelect: (e: React.SyntheticEvent<HTMLInputElement>) =>
      trackGaze(e.currentTarget),
  }

  const passwordField = {
    onFocus: () => {
      passwordFocused.current = true
      setGaze(null)
      setMode(revealed ? "peeking" : "covered")
    },
    onBlur: () => {
      passwordFocused.current = false
      setMode("idle")
    },
  }

  const toggleReveal = useCallback(() => {
    setRevealed((r) => {
      const next = !r
      if (next) setMode("peeking")
      else setMode(passwordFocused.current ? "covered" : "idle")
      return next
    })
  }, [])

  return {
    penguin: { covered: mode === "covered", peeking: mode === "peeking", gaze },
    identityField,
    passwordField,
    revealed,
    toggleReveal,
  }
}

/** Eye / eye-off icon for the password show-hide toggle. */
export function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <line x1="3" y1="3" x2="21" y2="21" /> : null}
    </svg>
  )
}

export interface AuthPenguinProps {
  covered: boolean
  peeking: boolean
  gaze: Gaze | null
}

export function AuthPenguin({ covered, peeking, gaze }: AuthPenguinProps) {
  const cls = `bear${covered ? " covered" : ""}${peeking ? " peeking" : ""}`

  const nx = gaze?.nx ?? 0
  const ny = gaze?.ny ?? 0
  const gazeTransform = gaze
    ? `translate(${nx * EYE_MAX_X} ${ny * EYE_MAX_Y})`
    : "translate(0 0)"
  const beakTransform = gaze
    ? `translate(${nx * BEAK_MAX_X} ${ny * BEAK_MAX_Y}) rotate(${-nx * BEAK_MAX_ROT})`
    : "translate(0 0) rotate(0)"

  return (
    <div className="penguin-wrap" aria-hidden="true">
      <svg className={cls} viewBox="0 0 1354 1393" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="penguin-circle-clip">
            <ellipse cx="677" cy="672.5" rx="677" ry="672.5" />
          </clipPath>
        </defs>

        <ellipse cx="677" cy="672.5" rx="677" ry="672.5" fill="#61B8FF" />

        <g clipPath="url(#penguin-circle-clip)">
          <g transform="translate(-11 18)">
            <g className="body-grp">
              <g className="wing-down">
                <path
                  d="M 172.52 974.13 C 189.28 925.28 220.83 888.74 242.52 861.95 C 264.21 835.16 313.83 793.09 330.76 782.10 C 347.69 771.12 363.71 763.52 380.08 756.52 C 396.46 749.53 411.99 741.12 432.43 731.24 C 452.88 721.37 599.71 742.65 599.71 742.65 L 402.03 958.12 C 402.03 958.12 380.76 986.12 364.88 1001.99 C 346.36 1020.48 334.84 1029.96 313.07 1044.50 C 293.32 1057.70 281.84 1065.08 259.68 1073.65 C 242.38 1080.34 210.44 1087.34 210.44 1087.34 C 210.44 1087.34 182.02 1093.30 169.07 1081.40 C 159.84 1072.92 156.83 1064.47 156.85 1051.72 C 156.88 1036.19 158.60 1029.10 161.62 1014.69 C 164.98 998.63 167.45 988.90 172.52 974.13 Z"
                  fill="black"
                  stroke="black"
                  strokeWidth="10"
                />
                <path
                  d="M 1199.19 982.13 C 1182.43 933.28 1150.89 896.74 1129.19 869.95 C 1107.50 843.16 1057.89 801.09 1040.96 790.10 C 1024.03 779.12 1008.01 771.52 991.63 764.52 C 975.26 757.53 959.73 749.12 939.28 739.24 C 918.83 729.37 772.00 750.65 772.00 750.65 L 969.68 966.12 C 969.68 966.12 990.95 994.12 1006.83 1009.99 C 1025.36 1028.48 1036.88 1037.96 1058.64 1052.50 C 1078.39 1065.70 1089.87 1073.08 1112.03 1081.65 C 1129.33 1088.34 1161.27 1095.34 1161.27 1095.34 C 1161.27 1095.34 1189.69 1101.30 1202.64 1089.40 C 1211.87 1080.92 1214.88 1072.47 1214.86 1059.72 C 1214.83 1044.19 1213.11 1037.10 1210.09 1022.69 C 1206.73 1006.63 1204.26 996.90 1199.19 982.13 Z"
                  fill="black"
                  stroke="black"
                  strokeWidth="10"
                />
              </g>

              <path
                d="M268.5 1233.5L309 1263L373.5 1315L578.5 1387L837 1368L1077 1228L1111.5 1203C1111.5 1203 1105.58 1187.81 1102 1178C1091.03 1147.95 1086.12 1130.66 1077 1100C1064.44 1057.78 1055.49 1034.41 1048 991C1041.9 955.617 1040.12 935.388 1039 899.5C1036.75 827.491 1055.32 787.994 1058 716C1059.51 675.413 1065.22 647.147 1058 612C1050.78 576.853 1051.54 555.801 1039.5 522C1027.92 489.505 999 443.5 999 443.5C999 443.5 959.922 400.643 929.5 380C896.468 357.586 875.063 348.53 837 336.5C810.706 328.19 795.305 325.356 768 321.5C716.184 314.182 686.207 317.912 634 321.5C607.561 323.317 592.525 323.497 566.5 328.5C528.359 335.832 506.453 341.569 472 359.5C437.601 377.403 418.387 390.126 392.5 419C366.613 447.874 356.655 468.597 342 504.5C331.397 530.475 327.615 546.012 322 573.5C315.358 606.014 313.069 624.814 313 658C312.94 686.815 317.898 702.729 319.5 731.5C323.236 798.58 319.639 836.414 316 903.5C313.858 942.993 313.129 965.22 308.5 1004.5C301.01 1068.05 287.759 1102.26 278 1165.5C273.911 1192 268.5 1233.5 268.5 1233.5Z"
                fill="black"
                stroke="black"
                strokeWidth="10"
              />

              <path
                d="M486.887 498.985C500.217 497.95 506.123 496.088 518.127 496.986C523.572 497.393 526.555 497.882 532.082 498.915C539.262 500.256 542.931 500.834 549.258 503.186C556.581 505.909 560.207 508.289 567.355 512.744C572.658 516.048 575.47 518.05 580.411 521.931C582.524 523.591 585.185 525.887 587.363 527.812C588.442 528.765 589.385 529.611 590.057 530.219C590.392 530.522 590.661 530.766 590.844 530.932C590.892 530.976 590.935 531.015 590.971 531.048L603.331 544.397L603.475 544.552L603.631 544.695L607 541C603.744 544.571 603.635 544.691 603.632 544.695L603.643 544.706C603.649 544.712 603.659 544.72 603.67 544.73C603.693 544.751 603.725 544.78 603.767 544.818C603.85 544.894 603.973 545.003 604.129 545.142C604.441 545.422 604.893 545.822 605.461 546.317C606.595 547.306 608.197 548.677 610.08 550.213C613.802 553.248 618.789 557.065 623.47 559.812C644.204 571.979 658.51 578.583 683.316 579.497C696.812 579.994 707.157 579.419 716.915 576.368C726.704 573.308 735.486 567.89 746.118 559.409C752.342 554.444 760.908 547.136 767.875 541.109C771.368 538.087 774.476 535.373 776.71 533.414C777.827 532.434 778.727 531.643 779.348 531.096C779.658 530.823 779.898 530.611 780.062 530.467C780.143 530.395 780.206 530.34 780.248 530.302C780.269 530.284 780.284 530.27 780.295 530.26C780.3 530.256 780.305 530.252 780.308 530.25L780.312 530.246L780.344 530.218L780.376 530.188C780.377 530.187 780.379 530.185 780.382 530.182C780.388 530.177 780.399 530.167 780.413 530.154C780.442 530.128 780.486 530.088 780.546 530.034C780.665 529.926 780.844 529.766 781.079 529.556C781.549 529.137 782.241 528.527 783.113 527.773C784.861 526.265 787.325 524.192 790.186 521.937C795.996 517.358 803.11 512.295 809.091 509.542C826.008 501.753 837.198 501.971 857.118 501.499C870.248 501.188 877.475 501.324 889.993 503.897C902.497 506.467 909.279 508.87 920.808 514.494C931.274 519.6 936.767 523.111 945.875 530.403C952.351 535.588 955.69 538.745 961.314 544.879C968.029 552.202 971.227 556.748 976.824 565.25C981.908 572.972 984.468 577.405 988.505 585.69C990.317 589.409 992.385 594.39 994.027 598.519C994.842 600.568 995.539 602.377 996.033 603.673C996.28 604.32 996.475 604.839 996.608 605.194C996.666 605.347 996.712 605.47 996.745 605.559L1000.65 619.231L1007.58 650.39L1013 688.851V728.922L1011.01 788.61L1005.04 837.898L1005.03 837.95L1005.02 838.003L1000.52 883.003L1000.51 883.153L1000.5 883.305L999.004 921.805L998.988 922.194L999.034 922.581L1004.53 969.581L1004.56 969.844L1004.62 970.101L1015.12 1016.6L1015.15 1016.74L1015.19 1016.88L1031.69 1074.38L1031.71 1074.45L1031.74 1074.52L1062.66 1171.77L1068.1 1198.02L1068.11 1198.06L1068.12 1198.1L1074.25 1225.25L816.647 1351.59L635.46 1366.45L379.396 1297.33L309.214 1258.18L310.487 1240.36L310.516 1239.96L310.481 1239.57L309.503 1228.32L309.995 1199.81L313.958 1162.16L319.923 1125.38L326.889 1090.05L335.383 1051.58L335.394 1051.53L335.403 1051.48L340.879 1024.1L346.344 1002.74L346.383 1002.59L346.412 1002.44L354.443 960.271L354.463 960.105L356.963 939.605L356.973 939.524L356.98 939.443L360.98 894.443L360.991 894.317L360.996 894.192L361.496 881.192L361.498 881.128L361.998 861.628L362 861.564V847.071L362.499 825.114L362.502 824.95L362.495 824.788L361.495 801.288L361.493 801.234L361.49 801.181L359.99 777.681L359.989 777.675L358.489 754.675L358.484 754.597L358.477 754.521L356.006 728.833L356.496 711.18L357.487 690.374L359.96 666.632L364.418 635.926C364.446 635.807 364.485 635.639 364.535 635.426C364.643 634.966 364.802 634.297 365.003 633.461C365.404 631.788 365.973 629.451 366.641 626.799C367.983 621.467 369.704 614.961 371.269 610.005L371.423 609.514C376.379 593.814 379.15 585.055 386.888 570.898C392.971 559.768 396.789 553.842 404.838 544.205C408.655 539.635 414.213 534.185 418.929 529.792C421.265 527.615 423.354 525.734 424.858 524.398C425.61 523.731 426.215 523.2 426.63 522.839C426.807 522.684 426.949 522.559 427.054 522.469C427.152 522.402 427.283 522.313 427.442 522.205C427.844 521.933 428.432 521.537 429.171 521.047C430.65 520.064 432.727 518.706 435.112 517.209C439.937 514.18 445.828 510.706 450.568 508.552C456.928 505.663 460.616 504.463 467.518 502.264C471.133 501.113 472.457 500.516 475.494 499.9C479.749 499.037 481.346 499.415 486.887 498.985Z"
                fill="white"
                stroke="black"
                strokeWidth="10"
              />

              <path
                className="beak"
                d="M 780.00 730.30 C 780.00 765.64 690.00 814.80 690.00 814.80 C 690.00 814.80 600.00 765.64 600.00 730.30 C 600.00 694.95 640.29 666.30 690.00 666.30 C 739.70 666.30 780.00 694.95 780.00 730.30 Z"
                fill="#E9C060"
                transform={beakTransform}
              />

              <g className="gaze" transform={gazeTransform}>
                <g className="eye-grp eye-L">
                  <circle cx="529.00" cy="666.30" r="73" fill="black" />
                  <path
                    d="M 567.50 654.80 C 567.50 667.22 557.20 677.30 544.50 677.30 C 531.80 677.30 521.50 667.22 521.50 654.80 C 521.50 642.37 531.80 632.30 544.50 632.30 C 557.20 632.30 567.50 642.37 567.50 654.80 Z"
                    fill="white"
                  />
                  <ellipse
                    cx="497.78"
                    cy="695.75"
                    rx="12.5"
                    ry="17.5"
                    transform="rotate(-39.5643 497.78 695.75)"
                    fill="#102644"
                  />
                </g>
                <g className="eye-grp eye-R">
                  <circle cx="845.00" cy="666.30" r="73" fill="black" />
                  <path
                    d="M 806.50 654.80 C 806.50 667.22 816.80 677.30 829.50 677.30 C 842.20 677.30 852.50 667.22 852.50 654.80 C 852.50 642.37 842.20 632.30 829.50 632.30 C 816.80 632.30 806.50 642.37 806.50 654.80 Z"
                    fill="white"
                  />
                  <ellipse
                    cx="12.5"
                    cy="17.5"
                    rx="12.5"
                    ry="17.5"
                    transform="matrix(-0.770911 -0.636943 -0.636943 0.770911 897.00 690.22)"
                    fill="#102644"
                  />
                </g>
              </g>

              <g className="wing-up">
                <path
                  d="M 539.99 572.76 C 490.98 589.02 454.11 620.19 427.10 641.60 C 400.09 663.02 357.51 712.20 346.35 729.02 C 335.20 745.83 327.43 761.78 320.27 778.08 C 313.11 794.38 304.54 809.83 294.45 830.17 C 284.37 850.51 304.15 997.56 304.15 997.56 L 521.63 802.09 C 521.63 802.09 549.85 781.11 565.87 765.39 C 584.55 747.06 594.16 735.64 608.92 714.02 C 622.32 694.41 629.82 683.00 638.61 660.94 C 645.48 643.70 652.81 611.84 652.81 611.84 C 652.81 611.84 659.06 583.48 647.30 570.41 C 638.91 561.09 630.49 557.99 617.74 557.89 C 602.21 557.75 595.10 559.40 580.66 562.28 C 564.57 565.47 554.81 567.84 539.99 572.76 Z"
                  fill="black"
                  stroke="black"
                  strokeWidth="10"
                />
                <path
                  d="M 809.73 572.76 C 858.74 589.02 895.61 620.19 922.62 641.60 C 949.63 663.02 992.20 712.20 1003.36 729.02 C 1014.52 745.83 1022.28 761.78 1029.44 778.08 C 1036.60 794.38 1045.18 809.83 1055.26 830.17 C 1065.34 850.51 1045.57 997.56 1045.57 997.56 L 828.08 802.09 C 828.08 802.09 799.86 781.11 783.84 765.39 C 765.16 747.06 755.56 735.64 740.80 714.02 C 727.40 694.41 719.90 683.00 711.10 660.94 C 704.23 643.70 696.90 611.84 696.90 611.84 C 696.90 611.84 690.65 583.48 702.42 570.41 C 710.80 561.09 719.23 557.99 731.98 557.89 C 747.50 557.75 754.61 559.40 769.05 562.28 C 785.14 565.47 794.90 567.84 809.73 572.76 Z"
                  fill="black"
                  stroke="black"
                  strokeWidth="10"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
