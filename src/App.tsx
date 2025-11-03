import { Icon } from "@stellar/design-system";
import { Outlet, Route, Routes, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import ConnectWallet from "./pages/ConnectWallet";
import { useStellarAccounts } from "./providers/StellarAccountProviders";
import RoleSelection from "./pages/RoleSelection";
import Dashboard from "./pages/Dashboard";
import { shortenAddress } from "./utils/shorten-address";
import { UserRole } from "./interfaces/user-role";
import Breadcrumbs from "./components/Breadcrumbs";
import { walletService } from "./services/wallet.service";

const AppLayout: React.FC = () => {
  const { walletAddress, selectedRole, setSelectedRole, setWalletAddress } = useStellarAccounts();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [focusedRoleIndex, setFocusedRoleIndex] = useState(-1);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const getRoleIcon = (role: UserRole | null = selectedRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Icon.UserSquare className="w-4 h-4" />;
      case UserRole.OWNER:
        return <Icon.Car01 className="w-4 h-4" />;
      case UserRole.RENTER:
        return <Icon.UserCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: UserRole | null = selectedRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-purple-100 text-purple-700 border-purple-300";
      case UserRole.OWNER:
        return "bg-green-100 text-green-700 border-green-300";
      case UserRole.RENTER:
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Administrator";
      case UserRole.OWNER:
        return "Car Owner";
      case UserRole.RENTER:
        return "Renter";
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsDropdownOpen(false);
    setFocusedRoleIndex(-1);
    if (location.pathname === "/") {
      navigate("/cars");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await walletService.disconnect();
      localStorage.removeItem("wallet");
      setWalletAddress("");
      setIsUserMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  // Keyboard navigation for role dropdown
  const handleRoleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const roles = [UserRole.ADMIN, UserRole.OWNER, UserRole.RENTER];
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = index < roles.length - 1 ? index + 1 : 0;
      setFocusedRoleIndex(nextIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index > 0 ? index - 1 : roles.length - 1;
      setFocusedRoleIndex(prevIndex);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (index >= 0 && index < roles.length) {
        handleRoleSelect(roles[index]);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setFocusedRoleIndex(-1);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setFocusedRoleIndex(-1);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest("[data-mobile-menu-button]")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const roles = [UserRole.ADMIN, UserRole.OWNER, UserRole.RENTER];

  return (
    <main className="min-h-screen flex flex-col">
      {/* Premium Navigation Header */}
      <header className="glass-dark sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand - Clickable */}
            <NavLink
              to="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#00B8E6] shadow-lg shadow-[#00D4FF]/30">
                <Icon.Car01 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Stellar Motors
                </h1>
                <p className="text-xs text-white/60">Premium Rentals</p>
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                Connect
              </NavLink>

              {selectedRole && walletAddress && (
                <NavLink
                  to="/cars"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-white/10 text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  Fleet
                </NavLink>
              )}
            </nav>

            {/* Right Side: Wallet, Role & Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Role Dropdown */}
              {walletAddress && (
                <div className="relative" ref={roleDropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setIsDropdownOpen(!isDropdownOpen);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                      selectedRole
                        ? getRoleColor()
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                    aria-label="Select role"
                    aria-expanded={isDropdownOpen}
                  >
                    {selectedRole ? (
                      <>
                        {getRoleIcon()}
                        <span className="capitalize hidden sm:inline">{selectedRole}</span>
                      </>
                    ) : (
                      <>
                        <Icon.UserCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Select Role</span>
                      </>
                    )}
                    <Icon.ArrowDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-fade-in"
                      role="menu"
                    >
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Select Role
                        </p>
                      </div>
                      {roles.map((role, index) => (
                        <button
                          key={role}
                          onClick={() => handleRoleSelect(role)}
                          onKeyDown={(e) => handleRoleKeyDown(e, index)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            selectedRole === role
                              ? getRoleColor(role) + " opacity-100"
                              : focusedRoleIndex === index
                              ? "bg-gray-100 text-gray-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                          role="menuitem"
                          tabIndex={0}
                        >
                          <div className="flex-shrink-0">
                            {getRoleIcon(role)}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">{getRoleLabel(role)}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {role}
                            </div>
                          </div>
                          {selectedRole === role && (
                            <Icon.Check className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* User Menu Dropdown */}
              {walletAddress && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all"
                    aria-label="User menu"
                    aria-expanded={isUserMenuOpen}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm font-mono text-white font-medium hidden sm:inline">
                        {shortenAddress(walletAddress)}
                      </span>
                      <span className="text-sm font-mono text-white font-medium sm:hidden">
                        {walletAddress.slice(0, 6)}...
                      </span>
                    </div>
                    <Icon.ArrowDown
                      className={`w-3 h-3 text-white transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            Connected
                          </span>
                        </div>
                        <p className="text-sm font-mono text-gray-900 break-all">
                          {walletAddress}
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => copyToClipboard(walletAddress)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>{copiedAddress ? "Copied!" : "Copy Address"}</span>
                        </button>
                        <button
                          onClick={() => handleDisconnect()}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Disconnect Wallet</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                data-mobile-menu-button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Slide-in Menu */}
            <div
              ref={mobileMenuRef}
              className="fixed top-20 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out"
            >
              <div className="p-6 space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Navigation</h2>
                  <nav className="space-y-2">
                    <NavLink
                      to="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                          isActive
                            ? "bg-[#00D4FF]/10 text-[#00D4FF]"
                            : "text-gray-700 hover:bg-gray-50"
                        }`
                      }
                    >
                      Connect
                    </NavLink>
                    {selectedRole && walletAddress && (
                      <NavLink
                        to="/cars"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `block px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                            isActive
                              ? "bg-[#00D4FF]/10 text-[#00D4FF]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`
                        }
                      >
                        Fleet
                      </NavLink>
                    )}
                  </nav>
                </div>

                {/* Role Selection in Mobile Menu */}
                {walletAddress && (
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      Select Role
                    </h3>
                    <div className="space-y-2">
                      {roles.map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            handleRoleSelect(role);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            selectedRole === role
                              ? getRoleColor(role)
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {getRoleIcon(role)}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold">{getRoleLabel(role)}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {role}
                            </div>
                          </div>
                          {selectedRole === role && (
                            <Icon.Check className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wallet Info in Mobile Menu */}
                {walletAddress && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      Wallet
                    </h3>
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          Connected
                        </span>
                      </div>
                      <p className="text-sm font-mono text-gray-900 break-all mb-3">
                        {walletAddress}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(walletAddress)}
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {copiedAddress ? "Copied!" : "Copy"}
                        </button>
                        <button
                          onClick={() => {
                            handleDisconnect();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Breadcrumbs */}
      <div className="glass-dark border-b border-white/10">
        <Breadcrumbs selectedRole={selectedRole} />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>

      {/* Premium Footer */}
      <footer className="glass-dark border-t border-white/10 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <span>© {new Date().getFullYear()} Stellar Motors</span>
              <span>•</span>
              <span>Built on Stellar</span>
            </div>
            <a
              href="http://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Apache License 2.0
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<ConnectWallet />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/cars" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
