import { useAuth } from "../context/AuthContext";
import {
  BookMarked,
  CircleDot,
  GitCommitHorizontal,
  GitPullRequest,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  {
    title: "Repositories",
    description: "Browse and search repositories for any user, org, or your own account.",
    icon: BookMarked,
    to: "/repos",
    color: "text-accent",
  },
  {
    title: "Issues",
    description: "List, search, and create issues in any repository you have access to.",
    icon: CircleDot,
    to: "/issues",
    color: "text-success",
  },
  {
    title: "Commits",
    description: "View commit history for any repository and branch.",
    icon: GitCommitHorizontal,
    to: "/commits",
    color: "text-warning",
  },
  {
    title: "Pull Requests",
    description: "Create pull requests to propose changes between branches.",
    icon: GitPullRequest,
    to: "/pulls",
    color: "text-[#8250df]",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <img
          src={user?.avatar_url}
          alt={user?.login}
          className="h-14 w-14 rounded-full border border-border"
        />
        <div>
          <h1 className="text-xl font-semibold text-primary">
            Welcome, {user?.name || user?.login}
          </h1>
          <a
            href={`https://github.com/${user?.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            @{user?.login} <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group flex gap-4 rounded-xl border border-border bg-canvas p-5 shadow-sm hover:border-accent/40 hover:shadow-md transition-all"
          >
            <div className={`mt-0.5 ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-primary group-hover:text-accent transition-colors">
                {card.title}
              </h2>
              <p className="mt-1 text-sm text-muted leading-relaxed">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
