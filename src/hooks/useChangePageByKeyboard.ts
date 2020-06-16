import keyboard from "keyboardjs";
import { useEffect } from "react";

export default function useChangePageByKeyboard(
  page: number,
  handle: (nextPage: number) => Promise<void>
) {
  useEffect(() => {
    keyboard.bind(["command + left", "ctrl + left"], () => handle(page - 1));
    keyboard.bind(["command + right", "ctrl + right"], () => handle(page + 1));
    return () =>
      keyboard.unbind([
        "command + left",
        "ctrl + left",
        "command + right",
        "ctrl + right",
      ]);
  }, [handle, page]);
}
