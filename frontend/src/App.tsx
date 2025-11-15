import React, { useEffect, useState } from "react";
import "./App.css";

async function fetchQuote(setters: {
  setQuote: Function;
  setBookTitle: Function;
  setRemainingText: Function;
  setTypedText: Function;
  setCorrectText: Function;
  setHighlightedRemainingText: Function;
}) {
  const {
    setQuote,
    setBookTitle,
    setRemainingText,
    setTypedText,
    setCorrectText,
    setHighlightedRemainingText: setHighlightedRemainingText,
  } = setters;

  try {
    const res = await fetch("http://127.0.0.1:8000/random_quote");
    const data = await res.json();
    const cleanText = replaceWeirdCharacters(data.highlight);

    setQuote(cleanText);
    setBookTitle(data.book_title);
    setRemainingText(cleanText);
    setTypedText("");
    setCorrectText("");
    setHighlightedRemainingText("");
  } catch (err) {
    console.error("Failed to fetch quote:", err);
  }
}

function checkTypedText(fullText: string, typedText: string) {
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

function replaceWeirdCharacters(text: string) {
  return text
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace("’", "'")
    .replace("…", "...")
    .replace("α", "alpha");
}

function App() {
  const [quote, setQuote] = useState("");
  const [typedText, setTypedText] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [remainingText, setRemainingText] = useState("");
  const [correctText, setCorrectText] = useState("");
  const [highlightedRemainingText, setHighlightedRemainingText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [wpm, setWpm] = useState(0);

  useEffect(() => {
    fetchQuote({
      setQuote,
      setBookTitle,
      setRemainingText,
      setTypedText,
      setCorrectText,
      setHighlightedRemainingText,
    });
  }, []);

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 10);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (!quote) return;
    setTime(0);
    setIsRunning(true);
  }, [quote]);

  const seconds = Math.floor(time / 100);

  return (
    <main>
      <h1>📚 Bookracer</h1>
      <h2>{bookTitle}</h2>
      <div className="quote-container">
        <p style={{ fontSize: "1.2rem" }}>
          <span style={{ color: "#00ff00" }}>{correctText}</span>

          <span style={{ backgroundColor: "red" }}>
            {highlightedRemainingText}
          </span>
          <span className="cursor"></span>
          <span>{remainingText}</span>
        </p>
      </div>

      <p>Your WPM: {wpm}</p>

      <div className="stopwatch-container">
        <p className="stopwatch-time">
          {seconds.toString().padStart(2, "0")}:
          {(time % 100).toString().padStart(2, "0")}
        </p>
      </div>
      <input
        autoFocus
        type="text"
        placeholder="Start typing..."
        value={typedText}
        onChange={(e) => {
          const value = e.target.value;

          setTypedText(value);

          const {
            correctText,
            highlightedRemainingText,
            remainingText,
          } = checkTypedText(quote, value);

          setCorrectText(correctText);
          setWpm(Math.round(correctText.length / 5 / (time / 100 / 60) || 0));

          setHighlightedRemainingText(highlightedRemainingText);
          setRemainingText(remainingText);

          // Optional: Completion check
          if (value === quote) {
            alert(
              `🎉 Congratulations! You’ve completed the quote. Your WPM is ${wpm}.`
            );
            fetchQuote({
              setQuote,
              setBookTitle,
              setRemainingText,
              setTypedText,
              setCorrectText,
              setHighlightedRemainingText,
            });
          }
        }}
      />
    </main>
  );
}

export default App;
