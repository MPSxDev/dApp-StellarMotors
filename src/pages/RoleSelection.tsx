import { Icon } from "@stellar/design-system";
import { useNavigate } from "react-router-dom";
import { useStellarAccounts } from "../providers/StellarAccountProviders";
import { UserRole } from "../interfaces/user-role";

interface RoleCardProps {
  role: UserRole;
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  bgColor: string;
  iconBg: string;
  isSelected: boolean;
  onSelect: () => void;
}

const RoleCard = ({
  role: _role,
  icon,
  title,
  description,
  benefits,
  gradientFrom,
  gradientTo,
  borderColor,
  bgColor,
  iconBg,
  isSelected,
  onSelect,
}: RoleCardProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left overflow-hidden ${
        isSelected
          ? `${borderColor} ${bgColor} shadow-2xl scale-[1.02]`
          : `border-gray-200 bg-white hover:${borderColor} hover:shadow-xl hover:scale-[1.02]`
      }`}
    >
      {/* Gradient Background Overlay */}
      <div
        className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${
          isSelected ? "opacity-10" : "group-hover:opacity-5"
        }`}
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 space-y-6">
        {/* Icon */}
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
            isSelected ? iconBg : `bg-gray-50 group-hover:${iconBg}`
          }`}
        >
          <div
            className={`transition-transform duration-300 ${
              isSelected ? "scale-110" : "group-hover:scale-110"
            }`}
          >
            {icon}
          </div>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>

        {/* Benefits List */}
        <div className="space-y-2 pt-4 border-t border-gray-100">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-2">
              <Icon.Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSelected ? "text-green-600" : "text-gray-400 group-hover:text-green-500"}`} />
              <span className="text-sm text-gray-600">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg animate-pulse" />
        </div>
      )}
    </button>
  );
};

export default function RoleSelection() {
  const { setSelectedRole, selectedRole } = useStellarAccounts();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    localStorage.setItem("role", role);
    setSelectedRole(role);
    void navigate("/cars");
  };

  const roles = [
    {
      role: UserRole.ADMIN,
      icon: <Icon.UserSquare className="w-8 h-8 text-purple-600" />,
      title: "Administrator",
      description: "Manage the platform, add cars, and control system settings.",
      benefits: [
        "Add and remove vehicles",
        "Set commission rates",
        "Monitor platform activity",
        "Access admin dashboard",
      ],
      gradientFrom: "#9333EA",
      gradientTo: "#A855F7",
      borderColor: "border-purple-500",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
    },
    {
      role: UserRole.OWNER,
      icon: <Icon.Car01 className="w-8 h-8 text-green-600" />,
      title: "Car Owner",
      description: "List your vehicles and earn passive income from rentals.",
      benefits: [
        "Track rental status",
        "Withdraw earnings",
        "View rental history",
        "Manage your fleet",
      ],
      gradientFrom: "#10B981",
      gradientTo: "#34D399",
      borderColor: "border-green-500",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
    },
    {
      role: UserRole.RENTER,
      icon: <Icon.UserCircle className="w-8 h-8 text-blue-600" />,
      title: "Renter",
      description: "Browse and rent premium vehicles with transparent pricing.",
      benefits: [
        "Browse available cars",
        "Secure payments",
        "Easy rental management",
        "Return when ready",
      ],
      gradientFrom: "#3B82F6",
      gradientTo: "#60A5FA",
      borderColor: "border-blue-500",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-white to-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
            Choose Your <span className="text-gradient">Role</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select how you want to interact with Stellar Motors. Each role has unique features and capabilities.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {roles.map((roleData) => (
            <RoleCard
              key={roleData.role}
              {...roleData}
              isSelected={selectedRole === roleData.role}
              onSelect={() => handleRoleSelect(roleData.role)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
