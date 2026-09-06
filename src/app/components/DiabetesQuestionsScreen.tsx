import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Droplet } from "lucide-react";
import { useCheckupStore } from "../../stores/useCheckupStore";


export function DiabetesQuestionsScreen() {
  const navigate = useNavigate();
  const { questionnaire, updateQuestionnaire } = useCheckupStore();

  const handleUpdate = (field: string, value: any) => {
    updateQuestionnaire({ [field]: value });
  };

  const isComplete =
    questionnaire.known_diabetes !== undefined &&
    questionnaire.on_antidiabetic_meds !== undefined &&
    questionnaire.family_history_diabetes_or_kidney !== undefined &&
    questionnaire.symptoms_polyuria !== undefined &&
    questionnaire.symptoms_polydipsia !== undefined &&
    questionnaire.symptoms_unexplained_weight_loss !== undefined;

  const answeredCount = [
    questionnaire.known_diabetes,
    questionnaire.on_antidiabetic_meds,
    questionnaire.family_history_diabetes_or_kidney,
    questionnaire.symptoms_polyuria,
    questionnaire.symptoms_polydipsia,
    questionnaire.symptoms_unexplained_weight_loss,
  ].filter((v) => v !== undefined).length;

  return (
    <div className="flex flex-col h-full bg-slate-50 pt-8 font-['Noto_Sans_Khmer',sans-serif]">
      {/* Navigation Header */}
      <div className="absolute top-4 left-6 z-10 flex justify-between items-center w-[calc(100%-3rem)] bg-white/90 backdrop-blur py-2.5 px-4 rounded-xl shadow-sm border border-slate-100">
        <button
          onClick={() => navigate("/questions/hypertension")}
          className="flex items-center space-x-2 text-teal-800 font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={22} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>
        <div className="flex items-center space-x-3 text-sm font-medium">
          <span className="bg-teal-200 text-teal-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">✓</span>
          <span className="text-slate-300">—</span>
          <span className="bg-teal-200 text-teal-700 rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">✓</span>
          <span className="text-slate-300">—</span>
          <span className="bg-teal-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs">៣</span>
        </div>
        <button
          // onClick={() => navigate("/handwash")}
          onClick={() => navigate("/payment")}
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
          <div className="bg-blue-50 p-2.5 rounded-2xl">
            <Droplet size={28} className="text-blue-500" />
          </div>
          <div className="text-center">
            <h1 className="font-['Moul'] text-2xl text-teal-900 mb-0.5">ការវាយតម្លៃជំងឺទឹកនោមផ្អែម</h1>
            <p className="text-sm text-slate-500">Diabetes & Osmotic Symptoms Assessment ({answeredCount}/6 answered)</p>
          </div>
        </div>
      </div>

      {/* Questionnaire Form */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-3xl mx-auto space-y-4 pb-8">

          {/* 1. Known Diabetes Diagnosis */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ១. តើអ្នកធ្លាប់ត្រូវបានគ្រូពេទ្យធ្វើរោគវិនិច្ឆ័យថាមានជំងឺទឹកនោមផ្អែមដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Have you ever been diagnosed with diabetes by a doctor?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("known_diabetes", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.known_diabetes === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.known_diabetes === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>ធ្លាប់ (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("known_diabetes", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.known_diabetes === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.known_diabetes === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>មិនធ្លាប់ (No)</span>
              </button>
            </div>
          </div>

          {/* 2. On Diabetes Medication */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ២. តើអ្នកកំពុងប្រើប្រាស់ថ្នាំ ឬចាក់អាំងស៊ុយលីនសម្រាប់ជំងឺទឹកនោមផ្អែមដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Are you currently taking antidiabetic oral medication or insulin?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("on_antidiabetic_meds", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.on_antidiabetic_meds === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.on_antidiabetic_meds === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>កំពុងប្រើ (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("on_antidiabetic_meds", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.on_antidiabetic_meds === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.on_antidiabetic_meds === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>មិនប្រើទេ (No)</span>
              </button>
            </div>
          </div>

          {/* 3. Family History of Diabetes or Kidney Disease */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ៣. តើឪពុកម្តាយ ឬបងប្អូនបង្កើតរបស់អ្នកមានប្រវត្តិជំងឺទឹកនោមផ្អែម ឬជំងឺតម្រងនោមដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Do your parents or siblings have a history of diabetes or chronic kidney disease?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("family_history_diabetes_or_kidney", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.family_history_diabetes_or_kidney === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.family_history_diabetes_or_kidney === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>មាន (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("family_history_diabetes_or_kidney", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.family_history_diabetes_or_kidney === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.family_history_diabetes_or_kidney === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>គ្មានទេ (No)</span>
              </button>
            </div>
          </div>

          {/* 4. Polyuria Symptom */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ៤. តើអ្នកឧស្សាហ៍នោមញឹកញាប់ ជាពិសេសក្រោកនោមនៅពេលយប់លើសពី ២ ដងដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Do you experience frequent urination, especially waking up multiple times at night?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("symptoms_polyuria", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.symptoms_polyuria === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.symptoms_polyuria === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>បាទ/ចាស (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("symptoms_polyuria", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.symptoms_polyuria === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.symptoms_polyuria === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>ទេ (No)</span>
              </button>
            </div>
          </div>

          {/* 5. Polydipsia Symptom */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ៥. តើអ្នកឧស្សាហ៍ស្រេកទឹកខ្លាំង និងស្ងួតកជាប្រចាំខុសពីធម្មតាដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Do you experience persistent and excessive thirst or dry mouth?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("symptoms_polydipsia", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.symptoms_polydipsia === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.symptoms_polydipsia === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>បាទ/ចាស (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("symptoms_polydipsia", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.symptoms_polydipsia === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.symptoms_polydipsia === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>ទេ (No)</span>
              </button>
            </div>
          </div>

          {/* 6. Unexplained Weight Loss */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-base text-slate-800 font-bold leading-relaxed mb-1">
              ៦. តើអ្នកមានការស្រកទម្ងន់លឿនខុសធម្មតាដោយមិនបានតមអាហារ ឬហាត់ប្រាណដែរឬទេ?
            </p>
            <p className="text-xs text-slate-400 mb-4">(Have you experienced rapid, unexplained weight loss without diet changes?)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUpdate("symptoms_unexplained_weight_loss", true)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.symptoms_unexplained_weight_loss === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.symptoms_unexplained_weight_loss === true ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>បាទ/ចាស (Yes)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate("symptoms_unexplained_weight_loss", false)}
                className={`py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                  questionnaire.symptoms_unexplained_weight_loss === false ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {questionnaire.symptoms_unexplained_weight_loss === false ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300" />}
                <span>ទេ (No)</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}