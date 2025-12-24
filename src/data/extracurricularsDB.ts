export interface ExtracurricularOpportunity {
  id: string;
  title: string;
  category: string;
  level: "Local" | "National" | "International";
  description: string;
  eligibility: string;
  applicationDeadline?: string;
  website?: string;
  tags: string[];
}

export const extracurricularsDB: ExtracurricularOpportunity[] = [
  // Academic Competitions
  {
    id: "math-olympiad",
    title: "International Mathematical Olympiad (IMO)",
    category: "Academic",
    level: "International",
    description:
      "Престижная международная математическая олимпиада для старшеклассников. Участники решают сложные задачи по алгебре, геометрии, комбинаторике.",
    eligibility: "Учащиеся до 20 лет, прошедшие национальный отбор",
    applicationDeadline: "Varies by country",
    website: "https://www.imo-official.org/",
    tags: ["Mathematics", "Olympiad", "Prestigious"]
  },
  {
    id: "usamo",
    title: "USA Mathematical Olympiad (USAMO)",
    category: "Academic",
    level: "National",
    description:
      "Всероссийская олимпиада по математике. Финал проводится ежегодно, победители могут попасть на международные соревнования.",
    eligibility: "Учащиеся 9-11 классов",
    applicationDeadline: "September-October",
    tags: ["Mathematics", "Olympiad", "Russia"]
  },
  {
    id: "ioi",
    title: "International Olympiad in Informatics (IOI)",
    category: "Academic",
    level: "International",
    description:
      "Международная олимпиада по информатике. Участники решают алгоритмические задачи на языке программирования.",
    eligibility: "Старшеклассники, прошедшие национальный отбор",
    website: "https://ioinformatics.org/",
    tags: ["Programming", "Computer Science", "Algorithms"]
  },
  {
    id: "regeneron-sts",
    title: "Regeneron Science Talent Search",
    category: "Research",
    level: "International",
    description:
      "Крупнейший научный конкурс для старшеклассников США. Участники представляют независимые исследовательские проекты.",
    eligibility: "Учащиеся 12 класса (senior year) в США",
    applicationDeadline: "November",
    website: "https://www.societyforscience.org/regeneron-sts/",
    tags: ["Research", "Science", "Prestigious"]
  },
  {
    id: "isef",
    title: "International Science and Engineering Fair (ISEF)",
    category: "Research",
    level: "International",
    description:
      "Крупнейшая международная научная выставка для школьников. Участники представляют проекты в различных областях науки и инженерии.",
    eligibility: "9-12 класс, через региональные отборы",
    applicationDeadline: "Varies by region",
    website: "https://www.societyforscience.org/isef/",
    tags: ["Research", "Engineering", "Science Fair"]
  },

  // Leadership & Community
  {
    id: "boys-girls-state",
    title: "Boys/Girls State",
    category: "Leadership",
    level: "National",
    description:
      "Программа развития лидерских навыков и гражданского образования. Участники моделируют работу правительства штата.",
    eligibility: "11 класс, номинация от школы или организации",
    tags: ["Leadership", "Government", "Civics"]
  },
  {
    id: "hosa",
    title: "Health Occupations Students of America (HOSA)",
    category: "Leadership",
    level: "International",
    description:
      "Организация для студентов, интересующихся карьерой в сфере здравоохранения. Проводятся конкурсы и конференции.",
    eligibility: "Учащиеся, изучающие программы здравоохранения",
    website: "https://hosa.org/",
    tags: ["Healthcare", "Leadership", "Competition"]
  },

  // Business & Entrepreneurship
  {
    id: "decabusiness",
    title: "DECA Business Competition",
    category: "Leadership",
    level: "International",
    description:
      "Конкурс по бизнесу, финансам, гостеприимству и маркетингу. Участники решают бизнес-кейсы и представляют проекты.",
    eligibility: "Учащиеся 9-12 классов",
    website: "https://www.deca.org/",
    tags: ["Business", "Entrepreneurship", "Marketing"]
  },
  {
    id: "fbla",
    title: "Future Business Leaders of America (FBLA)",
    category: "Leadership",
    level: "International",
    description:
      "Крупнейшая студенческая бизнес-организация в мире. Конкурсы по бизнесу, финансам, технологиям.",
    eligibility: "Учащиеся средней школы и колледжа",
    website: "https://www.fbla.org/",
    tags: ["Business", "Leadership", "Competition"]
  },

  // Creative & Arts
  {
    id: "scholastic-awards",
    title: "Scholastic Art & Writing Awards",
    category: "Creative",
    level: "National",
    description:
      "Старейший и самый престижный конкурс творческих работ для американских школьников. Категории: искусство, письмо, кинематограф.",
    eligibility: "Учащиеся 7-12 классов",
    applicationDeadline: "December-January",
    website: "https://www.artandwriting.org/",
    tags: ["Art", "Writing", "Creative"]
  },

  // Model UN
  {
    id: "mun",
    title: "Model United Nations (MUN)",
    category: "Leadership",
    level: "International",
    description:
      "Образовательная симуляция работы ООН. Участники представляют страны, обсуждают глобальные проблемы, пишут резолюции.",
    eligibility: "Школьники и студенты",
    tags: ["Debate", "International Relations", "Leadership"]
  }
];

