// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const color = hex.charAt(0) === "#" ? hex.substring(1, 7) : hex;
  const r = parseInt(color.substring(0, 2), 16) / 255; // hexToR
  const g = parseInt(color.substring(2, 4), 16) / 255; // hexToG
  const b = parseInt(color.substring(4, 6), 16) / 255; // hexToB
  return { r, g, b };
};

const rgbToInt = (value: any) => {
  return Math.round(value * 255);
};

const RGBAtoRGB = (colorRgba: { r; g; b; a }, bgRgb: { r; g; b }) => {
  const { r, g, b, a } = colorRgba;
  const r3 = (1 - a) * rgbToInt(bgRgb.r) + a * rgbToInt(r);
  const g3 = (1 - a) * rgbToInt(bgRgb.g) + a * rgbToInt(g);
  const b3 = (1 - a) * rgbToInt(bgRgb.b) + a * rgbToInt(b);
  return { r: r3 / 255, g: g3 / 255, b: b3 / 255 };
};

const rgbToHex = ({ r, g, b }) => {
  const intToHex = (int: any) => {
    let hex = Number(int).toString(16);
    if (hex.length < 2) {
      hex = "0" + hex;
    }
    return hex;
  };

  const red = intToHex(rgbToInt(r));
  const green = intToHex(rgbToInt(g));
  const blue = intToHex(rgbToInt(b));
  return "#" + red + green + blue;
};

const getTextColor = (bgColor) => {
  const color = bgColor.charAt(0) === "#" ? bgColor.substring(1, 7) : bgColor;
  const r = parseInt(color.substring(0, 2), 16); // hexToR
  const g = parseInt(color.substring(2, 4), 16); // hexToG
  const b = parseInt(color.substring(4, 6), 16); // hexToB
  const uicolors = [r / 255, g / 255, b / 255];
  const c = uicolors.map((col) => {
    if (col <= 0.03928) {
      return col / 12.92;
    }
    return Math.pow((col + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return L > 0.5 ? { r: 0, g: 0, b: 0 } : { r: 1, g: 1, b: 1 };
};

const selection = figma.currentPage.selection["0"];

const loadFont = async (rect, color, opacity) => {
  // Load fonts to use on canvas.
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });

  const colorTextNode = figma.createText();
  const textColor = getTextColor(rgbToHex(color));
  colorTextNode.fills = [
    {
      type: "SOLID",
      color: textColor,
    },
  ];

  colorTextNode.textCase = "UPPER";
  colorTextNode.characters = rgbToHex(color);
  colorTextNode.lineHeight = {
    value: 100,
    unit: "PERCENT",
  };

  const opacityTextNode = figma.createText();
  opacityTextNode.fills = [
    {
      type: "SOLID",
      color: textColor,
    },
  ];

  colorTextNode.y = rect.y + 14;
  colorTextNode.x = 16 + selection.x;

  opacityTextNode.textCase = "UPPER";
  opacityTextNode.characters =
    opacity === "BASE" ? "Base" : `${Math.round(opacity * 100)}%`;
  opacityTextNode.lineHeight = {
    value: 100,
    unit: "PERCENT",
  };

  opacityTextNode.y = rect.y + 14;
  // make x position 20px from the right side of the rectangle
  opacityTextNode.x = rect.x + rect.width - 16 - opacityTextNode.width;

  return { colorTextNode, opacityTextNode };
};

if (figma.command === "fill") {
  figma.showUI(__html__, {
    visible: false,
  });

  figma.ui.postMessage({
    type: "create-rectangles",
    name: "",
    data: selection,
  });
} else {
  figma.showUI(__html__, {
    width: 320,
    height: 490,
  });
}

figma.ui.onmessage = async (msg) => {
  // if (msg.type === "create-rectangles") {
  let fills;

  if (msg.type === "create-rectangles") {
    if (
      figma.currentPage.selection.length === 1 &&
      selection.type === "RECTANGLE"
    ) {
      fills = selection.fills[0];
    } else {
      // Show error for user
      figma.closePlugin("Please select a rectangle object with a fill");
    }
  }

  if (msg.type === "custom-rectangles") {
  }

  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  const nodes: SceneNode[] = [];

  for (let i = 0; i < msg.count; i++) {
    const opacity = i === msg.count - 1 ? 0.2 : 1 - (1 / msg.count) * i;

    const generateLightColors = async () => {
      const rect1 = figma.createRectangle();
      const group = figma.group([rect1], figma.currentPage);
      let height = 40;

      if (opacity === 1) {
        height = 100;
      }

      rect1.resize(selection.width, height);

      rect1.y = i * -40 + selection.y + (msg.count * 40 + selection.height);
      rect1.x = selection.x;

      const color = RGBAtoRGB(
        { ...fills.color, a: opacity },
        { r: 1, g: 1, b: 1 }
      );

      rect1.fills = [
        {
          type: "SOLID",
          color,
        },
      ];

      const opacityToFontFunction =
        opacity === 1
          ? "BASE"
          : (1 - (1 / (msg.count - 1)) * i) / 2 + 1 / ((msg.count - 1) * 2);

      const textColor = rgbToHex(color).substring(1).toUpperCase();

      group.name =
        opacityToFontFunction === "BASE"
          ? `${textColor}/Base`
          : `${textColor}/${Math.round(opacityToFontFunction * 100)}%`;

      selection.parent.appendChild(group);

      const { colorTextNode, opacityTextNode } = await loadFont(
        rect1,
        color,
        opacityToFontFunction
      );

      group.appendChild(colorTextNode);
      group.appendChild(opacityTextNode);
      group.expanded = false;
      nodes.push(group);
    };

    const generateDarkColors = async () => {
      if (opacity !== 1) {
        const rect2 = figma.createRectangle();
        const group = figma.group([rect2], figma.currentPage);
        rect2.resize(selection.width, 40);
        rect2.y =
          -i * -40 + selection.y + (msg.count * 40 + selection.height) + 60;
        rect2.x = selection.x;
        const color = RGBAtoRGB(
          { ...fills.color, a: opacity },
          { r: 0, g: 0, b: 0 }
        );

        rect2.fills = [
          {
            type: "SOLID",
            color,
          },
        ];

        const opacityToFontFunction = ((1 / (msg.count - 1)) * i) / 2 + 0.5;

        const textColor = rgbToHex(color).substring(1).toUpperCase();

        group.name = `${textColor}/${Math.round(opacityToFontFunction * 100)}%`;

        selection.parent.appendChild(group);

        const { colorTextNode, opacityTextNode } = await loadFont(
          rect2,
          color,
          opacityToFontFunction
        );

        group.appendChild(colorTextNode);
        group.appendChild(opacityTextNode);
        group.expanded = false;
        nodes.push(group);
      }
    };

    await generateDarkColors();
    await generateLightColors();
    // figma.currentPage.selection = nodes;

    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};
// };
