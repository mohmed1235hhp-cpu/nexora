/**
 * Phase 21 — Unit Tests: Reputation & Level System
 */
import { describe, it, expect } from "vitest";

function calculateLevel(score: number): number {
  if (score < 100) return 1;
  if (score < 300) return 2;
  if (score < 700) return 3;
  if (score < 1500) return 4;
  if (score < 3000) return 5;
  if (score < 6000) return 6;
  if (score < 12000) return 7;
  if (score < 25000) return 8;
  if (score < 50000) return 9;
  return 10;
}

function getLevelName(level: number): string {
  const names = ["", "Novice", "Explorer", "Creator", "Artisan", "Expert", "Master", "Elite", "Legend", "Grand Master", "AI Pioneer"];
  return names[level] ?? "AI Pioneer";
}

describe("Reputation & Level System", () => {
  it("should return level 1 for score 0-99", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(50)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
  });

  it("should return level 10 for score 50000+", () => {
    expect(calculateLevel(50000)).toBe(10);
    expect(calculateLevel(999999)).toBe(10);
  });

  it("should correctly map all levels", () => {
    const thresholds = [0, 100, 300, 700, 1500, 3000, 6000, 12000, 25000, 50000];
    const expectedLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    thresholds.forEach((score, i) => {
      expect(calculateLevel(score)).toBe(expectedLevels[i]);
    });
  });

  it("should return correct level names", () => {
    expect(getLevelName(1)).toBe("Novice");
    expect(getLevelName(5)).toBe("Expert");
    expect(getLevelName(10)).toBe("AI Pioneer");
  });

  it("should calculate stars correctly (max 5)", () => {
    function calculateStars(level: number): number {
      return Math.min(5, Math.floor(level / 2));
    }

    expect(calculateStars(1)).toBe(0);
    expect(calculateStars(2)).toBe(1);
    expect(calculateStars(10)).toBe(5);
    expect(calculateStars(100)).toBe(5); // capped at 5
  });
});
