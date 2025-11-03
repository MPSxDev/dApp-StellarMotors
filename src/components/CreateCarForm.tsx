import { Icon } from "@stellar/design-system";
import { useState } from "react";
import { CreateCar } from "../interfaces/create-car";
import Modal from "./Modal";

interface CreateCarFormProps {
  onCreateCar: (formData: CreateCar) => Promise<void>;
  onCancel: () => void;
}

export const CreateCarForm = ({
  onCreateCar,
  onCancel,
}: CreateCarFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCar>({
    brand: "",
    model: "",
    color: "",
    passengers: 1,
    pricePerDay: 0,
    ac: false,
    ownerAddress: "",
    commissionPercentage: 5, // Default 5%
  });

  // Keep string values for number inputs while typing
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>({
    passengers: "1",
    pricePerDay: "0",
    commissionPercentage: "5",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === "number") {
      // Keep string value for display while typing
      setNumberInputs((prev) => ({
        ...prev,
        [name]: value,
      }));
      
      // Update actual formData with numeric value
      const numValue = value === "" 
        ? (name === "commissionPercentage" ? 0 : (name === "passengers" ? 1 : 0))
        : Number(value);
      
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onCreateCar(formData);
    } catch (error) {
      console.error("Error creating car:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInputField = (
    label: string,
    name: string,
    type: string = "text",
    icon?: React.ReactNode,
    placeholder?: string,
    required: boolean = false,
    min?: number,
    max?: number,
  ) => {
    const inputValue: string | number = type === "number"
      ? (numberInputs[name] ?? String(formData[name as keyof CreateCar] ?? ""))
      : String(formData[name as keyof CreateCar] ?? "");
    
    return (
      <div>
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-white/90 mb-2"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
              {icon}
            </div>
          )}
          <input
            id={name}
            name={name}
            type={type}
            step={type === "number" ? (name === "commissionPercentage" ? "0.01" : "1") : undefined}
            value={inputValue}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            min={min}
            max={max}
            className={`w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D4FF] focus:border-transparent transition-all duration-200 ${
              icon ? "pl-11" : ""
            }`}
          />
        </div>
      </div>
    );
  };

  return (
    <Modal title="Add New Vehicle" closeModal={onCancel}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {renderInputField(
            "Brand",
            "brand",
            "text",
            <Icon.Car01 className="w-5 h-5" />,
            "e.g., Tesla, BMW, Mercedes",
            true
          )}

          {renderInputField(
            "Model",
            "model",
            "text",
            <Icon.Car01 className="w-5 h-5" />,
            "e.g., Model 3, X5, S-Class",
            true
          )}

          {renderInputField(
            "Color",
            "color",
            "text",
            undefined,
            "e.g., Black, White, Red",
            true
          )}

          {renderInputField(
            "Passengers",
            "passengers",
            "number",
            <Icon.Users01 className="w-5 h-5" />,
            undefined,
            true,
            1,
            10
          )}

          {renderInputField(
            "Price per Day (XLM)",
            "pricePerDay",
            "number",
            <Icon.Wallet02 className="w-5 h-5" />,
            "0.00",
            true,
            0
          )}

          <div className="md:col-span-2">
            {renderInputField(
              "Owner Address",
              "ownerAddress",
              "text",
              <Icon.User01 className="w-5 h-5" />,
              "Stellar address (G...)",
              true
            )}
          </div>

          <div className="md:col-span-2">
            {renderInputField(
              "Commission Percentage (%)",
              "commissionPercentage",
              "number",
              <Icon.Wallet02 className="w-5 h-5" />,
              "5.00",
              true,
              0,
              100
            )}
            <p className="text-xs text-white/50 mt-2 ml-1">
              Required: Set the commission percentage charged per rental (e.g., 5 for 5%)
            </p>
          </div>
        </div>

        {/* AC Checkbox */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
          <input
            id="ac"
            name="ac"
            type="checkbox"
            checked={formData.ac}
            onChange={handleChange}
            className="w-5 h-5 rounded border-white/30 bg-white/10 text-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF] focus:ring-offset-2 focus:ring-offset-transparent cursor-pointer"
          />
          <label
            htmlFor="ac"
            className="flex items-center gap-2 text-white/90 font-medium cursor-pointer"
          >
            <Icon.CheckCircle className="w-5 h-5 text-[#00D4FF]" />
            <span>Air Conditioning</span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-[#00B8E6] hover:from-[#00B8E6] hover:to-[#0099CC] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Icon.CheckCircle className="w-5 h-5" />
                <span>Create Vehicle</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
