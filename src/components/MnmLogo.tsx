/** Shared M&M brand assets (same logo as station login). */
export const MNM_LOGO_SRC = "/logo-1.png";

interface Props {
  className?: string;
  alt?: string;
}

export const MnmLogo = ({ className = "h-10 w-10 object-contain", alt = "M&M" }: Props) => (
  <img src={MNM_LOGO_SRC} alt={alt} className={className} />
);
