export interface PurchaseRequest {
  patient_record_id: string;
  kiosk_device_id: string;
  charge_fee: number;
  currency: "usd" | "khr";
  patient_name: string;
}

export interface AbaPurchaseResponse {
  success: boolean;
  tran_id: string;
  req_time: string;
  merchant_id: string;
  amount: string; // Keep as string "2.50" to avoid float truncation
  currency: string;
  items: string;
  hash: string;
  payment_option: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  type?: string;
  shipping?: string;
  continue_success_url?: string;
  cancel_url?: string;
  return_url?: string;
  return_deeplink?: string;
  custom_fields?: string;
  return_params?: string;
  payout?: string;
  additional_params?: string;
  google_pay_token?: string;
  lifetime?: number;
  skip_success_page?: number;
  view_type?: "popup" | "hosted";
}

declare global {
  interface Window {
    AbaPayway?: {
      checkout: () => void;
    };
  }
}