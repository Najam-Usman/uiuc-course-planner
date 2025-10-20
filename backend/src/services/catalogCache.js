import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";


const FALLBACK_DIR = path.join(process.cwd(), "src", "data");
const MAJORS_FALLBACK = path.join(FALLBACK_DIR, "majors.fallback.json");
const COLLEGES_FALLBACK = path.join(FALLBACK_DIR, "colleges.fallback.json");

let cache = {
  loadedAt: 0,
  majors: ([]),
  colleges: ([]),
};

const TTL_MS = 24 * 60 * 60 * 1000; 

const BASE = "https://catalog.illinois.edu";
const MAJORS_URL = `${BASE}/undergraduate/majors/`;

const COLLEGE_SLUG_MAP = {
  engineering: "Grainger College of Engineering",
  las: "College of Liberal Arts & Sciences",
  business: "Gies College of Business",
  aces: "College of ACES",
  education: "College of Education",
  faa: "College of Fine & Applied Arts",
  ischool: "School of Information Sciences",
  ahs: "College of Applied Health Sciences",
  media: "College of Media",
  dgs: "Division of General Studies",
  "fine-applied-arts": "College of Fine & Applied Arts",
  "applied-health-sciences": "College of Applied Health Sciences",
};

const DEFAULT_COLLEGES = [
  "Grainger College of Engineering",
  "College of Liberal Arts & Sciences",
  "Gies College of Business",
  "College of ACES",
  "College of Education",
  "College of Fine & Applied Arts",
  "School of Information Sciences",
  "College of Applied Health Sciences",
  "College of Media",
  "Division of General Studies",
];

function tidy(s = "") {
  return s.replace(/\s+/g, " ").trim();
}
function extractDegree(txt) {
  const m = txt.match(/\b(BS|B\.S\.|BA|B\.A\.|BSE|B\.S\.E\.|BALAS|BFA|B\.\s?FA|BSLAS)\b/i);
  return m ? m[0].replace(/\./g, "") : undefined;
}
function inferCollegeFromHref(href) {
  try {
    const u = new URL(href.startsWith("http") ? href : `${BASE}${href}`);
    const parts = u.pathname.split("/").filter(Boolean); 
    const idx = parts.indexOf("undergraduate");
    const slug = idx >= 0 ? (parts[idx + 1] || "").toLowerCase() : "";
    return COLLEGE_SLUG_MAP[slug];
  } catch {
    return undefined;
  }
}

async function fetchText(url) {
  try {
    const { data, status } = await axios.get(url, {
      timeout: 20000,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://catalog.illinois.edu/",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      validateStatus: () => true, 
      decompress: true,
    });
    if (status >= 200 && status < 300 && typeof data === "string" && data.length > 2000) {
      return String(data);
    }
    return null; 
  } catch {
    return null;
  }
}


function collectProgramAnchors($) {
  const anchors = [];
  const roots = [
    ".az_sitemap",        
    "#atoz",              
    "#content",
    "main",
    "#main",
    ".content",
    "body",
  ];
  const seen = new Set();

  for (const root of roots) {
    const $root = $(root);
    if ($root.length === 0) continue;
    $root.find("a[href*='/undergraduate/']").each((_i, el) => {
      const href = String($(el).attr("href") || "");
      const text = tidy($(el).text());
      if (!href || !text) return;

      const id = `${href}::${text}`;
      if (seen.has(id)) return;
      seen.add(id);

      anchors.push({ href, text });
    });
    if (anchors.length > 50) break; 
  }
  return anchors;
}

