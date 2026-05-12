import { ensureBuckets } from "../src/lib/storage";

(async () => {
  await ensureBuckets();
  console.log("Buckets ensured.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
