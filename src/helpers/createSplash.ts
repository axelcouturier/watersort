import { Container, Graphics, Text } from "pixi.js";

export function createSplash(width: number, height: number, text: string): Container {
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
    buttonBackground.roundRect(0, 0, width, height);
    buttonBackground.fill(0x007bff); // Blue background color

    // Center the text on the background
    buttonText.x = (buttonBackground.width - buttonText.width) / 2;
    buttonText.y = (buttonBackground.height - buttonText.height) / 2;

    // Create a container to hold the text and background
    const splashContainer = new Container();
    splashContainer.addChild(buttonBackground);
    splashContainer.addChild(buttonText);

    // Set the position of the container
    splashContainer.x = 0;
    splashContainer.y = 0;

    // Make it interactive and clickable
    splashContainer.interactive = true;

    // Add click event listener
    //splashContainer.on('pointerdown', () => action());
    return splashContainer;
}