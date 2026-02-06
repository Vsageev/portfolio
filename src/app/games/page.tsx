"use client";

import { ActiveGameProvider } from "./ActiveGameContext";
import CursorChase from "./CursorChase";
import TypingRacer from "./TypingRacer";
import MemoryGrid from "./MemoryGrid";
import ReactionTime from "./ReactionTime";
import Snake from "./Snake";
import Minesweeper from "./Minesweeper";
import GravityPong from "./GravityPong";
import PixelArtPainter from "./PixelArtPainter";
import GameOfLife from "./GameOfLife";
import MazeRunner from "./MazeRunner";
import SimonSays from "./SimonSays";

export default function GamesPage() {
  return (
    <ActiveGameProvider>
      <div>
        <CursorChase />
        <TypingRacer />
        <MemoryGrid />
        <ReactionTime />
        <Snake />
        <Minesweeper />
        <GravityPong />
        <PixelArtPainter />
        <GameOfLife />
        <MazeRunner />
        <SimonSays />
      </div>
    </ActiveGameProvider>
  );
}
