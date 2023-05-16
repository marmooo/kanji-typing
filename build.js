import { readLines } from "https://deno.land/std/io/mod.ts";
import { YomiDict } from "https://raw.githubusercontent.com/marmooo/yomi-dict/v0.1.3/mod.js";
import { hiraToRoma } from "https://raw.githubusercontent.com/marmooo/hiraroma/main/mod.js";

async function getGradedWords(filepath, threshold) {
  const examples = [];
  const fileReader = await Deno.open(filepath);
  for await (const line of readLines(fileReader)) {
    if (!line) continue;
    const arr = line.split(",");
    const word = arr[0];
    const count = parseInt(arr[1]);
    if (count >= threshold) {
      examples.push(word);
    }
  }
  return examples;
}

async function getGradedVocab(level, threshold) {
  const filepath = "graded-vocab-ja/dist/" + level + ".csv";
  return await getGradedWords(filepath, threshold);
}

async function getGradedIdioms(level, threshold) {
  const filepath = "graded-idioms-ja/dist/" + level + ".csv";
  return await getGradedWords(filepath, threshold);
}

async function build(threshold) {
  const yomiDict = await YomiDict.load("yomi-dict/yomi.csv");
  for (let level = 1; level <= 10; level++) {
    const result = [];
    let words = [];
    const vocab = await getGradedVocab(level, threshold);
    const idioms = await getGradedIdioms(level, threshold);
    words.push(...vocab);
    words.push(...idioms);
    words = [...new Set(words)];
    for (const word of words) {
      let yomis = yomiDict.get(word);
      if (!yomis) continue;
      yomis = yomis.filter((yomi) => yomi.at(-1) != "っ");
      if (yomis.length == 0) continue;
      const romas = yomis.map((yomi) => hiraToRoma(yomi));
      const line = word + "\t" + yomis.join("|") + "\t" + romas.join("|");
      result.push(line);
    }
    const outPath = "src/data/" + level + ".tsv";
    Deno.writeTextFileSync(outPath, result.join("\n"));
  }
}

const threshold = 100000;
await build(threshold);
