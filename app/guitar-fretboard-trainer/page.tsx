"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Navbar } from "@/components/layout/navbar";

const STRINGS = 6;
const MAX_FRETS = 22;
const MOBILE_FRETS = 12;

const NOTES = ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#"];

const FRETBOARD_NOTES_FULL = [
  ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D"],
  ["B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A"],
  ["G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F"],
  ["D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C"],
  ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G"],
  ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D"],
];

const FRETBOARD_NOTES_WITH_OCTAVE_FULL = [
  ["E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5", "C6", "C#6", "D6"],
  ["B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5"],
  ["G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5", "C#5", "D5", "D#5", "E5", "F5"],
  ["D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C4"],
  ["A2", "A#2", "B2", "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4"],
  ["E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2", "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3", "C4", "C#4", "D4"],
];

const OPEN_STRINGS = ["E", "B", "G", "D", "A", "E"];
const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];

type GameMode = "find-all" | "ear-training";
type GameState = "playing" | "won";
type FoundNote = { string: number; fret: number };

export default function GuitarFretboardTrainerPage() {
  const [gameMode, setGameMode] = useState<GameMode>("find-all");
  
  // Shared state
  const [message, setMessage] = useState("Select a game mode to start!");
  const synth = useRef<any>(null);
  const [displayedFrets, setDisplayedFrets] = useState(MAX_FRETS);
  
  // "Find All" mode state
  const [noteToFind, setNoteToFind] = useState("");
  const [foundNotes, setFoundNotes] = useState<FoundNote[]>([]);
  const [totalNotesToFind, setTotalNotesToFind] = useState(0);
  const [findAllGameState, setFindAllGameState] = useState<GameState>("playing");

  // "Ear Training" mode state
  const [noteToGuess, setNoteToGuess] = useState("");
  const [score, setScore] = useState(0);

  // Animation states
  const [feedbackAnimation, setFeedbackAnimation] = useState<{string: number, fret: number, type: 'success' | 'fail'} | null>(null);

  useEffect(() => {
    import("tone").then(Tone => {
      synth.current = new Tone.Synth().toDestination();
    });
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setDisplayedFrets(window.innerWidth < 768 ? MOBILE_FRETS : MAX_FRETS);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  
  const fretboardNotes = useMemo(() => FRETBOARD_NOTES_FULL.map(string => string.slice(0, displayedFrets + 1)), [displayedFrets]);
  const fretboardNotesWithOctave = useMemo(() => FRETBOARD_NOTES_WITH_OCTAVE_FULL.map(string => string.slice(0, displayedFrets + 1)), [displayedFrets]);

  // "Find All" mode logic
  const calculateNoteOccurrences = useCallback((note: string) => {
    return fretboardNotes.reduce((acc, string) => acc + string.filter(fretNote => fretNote === note).length, 0);
  }, [fretboardNotes]);

  const startFindAllRound = useCallback(() => {
    const newNote = NOTES[Math.floor(Math.random() * NOTES.length)];
    setNoteToFind(newNote);
    setFoundNotes([]);
    setTotalNotesToFind(calculateNoteOccurrences(newNote));
    setFindAllGameState("playing");
    setMessage(`Find all the '${newNote}' notes on the fretboard.`);
  }, [calculateNoteOccurrences]);
  
  // "Ear Training" mode logic
  const startEarTrainingRound = useCallback(() => {
    if (!synth.current) return;
    const randomString = Math.floor(Math.random() * STRINGS);
    const randomFret = Math.floor(Math.random() * (displayedFrets + 1));
    const newNoteToGuess = fretboardNotesWithOctave[randomString][randomFret];
    setNoteToGuess(newNoteToGuess);
    setMessage("What note is this? Guess on the fretboard.");
    synth.current.triggerAttackRelease(newNoteToGuess, "8n");
  }, [displayedFrets, fretboardNotesWithOctave]);
  
  const replaySound = () => {
    if (synth.current && noteToGuess) {
      synth.current.triggerAttackRelease(noteToGuess, "8n");
    }
  };

  // Change game mode effect
  useEffect(() => {
    if (gameMode === 'find-all') {
      startFindAllRound();
    } else {
      setScore(0);
      startEarTrainingRound();
    }
  }, [gameMode, startFindAllRound, startEarTrainingRound]);

  const handleFretClick = (string: number, fret: number) => {
    if (!synth.current) return;

    const clickedNoteWithOctave = fretboardNotesWithOctave[string][fret];
    synth.current.triggerAttackRelease(clickedNoteWithOctave, "8n");
    
    setFeedbackAnimation(null);

    const showFeedback = (type: 'success' | 'fail', s: number, f: number) => {
        setFeedbackAnimation({ string: s, fret: f, type });
        setTimeout(() => {
            setFeedbackAnimation(null);
        }, 2000);
    };

    if (gameMode === 'find-all') {
      if (findAllGameState === 'won') return;
      const guessedNote = fretboardNotes[string][fret];
      if (guessedNote === noteToFind) {
        const isAlreadyFound = foundNotes.some(note => note.string === string && note.fret === fret);
        if (!isAlreadyFound) {
          showFeedback('success', string, fret);
          const newFoundNotes = [...foundNotes, { string, fret }];
          setFoundNotes(newFoundNotes);
          if (newFoundNotes.length === totalNotesToFind) {
            setFindAllGameState("won");
            setMessage(`Congratulations! You found all ${totalNotesToFind} '${noteToFind}' notes!`);
          } else {
            setMessage(`Correct! You found a '${noteToFind}'. Keep going!`);
          }
        }
      } else {
        showFeedback('fail', string, fret);
        setMessage(`Incorrect. That's a ${guessedNote}. Keep looking for '${noteToFind}'.`);
      }
    } else { // ear-training
      if (clickedNoteWithOctave === noteToGuess) {
        showFeedback('success', string, fret);
        setScore(score + 1);
        setMessage(`Correct! It was ${noteToGuess}.`);
        setTimeout(startEarTrainingRound, 1500);
      } else {
        showFeedback('fail', string, fret);
        setMessage(`Incorrect. You clicked ${clickedNoteWithOctave}. Try again!`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">Guitar Fretboard Trainer</h1>
        
        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setGameMode('find-all')} className={`font-bold py-2 px-4 rounded ${gameMode === 'find-all' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Find All Notes</button>
          <button onClick={() => setGameMode('ear-training')} className={`font-bold py-2 px-4 rounded ${gameMode === 'ear-training' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Ear Training</button>
        </div>

        {gameMode === 'find-all' && (
          <div className="bg-muted rounded-lg p-6 max-w-2xl mx-auto mb-8">
            <div className="text-2xl sm:text-3xl mb-4">
              Find this note: <span className="font-bold text-primary">{noteToFind}</span>
            </div>
            <div className="text-xl sm:text-2xl">
              Found: <span className="font-bold text-primary">{foundNotes.length} / {totalNotesToFind}</span>
            </div>
          </div>
        )}

        {gameMode === 'ear-training' && (
          <div className="bg-muted rounded-lg p-6 max-w-2xl mx-auto mb-8">
            <div className="text-2xl sm:text-3xl mb-4 flex items-center justify-center gap-4">
              <span>What note is this?</span>
              <button onClick={replaySound} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded">Replay Sound</button>
            </div>
            <div className="text-xl sm:text-2xl">
              Score: <span className="font-bold text-primary">{score}</span>
            </div>
          </div>
        )}

        

        <div className="fretboard-container bg-accent p-4 sm:p-8 rounded-lg shadow-lg inline-block">
          <div className="relative" style={{ width: `${(displayedFrets + 2) * 3}rem` }}>
            {/* ... Fretboard rendering ... same as before but using displayedFrets */}
            <div className="flex text-xs sm:text-sm mb-1">
              <div className="w-12 shrink-0"></div>
              {Array.from({ length: displayedFrets + 1 }).map((_, i) => (
                <div key={i} className="w-12 text-center shrink-0">{i === 0 ? "Open" : i}</div>
              ))}
            </div>

            <div className="relative">
              <div className="flex flex-col gap-2">
                {Array.from({ length: STRINGS }).map((_, stringIndex) => (
                  <div key={stringIndex} className="flex items-center h-8">
                    <div className="w-12 font-bold text-sm sm:text-base text-center shrink-0 cursor-pointer" onClick={() => handleFretClick(stringIndex, 0)}>
                      {OPEN_STRINGS[stringIndex]}
                    </div>
                    <div className="h-0.5 bg-border absolute left-12 right-0" style={{width: `calc(100% - 3rem)`}}></div>
                  </div>
                ))}
              </div>

              <div className="absolute top-0 left-12 right-0 bottom-0 flex">
                {Array.from({ length: displayedFrets + 1 }).map((_, fretIndex) => (
                  <div key={fretIndex} className="h-full w-12 border-l border"></div>
                ))}
              </div>

              <div className="absolute top-0 left-12 right-0 bottom-0">
                <div className="flex flex-col gap-2 h-full">
                  {Array.from({ length: STRINGS }).map((_, stringIndex) => (
                    <div key={stringIndex} className="flex h-8">
                      {Array.from({ length: displayedFrets + 1 }).map((_, fretIndex) => (
                        <div
                          key={fretIndex}
                          className="h-8 w-12 flex items-center justify-center cursor-pointer group relative shrink-0"
                          onClick={() => handleFretClick(stringIndex, fretIndex)}
                        >
                          <div className="w-6 h-6 rounded-full bg-transparent group-hover:bg-primary/50 transition-colors z-10"></div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute top-0 left-12 right-0 bottom-0 pointer-events-none">
                <div className="flex h-full">
                  {Array.from({ length: displayedFrets + 1 }).map((_, fretIndex) => (
                    <div key={fretIndex} className="w-12 h-full relative">
                      {FRET_MARKERS.includes(fretIndex) && fretIndex <= displayedFrets && fretIndex !== 0 && fretIndex !== 12 && (
                        <div className="absolute w-2.5 h-2.5 bg-muted-foreground rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                      )}
                      {fretIndex === 12 && fretIndex <= displayedFrets && (
                        <>
                          <div className="absolute w-2.5 h-2.5 bg-muted-foreground rounded-full top-[33%] left-1/2 -translate-x-1/2 -translate-y-[33%]"></div>
                          <div className="absolute w-2.5 h-2.5 bg-muted-foreground rounded-full top-[66%] left-1/2 -translate-x-1/2 -translate-y-[66%]"></div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlays for found notes and animations */}
              <div className="absolute top-0 left-12 right-0 bottom-0 pointer-events-none">
                {/* Display Found Notes from "Find All" mode */}
                {gameMode === 'find-all' && foundNotes.map(({ string, fret }) => (
                  <div
                    key={`found-${string}-${fret}`}
                    className="absolute h-8 w-12 flex items-center justify-center"
                    style={{
                      top: `${string * 2.5}rem`,
                      left: `${fret * 3}rem`,
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {fretboardNotes[string][fret]}
                    </div>
                  </div>
                ))}

                {/* Display Feedback Animation */}
                {feedbackAnimation && (
                  <div
                    className="absolute h-8 w-12 flex items-center justify-center"
                    style={{
                      top: `${feedbackAnimation.string * 2.5}rem`,
                      left: `${feedbackAnimation.fret * 3}rem`,
                    }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm ${feedbackAnimation.type === 'success' ? 'bg-green-500/90' : 'bg-destructive/90'}`}>
                      {fretboardNotes[feedbackAnimation.string][feedbackAnimation.fret]}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {gameMode === 'find-all' && (
          <button
            onClick={startFindAllRound}
            className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded"
          >
            {findAllGameState === 'won' ? 'Next Round' : 'Reset Game'}
          </button>
        )}
      </div>
    </div>
  );
}
