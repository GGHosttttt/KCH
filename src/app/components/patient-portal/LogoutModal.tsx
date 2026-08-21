import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, AlertTriangle, X } from "lucide-react";
import apiService from "../../../../services/apiService";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Optional: Inform backend to revoke token/session
      await apiService("/kch-api/api/v1/auth/logout", "POST");
    } catch {
      // Continue cleanup on frontend regardless of server response
    } finally {
      // Clean up all client-side auth state
      localStorage.clear();
      sessionStorage.clear();

      setLoading(false);
      onClose();
      navigate("/patient/login");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-['Noto_Sans_Khmer',sans-serif]">
      <div 
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Icon & Title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="font-['Moul'] text-base text-slate-800 leading-tight">
                ចាកចេញពីគណនី
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Sign Out Confirmation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Description */}
        <div className="my-5 bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-start gap-2.5">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            តើអ្នកប្រាកដជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ? (Are you sure you want to log out of your active session?)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            បោះបង់ (Cancel)
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md shadow-red-600/20 hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "កំពុងចាកចេញ..." : "យល់ព្រម (Log Out)"}
          </button>
        </div>
      </div>
    </div>
  );
};