import { create } from "zustand";
import { LEFT_MARGIN_DEFUALT, RIGHT_MARGIN_DEFUALT } from "@/constants/margin";

interface RulerState {
  leftMargin: number;
  rightMargin: number;
  isDraggingLeft: boolean;
  isDraggingRight: boolean;
  setLeftMargin: (v: number) => void;
  setRightMargin: (v: number) => void;
  setIsDraggingLeft: (v: boolean) => void;
  setIsDraggingRight: (v: boolean) => void;
}

export const useRulerStore = create<RulerState>((set) => ({
  leftMargin: LEFT_MARGIN_DEFUALT,
  rightMargin: RIGHT_MARGIN_DEFUALT,
  isDraggingLeft: false,
  isDraggingRight: false,
  setLeftMargin: (v) => set({ leftMargin: v }),
  setRightMargin: (v) => set({ rightMargin: v }),
  setIsDraggingLeft: (v) => set({ isDraggingLeft: v }),
  setIsDraggingRight: (v) => set({ isDraggingRight: v }),
}));
