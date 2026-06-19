import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Droplet } from "lucide-react";

const questions = [
  "តើអ្នកឧស្សាហ៍ស្រេកទឹកខ្លាំង នោមញឹកញាប់ (ជាពិសេសពេលយប់) ឬឃ្លានខ្លាំងដែរឬទេ?\n(Excessive thirst, frequent urination—especially at night, or extreme hunger?)",
  "តើអ្នកស្រកទម្ងន់លឿនខុសធម្មតាដោយមិនបានតមអាហារ ឬហាត់ប្រាណដែរឬទេ?\n(Lost significant weight quickly without changes to diet or exercise?)",
  "តើអ្នកឧស្សាហ៍អស់កម្លាំង ស្រវាំងភ្នែក ស្បែកស្ងួត ឬមានរបួសក្រជាសះស្បើយដែរឬទេ?\n(Frequent fatigue, blurry vision, dry skin, or slow-healing cuts/bruises?)",
  "តើមានសមាជិកគ្រួសារបង្កើតរបស់អ្នកមានជំងឺទឹកនោមផ្អែមដែរឬទេ? តើអ្នកលើសទម្ងន់ ឬធ្លាប់មានទឹកនោមផ្អែមពេលពពោះដែរឬទេ?\n(Family history of diabetes? Overweight or gestational diabetes?)",
];

export function DiabetesQuestionsScreen() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});

  const handleAnswer = (idx: number, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  const answeredCount = Object.keys(answers).length;

  const handleNext = () => {
    sessionStorage.setItem("diabetesAnswers", JSON.stringify(answers));
    navigate("/handwash");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 pt-8">
      {/* Nav */}
      <div className="absolute top-4 left-6 z-10 flex justify-between w-[calc(100%-3rem)] bg-white/90 backdrop-blur py-2 px-4 rounded-xl shadow-sm border border-slate-100">
        <button
          onClick={() => navigate("/questions/hypertension")}
          className="flex items-center space-x-2 text-teal-800 font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>
        <div className="flex items-center space-x-3 text-sm font-medium">
          <span className="bg-teal-200 text-teal-700 rounded-full w-7 h-7 flex items-center justify-center font-bold">✓</span>
          <span className="text-slate-300">—</span>
          <span className="bg-teal-200 text-teal-700 rounded-full w-7 h-7 flex items-center justify-center font-bold">✓</span>
          <span className="text-slate-300">—</span>
          <span className="bg-teal-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold">៣</span>
        </div>
        <button
          onClick={handleNext}
          className="flex items-center space-x-2 text-white bg-teal-600 hover:bg-teal-700 px-6 py-2 rounded-lg shadow-sm font-bold active:scale-95 transition-all"
        >
          <span>បន្ត (Next)</span>
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Header */}
      <div className="pt-16 pb-3 px-6 bg-white shadow-sm z-0">
        <div className="flex items-center space-x-3 justify-center">
          <div className="bg-blue-50 p-2 rounded-full">
            <Droplet size={28} className="text-blue-500" />
          </div>
          <div className="text-center">
            <h1 className="font-['Moul'] text-2xl text-teal-900">ការវាយតម្លៃជំងឺទឹកនោមផ្អែម</h1>
            <p className="text-lg text-slate-500">Diabetes Assessment ({answeredCount}/{questions.length} answered)</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-4xl mx-auto space-y-3 pb-6">
          {questions.map((q, idx) => {
            const val = answers[idx];
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl shadow-sm border-2 p-5 transition-all ${val !== undefined && val !== null ? "border-teal-200" : "border-slate-100"}`}
              >
                <p className="text-base text-slate-700 font-medium leading-relaxed mb-4 whitespace-pre-line">{q}</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAnswer(idx, true)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border-2 transition-all ${val === true ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-white border-slate-200 text-slate-500 hover:border-rose-200"}`}
                  >
                    {val === true ? <CheckCircle2 size={24} className="text-rose-500" /> : <Circle size={24} className="text-slate-300" />}
                    <span className="font-bold text-lg">បាទ/ចាស (Yes)</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(idx, false)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border-2 transition-all ${val === false ? "bg-teal-50 border-teal-500 text-teal-700" : "bg-white border-slate-200 text-slate-500 hover:border-teal-200"}`}
                  >
                    {val === false ? <CheckCircle2 size={24} className="text-teal-600" /> : <Circle size={24} className="text-slate-300" />}
                    <span className="font-bold text-lg">ទេ (No)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
