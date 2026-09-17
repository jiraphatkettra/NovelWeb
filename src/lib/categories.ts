// Category definitions and mapping between Thai and English names

export interface CategoryDef {
  id: string; // English canonical key e.g. "Fantasy"
  label: string; // Thai display name e.g. "แฟนตาซี"
}

export const CATEGORIES: CategoryDef[] = [
  { id: "Fantasy", label: "แฟนตาซี" },
  { id: "Romance", label: "โรแมนติก" },
  { id: "Action", label: "แอ็กชัน" },
  { id: "Sci-Fi", label: "ไซไฟ" },
  { id: "Horror", label: "สยองขวัญ" },
  { id: "Mystery", label: "สืบสวน" },
  { id: "Slice of Life", label: "ชีวิตประจำวัน" },
  { id: "Drama", label: "ดราม่า" },
  { id: "Comedy", label: "คอมเมดี้" },
  { id: "Martial Arts", label: "กำลังภายใน" },
  { id: "Isekai", label: "ต่างโลก" },
  { id: "Rebirth", label: "เกิดใหม่" },
];

// Helper to get all matching category values for database queries (supporting both Thai & English)
export function getCategoryMatchValues(input: string): string[] {
  if (!input || input === "ALL") return [];

  const found = CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === input.toLowerCase() ||
      c.label.toLowerCase() === input.toLowerCase()
  );

  if (found) {
    return [found.id, found.label];
  }

  return [input];
}

// Helper to normalize to canonical English ID for DB or Thai Label
export function toCanonicalCategory(input: string): string {
  const found = CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === input.toLowerCase() ||
      c.label.toLowerCase() === input.toLowerCase()
  );
  return found ? found.id : input;
}

export function toThaiCategory(input: string): string {
  const found = CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === input.toLowerCase() ||
      c.label.toLowerCase() === input.toLowerCase()
  );
  return found ? found.label : input;
}
