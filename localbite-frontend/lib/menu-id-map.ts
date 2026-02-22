export const menuItemIdMap: { [key: string]: number } = {
  m1: 1,
  m2: 2,
  m3: 3,
  m4: 4,
  m5: 5,
  m6: 6,
  m7: 7,
  m8: 8,
  m9: 9,
  m10: 10,
  m11: 11,
  m12: 12,
  m13: 13,
  m14: 14,
  m15: 15,
  m16: 16,
  m17: 17,
  m18: 18,
  m19: 19,
  m20: 20,
};

export function getDatabaseMenuItemId(mockId: string): number {
  const dbId = menuItemIdMap[mockId];
  if (!dbId) {
    console.warn(`Menu item ID mapping not found for ${mockId}`);
    return parseInt(mockId.replace(/\D/g, "") || "0");
  }
  return dbId;
}
