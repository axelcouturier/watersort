import { Application, Assets, Container, ContainerChild, Graphics, Sprite } from "pixi.js";
import { GameState } from "./types/GameState";
import { Tube, TubeContent } from "./types/Tube";
import { checkSolutionExists, trySolve } from "./Solver";
import { isSolved } from "./Helper";
import { Move } from "./types/Move";
import { createButton } from "./helpers/createButton";
import { createSplash } from "./helpers/createSplash";
import { drawTube } from "./helpers/drawTube";


(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Load the bunny texture
  const texture = await Assets.load("assets/bunny.png");

  // Create a bunny Sprite
  const bunny = new Sprite(texture);

  // Center the sprite's anchor point
  bunny.anchor.set(0.5);

  // Move the sprite to the center of the screen
  //bunny.position.set(app.screen.width / 2, app.screen.height / 2);
  bunny.position.set(20, 20);

  // Add the bunny to the stage
  app.stage.addChild(bunny);

  // Listen for animate update
  app.ticker.add((time) => {
    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance *
    // * Creates frame-independent transformation *
    bunny.rotation += 0.1 * time.deltaTime;
  });

  // Add solver button:
  app.stage.addChild(createButton('Get hint', getHint, 100, 10))
  // Add back button:
  app.stage.addChild(createButton('Back', goBack, 300, 10))
  // Add back button:
  app.stage.addChild(createButton('Reset', resetGame, 500, 10))

  // Colors for water blocks
  const availableColors = [
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
    'pink',
    'brown',
    'cyan',
    'magenta',
    'lime',
    'teal',
    'indigo',
    'violet',
    'gold',
    'silver',
    'gray',
    'turquoise',
    'maroon',
    'beige',
    'lavender',
  ];

  const tubes: Tube[] = []; // Array to store tube data
  let selectedTube: number | null = null; // Tracks the currently selected tube

  // Initialize game setup
  const gameState: GameState = {
    tubeHeight: 4, tubeCount: 12, rowCount: 1, history: [], emptyTubes: 2
  }

  // Update row count according to screen size : // TODO: handle resize
  gameState.rowCount = 1 + Math.floor((app.screen.width - 100) / 80);
  console.log('rowCount', gameState.rowCount);

  resetGame();

  /**
   * Handles clicks on a tube.
   * @param {number} index - The index of the clicked tube.
   */
  function handleTubeClick(index: number) {
    if (selectedTube === null) {
      // Select this tube if no other is selected
      selectedTube = index;
      if (tubes[index].container === null) return;
      highlightTube(tubes[index].container, true);
      console.log(`Tube ${index} selected.`);
    } else {
      if (index !== selectedTube) {
        console.log(`Attempting to pour from Tube ${selectedTube} to Tube ${index}.`);

        attemptPour({ from: selectedTube, to: index }); // Attempt to pour water from selected to clicked
      }
      if (tubes[selectedTube].container !== null)
        highlightTube(tubes[selectedTube].container as ContainerChild, false); // Remove highlight from previously selected tube
      console.log(`Tube ${selectedTube} deselected.`);
      selectedTube = null; // Deselect after action
    }
  }

  async function getHint(): Promise<void> {
    console.log('Hint requested');

    // Step 1: Create and display the splash screen
    const splashLoading: Container = createSplash(app.screen.width, app.screen.height, "Searching best solution...");
    app.stage.addChild(splashLoading);
    await new Promise((resolve) => app.ticker.addOnce(resolve));

    // Step 2: Use a background task to compute the solution without blocking UI updates
    const solutionFromCurrentState: Array<{ from: number; to: number }> | null = await trySolve(
      gameState,
      tubes.map((tube) => ({
        ...tube,
        container: null,
        content: tube.content.map((block) => ({
          ...block,
          graphics: null, // Remove the `graphics` key while keeping the structure
        })),
      }))
    );

    // Step 3: Process and remove the splash screen after computation
    if (solutionFromCurrentState !== null) {
      solutionFromCurrentState.forEach(({ from, to }) => {
        console.log(`SOLUTION: from ${from} to ${to}`);
      });

      // Remove splash screen
      splashLoading.removeFromParent();

      // Execute the first move in the solution
      // Count how many colors we need to pour from the source tube
      let colorsToPour = 1;
      const fromTube = tubes[solutionFromCurrentState[0].from]
      const fromColor = (fromTube.content[fromTube.content.length - 1] || {}).color || null; // Top color of source

      for (let i = fromTube.content.length - 2; i >= 0; i--) {
        if (fromTube.content[i].color === fromColor) {
          colorsToPour++;
        } else {
          break;
        }
      }
      console.log('colorsToPour', colorsToPour);

      pour({ from: solutionFromCurrentState[0].from, to: solutionFromCurrentState[0].to, amount: colorsToPour });
    } else {
      console.log("No solution found.");
      splashLoading.removeFromParent();
    }
  }


  /**
   * Highlights or removes highlight from a specific tube.
   * @param {PIXI.Container} tube - The container representing the tube.
   * @param {boolean} highlight - Whether to highlight or not.
   */
  function highlightTube(tube: Container, highlight: boolean) {
    console.log('Highlight', tube)
    const outline = tube.children[0] as Graphics; // Get the outline graphic of the tube
    outline.clear(); // Clear previous styles

    if (highlight) {
      outline.rect(0, 0, 50, 200); // Redraw rectangle shape
      outline.fill({ color: 0xffffff }); // White fill
      outline.stroke({ width: 4, color: 0xff0000 }); // Red border for highlighting
    } else {
      outline.rect(0, 0, 50, 200); // Redraw rectangle shape
      outline.fill({ color: 0xffffff }); // White fill
      outline.stroke({ width: 2, color: 0x000000 }); // Default black border
    }
  }

  /**
   * Attempts to pour water from one tube to another.
   * @param {number} fromIndex - The index of the source tube.
   * @param {number} toIndex - The index of the destination tube.
   */
  function attemptPour(move: Move) {
    const fromTube = tubes[move.from];
    const toTube = tubes[move.to];

    const fromColor = (fromTube.content[fromTube.content.length - 1] || {}).color || null; // Top color of source
    const toColor = (toTube.content[toTube.content.length - 1] || {}).color || null; // Top color of destination

    if (fromColor !== null && (toColor === null || fromColor === toColor) && toTube.content.length < gameState.tubeHeight && fromTube.content.length > 0) {
      // Count how many colors we need to pour from the source tube
      let colorsToPour = 1;
      const fromColor = (fromTube.content[fromTube.content.length - 1] || {}).color || null; // Top color of source

      for (let i = fromTube.content.length - 2; i >= 0; i--) {
        if (fromTube.content[i].color === fromColor) {
          colorsToPour++;
        } else {
          break;
        }
      }
      console.log('colorsToPour', colorsToPour);
      pour({ ...move, amount: colorsToPour }); // Pour water from source to destination
      checkWinCondition(); // Check if game is won after each move


    } else {
      console.log(`Invalid move. Cannot pour ${fromColor} into Tube ${move.to}.`);
    }
    //console.log(tubes)
  }

  function pour(move: Move, preventHistory: boolean = false) {
    const fromTube = tubes[move.from];
    const toTube = tubes[move.to];
    const fromColor = (fromTube.content[fromTube.content.length - 1]).color; // Top color of source

    console.log(`Pouring ${fromColor} from Tube ${move.from} to Tube ${move.to}.`);

    let colorsToPour = move.amount;
    if (colorsToPour === undefined) return;
    // Count how many colors we can move to the destination tube
    while (colorsToPour > 0 && toTube.content.length < gameState.tubeHeight) {
      const pouredColor: TubeContent | undefined = fromTube.content.pop();
      // Display the color if hidden mode:
      const belowPoured = (fromTube.content[fromTube.content.length - 1]);
      if (typeof belowPoured !== 'undefined' && belowPoured.hidden) {
        console.log('poured color revealed', belowPoured, belowPoured.graphics);
        belowPoured.hidden = false
      }
      toTube.content.push({ graphics: null, color: fromColor, hidden: false }); // Update destination block stack visually
      tubes[move.to] = drawTube(gameState, toTube, toTube.container?.x || 0, toTube.container?.y || 0);
      tubes[move.to].container?.removeFromParent();
      app.stage.addChild(tubes[move.to].container as Container);
      if (tubes[move.to].container === null) return;
      tubes[move.to].container?.on('pointerdown', () => handleTubeClick(move.to)); // Add click event listener

      if (!pouredColor) {
        console.log(`No color to pour from Tube ${move.from}.`);
        return;
      }
      let { x, y } = fromTube.container?.getGlobalPosition() || { x: 0, y: 0 };
      tubes[move.from].container?.removeFromParent();
      tubes[move.from] = drawTube(gameState, fromTube, x, y);
      if (tubes[move.from].container !== null) {
        app.stage.addChild(tubes[move.from].container as Container);
        tubes[move.from].container?.on('pointerdown', () => handleTubeClick(move.from)); // Add click event listener
      }

      // Store the update in the history: 
      if (!preventHistory)
        gameState.history.push(move)
      colorsToPour--;
    }
  }

  /**
   * Checks if the win condition is met (all tubes sorted by color).
   */
  function checkWinCondition() {
    const isWin = isSolved(gameState, tubes);

    if (isWin) {
      console.log('You Win!');
      alert('You Win!'); // Notify player of victory
      resetGame(); // Reset game state after winning
    }
    else {
      // Ensure a solution exists from the current state
      if (
        !checkSolutionExists(gameState, tubes.map((tube) => ({
          ...tube,
          container: null,
          content: tube.content.map((block) => ({
            ...block,
            graphics: null, // Remove the `graphics` key while keeping the structure
          }))
        }
        )))) {
        const splashNoSolutions: Container = createSplash(app.screen.width, app.screen.height, "No solutions exists from current situation")
        app.stage.addChild(splashNoSolutions)
        splashNoSolutions.on('pointerdown', () => {
          splashNoSolutions.removeFromParent();
        });


      }
    }
  }

  function goBack() {
    const previousMove: Move | undefined = gameState.history.pop();
    console.log('Wayback machine', previousMove)
    if (typeof previousMove !== 'undefined')
      pour({ ...previousMove, from: previousMove.to, to: previousMove.from }, true)
  }

  /**
   * Resets the game by clearing all tubes and restarting.
   */
  function resetGame() {
    console.log('Resetting game...');

    const hiddenMode = true;

    tubes.forEach((tubeData) => {
      const { container } = tubeData;
      if (container === null) return;
      container.removeChildren(); // Clear all children from each container (tube)
      tubeData.container?.removeFromParent()
    });
    tubes.splice(0, gameState.tubeCount + gameState.emptyTubes)

    const colors: string[] = [];
    while (colors.length < gameState.tubeCount * gameState.tubeHeight) {
      colors.push(...availableColors.slice(0, gameState.tubeCount)); // Ensure enough colors for all blocks
    }
    colors.sort(() => Math.random() - 0.5); // Shuffle the colors randomly
    for (let i = 0; i < gameState.tubeCount + gameState.emptyTubes; i++) {
      const isEmptyTube = i >= gameState.tubeCount; // Leave last two tubes empty
      const tube: Tube = { container: new Container(), content: [] }
      if (!isEmptyTube) {
        for (let j = 0; j < gameState.tubeHeight; j++) {
          const tc: TubeContent = { color: colors[i * gameState.tubeHeight + j], graphics: null, hidden: hiddenMode ? j !== gameState.tubeHeight - 1 : false }
          tube.content.push(tc)
        }
      }
      tubes.push(tube);
    }



    // Initial draw
    for (let i = 0; i < gameState.tubeCount + gameState.emptyTubes; i++) {
      let tube: Tube = tubes[i];

      tube = drawTube(gameState, tube, 50 + (i % gameState.rowCount) * 80, 100 + gameState.tubeHeight * 50 * (i >= gameState.rowCount ? Math.floor(i / gameState.rowCount) : 0) + (i >= gameState.rowCount ? 50 * (i >= gameState.rowCount ? Math.floor(i / gameState.rowCount) : 1) : 0));
      if (tube.container === null) return;  // Skip if container is null

      app.stage.addChild(tube.container);
      tube.container.on('pointerdown', () => handleTubeClick(i)); // Add click event listener
    }

  }
})();
