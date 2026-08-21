import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { AuthScreen } from "./components/AuthScreen";
import { PersonalQuestionsScreen } from "./components/PersonalQuestionsScreen";
import { HypertensionQuestionsScreen } from "./components/HypertensionQuestionsScreen";
import { DiabetesQuestionsScreen } from "./components/DiabetesQuestionsScreen";
import { HandwashScreen } from "./components/HandwashScreen";
import { InstructionScreen } from "./components/InstructionScreen";
import { InstructionScreen2 } from "./components/InstructionScreen2";
import { InstructionScreen3 } from "./components/InstructionScreen3";
import { ProcessingScreen } from "./components/ProcessingScreen";
import { ResultScreen } from "./components/ResultScreen";
import { ReceiptScreen } from "./components/ReceiptScreen";
import MobilePairingPage from "./components/MobilePairingPage";
import PatientLoginPage from "./components/patient-portal/PatientLoginPage";
import PatientProfilePage from "./components/patient-portal/PatientProfilePage";
import RegisterProfilePage  from "./components/patient-portal/RegisterProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: WelcomeScreen },
      { path: "auth", Component: AuthScreen },
      { path: "patient/login", Component: PatientLoginPage },
      { path: "patient/profile", Component: PatientProfilePage },
      { path: "patient/register", Component: RegisterProfilePage },
      { path: "pairing", Component: MobilePairingPage },
      { path: "questions/personal", Component: PersonalQuestionsScreen },
      { path: "questions/hypertension", Component: HypertensionQuestionsScreen },
      { path: "questions/diabetes", Component: DiabetesQuestionsScreen },
      { path: "handwash", Component: HandwashScreen },
      { path: "instructions/1", Component: InstructionScreen },
      { path: "instructions/2", Component: InstructionScreen2 },
      { path: "instructions/3", Component: InstructionScreen3 },
      { path: "processing", Component: ProcessingScreen },
      { path: "results", Component: ResultScreen },
      { path: "receipt", Component: ReceiptScreen },
    ],
  },
]);
