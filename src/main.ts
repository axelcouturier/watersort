import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import { GameState } from "./types/GameState";
import { Tube } from "./types/Tube";


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
  bunny.position.set(app.screen.width / 2, app.screen.height / 2);

  // Add the bunny to the stage
  app.stage.addChild(bunny);

  // Listen for animate update
  app.ticker.add((time) => {
    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance *
    // * Creates frame-independent transformation *
    bunny.rotation += 0.1 * time.deltaTime;
  });
  // Colors for water blocks
  // Colors for water blocks
  const availableColors = ['red', 'blue', 'green', 'yellow'];
  const tubes: Tube[] = []; // Array to store tube data
  let selectedTube: number | null = null; // Tracks the currently selected tube

  // Initialize game setup
  const colors: string[] = [];
  while (colors.length < 4 * 4) {
    colors.push(...availableColors); // Ensure enough colors for all blocks
  }
  colors.sort(() => Math.random() - 0.5); // Shuffle the colors randomly
  for (let i = 0; i < 6; i++) {
    const isEmptyTube = i >= 4; // Leave last two tubes empty
    tubes.push({ container: null, waterLevels: [], colors: isEmptyTube ? [] : colors.slice(i * 4, (i + 1) * 4) });
  }
  for (let i = 0; i < 6; i++) {
    const tube = tubes[i];
    tube.container = new Container(); // Container for each tube
    tube.container.x = 100 + i * 120; // Position tubes horizontally
    tube.container.y = 200;

    // Draw the outline of the tube
    const outline = new Graphics();
    outline.rect(0, 0, 50, 200); // Define rectangle shape
    outline.fill({ color: 0xffffff }); // White fill
    outline.stroke({ width: 2, color: 0x000000 }); // Black border
    tube.container.addChild(outline);

    // Add water blocks inside the tube (leave some tubes empty)
    const isEmptyTube = i >= 4; // Leave last two tubes empty

    if (!isEmptyTube) {
      for (let j = 0; j < 4; j++) {
        const water = new Graphics();
        water.rect(0, 200 - (j + 1) * 50, 50, 50); // Define water block shape
        water.fill({ color: tube.colors[j] }); // Assign colors cyclically
        tube.container.addChild(water);
        tube.waterLevels.push(water);
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

  /**
   * Highlights or removes highlight from a specific tube.
   * @param {PIXI.Container} tube - The container representing the tube.
   * @param {boolean} highlight - Whether to highlight or not.
   */
  function highlightTube(tube, highlight) {
    const outline = tube.children[0]; // Get the outline graphic of the tube
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

    const fromColor = fromTube.colors[fromTube.colors.length - 1]; // Top color of source
    const toColor = toTube.colors[toTube.colors.length - 1] || null; // Top color of destination

    if ((toColor === null || fromColor === toColor) && toTube.colors.length < 4) {
      console.log(`Pouring ${fromColor} from Tube ${fromIndex} to Tube ${toIndex}.`);

      const pouredColor: Graphics = fromTube.waterLevels.pop(); // Remove top block from source visually
      pouredColor.clear()
      const newWater = new Graphics();
      newWater.rect(0, 0, 50, 50); // Define water block shape
      newWater.fill({ color: fromTube.colors.pop() }); // Assign colors cyclically
      newWater.y = 150 - (toTube.waterLevels.length) * 50; // Adjust position in destination visually
      toTube.container.addChild(newWater); // Add block to destination container visually
      toTube.waterLevels.push(newWater); // Update destination block stack visually
      toTube.colors.push(fromColor); // Update destination color stack logically

      checkWinCondition(); // Check if game is won after each move
    } else {
      console.log(`Invalid move. Cannot pour ${fromColor} into Tube ${toIndex}.`);
    }
    console.log(tubes)
  }

  /**
   * Checks if the win condition is met (all tubes sorted by color).
   */
  function checkWinCondition() {
    const isWin = tubes.every(
      (tube) => tube.colors.length === 4 && new Set(tube.colors).size === 1
    );

    if (isWin) {
      console.log('You Win!');
      alert('You Win!'); // Notify player of victory
      resetGame(); // Reset game state after winning
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

    location.reload(); // Reloads page for simplicity. Replace with custom reset logic if needed.
  }
})();
