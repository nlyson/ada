// components/PhotoModal.tsx
import React from "react";
import { motion } from "framer-motion";

type Props = {
  imageUrl: string;
  onClose: () => void;
};

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const PhotoModal: React.FC<Props> = ({ imageUrl, onClose }) => {
  return (
    <div style={backdropStyle} onClick={onClose}>
      <motion.img
        src={imageUrl}
        alt="Zoomed"
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          borderRadius: 8,
          cursor: "grab",
        }}
        drag
        dragConstraints={{ top: -1000, bottom: 1000, left: -1000, right: 1000 }}
        onClick={(e) => e.stopPropagation()} // prevent backdrop close on image click
      />
    </div>
  );
};

export default PhotoModal;
