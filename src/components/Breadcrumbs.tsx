import { Icon } from "@stellar/design-system";
import { Link, useLocation } from "react-router-dom";
import { UserRole } from "../interfaces/user-role";

interface BreadcrumbsProps {
  selectedRole?: UserRole | null;
}

export default function Breadcrumbs({ selectedRole }: BreadcrumbsProps) {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const getRouteLabel = (path: string) => {
    switch (path) {
      case "":
      case "/":
        return "Home";
      case "cars":
        return "Fleet";
      case "role-selection":
        return "Select Role";
      default:
        return path.charAt(0).toUpperCase() + path.slice(1);
    }
  };

  const getRouteIcon = (path: string) => {
    switch (path) {
      case "":
      case "/":
        return <Icon.Wallet02 className="w-4 h-4" />;
      case "cars":
        return <Icon.Car01 className="w-4 h-4" />;
      case "role-selection":
        return <Icon.UserCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoutePath = (index: number) => {
    return "/" + pathnames.slice(0, index + 1).join("/");
  };

  if (pathnames.length === 0) {
    return null;
  }

  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        <li>
          <Link
            to="/"
            className="text-white/60 hover:text-white transition-colors flex items-center gap-1"
          >
            <Icon.Wallet02 className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>
        {pathnames.map((path, index) => {
          const isLast = index === pathnames.length - 1;
          const routePath = getRoutePath(index);
          const label = getRouteLabel(path);
          const icon = getRouteIcon(path);

          return (
            <li key={path} className="flex items-center gap-2">
              <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {isLast ? (
                <span className="flex items-center gap-1.5 text-white font-medium">
                  {icon}
                  <span>{label}</span>
                  {selectedRole && path === "cars" && (
                    <span className="text-white/60 font-normal">
                      ({selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)})
                    </span>
                  )}
                </span>
              ) : (
                <Link
                  to={routePath}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
                >
                  {icon}
                  <span>{label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
