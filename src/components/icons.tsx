import type { SVGProps } from 'react';

export function NiyatiVerseLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 3L4 12L9 21" stroke="hsl(var(--primary))" />
      <path d="M15 3L20 12L15 21" stroke="hsl(var(--primary))" />
      <path d="M12 8l-2 3h4l-2 3" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" />
    </svg>
  );
}
