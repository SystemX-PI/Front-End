import {
  BellRing,
  Check,
  CircleAlert,
  Info,
  Mail,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

type Tone = "blue" | "green" | "red" | "amber" | "purple" | "neutral";
type Service = "gmail" | "whatsapp" | "notifications";

const serviceIcons: Record<Service, LucideIcon> = {
  gmail: Mail,
  whatsapp: MessageCircle,
  notifications: BellRing,
};

export function StatusPill({ children, tone = "neutral", dot = true }: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span className={`status-pill status-${tone}`}>
      {dot ? <span className="status-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function ServiceIcon({ service, tone }: {
  service: Service;
  tone: "red" | "green" | "purple";
}) {
  const Icon = serviceIcons[service];
  return (
    <span className={`service-icon icon-${tone}`} aria-hidden="true">
      <Icon size={23} strokeWidth={2} />
    </span>
  );
}

export function InlineFeedback({ message, kind = "info" }: {
  message: string;
  kind?: "info" | "success" | "error";
}) {
  const FeedbackIcon = kind === "success" ? Check : kind === "error" ? CircleAlert : Info;
  return (
    <div className={`inline-feedback feedback-${kind}`} role="status">
      <FeedbackIcon size={17} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
