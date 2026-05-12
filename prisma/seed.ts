import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LABELS = [
  { name: "adventure", color: "#D85A30" },
  { name: "cozy", color: "#1D9E75" },
  { name: "movie night", color: "#7F77DD" },
  { name: "date night", color: "#C84A72" },
  { name: "food", color: "#C68220" },
  { name: "sport", color: "#3C7BC8" },
  { name: "life changing", color: "#A56913" },
  { name: "chill", color: "#888780" },
];

const PROMPTS: { question: string; category: string }[] = [
  // Affirmation
  { category: "affirmation", question: "What's one thing you admire about them that you've never told them?" },
  { category: "affirmation", question: "Describe a moment this week when they made your day better." },
  { category: "affirmation", question: "What quality of theirs are you most grateful for?" },
  { category: "affirmation", question: "Write one sentence that describes how they make you feel safe." },
  { category: "affirmation", question: "What's your favorite thing about how they laugh?" },
  { category: "affirmation", question: "What's something they do that makes you proud of them?" },
  { category: "affirmation", question: "If you had to describe them in three words, what would they be?" },
  { category: "affirmation", question: "What's the first thing you noticed about them?" },
  { category: "affirmation", question: "What's something you love about how they look at you?" },
  { category: "affirmation", question: "Name a way they've grown that you've watched happen up close." },
  { category: "affirmation", question: "What's one of their strengths that other people might miss?" },
  { category: "affirmation", question: "What's a way they show love that's uniquely them?" },
  { category: "affirmation", question: "How do they make a regular Tuesday feel special?" },
  { category: "affirmation", question: "What's something they wear that you love seeing them in?" },
  { category: "affirmation", question: "If they had a superpower already, what would you call it?" },
  { category: "affirmation", question: "What's the best compliment you've ever given them?" },
  { category: "affirmation", question: "What's a tiny thing they do that disarms you?" },
  { category: "affirmation", question: "When do you feel proudest to be with them?" },
  { category: "affirmation", question: "What's the bravest thing you've watched them do?" },
  { category: "affirmation", question: "Describe their kindness without using the word 'nice'." },
  { category: "affirmation", question: "What do you love about the way they think?" },
  { category: "affirmation", question: "How are they different now from when you first met?" },
  { category: "affirmation", question: "What's a way they take care of you that you take for granted?" },
  { category: "affirmation", question: "When have you felt most chosen by them?" },
  { category: "affirmation", question: "What part of their personality do you wish you had more of?" },

  // Gratitude
  { category: "gratitude", question: "What's something small they did recently that made you smile?" },
  { category: "gratitude", question: "Name something they do for you that they probably think goes unnoticed." },
  { category: "gratitude", question: "What's a habit of theirs that you've grown to love?" },
  { category: "gratitude", question: "What's the best meal they made or picked for you?" },
  { category: "gratitude", question: "What's a moment from this week you keep replaying in your head?" },
  { category: "gratitude", question: "What's a small luxury you have together that you don't want to forget?" },
  { category: "gratitude", question: "What's a place you've been together that you're grateful for?" },
  { category: "gratitude", question: "What's a way you've been spoiled recently — by them or by life with them?" },
  { category: "gratitude", question: "What's the most thoughtful thing they've ever planned for you?" },
  { category: "gratitude", question: "Write a thank you for something they did this month." },
  { category: "gratitude", question: "What's a sound or smell that means home to you now?" },
  { category: "gratitude", question: "What's something they noticed about you that no one else did?" },
  { category: "gratitude", question: "When did they last surprise you with something small?" },
  { category: "gratitude", question: "What's a memory you're glad you took a photo of?" },
  { category: "gratitude", question: "Describe a perfect ordinary morning you've had together." },
  { category: "gratitude", question: "What's a thing they've taught you to enjoy?" },
  { category: "gratitude", question: "What's a piece of advice from them that stuck?" },
  { category: "gratitude", question: "What's a meal you're grateful you don't have to eat alone anymore?" },
  { category: "gratitude", question: "Name a body of water you'd thank for being part of your story together." },
  { category: "gratitude", question: "What's a song that makes you grateful when it plays?" },
  { category: "gratitude", question: "What's a friend they've brought into your life that you love?" },
  { category: "gratitude", question: "What's a future thing you can't wait to be grateful for?" },
  { category: "gratitude", question: "What's a way they helped you through a hard week?" },
  { category: "gratitude", question: "What's a habit they've helped you build?" },
  { category: "gratitude", question: "Name something small that's now your 'thing'." },

  // Reflection
  { category: "reflection", question: "What's a challenge you've overcome together that made you stronger?" },
  { category: "reflection", question: "How have you grown as a couple in the last month?" },
  { category: "reflection", question: "What's something you've learned from them?" },
  { category: "reflection", question: "Describe a moment where they surprised you in a good way." },
  { category: "reflection", question: "What's a fight you're glad you had? What did it teach you?" },
  { category: "reflection", question: "What's a thing you used to argue about that doesn't bother you anymore?" },
  { category: "reflection", question: "What's a part of yourself you only show to them?" },
  { category: "reflection", question: "What was the bravest decision you've made together?" },
  { category: "reflection", question: "When did you last feel like a real team?" },
  { category: "reflection", question: "What's something you're still figuring out together?" },
  { category: "reflection", question: "What do you wish someone had told you about long-term love?" },
  { category: "reflection", question: "How has your sense of home changed since being together?" },
  { category: "reflection", question: "Describe a season where you both grew up a little." },
  { category: "reflection", question: "What's something you'd like to do differently in the next year?" },
  { category: "reflection", question: "What's a value you share that you're proud of?" },
  { category: "reflection", question: "How do you want to be loved differently than you were before?" },
  { category: "reflection", question: "What's a piece of who you were before you met them you're glad you kept?" },
  { category: "reflection", question: "What's a fear you've shared that you don't talk about often?" },
  { category: "reflection", question: "What's a way you've changed because of them?" },
  { category: "reflection", question: "Describe a moment when you saw them differently." },
  { category: "reflection", question: "What's a tradition you want to start together?" },
  { category: "reflection", question: "What kind of older couple do you want to be?" },
  { category: "reflection", question: "What's something you didn't know about love until them?" },
  { category: "reflection", question: "What's a sacrifice they made for you that you're not sure you've acknowledged?" },
  { category: "reflection", question: "When was the last time you laughed together until you couldn't breathe?" },

  // Fun
  { category: "fun", question: "If you could relive any day together, which one and why?" },
  { category: "fun", question: "What's their most endearing quirk?" },
  { category: "fun", question: "If you were both characters in a movie, what genre would it be?" },
  { category: "fun", question: "What's the funniest thing that's happened to you both this month?" },
  { category: "fun", question: "What's a song that should be your unofficial theme right now?" },
  { category: "fun", question: "Pitch your love story as a Netflix synopsis." },
  { category: "fun", question: "What would your dream Sunday together look like in full detail?" },
  { category: "fun", question: "If you could build a tiny shop together, what would you sell?" },
  { category: "fun", question: "What's their best dance move?" },
  { category: "fun", question: "What's the most underrated thing about them?" },
  { category: "fun", question: "What city would you secretly love to move to with them?" },
  { category: "fun", question: "What's a meal you want them to cook for you in 10 years?" },
  { category: "fun", question: "Which fictional couple do you remind yourselves of?" },
  { category: "fun", question: "If you had to share an emoji that describes them, which?" },
  { category: "fun", question: "What's a nickname they have for you that you secretly love?" },
  { category: "fun", question: "Describe your perfect impromptu road trip." },
  { category: "fun", question: "What's the silliest fight you ever had?" },
  { category: "fun", question: "What's a hobby you'd love to try together?" },
  { category: "fun", question: "If you co-wrote a children's book, what would it be about?" },
  { category: "fun", question: "What outfit on them lives rent-free in your head?" },
  { category: "fun", question: "What's something you'd find funny in 5 years that you couldn't laugh at today?" },
  { category: "fun", question: "If you opened a restaurant together, what's the signature dish?" },
  { category: "fun", question: "What's the most romantic thing about being a little bored together?" },
  { category: "fun", question: "If you had to plan a surprise weekend, what's the plan?" },
  { category: "fun", question: "What's a small thing you'd put in a love-letter time capsule for them?" },
];

async function main() {
  console.log("Seeding labels…");
  for (const l of LABELS) {
    await prisma.label.upsert({
      where: { name: l.name },
      update: { color: l.color, isDefault: true },
      create: { ...l, isDefault: true },
    });
  }
  console.log(`Labels: ${LABELS.length}`);

  console.log("Seeding prompts…");
  // Only insert prompts that aren't already there
  const existing = await prisma.prompt.findMany({ select: { question: true } });
  const have = new Set(existing.map((p) => p.question));
  const toInsert = PROMPTS.filter((p) => !have.has(p.question));
  if (toInsert.length > 0) {
    await prisma.prompt.createMany({ data: toInsert, skipDuplicates: true });
  }
  console.log(`Prompts: ${PROMPTS.length} total, ${toInsert.length} new`);

  console.log("Done.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
