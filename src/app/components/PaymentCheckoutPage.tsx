import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Loader2,
  ExternalLink,
  Activity
} from "lucide-react";
import { PurchaseRequest, AbaPurchaseResponse } from "../../types/payment";
import apiService from "../../../services/apiService";
import { useCheckupStore } from "../../stores/useCheckupStore";

declare global {
  interface Window {
    AbaPayway?: {
      checkout: () => void;
    };
  }
}

export default function PaymentCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useCheckupStore();

  // 1. Resolve Valid UUIDs
  const kioskId =
    searchParams.get("kiosk_id") ||
    import.meta.env.VITE_KIOSK_DEVICE_ID

  const patientName =
    searchParams.get("name") || store.user?.fullname || "Walk-in Patient";
  const fee = parseFloat(searchParams.get("fee") || "2.5");

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(
    searchParams.get("record_id") || sessionStorage.getItem("record_id"),
  );
  const [payData, setPayData] = useState<AbaPurchaseResponse | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const assessmentTriggeredRef = useRef(false);

  // 2. Initialize PayWay Purchase with the created record ID
  const initiatePurchase = async (activeRecordId: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload: PurchaseRequest = {
        patient_record_id: activeRecordId,
        kiosk_device_id: kioskId,
        charge_fee: fee,
        currency: "usd", // Must be uppercase USD
        patient_name: patientName,
      };

      const res = await apiService(
        "/kch-payment/api/payway/purchase",
        "POST",
        payload,
      );

      const data: AbaPurchaseResponse = res?.data || res;

      if (!data?.hash || !data?.tran_id) {
        throw new Error(
          "Invalid transaction parameters returned from payment gateway.",
        );
      }

      setPayData(data);
    } catch (err: any) {
      console.error("Payment init error:", err);
      setError(
        err?.message ||
          "មិនអាចបង្កើតប្រតិបត្តិការបង់ប្រាក់បានទេ (Failed to initialize payment)",
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Background Assessment & Sequenced Initiation
  const runWorkflow = async () => {
    if (assessmentTriggeredRef.current) return;
    assessmentTriggeredRef.current = true;

    try {
      setLoading(true);

      // Check if record_id is already known
      let targetRecordId =
        searchParams.get("record_id") || sessionStorage.getItem("record_id");

      // Submit assessment if not submitted yet
      if (!targetRecordId) {
        const payload = store.getSubmissionPayload
          ? store.getSubmissionPayload()
          : {
              kiosk_id: kioskId,
              session_id: store.sessionId,
              vitals: store.vitals,
              questionnaire: store.questionnaire,
            };

        const res = await apiService(
          "/kch-api/api/v1/assessment/submit?lang=km",
          "POST",
          payload,
        );

        const assessmentResult = res?.data || res;
        const createdRecordId =
          assessmentResult?.record_id || assessmentResult?.patient_record_id;

        if (createdRecordId) {
          targetRecordId = String(createdRecordId);
          setRecordId(targetRecordId);
          sessionStorage.setItem("record_id", targetRecordId);
        }

        if (assessmentResult) {
          sessionStorage.setItem(
            "kch_screening_result",
            JSON.stringify(assessmentResult),
          );
        }
      }
      // If record_id is still missing, fallback to mock UUID to prevent schema validation failure
      const finalRecordId = targetRecordId;
      setRecordId(finalRecordId);

      // Trigger purchase initiation with guaranteed non-null UUID
      await initiatePurchase(finalRecordId);
    } catch (err: any) {
      console.error("Background assessment error:", err);
      setError(err?.message || "Failed to process assessment");
      setLoading(false);
    }
  };

  useEffect(() => {
    runWorkflow();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // 4. Poll transaction status
  const startStatusPolling = (tranId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    setCheckingStatus(true);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await apiService(
          `/kch-payment/api/payway/check-transaction/${tranId}`,
          "GET",
        );

        const data = res?.data || res;
        const isPaid = data?.data?.is_paid ?? data?.is_paid;
        const statusCode =
          data?.data?.payment_status_code ?? data?.payment_status_code;

        if (
          isPaid === true ||
          statusCode === 0 ||
          statusCode === "00" ||
          statusCode === "0"
        ) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

          const activeRecordId =
            recordId || sessionStorage.getItem("record_id") || "";

          navigate(`/results?record_id=${activeRecordId}&tran_id=${tranId}`);
        }
      } catch (e) {
        console.warn("Polling check pending...", e);
      }
    }, 4000);
  };

  // 5. Open ABA PayWay Modal / Checkout
  const handleOpenAbaCheckout = (mode: "popup" | "new_tab" = "popup") => {
    if (!payData) return;

    try {
      let iframe = document.getElementById(
        "aba_webservice",
      ) as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.name = "aba_webservice";
        iframe.id = "aba_webservice";
        iframe.style.display = "none";
        document.body.appendChild(iframe);
      }

      const existingForm = document.getElementById("aba_merchant_request");
      if (existingForm) existingForm.remove();

      const form = document.createElement("form");
      form.method = "POST";
      form.id = "aba_merchant_request";
      form.action =
        "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase";

      if (mode === "new_tab") {
        form.target = "_blank";
      } else {
        form.target = "aba_webservice";
      }

      const fields: Record<string, string | number> = {
        req_time: payData.req_time,
        merchant_id: payData.merchant_id,
        tran_id: payData.tran_id,
        amount: String(payData.amount),
        items: payData.items || "",
        shipping: payData.shipping || "0.00",
        firstname: payData.firstname || "",
        lastname: payData.lastname || "",
        email: payData.email || "",
        phone: payData.phone || "",
        type: payData.type || "purchase",
        payment_option: payData.payment_option || "abapay_khqr",
        return_url: payData.return_url || "",
        cancel_url: payData.cancel_url || "",
        continue_success_url: payData.continue_success_url || "",
        return_deeplink: payData.return_deeplink || "",
        currency: payData.currency?.toUpperCase() || "USD",
        custom_fields: payData.custom_fields || "",
        return_params: payData.return_params || "",
        payout: payData.payout || "",
        lifetime: payData.lifetime ?? 15,
        additional_params: payData.additional_params || "",
        google_pay_token: payData.google_pay_token || "",
        skip_success_page: payData.skip_success_page ?? 1,
        payment_gate: payData.payment_gate ?? 0,
        view_type:
          mode === "new_tab" ? "hosted_view" : payData.view_type || "popup",
        hash: payData.hash,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value =
          value === undefined || value === null ? "" : String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);

      startStatusPolling(payData.tran_id);

      if (mode === "new_tab") {
        form.submit();
      } else {
        AbaPayway.checkout();
      }
    } catch (err) {
      console.error("ABA Checkout Error:", err);
      setError("Failed to open ABA PayWay checkout.");
    }
  };

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-teal-800 to-teal-900 flex flex-col justify-between p-4 md:p-6 font-['Noto_Sans_Khmer',sans-serif] text-slate-800 ">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-wrap gap-12 items-center justify-center">
        {[...Array(20)].map((_, i) => (
          <Activity key={i} size={48} className="text-teal-200" />
        ))}
      </div>

      {/* Main Payment Container */}
      <main className="w-full max-w-xl mx-auto my-auto z-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-800/20">
        
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-teal-50 text-[#00A884] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <QrCode size={30} />
            </div>
            <h1 className="font-['Moul'] text-xl sm:text-2xl text-[#0A4D44] mb-1">
              ទូទាត់សេវាពិនិត្យសុខភាព
            </h1>
            <p className="text-xs text-slate-500">
              ABA PayWay e-Commerce Checkout
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-700 text-xs">
              <AlertCircle size={18} className="flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                <button
                  onClick={runWorkflow}
                  className="mt-1 text-teal-700 underline font-bold"
                >
                  ព្យាយាមម្តងទៀត (Retry)
                </button>
              </div>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>អ្នកជំងឺ (Patient):</span>
              <span className="font-bold text-slate-700">{patientName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>លេខកូដវិក្កយបត្រ (Tran ID):</span>
              <span className="font-mono font-bold text-teal-800">
                {payData?.tran_id || (loading ? "Generating..." : "Ready")}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>ប្រភេទសេវា (Service):</span>
              <span className="text-slate-700">
                ពិនិត្យសុខភាពបឋម (NCD Screening)
              </span>
            </div>

            <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-800">
                ទឹកប្រាក់សរុប (Total Amount):
              </span>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-[#0A4D44]">
                  ${fee.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  USD
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Option */}
          <div className="border-2 border-[#00A884] bg-teal-50/40 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-teal-200">
                <QrCode size={22} className="text-[#00A884]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  ABA PAY / KHQR
                </p>
                <p className="text-[11px] text-slate-500">
                  ស្កេនទូទាត់តាមកម្មវិធីធនាគារនានា
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#00A884] bg-white px-2.5 py-1 rounded-full border border-teal-200">
              Instant
            </span>
          </div>

          <iframe
            name="aba_webservice"
            id="aba_webservice"
            title="ABA PayWay Gateway"
            style={{ display: "none" }}
          />

          {/* Modal Popup Button */}
          <button
            type="button"
            disabled={loading || !payData}
            onClick={() => handleOpenAbaCheckout("popup")}
            className="w-full py-4 bg-[#00A884] hover:bg-[#008f70] active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>កំពុងដំណើរការ... (Preparing Gateway...)</span>
              </>
            ) : (
              <>
                <CreditCard size={18} />
                <span>បង់ប្រាក់ឥឡូវនេះ (Pay with ABA KHQR Popup)</span>
              </>
            )}
          </button>

          {/* New Tab Mode Button */}
          <button
            type="button"
            disabled={loading || !payData}
            onClick={() => handleOpenAbaCheckout("new_tab")}
            className="w-full mt-3 py-3 border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-slate-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ExternalLink size={15} />
            <span>បើកផ្ទាំងទូទាត់ថ្មី (Open in New Tab)</span>
          </button>

          {checkingStatus && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-teal-700 bg-teal-50 py-2.5 rounded-xl border border-teal-200">
              <Loader2 size={14} className="animate-spin" />
              <span>
                រង់ចាំការទូទាត់... (Listening for completed payment...)
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-2 text-[11px] text-teal-200/60 z-10">
        ទូរសុខភាពសហគមន៍ខ្មែរ · Khmer Community Health (Secure ABA PayWay
        Gateway)
      </footer>
    </div>
  );
}
