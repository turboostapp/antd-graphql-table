import keyboard from "keyboardjs";
import { useEffect } from "react";

export default function useChangePageByKeyboard(
  page: number,
  handle: (nextPage: number) => Promise<void>
) {
  useEffect(() => {
    keyboard.bind("command + j", () => handle(page - 1));
    keyboard.bind("command + k", () => handle(page + 1));
    return () => keyboard.unbind(["command + j", "command + k"]);
  }, [handle, page]);
}
