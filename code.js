// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
const hexToRgb = (hex) => {
    const color = hex.charAt(0) === "#" ? hex.substring(1, 7) : hex;
    const r = parseInt(color.substring(0, 2), 16) / 255; // hexToR
    const g = parseInt(color.substring(2, 4), 16) / 255; // hexToG
    const b = parseInt(color.substring(4, 6), 16) / 255; // hexToB
    return { r, g, b };
};
const rgbToInt = (value) => {
    return Math.round(value * 255);
};
const RGBAtoRGB = (colorRgba, bgRgb) => {
    const { r, g, b, a } = colorRgba;
    const r3 = (1 - a) * rgbToInt(bgRgb.r) + a * rgbToInt(r);
    const g3 = (1 - a) * rgbToInt(bgRgb.g) + a * rgbToInt(g);
    const b3 = (1 - a) * rgbToInt(bgRgb.b) + a * rgbToInt(b);
    return { r: r3 / 255, g: g3 / 255, b: b3 / 255 };
};
const rgbToHex = ({ r, g, b }) => {
    const intToHex = (int) => {
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
const loadFont = (rect, color) => __awaiter(this, void 0, void 0, function* () {
    // Load fonts to use on canvas.
    yield figma.loadFontAsync({ family: "Roboto", style: "Regular" });
    const textNode = figma.createText();
    textNode.y = rect.y + 15;
    textNode.x = 20 + selection.x;
    const textColor = getTextColor(rgbToHex(color));
    textNode.fills = [
        {
            type: "SOLID",
            color: textColor,
        },
    ];
    textNode.textCase = "UPPER";
    textNode.characters = rgbToHex(color);
    selection.parent.appendChild(textNode);
});
if (figma.currentPage.selection.length === 1 &&
    selection.type === "RECTANGLE") {
    const fills = selection.fills[0];
    figma.showUI(__html__);
    figma.ui.resize(320, 490);
    figma.ui.onmessage = (msg) => {
        // One way of distinguishing between different types of messages sent from
        // your HTML page is to use an object with a "type" property like this.
        if (msg.type === "create-rectangles") {
            const nodes = [];
            for (let i = 0; i < msg.count; i++) {
                const opacity = i === msg.count - 1 ? 0.2 : 1 - (1 / msg.count) * i;
                const generateLightColors = () => {
                    const rect1 = figma.createRectangle();
                    rect1.resize(selection.width, 40);
                    rect1.y = i * -40 + selection.y + (msg.count * 40 + selection.height);
                    rect1.x = selection.x;
                    const color = RGBAtoRGB(Object.assign(Object.assign({}, fills.color), { a: opacity }), { r: 1, g: 1, b: 1 });
                    rect1.fills = [
                        {
                            type: "SOLID",
                            color,
                        },
                    ];
                    loadFont(rect1, color);
                    selection.parent.appendChild(rect1);
                    nodes.push(rect1);
                };
                const generateDarkColors = () => {
                    const rect2 = figma.createRectangle();
                    rect2.resize(selection.width, 40);
                    rect2.y =
                        -i * -40 + selection.y + (msg.count * 40 + selection.height);
                    rect2.x = selection.x;
                    const color = RGBAtoRGB(Object.assign(Object.assign({}, fills.color), { a: opacity }), { r: 0, g: 0, b: 0 });
                    rect2.fills = [
                        {
                            type: "SOLID",
                            color,
                        },
                    ];
                    loadFont(rect2, color);
                    selection.parent.appendChild(rect2);
                    nodes.push(rect2);
                };
                generateDarkColors();
                generateLightColors();
            }
            figma.currentPage.selection = nodes;
            figma.viewport.scrollAndZoomIntoView(nodes);
        }
        // Make sure to close the plugin when you're done. Otherwise the plugin will
        // keep running, which shows the cancel button at the bottom of the screen.
        figma.closePlugin();
    };
}
else {
    // Show error for user
    figma.closePlugin("Please select a rectangle object with a fill");
}
