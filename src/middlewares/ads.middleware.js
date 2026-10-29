// Ad eligibility is a reading-progress signal only; it never requests an ad impression.
export const ADS_CHAPTER_INTERVAL = 6;
export const shouldShowAd = (chaptersSinceLastAd) => chaptersSinceLastAd >= ADS_CHAPTER_INTERVAL;
