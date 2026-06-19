import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";

const questions = [
  {
    category: "ការវាយតម្លៃសម្ពាធឈាម (Hypertension Assessment)",
    items: [
      "តើអ្នកធ្លាប់មានសម្ពាធឈាម 140/90 mmHg ឬខ្ពស់ជាងនេះដែរឬទេ? (Ever had a blood pressure reading of 140/90 mmHg or higher?)",
      "តើអ្នកឧស្សាហ៍ឈឺក្បាល (ជាពិសេសពេលព្រឹក) វិលមុខ ឈឺទ្រូង ថប់ដង្ហើម ឬហូរឈាមច្រមុះដែរឬទេ? (Frequent headaches, dizziness, chest pain, shortness of breath?)",
      "តើអ្នកបរិភោគអាហារប្រៃ ជក់បារី ផឹកស្រាជាប្រចាំ ឬមិនសូវបញ្ចេញពលកម្មដែរឬទេ? (Consume high-sodium foods, smoke, drink regularly, or sedentary?)",
      "តើឪពុកម្តាយ ឬបងប្អូនរបស់អ្នកមានប្រវត្តិជំងឺលើសឈាម គាំងបេះដូង ឬដាច់សរសៃឈាមខួរក្បាលដែរឬទេ? (Family history of high BP, heart attacks, or strokes?)"
    ]
  },
  {
    category: "ការវាយតម្លៃជំងឺទឹកនោមផ្អែម (Diabetes Assessment)",
    items: [
      "តើអ្នកឧស្សាហ៍ស្រេកទឹកខ្លាំង នោមញឹកញាប់ (ជាពិសេសពេលយប់) ឬឃ្លានខ្លាំងដែរឬទេ? (Excessive thirst, frequent urination, or extreme hunger?)",
      "តើអ្នកស្រកទម្ងន់លឿនខុសធម្មតាដោយមិនបានតមអាហារ ឬហាត់ប្រាណដែរឬទេ? (Lost significant weight quickly without diet/exercise changes?)",
      "តើអ្នកឧស្សាហ៍អស់កម្លាំង ស្រវាំងភ្នែក ស្បែកស្ងួត ឬមានរបួសក្រជាសះស្បើយដែរឬទេ? (Frequent fatigue, blurry vision, dry skin, or slow-healing cuts?)",
      "តើមានសមាជិកគ្រួសារបង្កើតរបស់អ្នកមានជំងឺទឹកនោមផ្អែមដែរឬទេ? តើអ្នកលើសទម្ងន់ឬធ្លាប់មានទឹកនោមផ្អែមពេលពពោះដែរឬទេ? (Family history of diabetes? Overweight or gestational diabetes?)"
    ]
  }
];

export function QuestionScreen() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});

  const handleAnswer = (qIndex: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const isAllAnswered = () => {
    // Just a basic check if some questions are answered. 
    // In a real app we might force all, but let's just make the Next button always work or check if at least 1 is answered.
    return true; 
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="absolute top-4 left-6 z-10 flex justify-between w-[calc(100%-3rem)] bg-white/90 backdrop-blur py-2 px-4 rounded-xl shadow-sm border border-slate-100">
        <button 
          onClick={() => navigate("/instructions")}
          className="flex items-center space-x-2 text-teal-800 font-bold active:scale-95 transition-transform"
        >
          <ArrowLeft size={24} />
          <span>ត្រឡប់ក្រោយ</span>
        </button>
        <button 
          onClick={() => navigate("/processing")}
          className="flex items-center space-x-2 text-white bg-teal-600 hover:bg-teal-700 px-6 py-2 rounded-lg shadow-sm font-bold active:scale-95 transition-all"
        >
          <span>បញ្ចប់ & វិភាគ (Finish & Analyze)</span>
          <ArrowRight size={24} />
        </button>
      </div>

      <div className="pt-20 pb-4 px-8 text-center bg-white shadow-sm z-0">
        <h1 className="font-['Moul'] text-3xl text-teal-900 mb-2">សំណួររោគវិនិច្ឆ័យ</h1>
        <p className="text-xl text-slate-500">Diagnostic Questions</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
          {questions.map((section, sIdx) => (
            <div key={sIdx} className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-teal-800 text-white p-4">
                <h2 className="font-['Moul'] text-xl">{section.category}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {section.items.map((q, qIdx) => {
                  const key = `${sIdx}-${qIdx}`;
                  const val = answers[key];
                  return (
                    <div key={qIdx} className="p-6 flex flex-col md:flex-row gap-6 items-center hover:bg-slate-50 transition-colors">
                      <p className="flex-1 text-lg text-slate-700 font-medium leading-relaxed">
                        {q}
                      </p>
                      <div className="flex space-x-4 shrink-0">
                        <button 
                          onClick={() => handleAnswer(key, true)}
                          className={`flex items-center space-x-2 px-6 py-4 rounded-xl border-2 transition-all ${val === true ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-500 hover:border-red-200'}`}
                        >
                          {val === true ? <CheckCircle2 className="text-red-500" /> : <Circle className="text-slate-300" />}
                          <span className="font-bold text-xl">បាទ/ចាស (Yes)</span>
                        </button>
                        <button 
                          onClick={() => handleAnswer(key, false)}
                          className={`flex items-center space-x-2 px-6 py-4 rounded-xl border-2 transition-all ${val === false ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-slate-200 text-slate-500 hover:border-teal-200'}`}
                        >
                          {val === false ? <CheckCircle2 className="text-teal-600" /> : <Circle className="text-slate-300" />}
                          <span className="font-bold text-xl">ទេ (No)</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
