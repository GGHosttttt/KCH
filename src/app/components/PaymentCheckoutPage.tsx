import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import apiService from "../../../services/apiService";
import { PurchaseRequest, AbaPurchaseResponse } from "../../types/payment";

export default function PaymentCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Retrieve parameters from router or query params
  const recordId =
    searchParams.get("record_id") || "3fa85f64-5717-4562-b3fc-2c963f66afa6";
  const kioskId =
    searchParams.get("kiosk_id") || "3fa85f64-5717-4562-b3fc-2c963f66afa6";
  const patientName = searchParams.get("name") || "Walk-in Patient";
  const fee = parseFloat(searchParams.get("fee") || "2.5");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payData, setPayData] = useState<AbaPurchaseResponse | null>(null);

  // 1. Initialize Transaction from Backend
  const initiatePurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: PurchaseRequest = {
        patient_record_id: recordId,
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

  useEffect(() => {
    initiatePurchase();
  }, []);

  // 2. Launch ABA PayWay Popup / Checkout
  const handleOpenAbaCheckout = () => {
    if (!payData) return;

    try {
      // Ensure target iframe exists for popup view
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

      // Remove any existing form to prevent duplicate ID collision
      const existingForm = document.getElementById("aba_merchant_request");
      if (existingForm) existingForm.remove();

      // Create and populate form with exact keys matching the hash
      const form = document.createElement("form");
      form.method = "POST";
      form.id = "aba_merchant_request";
      form.target = "aba_webservice";
      form.action =
        "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase";

      const fields: Record<string, string | number> = {
        req_time: payData.req_time,
        merchant_id: payData.merchant_id,
        tran_id: payData.tran_id,
        amount: String(payData.amount), // Ensures exact match (e.g. "2.50")
        items: payData.items || "",
        shipping: payData.shipping || "",
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
        view_type: payData.view_type || "popup",
        hash: payData.hash,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value === undefined || value === null ? "" : String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);


      // form.submit();
      AbaPayway.checkout();
      // Trigger checkout
      // if (AbaPayway && typeof AbaPayway.checkout === "function") {
      //   AbaPayway.checkout();
      // } else {
      //   form.submit();
      // }
    } catch (err) {
      console.error("ABA Checkout Error:", err);
      setError("Failed to open ABA PayWay checkout popup.");
    }
  };

  return (
    <div className="min-h-screen bg-[#073B35] flex flex-col justify-between p-4 md:p-6 font-['Noto_Sans_Khmer',sans-serif] text-slate-800 relative overflow-hidden">
      {/* Top Header */}
      <header className="w-full max-w-xl mx-auto z-10 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-teal-100 bg-white/10 backdrop-blur px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>ត្រឡប់ក្រោយ (Back)</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00A884] flex items-center justify-center text-white shadow-md">
            <ShieldCheck size={16} />
          </div>
          <span className="text-white text-xs font-bold font-mono tracking-wider">
            KCH Secure Pay
          </span>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="w-full max-w-xl mx-auto my-auto z-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-800/20">
          {/* Header */}
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
                  onClick={initiatePurchase}
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
                {payData?.tran_id || "Generating..."}
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

          {/* Hidden iframe required for ABA popup view */}
          <iframe
            name="aba_webservice"
            id="aba_webservice"
            title="ABA PayWay Gateway"
            style={{ display: "none" }}
          />

          {/* Action Trigger Button */}
          <button
            type="button"
            disabled={loading || !payData}
            onClick={handleOpenAbaCheckout}
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
                <span>បង់ប្រាក់ឥឡូវនេះ (Pay with ABA KHQR)</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-2 text-[11px] text-teal-200/60 z-10">
        ក្រសួងសុខាភិបាល · Khmer Community Health (Secure ABA PayWay Gateway)
      </footer>
    </div>
  );
}