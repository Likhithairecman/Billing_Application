import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  description: string;
  icon: ReactNode;
  to?: string;
}

export default function QuickAction({ title, description, icon, to }: Props) {
  const content = (
    <>
      <div className="quick-icon">{icon}</div>
      <div>
        <p className="eyebrow">{title}</p>
        {description && <p className="muted">{description}</p>}
      </div>
    </>
  );

  return (
    <>
      {to ? (
        <Link className="quick-card" to={to}>
          {content}
        </Link>
      ) : (
        <button className="quick-card" type="button">
          {content}
        </button>
      )}
    </>
  );
}
