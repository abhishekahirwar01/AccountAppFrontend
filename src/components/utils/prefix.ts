// utils/prefix.js
exports.deriveThreeLetterPrefix = function deriveThreeLetterPrefix(name = "") {
  const cleaned = (name || "").replace(/[^A-Za-z\s]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
  if (!cleaned) return "XXX";
  const words = cleaned.split(" ");
  let letters = words.slice(0, 3).map(w => w[0]).join(""); // first letters of up to 3 words
  if (letters.length < 3) {
    const rest = cleaned.replace(/\s/g, "");
    for (let i = 0; i < rest.length && letters.length < 3; i++) letters += rest[i];
  }
  return (letters + "XXX").slice(0, 3);
};
