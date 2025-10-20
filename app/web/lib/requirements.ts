export type RequirementNeed = {
  id: string;
  title: string;        
  needText: string;     
  searchPath?: string;  
  options?: string[];   
};

export type ActionableNeeds = {
  geneds: RequirementNeed[];
  courses: RequirementNeed[];
};


const BAD_TITLES = [
  "TOTAL HOURS",
  "SUMMARY OF COURSES",
  "CREDIT/NO CREDIT",
  "HOURS IN PROGRESS",
  "EARNED HOURS",
  "0.0 GPA HOURS",
  "2.000 GPA REQUIRED",
  "YOUR GRADE POINT AVERAGE",
  "COMBINED GPA",
  "RESIDENCY REQUIREMENT",
  "STATISTICS AND COMPUTER SCIENCE MAJOR",
];

const GENED_KEYWORDS = [
  "GENERAL EDUCATION",
  "HUMANITIES AND THE ARTS",
  "SOCIAL AND BEHAVIORAL",
  "NATURAL SCIENCES AND TECHNOLOGY",
  "CULTURAL STUDIES",
  "COMPOSITION",
  "QUANTITATIVE REASONING",
  "WESTERN/COMPARATIVE",
  "NON-WESTERN",
  "U.S. MINORITY",
];

function stripNumbering(title: string) {
  return title.replace(/^\s*\d+\)\s*/,'').trim();
}

function looksBadTitle(title: string) {
  const T = title.toUpperCase();
  return BAD_TITLES.some((x) => T.includes(x));
}

function hasSatisfiedHints(s: string) {
  return /COURSE TAKEN|EARNED:\s*\d+(\.\d+)?\s*(COURSES?|HOURS?)|COMPLETED/i.test(s);
}

function isGenEdCategoryTitle(title: string) {
  const T = title.toUpperCase();
  return GENED_KEYWORDS.some(k => T.includes(k));
}

function isGenericGenEd(title: string) {
  const T = title.toUpperCase();
  return T.includes("GENERAL EDUCATION") &&
         !/HUMANITIES|SOCIAL|NATURAL|CULTURAL|COMPOSITION|QUANTITATIVE|WESTERN|NON-WESTERN|U\.S\./i.test(title);
}

function extractNeedText(titlePlusLines: string) {
  const m = /NEEDS?:\s*([0-9.]+\s*(?:HOURS?|COURSES?)|1\s*SUB-?GROUP|[0-9]+\s*SUB-?GROUPS?)/i.exec(titlePlusLines);
  return m ? `NEEDS: ${m[1].trim()}` : null;
}

function extractCourseCodes(text: string): string[] {
  const out = new Set<string>();

  const pA = /([A-Z]{2,5})\s+((?:\d{3})(?:\s*[,/]\s*\d{3})+)/g;
  for (const match of text.matchAll(pA)) {
    const subj = match[1].toUpperCase();
    const nums = match[2].match(/\d{3}/g) || [];
    nums.forEach((n) => {
      const num = parseInt(n, 10);
      if (num >= 100 && num < 600 && num !== 999) out.add(`${subj} ${num}`);
    });
  }

  const pB = /([A-Z]{2,5})\s+(\d{3})/g;
  for (const match of text.matchAll(pB)) {
    const subj = match[1].toUpperCase();
    const num = parseInt(match[2], 10);
    if (num >= 100 && num < 600 && num !== 999) out.add(`${subj} ${num}`);
  }

  return Array.from(out);
}

