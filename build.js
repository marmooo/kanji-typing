import { readLines } from "https://deno.land/std/io/mod.ts";
import { YomiDict } from "https://raw.githubusercontent.com/marmooo/yomi-dict/v0.1.5/mod.js";
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

async function getGradedVocab(grade, threshold) {
  const filepath = "graded-vocab-ja/dist/" + grade + ".csv";
  return await getGradedWords(filepath, threshold);
}

async function getGradedIdioms(grade, threshold) {
  const filepath = "graded-idioms-ja/dist/" + grade + ".csv";
  return await getGradedWords(filepath, threshold);
}

async function build(threshold) {
  const yomiDict = await YomiDict.load("yomi-dict/yomi.csv");
  for (let grade = 1; grade <= 12; grade++) {
    const result = [];
    let words = [];
    const vocab = await getGradedVocab(grade, threshold);
    const idioms = await getGradedIdioms(grade, threshold);
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
    const outPath = "src/data/" + grade + ".tsv";
    Deno.writeTextFileSync(outPath, result.join("\n"));
  }
}

const threshold = 100000;
await build(threshold);
