import { toast } from "sonner";

export function SuccessToast(message: string) {
  toast.success(message, {
    duration: 5000,
    action: {
      label: "Close",
      onClick: () => {},
    },
  });
}
export function ErrorToast(message: string) {
  toast.error(message, {
    duration: 5000,
    action: {
      label: "Close",
      onClick: () => {},
    },
  });
}