function friendlyCourseGroupTitle(title: string, blob: string): string {
  const t = (title + " " + blob).toUpperCase();

  if (/REQUIRED COMPUTER SCIENCE FOUNDATION/i.test(t)) return "CS Foundation";
  if (/ONE OF THE FOLLOWING COMBINATIONS/i.test(t)) return "Systems pair";
  if (/REQUIRED STATISTICS COURSES/i.test(t)) return "Required Statistics Core";
  if (/STATISTICAL APPLICATION ELECTIVE/i.test(t)) return "Statistical Application Elective";
  if (/COMPUTATIONAL APPLICATION ELECTIVE/i.test(t)) return "Computational Application Elective";

  if (/SELECT FROM:\s*CS\s+222.*357.*374.*421/i.test(t)) return "CS Core Options";
  if (/SELECT FROM:\s*STAT\s+410.*425.*426/i.test(t)) return "Statistics Core Electives";
  if (/SELECT FROM:\s*CS\s+410.*482/i.test(t)) return "Upper-level CS Elective";

  return stripNumbering(title).replace(/^NEEDS?:.*?\bSELECT FROM:\s*/i, "").trim() || "Major requirement";
}

function buildSearchPath(title: string, blob: string, options?: string[]) {
  const t = (title + " " + blob).toUpperCase();

  if (t.includes("ADVANCED COMPOSITION")) return "/search?gened=ACP";
  if (t.includes("COMPOSITION I")) return "/search?gened=COMP1";
  if (t.includes("QUANTITATIVE REASONING II") || t.includes("QR2")) return "/search?gened=QR2";
  if (t.includes("QUANTITATIVE REASONING I") || t.includes("QR1")) return "/search?gened=QR1";
  if (t.includes("HUMANITIES AND THE ARTS")) return "/search?gened=HUM";
  if (t.includes("SOCIAL AND BEHAVIORAL")) return "/search?gened=SB";
  if (t.includes("NATURAL SCIENCES AND TECHNOLOGY")) return "/search?gened=NAT";
  if (t.includes("WESTERN/COMPARATIVE")) return "/search?gened=WEST";
  if (t.includes("NON-WESTERN")) return "/search?gened=NW";
  if (t.includes("U.S. MINORITY")) return "/search?gened=US";

  if (options && options.length) {
    const subj = options[0].split(" ")[0];
    return `/search?subject=${encodeURIComponent(subj)}`;
  }

  if (t.includes("300 OR 400") || t.includes("ADVANCED HOUR")) return "/search?minLevel=300";
  return undefined;
}



export function extractActionableNeeds(raw: any, taken?: Set<string>): ActionableNeeds {
  const result: ActionableNeeds = { geneds: [], courses: [] };
  const seen = new Set<string>();
  const sections = Array.isArray(raw?.sections) ? raw.sections : [];

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i] || {};
    const rawTitle = String(sec.section_title || "");
    if (!rawTitle) continue;

    if (looksBadTitle(rawTitle)) continue;

    const lines: string[] = Array.isArray(sec.raw_lines) ? sec.raw_lines : [];
    const blob = lines.join(" ");
    const allText = (rawTitle + " " + blob).trim();

    const needText = extractNeedText(allText);
    if (!needText) continue;                   
    if (hasSatisfiedHints(allText)) continue;  
    if (/SUB-?GROUP/i.test(rawTitle)) continue;

    if (isGenEdCategoryTitle(rawTitle) && !isGenericGenEd(rawTitle)) {
      const title = stripNumbering(rawTitle);
      const key = `GENED|${title}|${needText}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.geneds.push({
        id: `gened_${i}`,
        title,
        needText,
        searchPath: buildSearchPath(title, blob),
      });
      continue;
    }

    const selectable = /SELECT FROM:|ONE OF THE FOLLOWING COMBINATIONS/i.test(allText);
    const codes = extractCourseCodes(allText).filter(c => !(taken?.has(c)));

    if (selectable || codes.length > 0) {
      const title = friendlyCourseGroupTitle(rawTitle, blob);
      const key = `COURSES|${title}|${needText}`;
      if (seen.has(key)) continue;
      seen.add(key);

      result.courses.push({
        id: `courses_${i}`,
        title,
        needText: needText.replace(/\s+5\)\s*/,'').trim(), 
        options: codes.length ? codes : undefined,
        searchPath: buildSearchPath(title, blob, codes),
      });
    }
  }
  return result;
}
