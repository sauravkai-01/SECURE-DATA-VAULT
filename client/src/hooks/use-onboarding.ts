import { useState, useEffect, useCallback } from "react";

const ONBOARDING_KEY = "ciphervault-onboarding-complete";
const ONBOARDING_STEP_KEY = "ciphervault-onboarding-step";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour=\"sidebar\"]",
    title: "Navigation Sidebar",
    description:
      "Your command center. Use these links to navigate between Dashboard, Secure Vault, Notepad, Audit Logs, and Settings. You can also collapse this sidebar for more workspace.",
    position: "right",
  },
  {
    target: "[data-tour=\"security-score\"]",
    title: "Security Score",
    description:
      "This card displays your real-time security posture rating (0-100). It factors in encryption strength, active sessions, and vault integrity. Aim to keep this above 90.",
    position: "bottom",
  },
  {
    target: "[data-tour=\"stats-cards\"]",
    title: "Vault Statistics",
    description:
      "Three live counters: Secured Items (total encrypted files), Active Links (shareable links that haven't expired), and Security Events (total audit log actions). These update in real-time.",
    position: "bottom",
  },
  {
    target: "[data-tour=\"security-chart\"]",
    title: "Security Insights Graph",
    description:
      "This area chart visualizes your activity over the last 7 days. The Y-axis shows the number of security events per day. Hover over points to see exact counts. It helps you spot unusual activity patterns.",
    position: "top",
  },
  {
    target: "[data-tour=\"storage-integrity\"]",
    title: "Storage Integrity",
    description:
      "A breakdown of your vault capacity and file type distribution. The progress bar shows overall usage. Below, you can see estimated storage by category (Documents, Encrypted Media, etc.).",
    position: "top",
  },
  {
    target: "[data-tour=\"operational-log\"]",
    title: "Operational Log",
    description:
      "A live timeline of every action performed in your vault — uploads, downloads, access attempts, deletions, and more. Each entry shows the action type, timestamp, and details. Click 'Full Audit' to see the complete history.",
    position: "left",
  },
  {
    target: "[data-tour=\"vault-header\"]",
    title: "Vault Inventory",
    description:
      "This is your main asset table. Every encrypted file you've uploaded appears here with its metadata, security hash, access code, and expiry time.",
    position: "bottom",
  },
  {
    target: "[data-tour=\"search-filter\"]",
    title: "Search & Filter",
    description:
      "Use the search bar to find assets by name. The filter dropdown lets you quickly view only Favorites, Images, Videos, or Documents. Combine both for powerful asset discovery.",
    position: "bottom",
  },
  {
    target: "[data-tour=\"bulk-actions\"]",
    title: "Bulk Selection Actions",
    description:
      "When you select one or more items using the checkboxes, this toolbar appears. You can clear your selection or permanently shred (delete) multiple assets at once.",
    position: "bottom",
  },
  {
    target: "[data-tour=\"item-row\"]",
    title: "Asset Row",
    description:
      "Each row represents one encrypted asset. Click the checkbox to select it, click the filename to open the Inspector for full details, or use the ⋮ menu for actions like Share, Favorite, Copy Link, or Shred.",
    position: "left",
  },
  {
    target: "[data-tour=\"ingest-btn\"]",
    title: "Ingest Asset Button",
    description:
      "The big button to upload new files or create encrypted text notes. Clicking it opens the Secure Depository wizard where you can choose content, set a password, pick expiry, and select a folder.",
    position: "left",
  },
  {
    target: "[data-tour=\"command-palette\"]",
    title: "Command Palette",
    description:
      "Press ⌘K (or Ctrl+K) anytime to open the Command Palette. It lets you jump to any page, trigger quick actions like viewing favorites or trash, and navigate without using the mouse.",
    position: "bottom",
  },
];

export function useOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
    if (!completed) {
      setHasCompleted(false);
      setIsOpen(true);
      if (savedStep) {
        setCurrentStep(Math.min(parseInt(savedStep, 10), DASHBOARD_TOUR_STEPS.length - 1));
      }
    }
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= DASHBOARD_TOUR_STEPS.length) {
        localStorage.setItem(ONBOARDING_KEY, "true");
        localStorage.removeItem(ONBOARDING_STEP_KEY);
        setHasCompleted(true);
        setIsOpen(false);
        return prev;
      }
      localStorage.setItem(ONBOARDING_STEP_KEY, String(next));
      return next;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem(ONBOARDING_STEP_KEY, String(next));
      return next;
    });
  }, []);

  const skip = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setHasCompleted(true);
    setIsOpen(false);
  }, []);

  const restart = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setHasCompleted(false);
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    currentStep,
    hasCompleted,
    totalSteps: DASHBOARD_TOUR_STEPS.length,
    step: DASHBOARD_TOUR_STEPS[currentStep],
    nextStep,
    prevStep,
    skip,
    restart,
    setIsOpen,
  };
}

