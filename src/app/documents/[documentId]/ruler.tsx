import { useEffect, useRef, useState } from "react";
import { FaCaretDown } from "react-icons/fa";
import { LEFT_MARGIN_DEFUALT, RIGHT_MARGIN_DEFUALT } from "@/constants/margin";
import { useRulerStore } from "@/store/use-ruler-store";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const markers = Array.from({ length: 83 }, (_, i) => i);

interface RulerProps {
  id: Id<"documents">;
  canEdit?: boolean;
}

export const Ruler = ({ id, canEdit = true }: RulerProps) => {
  const {
    leftMargin,
    rightMargin,
    isDraggingLeft,
    isDraggingRight,
    setLeftMargin,
    setRightMargin,
    setIsDraggingLeft,
    setIsDraggingRight,
  } = useRulerStore();
  const rulerRef = useRef<HTMLDivElement>(null);
  const updateMargins = useMutation(api.documents.updateMargins);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (leftMargin !== -1 && rightMargin !== -1) {
      setIsInitialized(true);
    }
  }, [leftMargin, rightMargin]);

  const handleLeftMouseDown = () => {
    if (!canEdit) return;
    setIsDraggingLeft(true);
  };

  const handleRightMouseDown = () => {
    if (!canEdit) return;
    setIsDraggingRight(true);
  };

  const handleMouseUp = async () => {
    if (!canEdit) return;
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
    await updateMargins({
      id,
      leftMargin,
      rightMargin,
    });
  };

  const handleLeftDoubleClick = () => {
    if (!canEdit) return;
    setLeftMargin(LEFT_MARGIN_DEFUALT);
  };

  const handleRightDoubleClick = () => {
    if (!canEdit) return;
    setRightMargin(RIGHT_MARGIN_DEFUALT);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canEdit) {
      return;
    }

    const pageWidth = 816;
    const minimumSpace = 100;

    if ((isDraggingLeft || isDraggingRight) && rulerRef.current) {
      const container = rulerRef.current.querySelector("#ruler-container");
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const relativeX = e.clientX - containerRect.left;
        const rawPosition = Math.max(0, Math.min(pageWidth, relativeX));

        if (isDraggingLeft) {
          const maxLeftPosition = pageWidth - rightMargin - minimumSpace;
          const newLeftPosition = Math.min(rawPosition, maxLeftPosition);
          setLeftMargin(newLeftPosition);
        } else if (isDraggingRight) {
          const maxRightPosition = pageWidth - (leftMargin + minimumSpace);
          const newRightPosition = Math.max(pageWidth - rawPosition, 0);
          const constrainedRightPosition = Math.min(newRightPosition, maxRightPosition);
          setRightMargin(constrainedRightPosition);
        }
      }
    }
  };

  return (
    <div
      ref={rulerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-[816px] mx-auto h-6 border-b border-gray-300 flex items-end relative select-none print:hidden"
    >
      <div id="ruler-container" className="w-full h-full relative">
        {isInitialized ? (
          <>
            <Marker
              position={leftMargin}
              isLeft={true}
              isDragging={isDraggingLeft}
              onMouseDown={handleLeftMouseDown}
              onDoubleClick={handleLeftDoubleClick}
              canEdit={canEdit}
            />
            <Marker
              position={rightMargin}
              isLeft={false}
              isDragging={isDraggingRight}
              onMouseDown={handleRightMouseDown}
              onDoubleClick={handleRightDoubleClick}
              canEdit={canEdit}
            />
          </>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 h-full">
          <div className="relative h-full w-[816px]">
            {markers.map((marker) => {
              const position = marker * (816 / 82);
              return (
                <div
                  key={marker}
                  className="absolute bottom-0"
                  style={{ left: `${position}px` }}
                >
                  {marker % 10 === 0 ? (
                    <div className="absolute bottom-0 w-[1px] h-2 bg-neutral-500">
                      <span className="absolute bottom-2 text-[10px] text-neutral-500 transform translate-x-[-50%]">
                        {marker / 10 + 1}
                      </span>
                    </div>
                  ) : null}
                  {marker % 5 === 0 && marker % 10 !== 0 ? (
                    <div className="absolute bottom-0 w-[1px] h-1.5 bg-neutral-500" />
                  ) : null}
                  {marker % 5 !== 0 ? (
                    <div className="absolute bottom-0 w-[1px] h-1 bg-neutral-500" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MarkerProps {
  position: number;
  isLeft: boolean;
  isDragging: boolean;
  onMouseDown: () => void;
  onDoubleClick: () => void;
  canEdit: boolean;
}

const Marker = ({
  position,
  isLeft,
  isDragging,
  onMouseDown,
  onDoubleClick,
  canEdit,
}: MarkerProps) => {
  return (
    <div
      className={`absolute top-0 w-4 h-full z-[5] group -ml-2 ${canEdit ? "cursor-ew-resize" : "cursor-default"}`}
      style={{
        [isLeft ? "left" : "right"]: `${position}px`,
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <FaCaretDown className="absolute left-1/2 top-0 h-full fill-blue-500 transform translate-x-[-50%]" />
      <div
        className="absolute left-1/2 top-4 transform -translate-x-1/2 duration-150"
        style={{
          height: "100vh",
          width: "1px",
          transform: "scaleX(0.5)",
          backgroundColor: "#3b72f6",
          display: isDragging ? "block" : "none",
        }}
      />
    </div>
  );
};
