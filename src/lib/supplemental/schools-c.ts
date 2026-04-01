import { uni } from "@/lib/supplemental/build";

/** Shared UC PIQs — also resolved for any `university-of-california-*` campus slug via supplementalPrompts helper. */
export const universityOfCaliforniaPiQs = uni(
  "university-of-california",
  "University of California (PIQs)",
  "UC application filing period: October 1–December 2 (verify current cycle dates)",
  [
    {
      id: "uc-piq-note",
      kind: "required",
      wordLimit: "350 words each; answer 4 of 8",
      question:
        "Personal Insight Questions — answer 4 of the following 8 prompts. Each response has a 350-word limit.\n\n1. Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.\n2. Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.\n3. What would you say is your greatest talent or skill? How have you developed and demonstrated that talent over time?\n4. Describe how you have taken advantage of a significant educational opportunity or worked to overcome an educational barrier you have faced.\n5. Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?\n6. Think about an academic subject that inspires you. Describe how you have furthered this interest inside and/or outside of the classroom.\n7. What have you done to make your school or your community a better place?\n8. Beyond what has already been shared in your application, what do you believe makes you a strong candidate for admissions to the University of California?",
    },
  ],
);

export const supplementalSchoolsC = [
  universityOfCaliforniaPiQs,
  uni(
    "cornell-university",
    "Cornell University",
    "Early Decision: November 1, 2025\nRegular Decision: January 2, 2026\nSupplemental materials: November 14 (ED) / January 16 (RD)",
    [
      {
        id: "cornell-all",
        wordLimit: "350 words",
        question:
          "In the aftermath of the U.S. Civil War, Ezra Cornell wrote, “I would found an institution where any person can find instruction in any study.” Please share how you, your life experiences, and/or the things that matter to you will contribute to Cornell’s community.",
      },
      {
        id: "cornell-opt-disciplinary",
        kind: "optional",
        wordLimit: "100 words",
        question: "Have you ever been convicted of a crime or engaged in a disciplinary infraction? If yes, please explain.",
      },
      {
        id: "cornell-opt-additional",
        kind: "optional",
        wordLimit: "100 words",
        question: "Please feel free to share additional details (optional).",
      },
      {
        id: "cornell-caap",
        wordLimit: "650 words",
        question:
          "College of Architecture, Art, and Planning — How do your interests directly connect with your intended major at the College of Architecture, Art, and Planning (AAP)? Why architecture (B.Arch), art (BFA), or urban and regional studies (URS)? B.Arch applicants, please provide an example of how a creative project or passion sparks your motivation to pursue a 5-year professional degree program. BFA applicants may want to consider how they could integrate a range of interests and available resources at Cornell into a coherent art practice. URS students may want to emphasize their enthusiasm and depth of interest in the study of urban and regional issues.",
      },
      {
        id: "cornell-arts-sciences",
        wordLimit: "650 words",
        question:
          "College of Arts & Sciences — At the College of Arts and Sciences, curiosity will be your guide. Discuss how your passion for learning is shaping your academic journey, and what areas of study or majors excite you and why. Your response should convey how your interests align with the College, and how you would take advantage of the opportunities and curriculum in Arts and Sciences.",
      },
      {
        id: "cornell-brooks",
        wordLimit: "650 words",
        question:
          "Cornell Jeb E. Brooks School of Public Policy — Why are you interested in studying policy, and why do you want to pursue this major at Cornell’s Jeb E. Brooks School of Public Policy? You should share how your current interests, related experiences, and/or goals have influenced your choice of policy major.",
      },
    ],
  ),
  uni(
    "dartmouth-college",
    "Dartmouth College",
    "Regular Decision: January 2, 2026",
    [
      {
        id: "dartmouth-1",
        wordLimit: "100 words or fewer",
        question:
          "As you seek admission to Dartmouth’s Class of 2030, what aspects of the college’s academic program, community, and/or campus environment attract your interest? How is Dartmouth a good fit for you?",
      },
      {
        id: "dartmouth-2",
        kind: "choose_one",
        wordLimit: "250 words or fewer",
        question:
          "Respond to one of the following in 250 words or fewer:\nA. There is a Quaker saying: Let your life speak. Describe the environment in which you were raised and the impact it has had on the person you are today.\nB. “Be yourself,” Oscar Wilde advised. “Everyone else is taken.” Introduce yourself.\nC. What excites you?\nD. Celebrate your nerdy side.",
      },
      {
        id: "dartmouth-3",
        kind: "choose_one",
        wordLimit: "250 words or fewer",
        question:
          "Respond to one of the following in 250 words or fewer:\nA. Find x.\nB. “It’s not easy being green…” – Kermit the Frog. Discuss.\nC. How has your family background affected the way you see the world?\nD. How have you spent your last two summers?",
      },
    ],
  ),
  uni(
    "georgetown-university",
    "Georgetown University",
    "Early Action: November 1, 2025\nRegular Decision: January 10, 2026",
    [
      {
        id: "gtown-all-1",
        wordLimit: "250 words",
        question: "Please elaborate on any special talents or skills you would like to highlight.",
      },
      {
        id: "gtown-all-2",
        wordLimit: "1/2 page, single-spaced",
        question:
          "Briefly discuss the significance to you of the school or summer activity in which you have been most involved.",
      },
      {
        id: "gtown-all-3",
        wordLimit: "1 page, single-spaced",
        question:
          "As Georgetown is a diverse community, the Admissions Committee would like to know more about you in your own words. Please submit a brief personal or creative essay which you feel best describes you and reflects on your personal background and individual experiences, skills, and talents.",
      },
      {
        id: "gtown-cas",
        wordLimit: "1 page, single-spaced",
        question:
          "Georgetown College of Arts & Sciences — Founded in 1789, the Georgetown College of Arts & Sciences is committed to the Jesuit traditions of an integrated education and of productive research in the natural sciences, humanities, social sciences, and fine arts. Describe your interest in studying in the College of Arts & Sciences. Applicants interested in the sciences, mathematics, or languages are encouraged to make specific reference to their choice of major.",
      },
      {
        id: "gtown-nursing",
        wordLimit: "1 page, single-spaced",
        question:
          "School of Nursing — Georgetown University’s School of Nursing is committed to the formation of ethical, empathetic, and transformational nursing leaders. Describe the factors that have influenced your interest in studying Nursing at Georgetown University.",
      },
      {
        id: "gtown-health",
        wordLimit: "1 page, single-spaced",
        question:
          "School of Health — Georgetown University’s School of Health was founded to advance the health and well-being of people locally, nationally, and globally through innovative research, the delivery of interdisciplinary education, and transformative engagement of communities. Describe the factors that influenced your interest in studying health care at Georgetown University, specifically addressing your intended related major: Global Health, Health Care Management & Policy, or Human Science.",
      },
      {
        id: "gtown-sfs",
        wordLimit: "1 page, single-spaced",
        question:
          "Walsh School of Foreign Service — Georgetown University’s Walsh School of Foreign Service was founded more than a century ago to prepare generations of leaders with the foundational skills to address global issues. Describe your primary motivations for studying international affairs at Georgetown University and dedicating your undergraduate studies toward a future in global service.",
      },
      {
        id: "gtown-msb",
        wordLimit: "1 page, single-spaced",
        question:
          "McDonough School of Business — Georgetown University’s McDonough School of Business provides graduates with essential global, ethical, analytical, financial, and diverse perspectives on the economies of our nation and the world. Describe your primary motivations for studying business at Georgetown University.",
      },
    ],
  ),
  uni(
    "rice-university",
    "Rice University",
    "Regular Decision: January 4, 2026",
    [
      {
        id: "rice-1",
        wordLimit: "150 words",
        question: "Please explain why you wish to study in the academic areas you selected.",
      },
      {
        id: "rice-2",
        wordLimit: "150 words",
        question: "Based upon your exploration of Rice University, what elements of the Rice experience appeal to you?",
      },
      {
        id: "rice-3",
        kind: "choose_one",
        wordLimit: "500 words or fewer",
        question:
          "Please respond to one of the following prompts to explore how you will contribute to the Rice community.\nA. The Residential College System is at the heart of Rice student life and is heavily influenced by the particular cultural traditions and unique life experiences each student brings. What life experiences and/or unique perspectives are you looking forward to sharing with fellow Owls in the residential college system?\nB. Rice is strengthened by its diverse community of collaborative thinkers, each contributing a distinct perspective and personal story. How will your background, experiences, and/or identity add to the vibrant tapestry of the Rice community?",
      },
      {
        id: "rice-image",
        kind: "optional",
        question: "Rice also invites applicants to submit an image. (1 image upload — not an essay prompt.)",
      },
    ],
  ),
  uni(
    "tufts-university",
    "Tufts University",
    "Regular Decision: January 6, 2026",
    [
      {
        id: "tufts-1",
        wordLimit: "150–250 words",
        question: "Why Tufts?",
      },
      {
        id: "tufts-2",
        kind: "choose_one",
        wordLimit: "200–250 words",
        question:
          "Applicants to the School of Arts & Sciences or the School of Engineering — choose one:\n• It’s cool to love learning. What excites your intellectual curiosity and why?\n• How have the environments or experiences of your upbringing – your family, home, neighborhood, or community – shaped the person you are today?\n• Using a specific example or two, tell us about a way that you contributed to building a collaborative and/or inclusive community.",
      },
    ],
  ),
  uni(
    "university-of-rochester",
    "University of Rochester",
    "Regular Decision: January 5, 2026",
    [
      {
        id: "rochester-1",
        wordLimit: "250 words",
        question:
          "The University of Rochester’s motto is Meliora, which means “Ever Better.” What does Meliora mean to you and how will you make the world, your neighborhood, or your community ever better?",
      },
    ],
  ),
  uni(
    "university-of-southern-california",
    "University of Southern California",
    "Regular Decision: January 15, 2026",
    [
      {
        id: "usc-1",
        wordLimit: "250 words",
        question:
          "Describe how you plan to pursue your academic interests at USC. Please feel free to address your first- and second-choice major selections.",
      },
      {
        id: "usc-2",
        wordLimit: "25 characters total",
        kind: "list",
        question: "Describe yourself in three words.",
      },
      {
        id: "usc-short-answers",
        kind: "list",
        wordLimit: "100 characters each",
        question:
          "Short answers (100 characters each):\n• What is your favorite snack?\n• Best movie of all time:\n• Dream job:\n• If your life had a theme song, what would it be?\n• Dream trip:\n• What TV show will you binge watch next?\n• Which well-known person or fictional character would be your ideal roommate?\n• Favorite book:\n• If you could teach a class on any topic, what would it be?",
      },
      {
        id: "usc-dornsife",
        wordLimit: "250 words",
        question:
          "USC Dornsife — Many of us have at least one issue or passion that we care deeply about – a topic on which we would love to share our opinions and insights in hopes of sparking intense interest and continued conversation. If you had ten minutes and the attention of a million people, what would your talk be about?",
      },
      {
        id: "usc-viterbi-1",
        wordLimit: "250 words",
        question:
          "USC Viterbi — The student body at the USC Viterbi School of Engineering is a diverse group of unique engineers and computer scientists who work together to engineer a better world for all humanity. Describe how your contributions to the USC Viterbi student body may be distinct from others. Please feel free to touch on any part of your background, traits, skills, experiences, challenges, and/or personality in helping us better understand you.",
      },
      {
        id: "usc-viterbi-2",
        wordLimit: "250 words",
        question:
          "USC Viterbi — The National Academy of Engineering (NAE) and their 14 Grand Challenges go hand-in-hand with our vision to engineer a better world for all humanity. Engineers and computer scientists are challenged to solve these problems in order to improve life on the planet. Learn more about the NAE Grand Challenges and tell us which challenge is most important to you, and why.",
      },
    ],
  ),
  uni(
    "university-of-virginia-main-campus",
    "University of Virginia",
    "Regular Decision: January 5, 2026",
    [
      {
        id: "uva-nursing",
        wordLimit: "around 250 words",
        question:
          "School of Nursing only — In the field of nursing, you will encounter and impact real human lives. Please explain why you feel this is important as you choose this field as your future.",
      },
    ],
  ),
  uni(
    "vanderbilt-university",
    "Vanderbilt University",
    "Regular Decision: January 1, 2026",
    [
      {
        id: "vandy-1",
        wordLimit: "approximately 250 words",
        question:
          "Vanderbilt University’s motto, Crescere aude, is Latin for “dare to grow.” In your response, reflect on how one or more aspects of your identity, culture, or background has played a role in your personal growth, and how it will contribute to our campus community as you dare to grow at Vanderbilt.",
      },
    ],
  ),
  uni(
    "wake-forest-university",
    "Wake Forest University",
    "Regular Decision: January 1, 2026",
    [
      {
        id: "wf-1",
        wordLimit: "150 words",
        question: "Why have you decided to apply to Wake Forest? Share with us anything that has made you interested in our institution.",
      },
      {
        id: "wf-books",
        kind: "list",
        wordLimit: "list",
        question: "Optional — List five books you have read that intrigued you.",
      },
      {
        id: "wf-joy",
        kind: "optional",
        wordLimit: "150 words",
        question: "Optional — Tell us about a random thing that brings you joy.",
      },
      {
        id: "wf-topten",
        kind: "optional",
        wordLimit: "list",
        question: "Optional — Give us your Top Ten list.",
      },
      {
        id: "wf-upload-essay",
        kind: "optional",
        wordLimit: "up to 300 words",
        question:
          "Optional — Upload an essay from one of the following prompts:\n• Explain how a text you have read—fiction, nonfiction, poetry, or literature—has helped you to understand the world’s complexity.\n• Tell us about an experience that led you to change your mind about something.\n• Explain a perspective you have developed from your personal experiences that you believe makes you unique.\n• Choose any topic you like.",
      },
    ],
  ),
  uni(
    "washington-university-in-st-louis",
    "Washington University in St. Louis",
    "Regular Decision: January 2, 2026",
    [
      {
        id: "washu-1",
        wordLimit: "200 words",
        question: "Please tell us what you are interested in studying at college and why.",
      },
      {
        id: "washu-2",
        kind: "choose_one",
        wordLimit: "250 words",
        question:
          "Optional: WashU is a place that values a variety of perspectives. We believe those perspectives come from a variety of experiences and identities. Respond to one of the following prompts to help us understand “Who are you?”\nA. WashU supports engagement in the St. Louis community by considering the university as “In St. Louis, For St. Louis.” What is a community you are a part of and your place or impact within it?\nB. WashU strives to know every undergraduate student “By Name & Story.” How have your life experiences shaped who you are?\nC. WashU is a global community that brings together students from around the world. Describe a cultural experience, difference, or perspective that has influenced you.",
      },
    ],
  ),
];
