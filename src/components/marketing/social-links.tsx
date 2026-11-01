import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { getWhatsAppBusinessNumber } from "@/lib/whatsapp";

const whatsappNumber = getWhatsAppBusinessNumber();
const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/dukaos/",
    icon: FaInstagram,
  },
  ...(whatsappNumber
    ? [{
        label: "WhatsApp",
        href: `https://wa.me/${whatsappNumber}`,
        icon: FaWhatsapp,
      }]
    : []),
  {
    label: "Facebook",
    href: "https://www.facebook.com/dukaos/",
    icon: FaFacebookF,
  },
] as const;

export function SocialLinks({
  className,
  linkClassName,
}: {
  className?: string;
  linkClassName?: string;
}) {
  return (
    <div role="group" aria-label="DukaOS social media" className={className}>
      {socialLinks.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`DukaOS on ${label}`}
          title={label}
          className={linkClassName}
        >
          <Icon aria-hidden="true" size={18} />
          <span>{label}</span>
        </a>
      ))}
    </div>
  );
}
