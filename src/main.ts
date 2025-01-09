import { Application, Assets, Container, Graphics, Sprite, Text } from "pixi.js";
import { GameState } from "./types/GameState";
import { Tube, TubeContent } from "./types/Tube";
import { checkSolutionExists, trySolve } from "./Solver";
import { isSolved } from "./Helper";


(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");

  // Create a bunny Sprite
  const bunny = new Sprite(texture);

  // Center the sprite's anchor point
  bunny.anchor.set(0.5);

  // Move the sprite to the center of the screen
  //bunny.position.set(app.screen.width / 2, app.screen.height / 2);
  bunny.position.set(20, 20);

  // Add the bunny to the stage
  app.stage.addChild(bunny);

  // Add solver button:
  // Create the button text
  const buttonText = new Text({
    text: "Get Hint", style: {
      fontFamily: 'Arial',
      fontSize: 36,
      fill: 0xffffff, // White text color
      align: 'center',
    }
  });

  // Create the button background
  const buttonBackground = new Graphics();
  buttonBackground.roundRect(0, 0, buttonText.width + 20, buttonText.height + 10, 10); // Rounded rectangle
  buttonBackground.fill(0x007bff); // Blue background color

  // Center the text on the background
  buttonText.x = (buttonBackground.width - buttonText.width) / 2;
  buttonText.y = (buttonBackground.height - buttonText.height) / 2;

  // Create a container to hold the text and background
  const buttonContainer = new Container();
  buttonContainer.addChild(buttonBackground);
  buttonContainer.addChild(buttonText);

  // Set the position of the container
  buttonContainer.x = 100;
  buttonContainer.y = 100;

  // Make it interactive and clickable
  buttonContainer.interactive = true;

  // Add click event listener
  buttonContainer.on('pointerdown', () => getHint());

  app.stage.addChild(buttonContainer);

  // Listen for animate update
  app.ticker.add((time) => {
    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance *
    // * Creates frame-independent transformation *
    bunny.rotation += 0.1 * time.deltaTime;
  });
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
    'silver'
  ];

  const tubes: Tube[] = []; // Array to store tube data
  let selectedTube: number | null = null; // Tracks the currently selected tube

  // Initialize game setup
  const gameState: GameState = {
    tubeHeight: 4, tubeCount: 11, rowCount: 1
  }

  // Update row count according to screen size : // TODO: handle resize
  gameState.rowCount = 1 + Math.floor((gameState.tubeCount * 120) / (app.screen.width - 200));

  const colors: string[] = [];
  while (colors.length < gameState.tubeCount * gameState.tubeHeight) {
    colors.push(...availableColors.slice(0, gameState.tubeCount)); // Ensure enough colors for all blocks
  }
  colors.sort(() => Math.random() - 0.5); // Shuffle the colors randomly
  for (let i = 0; i < gameState.tubeCount + 2; i++) {
    const isEmptyTube = i >= gameState.tubeCount; // Leave last two tubes empty
    const tube: Tube = { container: new Container(), content: [] }
    if (!isEmptyTube) {
      for (let j = 0; j < gameState.tubeHeight; j++) {
        const tc: TubeContent = { color: colors[i * gameState.tubeHeight + j], graphics: null }
        tube.content.push(tc)
      }
    }

    tubes.push(tube);
  }

  // Initial draw
  for (let i = 0; i < gameState.tubeCount + 2; i++) {
    const tube = tubes[i];
    tube.container.x = 100 + i * 120; // Position tubes horizontally
    tube.container.y = gameState.tubeHeight * 50;

    // Draw the outline of the tube
    const outline = new Graphics();
    outline.rect(0, 0, 50, gameState.tubeHeight * 50); // Define rectangle shape
    outline.fill({ color: 0xffffff }); // White fill
    outline.stroke({ width: 2, color: 0x000000 }); // Black border
    tube.container.addChild(outline);

    // Add water blocks inside the tube (leave some tubes empty)
    const isEmptyTube = i >= gameState.tubeCount; // Leave last two tubes empty

    if (!isEmptyTube) {
      for (let j = 0; j < gameState.tubeHeight; j++) {
        const water = new Graphics();
        water.rect(0, 50 * gameState.tubeHeight - (j + 1) * 50, 50, 50); // Define water block shape
        water.fill({ color: tube.content[j].color }); // Assign colors cyclically
        tube.container.addChild(water);
        tube.content[j].graphics = water;
      }
    }
    app.stage.addChild(tube.container);
    // Make the tubes interactive for pointer events
    tube.container.interactive = true;
    tube.container.on('click', () => handleTubeClick(i)); // Add click event listener
  }

  /**
   * Handles clicks on a tube.
   * @param {number} index - The index of the clicked tube.
   */
  function handleTubeClick(index: number) {
    if (selectedTube === null) {
      // Select this tube if no other is selected
      selectedTube = index;
      highlightTube(tubes[index].container, true);
      console.log(`Tube ${index} selected.`);
    } else {
      if (index !== selectedTube) {
        console.log(`Attempting to pour from Tube ${selectedTube} to Tube ${index}.`);
        attemptPour(selectedTube, index); // Attempt to pour water from selected to clicked
      }
      highlightTube(tubes[selectedTube].container, false); // Remove highlight from previously selected tube
      console.log(`Tube ${selectedTube} deselected.`);
      selectedTube = null; // Deselect after action
    }
  }

  function getHint(): void {
    console.log('Hint requested');
    const solutionFromCurrentState: Array<{ from: number; to: number }> | null = trySolve(gameState, tubes.map((tube) => ({
      ...tube,
      container: new Container(),
      content: tube.content.map((block) => ({
        ...block,
        graphics: null, // Remove the `graphics` key while keeping the structure
      })),
    })));
    if (solutionFromCurrentState !== null) {
      solutionFromCurrentState.forEach(({ from, to }) => { console.log(`SOLUTION: from ${from} to ${to}`) });
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
  function attemptPour(fromIndex: number, toIndex: number) {
    const fromTube = tubes[fromIndex];
    const toTube = tubes[toIndex];

    const fromColor = (fromTube.content[fromTube.content.length - 1] || {}).color || null; // Top color of source
    const toColor = (toTube.content[toTube.content.length - 1] || {}).color || null; // Top color of destination

    if (fromColor !== null && (toColor === null || fromColor === toColor) && toTube.content.length < gameState.tubeHeight && fromTube.content.length > 0) {
      console.log(`Pouring ${fromColor} from Tube ${fromIndex} to Tube ${toIndex}.`);

      // Count how many colors we need to pour from the source tube
      let colorsToPour = 1;
      for (let i = fromTube.content.length - 2; i >= 0; i--) {
        if (fromTube.content[i].color === fromColor) {
          colorsToPour++;
        } else {
          break;
        }
      }
      console.log('colorsToPour', colorsToPour);
      // Count how many colors we can move to the destination tube
      while (colorsToPour > 0 && toTube.content.length < gameState.tubeHeight) {
        const pouredColor: TubeContent | undefined = fromTube.content.pop();
        if (!pouredColor) {
          console.log(`No color to pour from Tube ${fromIndex}.`);
          return;
        }
        if (pouredColor.graphics !== null) {
          pouredColor.graphics.clear()
        }
        const newWater = new Graphics();
        newWater.rect(0, 0, 50, 50); // Define water block shape
        newWater.fill({ color: fromColor }); // Assign colors cyclically
        newWater.y = (50 * (gameState.tubeHeight - 1)) - (toTube.content.length) * 50; // Adjust position in destination visually
        toTube.container.addChild(newWater); // Add block to destination container visually
        toTube.content.push({ graphics: newWater, color: fromColor }); // Update destination block stack visually
        colorsToPour--;
      }
      checkWinCondition(); // Check if game is won after each move


    } else {
      console.log(`Invalid move. Cannot pour ${fromColor} into Tube ${toIndex}.`);
    }
    //console.log(tubes)
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
      console.log(checkSolutionExists(gameState, tubes.map((tube) => ({
        ...tube,
        container: new Container(),
        content: tube.content.map((block) => ({
          ...block,
          graphics: null, // Remove the `graphics` key while keeping the structure
        }))
      }
      ))));

    }
  }

  /**
   * Resets the game by clearing all tubes and restarting.
   */
  function resetGame() {
    console.log('Resetting game...');

    tubes.forEach((tubeData) => {
      const { container } = tubeData;
      container.removeChildren(); // Clear all children from each container (tube)
    });

  }
})();
