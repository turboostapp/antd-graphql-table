import { useEffect } from "react";
import keyboard from "keyboardjs";

export default function useChangePageByKeyboard(
  page: number,
  handle: (nextPage: number) => Promise<void>
) {
  useEffect(() => {
    keyboard.bind("j", () => handle(page - 1));
    keyboard.bind("k", () => handle(page + 1));
    return () => keyboard.unbind(["j", "k"]);
  }, [handle, page]);
}
