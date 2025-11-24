export function checkTypedText(fullText: string, typedText: string) {
  let correctText = "";
  let highlightedRemainingText = "";

  let correctIndex = 0;
  let wrongIndex = 0;

  for (let i = 0; i < typedText.length; i++) {
    if (typedText[i] === fullText[i]) {
      correctIndex++;
    } else {
      break;
    }
  }

  wrongIndex = typedText.length;

  correctText = fullText.slice(0, correctIndex);
  highlightedRemainingText = fullText.slice(correctIndex, wrongIndex);
  fullText.slice(wrongIndex);

  let remainingText = fullText.slice(wrongIndex, fullText.length);
  return {
    correctText: correctText,
    highlightedRemainingText: highlightedRemainingText,
    remainingText,
  };
}

export function replaceWeirdCharacters(text: string) {
  return text
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace("’", "'")
    .replace("…", "...");
}
