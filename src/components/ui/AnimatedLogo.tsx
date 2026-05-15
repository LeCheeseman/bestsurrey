export function AnimatedLogo({ className = '' }: { className?: string }) {
  const outerPetals = Array.from({ length: 8 }, (_, index) => index * 45)
  const innerPetals = Array.from({ length: 8 }, (_, index) => index * 45)
  const dividerLines = Array.from({ length: 8 }, (_, index) => 22.5 + index * 45)

  return (
    <svg
      viewBox="0 0 500 510"
      role="img"
      aria-labelledby="best-surrey-animated-logo-title"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="best-surrey-animated-logo-title">Best Surrey logo</title>
      <g transform="translate(250,250)">
        {outerPetals.map((rotation, index) => (
          <path
            key={`outer-${rotation}`}
            className="animated-logo-petal"
            style={{ '--petal-index': index } as React.CSSProperties}
            d="M0,0 C-52,-30 -62,-90 0,-145 C62,-90 52,-30 0,0 Z"
            fill="#1a4a35"
            transform={`rotate(${rotation})`}
          />
        ))}

        {innerPetals.map((rotation) => (
          <path
            key={`inner-${rotation}`}
            d="M0,0 C-22,-12 -26,-38 0,-60 C26,-38 22,-12 0,0 Z"
            fill="#b8882a"
            transform={`rotate(${rotation})`}
          />
        ))}

        {dividerLines.map((rotation) => (
          <line
            key={`line-${rotation}`}
            x1="0"
            y1="0"
            x2="0"
            y2="-155"
            stroke="#ffffff"
            strokeWidth="4"
            transform={`rotate(${rotation})`}
          />
        ))}

        <circle cx="0" cy="0" r="7" fill="#ffffff" />
      </g>
    </svg>
  )
}
