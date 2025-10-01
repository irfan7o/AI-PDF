export default function Logo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-10"
    >
      <path
        d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4Z"
        className="fill-primary"
        fill="hsl(var(--primary))"
      />
      <path
        d="M16 8V16H24C24 11.5817 20.4183 8 16 8Z"
        className="fill-primary-foreground"
        fill="hsl(var(--primary-foreground))"
      />
    </svg>
  );
}
