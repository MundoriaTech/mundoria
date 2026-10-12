export const SKILLS_EXAM_PASS_SCORE = 9;

export type SkillsExamAnswer = number | number[];

export type SkillsExamQuestion = {
  id: string;
  prompt: string;
  options: string[];
  /** One correct option. */
  correctIndex?: number;
  /** Every listed option must be selected, and no others. */
  correctIndexes?: number[];
  selectLabel?: string;
};

export const TRAINING_PAGES = [
  {
    id: "intro",
    title: "How Mundoria works",
  },
  {
    id: "situations",
    title: "What would you do?",
  },
  {
    id: "skills",
    title: "Cleaning skills",
  },
  {
    id: "charter",
    title: "The Mundoria Pro charter",
  },
] as const;

export const CHARTER_AGREEMENTS = [
  "I will honour appointments I have accepted, except in a real emergency, and I will not send someone else in my place.",
  "I will follow the booking brief and work to a high standard, using suitable products and equipment.",
  "I will keep payment and future bookings on Mundoria, and I will not arrange them privately with the customer.",
] as const;

export const SKILLS_EXAM_QUESTIONS: SkillsExamQuestion[] = [
  {
    id: "cancel",
    prompt:
      "A customer cancels a few minutes before the start, as you arrive. What should you do?",
    options: [
      "Insist they keep the appointment",
      "Report the customer for inappropriate behaviour",
      "Message Mundoria in the app and follow what it says about the cancellation",
      "Ask them to pay you in cash for the journey",
    ],
    correctIndex: 2,
  },
  {
    id: "emergency",
    prompt:
      "You have an emergency and cannot make an appointment you already accepted. What should you do?",
    options: [
      "Cancel it in the app as early as you can, and tell Mundoria",
      "Wait until the start time and see if you can still get there",
      "Ask a friend to do the clean for you",
      "Message only the customer and sort it privately",
    ],
    correctIndex: 0,
  },
  {
    id: "arrival",
    prompt: "What is the first thing you do at the home?",
    options: [
      "Start cleaning straight away",
      "Introduce yourself, agree what matters most, then start",
      "Ask for a drink and check your messages before you begin",
    ],
    correctIndex: 1,
  },
  {
    id: "overtime",
    prompt: "A deep clean will not finish in the booked time. What should you do?",
    options: [
      "Leave without saying what is left",
      "Tell the customer what is left and add extra time only if they agree",
      "Keep working, then add the extra hours afterwards without asking",
    ],
    correctIndex: 1,
  },
  {
    id: "damage",
    prompt:
      "You notice damage, or something gets damaged during the visit. What should you do?",
    options: [
      "Offer a private cash refund",
      "Tell Mundoria in the app as soon as you can",
      "Wait to see if the customer complains",
    ],
    correctIndex: 1,
  },
  {
    id: "offer",
    prompt: "An offer appears in the Mundoria Pro app. What do you do?",
    options: [
      "Accept or decline it before the respond-by time",
      "Leave it until after the appointment time",
      "Message the customer off the app to negotiate a different price",
      "Accept it even if you already know you cannot attend",
    ],
    correctIndex: 0,
  },
  {
    id: "order",
    prompt: "Which steps are right when you clean a house?",
    selectLabel: "Select both answers.",
    options: [
      "Start from the highest surfaces and work down",
      "Start from the floor and move up",
      "Clean the dirtiest spots first",
      "Begin with the cleaner areas, then the dirtier ones",
    ],
    correctIndexes: [0, 3],
  },
  {
    id: "bedroom",
    prompt: "A sensible order in a bedroom is:",
    options: [
      "Clear, then dust, then hoover and mop",
      "Dust, then hoover and mop, then clear",
      "Hoover and mop, then clear, then dust",
    ],
    correctIndex: 0,
  },
  {
    id: "bleach",
    prompt: "Should you use bleach without the customer’s permission?",
    options: ["Yes", "No"],
    correctIndex: 1,
  },
  {
    id: "hazard",
    prompt: "A warning triangle on a cleaning product means it is:",
    options: [
      "Organic",
      "Expensive",
      "Dangerous",
      "Something that must be kept in the fridge",
    ],
    correctIndex: 2,
  },
  {
    id: "hob",
    prompt: "How do you clean a glass induction hob?",
    options: [
      "Soft sponge and a suitable cleaner",
      "Hard brush and bleach",
      "Metal scrubber",
    ],
    correctIndex: 0,
  },
  {
    id: "offplatform",
    prompt: "A customer asks to pay you directly and book you privately next time. What do you do?",
    options: [
      "Agree, if the price is the same",
      "Explain that payment and future bookings stay on Mundoria",
      "Take cash this once and tell Mundoria afterwards",
    ],
    correctIndex: 1,
  },
];

const SITUATION_IDS = ["cancel", "emergency", "arrival", "overtime", "damage", "offer"];
const SKILL_IDS = ["order", "bedroom", "bleach", "hazard", "hob", "offplatform"];

export function questionsForPage(pageId: (typeof TRAINING_PAGES)[number]["id"]) {
  const ids = pageId === "situations" ? SITUATION_IDS : pageId === "skills" ? SKILL_IDS : [];
  return ids
    .map((id) => SKILLS_EXAM_QUESTIONS.find((question) => question.id === id))
    .filter((question): question is SkillsExamQuestion => Boolean(question));
}

export function scoreSkillsExam(answers: Record<string, SkillsExamAnswer | undefined>) {
  let score = 0;
  for (const question of SKILLS_EXAM_QUESTIONS) {
    if (answerIsCorrect(question, answers[question.id])) score += 1;
  }
  return {
    passed: score >= SKILLS_EXAM_PASS_SCORE,
    score,
    total: SKILLS_EXAM_QUESTIONS.length,
  };
}

export function answerIsComplete(
  question: SkillsExamQuestion,
  answer: SkillsExamAnswer | undefined,
) {
  if (answer === undefined) return false;
  if (question.correctIndexes) {
    return Array.isArray(answer) && answer.length > 0;
  }
  return typeof answer === "number";
}

function answerIsCorrect(
  question: SkillsExamQuestion,
  answer: SkillsExamAnswer | undefined,
) {
  if (question.correctIndexes) {
    if (!Array.isArray(answer)) return false;
    const chosen = [...answer].sort((a, b) => a - b);
    const expected = [...question.correctIndexes].sort((a, b) => a - b);
    return (
      chosen.length === expected.length &&
      chosen.every((value, index) => value === expected[index])
    );
  }
  return answer === question.correctIndex;
}
