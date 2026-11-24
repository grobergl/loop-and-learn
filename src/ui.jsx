import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  FolderHeart,
  Layers,
  GraduationCap,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Heart,
  MoreHorizontal,
  Leaf,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Download,
  Settings,
  ExternalLink,
  Scissors,
  Sparkles,
  Menu,
  Minus,
  Pencil,
  Trash2,
  ArrowLeft,
  Info,
} from "lucide-react";

export function Stat({ icon: Icon, label, value, note, color, onClick }) {
  return (
    <button className="stat-card" onClick={onClick}>
      <div className="stat-top">
        <span>{label}</span>
        <span className={"icon-tile " + color}>
          <Icon size={17} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </button>
  );
}
export function SectionTitle({ title, subtitle, action, onClick }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && (
        <button className="text-link" onClick={onClick}>
          {action}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  text,
  action,
  onClick,
  secondaryAction,
  onSecondaryClick,
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {(action || secondaryAction) && (
        <div className="heading-actions">
          {secondaryAction && (
            <button className="button outline" onClick={onSecondaryClick}>
              <Plus size={16} />
              {secondaryAction}
            </button>
          )}
          {action && (
            <button className="button primary" onClick={onClick}>
              <Plus size={16} />
              {action}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
export function SearchInput({ query, setQuery, placeholder }) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <button aria-label="Clear search" onClick={() => setQuery("")}>
          <X size={15} />
        </button>
      )}
    </div>
  );
}
export function Empty({ icon: Icon, title, text, action, onClick }) {
  return (
    <div className="empty">
      <Icon size={32} strokeWidth={1.3} />
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="button outline" onClick={onClick}>
        {action}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
export function download(data, name, type = "application/json") {
  const blob = new Blob([data], { type }),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
