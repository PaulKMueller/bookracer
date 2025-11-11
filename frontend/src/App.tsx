import React, { useEffect, useState } from "react";

function checkAndRemoveTypedText(fullText: string, typedText: string) {
  if (fullText.startsWith(typedText)) {
    return fullText.slice(typedText.length).trimStart();
  }
  return fullText;
}

function replaceWeirdCharacters(text: string) {
    return text
        .replace(/\u2018/g, "'")
        .replace(/\u2019/g, "'")
        .replace(/\u201C/g, '"')
        .replace(/\u201D/g, '"')
        .replace(/\u2013/g, '-')
        .replace(/\u2014/g, '-')
        .replace("’", "'")
        .replace("…", "...")
}

function App() {
  const [quote, setQuote] = useState("");
  const [textToType, setTextToType] = useState("");
  const [bookTitle, setBookTitle] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/random_quote")
      .then((res) => res.json())
      .then((data) => {
        setQuote(replaceWeirdCharacters(data.highlight));
        setBookTitle(data.book_title);
        setTextToType(replaceWeirdCharacters(data.highlight));
      })
      .catch((err) => console.error("Failed to fetch quote:", err));
  }, []);

  return (
    <main style={{ textAlign: "center", padding: "2rem" }}>
      <h1>📚 Bookracer</h1>
      <h2>{bookTitle}</h2>
      <p style={{ fontSize: "1.2rem" }}>{quote}</p>

      {/* Input field for user to type the highlight text */}
      <input
        type="text"
        placeholder="Start typing..."
        value=""
        // Remove full word from quote if it has been typed correctly
        onChange={(e) => {
          const value = e.target.value;
            const updatedText = checkAndRemoveTypedText(textToType, value);
          setTextToType(updatedText);
          if (updatedText === "") {
            alert("Congratulations! You've completed the quote.");
          }
        }}
      />
      <p style={{ fontSize: "1.2rem" }}>{textToType}</p>
    </main>
  );
}

export default App;