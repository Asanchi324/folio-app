export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  region: string;
  imageUrl?: string;
  logoUrl?: string;
  requirements: {
    sat?: {
      median?: number;
      range?: { min: number; max: number };
      required: boolean;
    };
    act?: {
      median?: number;
      range?: { min: number; max: number };
      required: boolean;
    };
    gpa?: {
      min?: number;
      median?: number;
      weighted?: boolean;
    };
    ielts?: {
      min: number;
      required: boolean;
    };
    toefl?: {
      min: number;
      required: boolean;
    };
    ib?: {
      min: number;
      required: boolean;
    };
    aLevels?: {
      minGrades: string;
      required: boolean;
    };
  };
  acceptanceRate?: number;
  ranking?: {
    usNews?: number;
    qs?: number;
    times?: number;
  };
  notablePrograms?: string[];
  description: string;
  website: string;
  applicationDeadline?: string;
}

export const universitiesDB: University[] = [
  // US Universities
  {
    id: "harvard",
    name: "Harvard University",
    country: "United States",
    city: "Cambridge, MA",
    region: "USA",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
    requirements: {
      sat: { median: 1540, range: { min: 1460, max: 1580 }, required: false },
      act: { median: 35, range: { min: 33, max: 36 }, required: false },
      gpa: { min: 3.9, median: 4.18, weighted: true },
      ielts: { min: 7.0, required: true },
      toefl: { min: 100, required: true }
    },
    acceptanceRate: 3.2,
    ranking: { usNews: 3, qs: 4, times: 2 },
    notablePrograms: ["Economics", "Computer Science", "Government", "Biology"],
    description:
      "Один из самых престижных университетов мира, основан в 1636 году. Известен сильными программами в гуманитарных, естественных науках и бизнесе.",
    website: "https://www.harvard.edu/",
    applicationDeadline: "January 1 (Regular Decision)"
  },
  {
    id: "mit",
    name: "Massachusetts Institute of Technology",
    country: "United States",
    city: "Cambridge, MA",
    region: "USA",
    imageUrl: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800",
    requirements: {
      sat: { median: 1540, range: { min: 1500, max: 1570 }, required: false },
      act: { median: 35, range: { min: 34, max: 36 }, required: false },
      gpa: { min: 4.0, median: 4.17, weighted: true },
      ielts: { min: 7.0, required: true },
      toefl: { min: 90, required: true }
    },
    acceptanceRate: 6.7,
    ranking: { usNews: 2, qs: 1, times: 5 },
    notablePrograms: ["Engineering", "Computer Science", "Physics", "Mathematics"],
    description:
      "Ведущий технический университет мира, известен исследованиями и инновациями в области технологий, инженерии и естественных наук.",
    website: "https://www.mit.edu/",
    applicationDeadline: "January 5"
  },
  {
    id: "stanford",
    name: "Stanford University",
    country: "United States",
    city: "Palo Alto, CA",
    region: "USA",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
    requirements: {
      sat: { median: 1505, range: { min: 1440, max: 1570 }, required: false },
      act: { median: 34, range: { min: 32, max: 35 }, required: false },
      gpa: { min: 3.95, median: 3.96, weighted: true },
      ielts: { min: 7.0, required: true },
      toefl: { min: 100, required: true }
    },
    acceptanceRate: 4.3,
    ranking: { usNews: 6, qs: 5, times: 4 },
    notablePrograms: ["Computer Science", "Engineering", "Business", "Psychology"],
    description:
      "Престижный университет в Кремниевой долине, известен тесными связями с технологической индустрией и предпринимательством.",
    website: "https://www.stanford.edu/",
    applicationDeadline: "January 5"
  },
  {
    id: "yale",
    name: "Yale University",
    country: "United States",
    city: "New Haven, CT",
    region: "USA",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
    requirements: {
      sat: { median: 1520, range: { min: 1460, max: 1580 }, required: false },
      act: { median: 34, range: { min: 33, max: 35 }, required: false },
      gpa: { min: 3.9, median: 4.14, weighted: true },
      ielts: { min: 7.0, required: true },
      toefl: { min: 100, required: true }
    },
    acceptanceRate: 5.1,
    ranking: { usNews: 5, qs: 16, times: 9 },
    notablePrograms: ["History", "Political Science", "Economics", "English"],
    description:
      "Один из старейших и самых престижных университетов США, член Лиги плюща. Известен сильными гуманитарными и социальными программами.",
    website: "https://www.yale.edu/",
    applicationDeadline: "January 2"
  },
  {
    id: "princeton",
    name: "Princeton University",
    country: "United States",
    city: "Princeton, NJ",
    region: "USA",
    requirements: {
      sat: { median: 1515, range: { min: 1460, max: 1570 }, required: false },
      act: { median: 34, range: { min: 33, max: 35 }, required: false },
      gpa: { min: 3.9, median: 3.91, weighted: true },
      ielts: { min: 7.0, required: true },
      toefl: { min: 100, required: true }
    },
    acceptanceRate: 5.7,
    ranking: { usNews: 1, qs: 17, times: 7 },
    notablePrograms: ["Economics", "Public Policy", "Engineering", "Politics"],
    description:
      "Престижный университет Лиги плюща, известен строгой академической программой и системой наставничества.",
    website: "https://www.princeton.edu/",
    applicationDeadline: "January 1"
  },
  {
    id: "columbia",
    name: "Columbia University",
    country: "United States",
    city: "New York, NY",
    region: "USA",
    requirements: {
      sat: { median: 1515, range: { min: 1450, max: 1570 }, required: false },
      act: { median: 34, range: { min: 33, max: 35 }, required: false },
      gpa: { min: 3.9, median: 4.12, weighted: true },
      ielts: { min: 7.0, required: true },
      toefl: { min: 100, required: true }
    },
    acceptanceRate: 5.1,
    ranking: { usNews: 12, qs: 23, times: 11 },
    notablePrograms: ["Journalism", "Business", "Engineering", "Political Science"],
    description:
      "Университет Лиги плюща в Нью-Йорке, известен программами в журналистике, бизнесе и инженерии.",
    website: "https://www.columbia.edu/",
    applicationDeadline: "January 1"
  },
  {
    id: "nyu",
    name: "New York University",
    country: "United States",
    city: "New York, NY",
    region: "USA",
    requirements: {
      sat: { median: 1450, range: { min: 1370, max: 1510 }, required: false },
      act: { median: 32, range: { min: 31, max: 34 }, required: false },
      gpa: { min: 3.7, median: 3.8, weighted: true },
      ielts: { min: 7.5, required: true },
      toefl: { min: 100, required: true }
    },
    acceptanceRate: 12.8,
    ranking: { usNews: 35, qs: 38, times: 27 },
    notablePrograms: ["Business", "Arts", "Film", "International Relations"],
    description:
      "Крупный частный университет в Нью-Йорке, известен программами в бизнесе, искусстве и кино.",
    website: "https://www.nyu.edu/",
    applicationDeadline: "January 5"
  },
  {
    id: "ucla",
    name: "University of California, Los Angeles",
    country: "United States",
    city: "Los Angeles, CA",
    region: "USA",
    requirements: {
      sat: { median: 1415, range: { min: 1290, max: 1510 }, required: false },
      act: { median: 31, range: { min: 29, max: 35 }, required: false },
      gpa: { min: 3.9, median: 3.9, weighted: true },
      ielts: { min: 7.0, required: true },
      toefl: { min: 100, required: true }
    },
    acceptanceRate: 11.0,
    ranking: { usNews: 15, qs: 29, times: 21 },
    notablePrograms: ["Film", "Business", "Engineering", "Psychology"],
    description:
      "Ведущий государственный университет Калифорнии, известен разнообразием программ и сильной исследовательской деятельностью.",
    website: "https://www.ucla.edu/",
    applicationDeadline: "November 30"
  },

  // UK Universities
  {
    id: "oxford",
    name: "University of Oxford",
    country: "United Kingdom",
    city: "Oxford",
    region: "UK",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800",
    requirements: {
      sat: { median: 1470, range: { min: 1400, max: 1550 }, required: false },
      act: { median: 32, required: false },
      aLevels: { minGrades: "A*A*A - AAA", required: true },
      ib: { min: 38, required: false },
      ielts: { min: 7.0, required: true }
    },
    acceptanceRate: 17.5,
    ranking: { qs: 3, times: 1 },
    notablePrograms: ["PPE", "Law", "Medicine", "Mathematics"],
    description:
      "Один из старейших и самых престижных университетов мира. Известен системой колледжей и строгими академическими стандартами.",
    website: "https://www.ox.ac.uk/",
    applicationDeadline: "October 15 (via UCAS)"
  },
  {
    id: "cambridge",
    name: "University of Cambridge",
    country: "United Kingdom",
    city: "Cambridge",
    region: "UK",
    requirements: {
      sat: { median: 1500, range: { min: 1460, max: 1530 }, required: false },
      act: { median: 33, required: false },
      aLevels: { minGrades: "A*A*A - A*AA", required: true },
      ib: { min: 40, required: false },
      ielts: { min: 7.5, required: true }
    },
    acceptanceRate: 20.8,
    ranking: { qs: 2, times: 3 },
    notablePrograms: ["Natural Sciences", "Mathematics", "Engineering", "Economics"],
    description:
      "Один из ведущих университетов мира, известен сильными программами в естественных науках, математике и инженерии.",
    website: "https://www.cam.ac.uk/",
    applicationDeadline: "October 15 (via UCAS)"
  },
  {
    id: "lse",
    name: "London School of Economics and Political Science",
    country: "United Kingdom",
    city: "London",
    region: "UK",
    requirements: {
      sat: { median: 1450, range: { min: 1370, max: 1520 }, required: false },
      act: { median: 32, required: false },
      aLevels: { minGrades: "A*AA - AAA", required: true },
      ib: { min: 37, required: false },
      ielts: { min: 7.0, required: true }
    },
    acceptanceRate: 12.2,
    ranking: { qs: 45, times: 27 },
    notablePrograms: ["Economics", "International Relations", "Law", "Politics"],
    description:
      "Ведущий университет в области социальных наук, известен программами по экономике, политологии и международным отношениям.",
    website: "https://www.lse.ac.uk/",
    applicationDeadline: "January 25 (via UCAS)"
  },
  {
    id: "imperial",
    name: "Imperial College London",
    country: "United Kingdom",
    city: "London",
    region: "UK",
    requirements: {
      sat: { median: 1450, required: false },
      aLevels: { minGrades: "A*A*A - AAA", required: true },
      ib: { min: 38, required: false },
      ielts: { min: 7.0, required: true }
    },
    acceptanceRate: 14.3,
    ranking: { qs: 6, times: 10 },
    notablePrograms: ["Engineering", "Medicine", "Natural Sciences", "Business"],
    description:
      "Ведущий технический университет Великобритании, специализируется на науке, инженерии, медицине и бизнесе.",
    website: "https://www.imperial.ac.uk/",
    applicationDeadline: "January 25 (via UCAS)"
  },
  {
    id: "ucl",
    name: "University College London",
    country: "United Kingdom",
    city: "London",
    region: "UK",
    requirements: {
      sat: { median: 1440, required: false },
      aLevels: { minGrades: "A*A*A - AAB", required: true },
      ib: { min: 34, required: false },
      ielts: { min: 6.5, required: true }
    },
    acceptanceRate: 38.0,
    ranking: { qs: 9, times: 22 },
    notablePrograms: ["Architecture", "Medicine", "Law", "Economics"],
    description:
      "Один из крупнейших и самых разнообразных университетов Лондона, известен сильными программами в различных областях.",
    website: "https://www.ucl.ac.uk/",
    applicationDeadline: "January 25 (via UCAS)"
  },

  // Canadian Universities
  {
    id: "utoronto",
    name: "University of Toronto",
    country: "Canada",
    city: "Toronto, ON",
    region: "Canada",
    requirements: {
      sat: { median: 1370, range: { min: 1330, max: 1500 }, required: false },
      act: { median: 31, required: false },
      gpa: { min: 3.7, weighted: true },
      ielts: { min: 6.5, required: true },
      toefl: { min: 100, required: true }
    },
    acceptanceRate: 43.0,
    ranking: { qs: 21, times: 18 },
    notablePrograms: ["Computer Science", "Engineering", "Business", "Medicine"],
    description:
      "Ведущий университет Канады, известен сильными программами в компьютерных науках, инженерии и бизнесе.",
    website: "https://www.utoronto.ca/",
    applicationDeadline: "January 15"
  },
  {
    id: "mcgill",
    name: "McGill University",
    country: "Canada",
    city: "Montreal, QC",
    region: "Canada",
    requirements: {
      sat: { median: 1400, range: { min: 1300, max: 1500 }, required: false },
      gpa: { min: 3.7, weighted: true },
      ielts: { min: 6.5, required: true },
      toefl: { min: 90, required: true }
    },
    acceptanceRate: 46.0,
    ranking: { qs: 30, times: 46 },
    notablePrograms: ["Medicine", "Law", "Business", "Engineering"],
    description:
      "Престижный университет в Монреале, известен сильными программами в медицине, праве и бизнесе.",
    website: "https://www.mcgill.ca/",
    applicationDeadline: "January 15"
  },

  // European Universities
  {
    id: "eth-zurich",
    name: "ETH Zurich",
    country: "Switzerland",
    city: "Zurich",
    region: "Europe",
    requirements: {
      sat: { median: 1450, required: false },
      ib: { min: 38, required: true },
      ielts: { min: 7.0, required: true }
    },
    acceptanceRate: 27.0,
    ranking: { qs: 7, times: 11 },
    notablePrograms: ["Engineering", "Computer Science", "Mathematics", "Physics"],
    description:
      "Ведущий технический университет Швейцарии, известен сильными программами в инженерии и естественных науках.",
    website: "https://www.ethz.ch/",
    applicationDeadline: "December 31"
  },
  {
    id: "sorbonne",
    name: "Sorbonne University",
    country: "France",
    city: "Paris",
    region: "Europe",
    requirements: {
      ib: { min: 35, required: false },
      ielts: { min: 6.5, required: true }
    },
    acceptanceRate: 50.0,
    ranking: { qs: 77, times: 48 },
    notablePrograms: ["Arts", "Humanities", "Sciences", "Medicine"],
    description:
      "Престижный университет в Париже, образован слиянием Париж-Сорбонна и Университета Пьера и Марии Кюри.",
    website: "https://www.sorbonne-universite.fr/",
    applicationDeadline: "Varies by program"
  }
];

