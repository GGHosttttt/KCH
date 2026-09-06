import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, HeartPulse } from "lucide-react";
import { useCheckupStore } from "../../stores/useCheckupStore";

export function HypertensionQuestionsScreen() {
  const navigate = useNavigate();
  const { questionnaire, updateQuestionnaire } = useCheckupStore();

  const handleUpdate = (field: string, value: any) => {
    updateQuestionnaire({ [field]: value });
  };

  const isComplete =
    questionnaire.known_hypertension !== undefined &&
    questionnaire.on_antihypertensive_meds !== undefined &&
    questionnaire.family_history_hypertension !== undefined &&
    questionnaire.smoking_status !== undefined &&
    questionnaire.alcohol_use !== undefined;

  const answeredCount = [
    questionnaire.known_hypertension,
    questionnaire.on_antihypertensive_meds,
    questionnaire.family_history_hypertension,
    questionnaire.smoking_status,
    questionnaire.alcohol_use,
  ].filter((v) => v !== undefined).length;

  return (
    <div className="flex flex-col h-full bg-slate-50 pt-8 font-['Noto_Sans_Khmer',sans-serif]">
      {/* Navigation Header */}
      <div className="absolute top-4 left-6 z-10 flex justify-between items-center w-[calc(100%-3rem)] bg-white/90 backdrop-blur py-2.5 px-4 rounded-xl shadow-sm border border-slate-100">
        <button
          onClick={() => navigate("/questions/personal")}
          className="flex items-center space-x-2 text-teal-800 font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={22} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>
        <div className="flex items-center space-x-3 text-sm font-medium">
          <span className="bg-teal-200 text-teal-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">✓</span>
          <span className="text-slate-300">—</span>
          <span className="bg-teal-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">២</span>
          <span className="text-slate-300">—</span>
          <span className="bg-slate-200 text-slate-400 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">៣</span>
        </div>
        <button
          onClick={() => navigate("/questions/diabetes")}
          disabled={!isComplete}
          className={`flex items-center space-x-2 px-6 py-2 rounded-xl shadow-sm font-bold active:scale-95 transition-all text-sm ${
            isComplete ? "text-white bg-teal-600 hover:bg-teal-700" : "text-slate-400 bg-slate-200 cursor-not-allowed"
          }`}
        >
          <span>បន្ត (Next)</span>
          <ArrowRight size={20} />
        </button>
      </div>

      {/* Screen Title */}
      <div className="pt-16 pb-4 px-6 bg-white shadow-sm">
        <div className="flex items-center space-x-3 justify-center">
          <div className="bg-rose-50 p-2.5 rounded-2xl">
            <HeartPulse size={28} className="text-rose-600" />
          </div>
          <div className="text-center">
            <h1 className="font-['Moul'] text-2xl text-teal-900 mb-0.5">ការវាយតម្លៃជំងឺលើសសម្ពាធឈាម</h1>
            <p className="text-sm text-slate-500">Hypertension & Lifestyle Assessment ({answeredCount}/5 answered)</p>
          </div>
        </div>
      </div>

      {/* Questionnaire Form */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl mx-auto space-y-4 pb-8">

          {/* 1. Known Hypertension Diagnosis */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ១. តើអ្នកធ្លាប់ត្រូវបានគ្រូពេទ្យធ្វើរោគវិនិច្ឆ័យថាមានជំងឺលើសសម្ពាធឈាមដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Have you ever been diagnosed with hypertension by a doctor?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("known_hypertension", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.known_hypertension === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.known_hypertension === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>ធ្លាប់ (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("known_hypertension", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.known_hypertension === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.known_hypertension === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>មិនធ្លាប់ (No)</span>
              </button>
            </div>
          </div>

          {/* 2. On BP Medication */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ២. តើអ្នកកំពុងប្រើប្រាស់ថ្នាំបញ្ចុះសម្ពាធឈាមជាប្រចាំដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Are you currently taking any prescription antihypertensive medication?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("on_antihypertensive_meds", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.on_antihypertensive_meds === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.on_antihypertensive_meds === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>កំពុងប្រើ (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("on_antihypertensive_meds", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.on_antihypertensive_meds === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.on_antihypertensive_meds === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>មិនប្រើទេ (No)</span>
              </button>
            </div>
          </div>

          {/* 3. Family History of Hypertension */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ៣. តើឪពុកម្តាយ ឬបងប្អូនបង្កើតរបស់អ្នកមានប្រវត្តិជំងឺលើសសម្ពាធឈាមដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Do your parents or siblings have a history of high blood pressure?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("family_history_hypertension", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.family_history_hypertension === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.family_history_hypertension === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>មាន (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("family_history_hypertension", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.family_history_hypertension === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.family_history_hypertension === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>គ្មានទេ (No)</span>
              </button>
            </div>
          </div>

          {/* 4. Smoking Status (WHO CVD Scoring Critical Factor) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ៤. តើអ្នកមានជក់បារីដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(What is your current smoking status?)</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "មិនដែលជក់", sub: "Never", value: "never" },
                { label: "ធ្លាប់ (ឈប់ហើយ)", sub: "Former", value: "former" },
                { label: "កំពុងជក់", sub: "Current", value: "current" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleUpdate("smoking_status", opt.value)}
                  className={`py-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    questionnaire.smoking_status === opt.value
                      ? opt.value === "current"
                        ? "bg-rose-50 border-rose-500 text-rose-700 font-bold"
                        : "bg-teal-50 border-teal-600 text-teal-800 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span className="text-sm">{opt.label}</span>
                  <span className="text-[10px] text-slate-400">({opt.sub})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Alcohol Consumption */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ៥. តើអ្នកបរិភោគគ្រឿងស្រវឹងជាប្រចាំ (លើសពី ៣ ដងក្នុងមួយសប្តាហ៍) ដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Do you drink alcohol regularly - more than 3 times a week?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("alcohol_use", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.alcohol_use === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.alcohol_use === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>បាទ/ចាស (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("alcohol_use", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.alcohol_use === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.alcohol_use === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>ទេ (No)</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}