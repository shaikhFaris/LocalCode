"use client";

import Markdown from "react-markdown";
import styles from "./StreamingText.module.css";
import { useEffect, useState } from "react";

export function StreamingText({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 9);
    return () => clearInterval(id);
  }, [text]);
  return (
    <div className={styles.prose}>
      <div className="markdown">
        <Markdown>{shown}</Markdown>
      </div>
    </div>
  );
}
