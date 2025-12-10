"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const STRINGS = 6;
const FRETS = 22;

const NOTES = ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#"];

const FRETBOARD_NOTES = [
  ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D"],
  ["B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A"],
  ["G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F"],
  ["D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C"],
  ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G"],
  ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D"],
];

const FRETBOARD_NOTES_WITH_OCTAVE = [
  ["E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5", "C6", "C#6", "D6"],
  ["B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5"],
  ["G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5", "C#5", "D5", "D#5", "E5", "F5"],
  ["D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C4"],
  ["A2", "A#2", "B2", "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4"],
  ["E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2", "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4"],
];

const OPEN_STRINGS = ["E", "B", "G", "D", "A", "E"];
const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];

type GameState = "playing" | "won";
type FoundNote = { string: number; fret: number };

export default function GuitarFretboardTrainerPage() {
  const [currentNote, setCurrentNote] = useState("");
  const [foundNotes, setFoundNotes] = useState<FoundNote[]>([]);
  const [totalNotesToFind, setTotalNotesToFind] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [message, setMessage] = useState("Let's start! Find the first note.");

  const synth = useRef<any>(null);

  useEffect(() => {
    import("tone").then(Tone => {
      synth.current = new Tone.Synth().toDestination();
    });
  }, []);

  const calculateNoteOccurrences = (note: string) => {
    let count = 0;
    for (const string of FRETBOARD_NOTES) {
      for (const fretNote of string) {
        if (fretNote === note) {
          count++;
        }
      }
    }
    return count;
  };

  const startNewRound = useCallback(() => {
    const newNote = NOTES[Math.floor(Math.random() * NOTES.length)];
    setCurrentNote(newNote);
    setFoundNotes([]);
    setTotalNotesToFind(calculateNoteOccurrences(newNote));
    setGameState("playing");
    setMessage(`Find all the '${newNote}' notes on the fretboard.`);
  }, []);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const handleFretClick = (string: number, fret: number) => {
    if (gameState === "won" || !synth.current) return;

    const noteWithOctave = FRETBOARD_NOTES_WITH_OCTAVE[string][fret];
    synth.current.triggerAttackRelease(noteWithOctave, "8n");

    const guessedNote = FRETBOARD_NOTES[string][fret];

    if (guessedNote === currentNote) {
      const isAlreadyFound = foundNotes.some(
        note => note.string === string && note.fret === fret
      );

      if (!isAlreadyFound) {
        const newFoundNotes = [...foundNotes, { string, fret }];
        setFoundNotes(newFoundNotes);

        if (newFoundNotes.length === totalNotesToFind) {
          setGameState("won");
          setMessage(`Congratulations! You found all ${totalNotesToFind} '${currentNote}' notes!`);
        } else {
          setMessage(`Correct! You found a '${currentNote}'. Keep going!`);
        }
      }
    }
  };

  const handleOpenStringClick = (stringIndex: number) => {
    handleFretClick(stringIndex, 0);
  };

  return (
    <div className="bg-gray-800 text-white min-h-screen">
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl font-bold mb-4">Guitar Fretboard Trainer</h1>
        <p className="text-gray-400 text-lg mb-8">Game Mode: Find All The Notes</p>

        <div className="bg-gray-700 rounded-lg p-6 max-w-2xl mx-auto mb-8">
          <div className="text-3xl mb-4">
            Find this note: <span className="font-bold text-teal-400">{currentNote}</span>
          </div>
          <div className="text-2xl">
            Found: <span className="font-bold text-green-400">{foundNotes.length} / {totalNotesToFind}</span>
          </div>
        </div>

        <div className="text-lg mb-8 p-4 bg-gray-700 rounded-lg max-w-2xl mx-auto min-h-[5rem]">
          {message}
        </div>

        <div className="fretboard-container bg-gray-900 p-4 sm:p-8 rounded-lg shadow-lg inline-block overflow-x-auto">
          <div className="relative" style={{ width: `${(FRETS + 2) * 3}rem` }}>
            <div className="flex text-xs sm:text-sm mb-1">
              <div className="w-12 shrink-0"></div>
              {Array.from({ length: FRETS + 1 }).map((_, i) => (
                <div key={i} className="w-12 text-center shrink-0">{i === 0 ? "Open" : i}</div>
              ))}
            </div>

            <div className="relative">
              <div className="flex flex-col gap-2">
                {Array.from({ length: STRINGS }).map((_, stringIndex) => (
                  <div key={stringIndex} className="flex items-center h-8">
                    <div className="w-12 font-bold text-sm sm:text-base text-center shrink-0 cursor-pointer" onClick={() => handleOpenStringClick(stringIndex)}>
                      {OPEN_STRINGS[stringIndex]}
                    </div>
                    <div className="h-0.5 bg-gray-500 absolute left-12 right-0"></div>
                  </div>
                ))}
              </div>

              <div className="absolute top-0 left-12 right-0 bottom-0 flex">
                {Array.from({ length: FRETS + 1 }).map((_, fretIndex) => (
                  <div key={fretIndex} className="h-full w-12 border-l border-gray-600"></div>
                ))}
              </div>

              <div className="absolute top-0 left-12 right-0 bottom-0">
                <div className="flex flex-col gap-2 h-full">
                  {Array.from({ length: STRINGS }).map((_, stringIndex) => (
                    <div key={stringIndex} className="flex h-8">
                      {Array.from({ length: FRETS + 1 }).map((_, fretIndex) => (
                        <div
                          key={fretIndex}
                          className="h-8 w-12 flex items-center justify-center cursor-pointer group relative shrink-0"
                          onClick={() => handleFretClick(stringIndex, fretIndex)}
                        >
                          <div className="w-6 h-6 rounded-full bg-transparent group-hover:bg-teal-500/50 transition-colors z-10"></div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute top-0 left-12 right-0 bottom-0 pointer-events-none">
                <div className="flex h-full">
                  {Array.from({ length: FRETS + 1 }).map((_, fretIndex) => (
                    <div key={fretIndex} className="w-12 h-full relative">
                      {FRET_MARKERS.includes(fretIndex) && fretIndex !== 0 && fretIndex !== 12 && (
                        <div className="absolute w-2.5 h-2.5 bg-gray-400 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                      )}
                      {fretIndex === 12 && (
                        <>
                          <div className="absolute w-2.5 h-2.5 bg-gray-400 rounded-full top-[33%] left-1/2 -translate-x-1/2 -translate-y-[33%]"></div>
                          <div className="absolute w-2.5 h-2.5 bg-gray-400 rounded-full top-[66%] left-1/2 -translate-x-1/2 -translate-y-[66%]"></div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Display Found Notes */}
              <div className="absolute top-0 left-12 right-0 bottom-0 pointer-events-none">
                {foundNotes.map(({ string, fret }) => (
                  <div
                    key={`${string}-${fret}`}
                    className="absolute h-8 w-12 flex items-center justify-center"
                    style={{
                      top: `${string * 2.5}rem`, // h-8 (2rem) + gap-2 (0.5rem)
                      left: `${fret * 3}rem`,
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-green-500/70 flex items-center justify-center text-white font-bold text-sm">
                      {FRETBOARD_NOTES[string][fret]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {gameState === 'won' ? (
          <button
            onClick={startNewRound}
            className="mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Next Round
          </button>
        ) : (
          <button
            onClick={startNewRound}
            className="mt-8 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Reset Game
          </button>
        )}
      </div>
    </div>
  );
}
