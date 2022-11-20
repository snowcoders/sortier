import { describe, it, expect } from "@jest/globals";
import { globbySync } from "globby";
import { basename, dirname } from "path";
import { fileURLToPath } from "url";
import { FileUtils } from "./file-utils.js";

type TestAssets = {
  inputFilePath: string;
  outputFilePath: string;
  type: "leaf";
};

type TestTree = {
  nodes: { [name: string]: TestAssets | TestTree };
  type: "branch";
};

type TestInputTransform = (inputFilePath: string, inputFileContents: string) => string;

function sentenceCase(text: string) {
  const spacedText = text.replace(/_/g, " ");
  return spacedText.charAt(0).toUpperCase() + spacedText.slice(1);
}

/**
 * Given a directory, reads all the files from the test_assets folder in that directory and generates
 * an array of tests information to be run.
 *
 * The file format for all files in the test_assets folder should be as follows:
 *  - Input: (category_path\.)*?test_name.input.extension.txt
 *  - Output: (category_path\.)*?test_name.output.extension.txt
 *
 * Given this, some valid examples are:
 *  - context_barrier.input.css.txt
 *  - es6.imports.input.js.txt
 *  - es6.spread.imports.input.js.txt
 *
 * @param testFileUrl The test file that has a test_assets folder as a sibling
 * @param transform The reprinting logic to transform the input code and return the output
 */
export function runTestAssetsTests(testFileUrl: string, transform: TestInputTransform) {
  const folderPath = getFolderPathFromFileUrl(testFileUrl);
  const testNodes = getTestAssetsTree(folderPath);
  runNodes(testNodes, transform);
}

export function getFolderPathFromFileUrl(filePath: string) {
  return dirname(fileURLToPath(filePath));
}

/**
 * Given a directory, reads all the files from the test_assets folder in that directory and generates
 * an array of tests information to be run.
 *
 * The file format for all files in the test_assets folder should be as follows:
 *  - Input: (category_path\.)*?test_name.input.extension.txt
 *  - Output: (category_path\.)*?test_name.output.extension.txt
 *
 * Given this, some valid examples are:
 *  - context_barrier.input.css.txt
 *  - es6.imports.input.js.txt
 *  - es6.spread.imports.input.js.txt
 *
 * @param folderPath The directory that contains a test_assets folder
 * @param transform The reprinting logic to transform the input code and return the output
 * @deprecated use runTestAssetsTests instead
 */
export function runTestAssestsTests(folderPath: string, transform: TestInputTransform) {
  const testNodes = getTestAssetsTree(folderPath);
  runNodes(testNodes, transform);
}

function runNodes(testNode: TestTree, transform: TestInputTransform) {
  const nodes = testNode.nodes;
  for (const name in nodes) {
    const testNode = nodes[name];
    if (testNode.type === "leaf") {
      const { inputFilePath, outputFilePath } = testNode;

      it(sentenceCase(name), () => {
        const input = FileUtils.readFileContents(inputFilePath);
        const expected = FileUtils.readFileContents(outputFilePath);
        const actual = transform(inputFilePath, input);

        expect(actual).toEqual(expected);
      });
    } else if (testNode.type === "branch") {
      describe(sentenceCase(name), () => {
        runNodes(testNode, transform);
      });
    } else {
      throw new Error("Unexpected testNode type");
    }
  }
}

function getTestAssetsTree(folderPath: string): TestTree {
  const root: TestTree = {
    nodes: {},
    type: "branch",
  };

  const assetsFolderPath = FileUtils.globbyJoin(folderPath, `test_assets/*.input.*.txt`);
  const filePaths = globbySync(assetsFolderPath);
  for (const filePath of filePaths) {
    const segments = basename(filePath).split(".");
    if (segments.length < 4) {
      throw new Error(
        `${filePath} does not match getTestAssetsTree pattern. Expected (one_or.more_segments).input.js.txt`
      );
    }

    // Find or create the path in the tree needed
    let possibleChildren = root.nodes;
    while (segments.length > 4) {
      const name = segments.shift();
      if (name == null) {
        break;
      }
      if (!(name in possibleChildren)) {
        possibleChildren[name] = {
          nodes: {},
          type: "branch",
        };
      }
      const nextChild = possibleChildren[name];
      if (nextChild.type === "branch") {
        possibleChildren = nextChild.nodes;
      }
    }

    if (possibleChildren[segments[0]] != null) {
      throw new Error(`${segments[0]} already exists in the test tree, do you have a file naming collision?`);
    }
    possibleChildren[segments[0]] = {
      inputFilePath: filePath,
      outputFilePath: filePath.replace(".input.", ".output."),
      type: "leaf",
    };
  }

  return root;
}
