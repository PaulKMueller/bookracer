import React, { useEffect, useState } from "react";
import "./App.css";

function checkAndRemoveTypedText(fullText: string, typedText: string) {
  if (fullText.startsWith(typedText)) {
    return fullText.slice(typedText.length).trimStart();
  }
  return fullText;
}

async function fetchQuote(setters: {
  setQuote: Function;
  setBookTitle: Function;
  setRemainingText: Function;
  setTypedText: Function;
  setCorrectText: Function;
  setWrongText: Function;
  setIsLoading: Function;
}) {
  const {
    setQuote,
    setBookTitle,
    setRemainingText,
    setTypedText,
    setCorrectText,
    setWrongText,
    setIsLoading,
  } = setters;

  setIsLoading(true);

  try {
    const res = await fetch("http://127.0.0.1:8000/random_quote");
    const data = await res.json();
    const cleanText = replaceWeirdCharacters(data.highlight);

    setQuote(cleanText);
    setBookTitle(data.book_title);
    setRemainingText(cleanText);
    setTypedText("");
    setCorrectText("");
    setWrongText("");
  } catch (err) {
    console.error("Failed to fetch quote:", err);
  } finally {
    setIsLoading(false);
  }
}

function checkTypedText(fullText: string, typedText: string) {
  // Return the number of correct words typed, the correctly typed text, the wrongly typed text and the remaining text.
  // All text that comes after a mistake is considered wrong.

  let correctText = "";
  let wrongText = "";

  for (let i = 0; i < typedText.length; i++) {
    if (fullText[i] === typedText[i]) {
      correctText += typedText[i];
    } else {
      wrongText = typedText.slice(i);
      break;
    }
  }
  const remainingText = fullText.slice(typedText.length);
  return {
    correctText: correctText,
    wrongText: wrongText,
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
  const [wrongText, setWrongText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    fetchQuote({
      setQuote,
      setBookTitle,
      setRemainingText,
      setTypedText,
      setCorrectText,
      setWrongText,
      setIsLoading,
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

  const seconds = Math.floor(time / 100);
  const startAndStop = () => {
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setTime(0);
  };

  return (
    <main style={{ textAlign: "center", padding: "2rem" }}>
      <h1>📚 Bookracer</h1>
      <h2>{bookTitle}</h2>
      {/* Show correctly typed part as green, wrong part as red */}
      <p style={{ fontSize: "1.2rem" }}>
        <span style={{ color: "green" }}>{correctText}</span>
        <span style={{ color: "red" }}>{wrongText}</span>
        <span>{remainingText}</span>
      </p>

      <div className="stopwatch-container">
        <p className="stopwatch-time">{seconds.toString().padStart(2, "0")}:</p>
        <div className="stopwatch-buttons">
          <button className="stopwatch-button" onClick={startAndStop}>
            {isRunning ? "Stop" : "Start"}
          </button>
          <button className="stopwatch-button" onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      <input
        autoFocus
        type="text"
        placeholder="Start typing..."
        value={typedText}
        onChange={(e) => {
          const value = e.target.value;

          // Update typedText directly from the input field
          setTypedText(value);

          // Compare current typed text to the quote
          const { correctText, wrongText, remainingText } = checkTypedText(
            quote,
            value
          );

          setCorrectText(correctText);
          setWrongText(wrongText);
          setRemainingText(remainingText);

          // Optional: Completion check
          if (value === quote) {
            alert("🎉 Congratulations! You’ve completed the quote.");
            fetchQuote({
              setQuote,
              setBookTitle,
              setRemainingText,
              setTypedText,
              setCorrectText,
              setWrongText,
              setIsLoading,
            });
          }
        }}
      />
    </main>
  );
}

export default App;
