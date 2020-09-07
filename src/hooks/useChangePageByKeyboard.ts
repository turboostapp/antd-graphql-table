import keyboard from "keyboardjs";
import { useEffect } from "react";

export default function useChangePageByKeyboard(
  onLoadPrev: () => void | Promise<void>,
  onLoadNext: () => void | Promise<void>
): void {
  useEffect(() => {
    keyboard.bind("j", onLoadPrev);
    keyboard.bind("k", onLoadNext);
    return () => keyboard.unbind(["j", "k"]);
  }, [onLoadNext, onLoadPrev]);
}
