import { isSolved } from "./Helper";
import { GameState } from "./types/GameState";
import { Tube } from "./types/Tube";

/**
 * Solves the Water Sort Puzzle using Breadth-First Search (BFS) to find the minimum steps.
 * @param {GameState} gameState - The initial state of the puzzle.
 * @param {Tube[]} tubes - The array of tubes representing the puzzle state.
 * @returns {Array<{from: number, to: number}> | null} - The sequence of moves to solve the puzzle in minimum steps, or null if no solution exists.
 */
export function trySolve(gameState: GameState, tubes: Tube[]): Array<{ from: number; to: number }> | null {
    console.log("Solver started with BFS", tubes);

    // BFS queue: each entry contains [current state (deep copy of tubes), moves taken so far]
    const queue: Array<[Tube[], Array<{ from: number; to: number }>]> = [[deepCopyTubes(tubes), []]];
    const visitedStates = new Set<string>(); // To track visited states
    visitedStates.add(stateKey(tubes)); // Add initial state

    /**
     * Generates a unique key for a given state of tubes.
     * @param {Tube[]} state - The current state of tubes.
     * @returns {string} - A unique string key representing the state.
     */
    function stateKey(state: Tube[]): string {
        return JSON.stringify(state.map((tube) => tube.content.map((block) => block.color)));
    }

    /**
     * Deep copies the tubes array to avoid mutating the original state.
     * @param {Tube[]} tubes - The array of tubes to copy.
     * @returns {Tube[]} - A deep copy of the tubes array.
     */
    function deepCopyTubes(tubes: Tube[]): Tube[] {
        return tubes.map((tube) => ({
            ...tube,
            content: tube.content.map((block) => ({ ...block })),
        }));
    }

    /**
     * Checks if moving water from one tube to another is valid.
     * @param {Tube[]} state - The current state of tubes.
     * @param {number} from - The index of the source tube.
     * @param {number} to - The index of the target tube.
     * @returns {boolean} - True if the move is valid.
     */
    function isValidMove(state: Tube[], from: number, to: number): boolean {
        if (from === to) return false; // Cannot pour into itself
        if (state[from].content.length === 0) return false; // Source tube is empty
        if (state[to].content.length === gameState.tubeHeight) return false; // Target tube is full

        const fromTop = state[from].content[state[from].content.length - 1]?.color; // Top color of source
        const toTop = state[to].content[state[to].content.length - 1]?.color; // Top color of target

        return (
            state[to].content.length === 0 || // Target is empty
            fromTop === toTop // Colors match
        );
    }

    /**
     * Makes a move by pouring water from one tube to another in a given state.
     * @param {Tube[]} state - The current state of tubes.
     * @param {number} from - The index of the source tube.
     * @param {number} to - The index of the target tube.
     */
    function makeMove(state: Tube[], from: number, to: number): void {
        const block = state[from].content.pop(); // Remove top block from source
        if (block !== undefined) {
            state[to].content.push(block); // Add it to the target
        }
    }

    while (queue.length > 0) {
        const [currentState, moves] = queue.shift()!; // Dequeue

        if (isSolved(gameState, currentState)) {
            //console.log("Solution found with BFS:", moves);
            return moves; // Return the sequence of moves for the shortest solution
        }

        for (let from = 0; from < currentState.length; from++) {
            for (let to = 0; to < currentState.length; to++) {
                if (isValidMove(currentState, from, to)) {
                    const nextState = deepCopyTubes(currentState); // Deep copy current state
                    makeMove(nextState, from, to); // Apply move

                    const nextStateKey = stateKey(nextState);
                    if (!visitedStates.has(nextStateKey)) {
                        visitedStates.add(nextStateKey); // Mark as visited
                        queue.push([nextState, [...moves, { from, to }]]); // Enqueue new state and updated moves
                    }
                }
            }
        }
    }

    console.log("No solution exists.");
    return null; // No solution found
}
