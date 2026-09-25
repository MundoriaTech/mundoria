/** In-app Mundoria Pro skills check — cleaning standards & platform rules. */

export type SkillsExamQuestion = {
  id: string;
  prompt: string;
  options: string[];
  /** Index into options */
  correctIndex: number;
};

export const SKILLS_EXAM_PASS_SCORE = 6;

export const SKILLS_EXAM_QUESTIONS: SkillsExamQuestion[] = [
  {
    id: "dbs",
    prompt: "Before working in customer homes, Mundoria expects cleaners to have:",
    options: [
      "A clear DBS check on file",
      "Only a verbal reference",
      "No background check if experienced",
      "A driving licence only",
    ],
    correctIndex: 0,
  },
  {
    id: "supplies",
    prompt: "Unless the booking says otherwise, who usually brings cleaning products and tools?",
    options: [
      "The customer always provides everything",
      "The cleaner, unless the booking notes say otherwise",
      "Mundoria delivers a kit to every job",
      "Neighbours may lend supplies",
    ],
    correctIndex: 1,
  },
  {
    id: "accept",
    prompt: "When you receive a job offer, you should:",
    options: [
      "Ignore it — Mundoria will auto-assign",
      "Accept or decline within the respond-by window",
      "Message the customer off-platform first",
      "Show up without confirming",
    ],
    correctIndex: 1,
  },
  {
    id: "offplatform",
    prompt: "Taking payment or arranging future cleans outside Mundoria is:",
    options: [
      "Allowed if the customer asks",
      "Fine after the first session",
      "Against platform rules",
      "Required for cash jobs",
    ],
    correctIndex: 2,
  },
  {
    id: "checkin",
    prompt: "Check-in / check-out location sharing is used to:",
    options: [
      "Track you all day for marketing",
      "Create an audit trail for arrival and completion disputes",
      "Share your live location with all customers forever",
      "Replace messaging entirely",
    ],
    correctIndex: 1,
  },
  {
    id: "damage",
    prompt: "If something is damaged or goes wrong during a clean, you should:",
    options: [
      "Leave without saying anything",
      "Only tell friends",
      "Report it honestly via Mundoria (chat / support) as soon as practical",
      "Offer a private cash refund off-platform",
    ],
    correctIndex: 2,
  },
  {
    id: "noshow",
    prompt: "If you cannot make a confirmed booking, you should:",
    options: [
      "Not respond and hope it goes away",
      "Tell Mundoria / use the app as early as you can so the customer can be protected",
      "Send a personal WhatsApp only",
      "Arrive late without notice",
    ],
    correctIndex: 1,
  },
  {
    id: "standard",
    prompt: "A high-quality clean usually means:",
    options: [
      "Rushing through to maximise jobs per day",
      "Following the booking brief, checklist, and agreed rooms/add-ons carefully",
      "Skipping bathrooms if short on time",
      "Using whatever product the customer has, even if unsafe",
    ],
    correctIndex: 1,
  },
];

export function scoreSkillsExam(answers: Record<string, number>) {
  let score = 0;
  for (const question of SKILLS_EXAM_QUESTIONS) {
    if (answers[question.id] === question.correctIndex) score += 1;
  }
  return {
    passed: score >= SKILLS_EXAM_PASS_SCORE,
    score,
    total: SKILLS_EXAM_QUESTIONS.length,
  };
}
