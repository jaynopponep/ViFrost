import * as React from "react";
import "./loader.css";

interface LoaderProps {
  size?: number;
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 180, text = "Loading" }) => {
  const letters = text.split("");

  return (
    <div
      className="relative flex items-center justify-center font-mono select-none"
      style={{ width: size, height: size }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className="inline-block text-[var(--colorText)] opacity-40 animate-loaderLetter"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {letter}
        </span>
      ))}

      <div className="absolute inset-0 rounded-full animate-loaderCircle"></div>
    </div>
  );
};
