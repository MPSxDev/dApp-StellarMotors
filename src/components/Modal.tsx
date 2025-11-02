import { Icon } from "@stellar/design-system";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  closeModal: () => void;
}

export default function Modal({ title, children, closeModal }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <Icon.X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
