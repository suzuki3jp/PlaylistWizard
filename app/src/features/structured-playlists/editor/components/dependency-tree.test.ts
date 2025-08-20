import { describe, expect, it } from "vitest";

import { Playlist } from "@/entity";
import { type DependencyNode, NodeHelpers } from "./dependency-tree";

function dummyPlaylist(id: string): Playlist {
  return new Playlist({
    id,
    title: `Playlist ${id}`,
    thumbnailUrl: `https://example.com/thumbnail/${id}.jpg`,
    itemsTotal: 10,
    url: `https://example.com/playlist/${id}`,
  });
}

describe("NodeHelpers", () => {
  describe("NodeHelpers#getDepth", () => {
    it("should return 0 for a root node", () => {
      const rootNode: DependencyNode = {
        id: "1",
        playlist: dummyPlaylist("1"),
        parent: null,
        children: [],
      };

      const depth = NodeHelpers.getDepth(rootNode, [rootNode]);
      expect(depth).toBe(0);
    });

    it("should return 1 for a child node", () => {
      const rootNode: DependencyNode = {
        id: "1",
        playlist: dummyPlaylist("1"),
        parent: null,
        children: [],
      };

      const childNode: DependencyNode = {
        id: "2",
        playlist: dummyPlaylist("2"),
        parent: rootNode.id,
        children: [],
      };

      const depth = NodeHelpers.getDepth(childNode, [rootNode, childNode]);
      expect(depth).toBe(1);
    });

    it("should return 2 for a grandchild node", () => {
      const rootNode: DependencyNode = {
        id: "1",
        playlist: dummyPlaylist("1"),
        parent: null,
        children: [],
      };

      const childNode: DependencyNode = {
        id: "2",
        playlist: dummyPlaylist("2"),
        parent: rootNode.id,
        children: [],
      };

      const grandChildNode: DependencyNode = {
        id: "3",
        playlist: dummyPlaylist("3"),
        parent: childNode.id,
        children: [],
      };

      const depth = NodeHelpers.getDepth(grandChildNode, [
        rootNode,
        childNode,
        grandChildNode,
      ]);
      expect(depth).toBe(2);
    });
  });

  describe("NodeHelpers#addRoot", () => {
    it("should add a root node to the list", () => {
      const playlist = dummyPlaylist("1");

      const nodes: DependencyNode[] = [];
      const newNodes = NodeHelpers.addRoot(playlist, nodes);

      expect(newNodes).toHaveLength(1);
      expect(newNodes[0].playlist).toEqual(playlist);
    });
  });

  describe("NodeHelpers#addChild", () => {
    it("should add a child node to the parent node", () => {
      const parentNodePlaylist = dummyPlaylist("1");
      const childNodePlaylist = dummyPlaylist("2");

      const nodes = NodeHelpers.addRoot(parentNodePlaylist, []);

      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const newNodes = NodeHelpers.addChild(
        nodes[0].id,
        childNodePlaylist,
        nodes,
      )!;

      expect(newNodes).toHaveLength(2);
      expect(newNodes[1].playlist).toBe(childNodePlaylist);
      expect(newNodes[1].parent).toBe(nodes[0].id);
      expect(newNodes[0].children).toContain(newNodes[1].id);
    });
  });

  describe("NodeHelpers#remove", () => {
    it("should remove a node and its children from the list", () => {
      const rootNodePlaylist = dummyPlaylist("1");
      const childNodePlaylist = dummyPlaylist("2");

      let nodes = NodeHelpers.addRoot(rootNodePlaylist, []);
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      nodes = NodeHelpers.addChild(nodes[0].id, childNodePlaylist, nodes)!;

      const newNodes = NodeHelpers.remove(nodes[1].id, nodes);

      expect(newNodes).toHaveLength(1);
      expect(newNodes[0].id).not.toBeUndefined();
    });

    it("should make the node's children become root nodes if the node has no parent", () => {
      const rootNodePlaylist = dummyPlaylist("1");
      const childNodePlaylist = dummyPlaylist("2");

      let nodes = NodeHelpers.addRoot(rootNodePlaylist, []);
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      nodes = NodeHelpers.addChild(nodes[0].id, childNodePlaylist, nodes)!;

      const newNodes = NodeHelpers.remove(nodes[0].id, nodes);

      expect(newNodes).toHaveLength(1);
      expect(newNodes[0].playlist).toBe(childNodePlaylist);
      expect(newNodes[0].parent).toBeNull();
    });

    it("should make the node's children become children of the parent node if it has a parent", () => {
      const rootNodePlaylist = dummyPlaylist("1");
      const childNodePlaylist = dummyPlaylist("2");
      const grandChildNodePlaylist = dummyPlaylist("3");

      let nodes = NodeHelpers.addRoot(rootNodePlaylist, []);
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      nodes = NodeHelpers.addChild(nodes[0].id, childNodePlaylist, nodes)!;
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      nodes = NodeHelpers.addChild(nodes[1].id, grandChildNodePlaylist, nodes)!;

      const newNodes = NodeHelpers.remove(nodes[1].id, nodes);

      expect(newNodes).toHaveLength(2);
      expect(newNodes[0].children).toEqual([newNodes[1].id]);
      expect(newNodes[1].parent).toBe(newNodes[0].id);
    });
  });
});
