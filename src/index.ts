import { createSingleInstanceExtension, overrideStyleFunction } from "./utils";

export default function (cytoscape) {
  overrideStyleFunction('register', () => {
    return function (name: string, initialStyle: cytoscape.StylesheetStyle[]) {
      
    }
  });
}