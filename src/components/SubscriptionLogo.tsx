interface Props {
  name: string;
  logo?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-7 h-7 rounded-lg text-[10px]",
  md: "w-9 h-9 rounded-lg text-xs",
  lg: "w-10 h-10 rounded-xl text-sm",
};

const SubscriptionLogo = ({ name, logo, color, size = "md" }: Props) => {
  const sizeClass = sizeMap[size];

  if (logo) {
    return (
      <div
        className={`${sizeClass} shrink-0 overflow-hidden flex items-center justify-center`}
        style={{ backgroundColor: color || "#000" }}
      >
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center font-bold text-primary-foreground shrink-0`}
      style={{ backgroundColor: color || "hsl(270 70% 55%)" }}
    >
      {name[0]}
    </div>
  );
};

export default SubscriptionLogo;
