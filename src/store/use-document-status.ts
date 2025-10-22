import { create } from "zustand";

type Status = "idle" | "typing" | "saving" | "saved";

interface EditorDocumentState {
  status: Status;
  setStatus: (newStatus: Status) => void;
  resetStatusAfterSave: () => void;
}

export const useDocumentStatus = create<EditorDocumentState>((set) => ({
  status: "idle",
  setStatus: (newStatus) => set({ status: newStatus }),
  resetStatusAfterSave: () => {
    // 保存后2秒自动恢复到 idle
    set({ status: "saved" });
    setTimeout(() => {
      set((state) => (state.status === "saved" ? { status: "idle" } : state));
    }, 2000);
  },
}));