function filterToMajors(anchors) {
  return anchors
    .filter(({ href, text }) => {
      const lower = text.toLowerCase();
      if (
        /back to top|catalog|policy|admission|minor|certificate|curriculum|requirements|pdf|download/i.test(
          lower
        ) ||
        /^see /i.test(lower) ||
        /^\(see/i.test(lower) ||
        /@/.test(text) 
      ) {
        return false;
      }
      if (text.length < 3 || text.length > 200) return false;

      if (!/\/undergraduate\/[^/]+\/.+/i.test(href)) return false;

      return true;
    })
    .map(({ href, text }) => {
      const degree = extractDegree(text);
      const collegeName = inferCollegeFromHref(href);
      return {
        name: text,
        degree,
        collegeName,
        href: href.startsWith("http") ? href : `${BASE}${href}`,
      };
    });
}

async function scrapeMajorsIndex() {
  const html = await fetchText(MAJORS_URL);
  if (!html) return [];
  const $ = cheerio.load(html);
  const anchors = collectProgramAnchors($);
  const majors = filterToMajors(anchors);

  const seen = new Set();
  const unique = majors.filter((m) => {
    const k = m.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  unique.sort((a, b) => a.name.localeCompare(b.name));
  return unique;
}

async function scrapeCollegePagesIfNeeded(existingMajors) {
  if (existingMajors.length >= 80) return existingMajors; 

  const slugs = Object.keys(COLLEGE_SLUG_MAP);
  const results = await Promise.all(
    slugs.map(async (slug) => {
      const url = `${BASE}/undergraduate/${slug}/`;
      const html = await fetchText(url);
      if (!html) return [];
      const $ = cheerio.load(html);
      const anchors = collectProgramAnchors($)
        .filter(a => new RegExp(`/undergraduate/${slug}/`, "i").test(a.href));
      return filterToMajors(anchors);
    })
  );

  const merged = [...existingMajors, ...results.flat()];
  const seen = new Set();
  const unique = merged.filter((m) => {
    const k = m.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  unique.sort((a, b) => a.name.localeCompare(b.name));
  return unique;
}

function deriveColleges(majors, collegesFallback) {
  const set = new Set(
    majors
      .map((m) => tidy(m.collegeName || ""))
      .filter((c) => c && /(college|school|division)/i.test(c))
  );
  let arr = Array.from(set).sort((a, b) => a.localeCompare(b));
  if (arr.length >= 8) return arr; 

  if (Array.isArray(collegesFallback) && collegesFallback.length >= 8) {
    return collegesFallback;
  }
  return DEFAULT_COLLEGES;
}

export async function ensureCatalog(force = false) {
  const fresh =
    !force && Date.now() - cache.loadedAt < TTL_MS && cache.majors.length && cache.colleges.length;
  if (fresh) return cache;

  let majors = [];
  try {
    if (fs.existsSync(MAJORS_FALLBACK)) {
      majors = JSON.parse(fs.readFileSync(MAJORS_FALLBACK, "utf-8"));
    }
  } catch {}
  let collegesFallback = [];
  try {
    if (fs.existsSync(COLLEGES_FALLBACK)) {
      collegesFallback = JSON.parse(fs.readFileSync(COLLEGES_FALLBACK, "utf-8"));
    }
  } catch {}

  let scraped = await scrapeMajorsIndex();
  scraped = await scrapeCollegePagesIfNeeded(scraped);

  if (scraped.length >= 30) {
    majors = scraped;
  }

  const colleges = deriveColleges(majors, collegesFallback);


  const merged = [...(majors || []), ...(scraped || [])];
  const seen = new Set();
  majors = merged.filter(m => {
    const k = (m?.name || "").toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a,b)=> a.name.localeCompare(b.name));


  cache = { loadedAt: Date.now(), majors, colleges };
  return cache;
}

export async function getMajors() {
  const { majors } = await ensureCatalog();
  return majors;
}

export async function getColleges() {
  const { colleges } = await ensureCatalog();
  return colleges;
}

export async function refreshCatalog() {
  await ensureCatalog(true);
  return {
    ok: true,
    loadedAt: cache.loadedAt,
    majors: cache.majors.length,
    colleges: cache.colleges.length,
  };
}
