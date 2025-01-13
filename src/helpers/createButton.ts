import { Container, Graphics, Text } from "pixi.js";

export function createButton(text: String, action: Function, x: number, y: number): Container {
    // Create the button text
    const buttonText = new Text({
        text, style: {
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
    buttonContainer.x = x;
    buttonContainer.y = y;

    // Make it interactive and clickable
    buttonContainer.interactive = true;

    // Add click event listener
    buttonContainer.on('pointerdown', () => action());
    return buttonContainer;
}