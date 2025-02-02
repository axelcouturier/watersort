import { isSolved } from "./Helper";
import { GameState } from "./types/GameState";
import { Tube } from "./types/Tube";

/**
 * Solves the Water Sort Puzzle using Breadth-First Search (BFS) to find the minimum steps.
 * @param {GameState} gameState - The initial state of the puzzle.
 * @param {Tube[]} tubes - The array of tubes representing the puzzle state.
 */
export async function trySolve(gameState: GameState, tubes: Tube[]): Promise<Array<{ from: number; to: number }> | null> {
    console.log("Solver started with BFS", tubes);

    // BFS queue: each entry contains [current state (reference to tubes), moves taken so far]
    const queue: Array<[Tube[], Array<{ from: number; to: number }>]> = [[deepCopyTubes(tubes), []]];
    const visitedStates = new Set<string>();
    visitedStates.add(stateKey(tubes)); // Add initial state

    while (queue.length > 0) {
        const [currentState, moves] = queue.shift()!;

        // Check if the current state is solved
        if (isSolved(gameState, currentState)) {
            console.log("Solution found with BFS:", moves);
            return moves; // Return the sequence of moves for the shortest solution
        }

        // Iterate over all possible moves
        for (let from = 0; from < currentState.length; from++) {
            for (let to = 0; to < currentState.length; to++) {
                if (!isValidMove(currentState, from, to, gameState)) continue;

                const nextState = deepCopyTubes(currentState); // Deep copy current state
                makeMove(nextState, from, to); // Apply move

                const nextStateKey = stateKey(nextState);
                if (!visitedStates.has(nextStateKey)) {
                    visitedStates.add(nextStateKey);
                    queue.push([nextState, [...moves, { from, to }]]);
                }
            }
        }

        // Yield control back to the event loop every X iterations
        if (queue.length % 100 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }

    console.log("No solution exists.");
    return null; // No solution found
}


/**
 * Checks if a solution exists for the Water Sort Puzzle without finding the best solution.
 * This optimized function uses Depth-First Search (DFS) with backtracking and avoids deep copying.
 * @param {GameState} gameState - The initial state of the puzzle.
 * @param {Tube[]} tubes - The array of tubes representing the puzzle state.
 * @returns {boolean} - True if a solution exists, false otherwise.
 */
export function checkSolutionExists(gameState: GameState, tubes: Tube[]): boolean {
    console.log("Checking if a solution exists...");

    const visitedStates = new Set<string>();
    const stack: { state: Tube[], from: number, to: number }[] = [{ state: tubes, from: -1, to: -1 }];

    while (stack.length > 0) {
        const { state } = stack.pop()!;

        if (isSolved(gameState, state)) {
            console.log('Solution found');
            return true; // A solution exists
        }

        const currentKey = stateKey(state);
        if (visitedStates.has(currentKey)) {
            continue; // Already visited this state
        }
        visitedStates.add(currentKey);

        for (let i = 0; i < state.length; i++) {
            for (let j = 0; j < state.length; j++) {
                if (i === j || !isValidMove(state, i, j, gameState)) continue;

                // Perform the move
                const block = state[i].content.pop();
                if (block !== undefined) {
                    state[j].content.push(block);

                    // Push the new state onto the stack
                    stack.push({ state: cloneState(state), from: i, to: j });

                    // Undo the move
                    state[j].content.pop();
                    state[i].content.push(block);
                }
            }
        }
    }

    console.log("No solution exists.");
    return false; // No solution found
}

function cloneState(state: Tube[]): Tube[] {
    return state.map(tube => ({
        ...tube,
        content: [...tube.content]
    }));
}

function stateKey(state: Tube[]): string {
    return state.map(tube => tube.content.map(block => block.color).join(',')).sort((a, b) => a.localeCompare(b)).join('|');
}


/**
 * Deep copies the tubes array for BFS branching.
 * Only used when enqueuing new states in trySolve.
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
 * @param {GameState} gameState - The current game state for height checks.
 * @returns {boolean} - True if the move is valid.
 */
function isValidMove(state: Tube[], from: number, to: number, gameState: GameState): boolean {
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
 * This modifies the current state directly (no deep copy).
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
