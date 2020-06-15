import keyboard from "keyboardjs";
import { useEffect } from "react";

export default function useChangePageByKeyboard(
  page: number,
  handle: (nextPage: number) => Promise<void>
) {
  useEffect(() => {
    keyboard.bind("ctrl + left", () => handle(page - 1));
    keyboard.bind("ctrl + right", () => handle(page + 1));
    return () => keyboard.unbind(["ctrl + left", "ctrl + right"]);
  }, [handle, page]);
}
