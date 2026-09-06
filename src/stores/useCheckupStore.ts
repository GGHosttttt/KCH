import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface PatientUser {
  id?: string;
  fullname: string;
  phone_number?: string;
  gender: "male" | "female";
  date_of_birth?: string;
  is_guest: boolean;
}

export interface QuestionnaireData {
  age?: number;
  gender?: "male" | "female";
  waist_circumference_cm?: number;
  is_pregnant?: boolean;
  smoking_status?: "never" | "former" | "current";
  alcohol_use?: boolean;
  activity_level?: "sedentary" | "moderate" | "active";
  family_history_hypertension?: boolean;
  family_history_diabetes_or_kidney?: boolean;
  family_history_premature_cvd?: boolean;
  known_hypertension?: boolean;
  known_diabetes?: boolean;
  on_antihypertensive_meds?: boolean;
  on_antidiabetic_meds?: boolean;
  symptoms_polyuria?: boolean;
  symptoms_polydipsia?: boolean;
  symptoms_unexplained_weight_loss?: boolean;
}

export interface VitalsData {
  height_cm?: number;
  weight_kg?: number;
  systolic_mmhg?: number;
  diastolic_mmhg?: number;
  pulse_bpm?: number;
  heart_rate_bpm?: number;
  spo2_percent?: number;
  fpg_mgdl?: number;
  rpg_mgdl?: number;
}

export interface CheckupSessionState {
  sessionId: string | null;
  kioskId: string;
  user: PatientUser | null;
  questionnaire: QuestionnaireData;
  vitals: VitalsData;
  paymentTranId: string | null;
  isPaid: boolean;

  // Actions
  setSessionId: (id: string) => void;
  setUser: (user: PatientUser) => void;
  updateQuestionnaire: (data: Partial<QuestionnaireData>) => void;
  updateVitals: (data: Partial<VitalsData>) => void;
  setPaymentStatus: (tranId: string, status: boolean) => void;
  getSubmissionPayload: () => Record<string, any>;
  resetCheckup: () => void;
}

export const useCheckupStore = create<CheckupSessionState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      kioskId: import.meta.env.VITE_KIOSK_DEVICE_ID,
      user: null,
      questionnaire: {},
      vitals: {},
      paymentTranId: null,
      isPaid: false,

      setSessionId: (id) => set({ sessionId: id }),
      setUser: (user) => set({ user }),
      updateQuestionnaire: (data) =>
        set((state) => ({
          questionnaire: { ...state.questionnaire, ...data },
        })),
      updateVitals: (data) =>
        set((state) => ({ vitals: { ...state.vitals, ...data } })),
      setPaymentStatus: (tranId, status) =>
        set({ paymentTranId: tranId, isPaid: status }),

      // Produces the exact schema expected by @router.post("/submit")
      getSubmissionPayload: () => {
        const { sessionId, kioskId, questionnaire, vitals } = get();
        return {
          session_id: sessionId,
          kiosk_id: kioskId,
          // vitals: {
          //   height_cm: vitals.height_cm ?? null,
          //   weight_kg: vitals.weight_kg ?? null,
          //   systolic_mmhg: vitals.systolic_mmhg ?? null,
          //   diastolic_mmhg: vitals.diastolic_mmhg ?? null,
          //   pulse_bpm: vitals.pulse_bpm ?? null,
          //   heart_rate_bpm: vitals.heart_rate_bpm ?? null,
          //   spo2_percent: vitals.spo2_percent ?? null,
          //   fpg_mgdl: vitals.fpg_mgdl ?? null,
          //   rpg_mgdl: vitals.rpg_mgdl ?? null,
          // },
          vitals: {
            height_cm: 165,
            weight_kg: 58.5,
            systolic_mmhg: 118,
            diastolic_mmhg: 76,
            pulse_bpm: 72,
            heart_rate_bpm: 72,
            spo2_percent: 98.5,
            fpg_mgdl: 88,
            rpg_mgdl: null,
          },
          questionnaire: {
            age: questionnaire.age ?? 25,
            gender: questionnaire.gender ?? "male",
            waist_circumference_cm:
              questionnaire.waist_circumference_cm ?? null,
            is_pregnant: questionnaire.is_pregnant ?? false,
            smoking_status: questionnaire.smoking_status ?? "never",
            alcohol_use: questionnaire.alcohol_use ?? false,
            activity_level: questionnaire.activity_level ?? "moderate",
            family_history_hypertension:
              questionnaire.family_history_hypertension ?? false,
            family_history_diabetes_or_kidney:
              questionnaire.family_history_diabetes_or_kidney ?? false,
            family_history_premature_cvd:
              questionnaire.family_history_premature_cvd ?? false,
            known_hypertension: questionnaire.known_hypertension ?? false,
            known_diabetes: questionnaire.known_diabetes ?? false,
            on_antihypertensive_meds:
              questionnaire.on_antihypertensive_meds ?? false,
            on_antidiabetic_meds: questionnaire.on_antidiabetic_meds ?? false,
            symptoms_polyuria: questionnaire.symptoms_polyuria ?? false,
            symptoms_polydipsia: questionnaire.symptoms_polydipsia ?? false,
            symptoms_unexplained_weight_loss:
              questionnaire.symptoms_unexplained_weight_loss ?? false,
          },
        };
      },

      resetCheckup: () => {
        set({
          sessionId: null,
          user: null,
          questionnaire: {},
          vitals: {},
          paymentTranId: null,
          isPaid: false,
        });
        // sessionStorage.removeItem("kiosk_active_session");
        sessionStorage.clear();
        localStorage.clear();
      },
    }),
    {
      name: "kiosk_active_session",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
