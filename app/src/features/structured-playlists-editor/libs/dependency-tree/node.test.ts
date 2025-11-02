/** biome-ignore-all lint/style/noNonNullAssertion: TODO */
import { describe, expect, it } from "vitest";
import { Provider } from "@/entities/provider";
import { Playlist } from "@/features/playlist/entities";
import { type DependencyTreeNode, NodeHelpers } from "./node";

function dummyPlaylist(id: string): Playlist {
  return Playlist.parse({
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
      const rootNode: DependencyTreeNode = {
        id: "1",
        playlist: dummyPlaylist("1"),
        parent: null,
        children: [],
      };

      const depth = NodeHelpers.getDepth(rootNode, [rootNode]);
      expect(depth).toBe(0);
    });

    it("should return 1 for a child node", () => {
      const rootNode: DependencyTreeNode = {
        id: "1",
        playlist: dummyPlaylist("1"),
        parent: null,
        children: [],
      };

      const childNode: DependencyTreeNode = {
        id: "2",
        playlist: dummyPlaylist("2"),
        parent: rootNode.id,
        children: [],
      };

      const depth = NodeHelpers.getDepth(childNode, [rootNode, childNode]);
      expect(depth).toBe(1);
    });

    it("should return 2 for a grandchild node", () => {
      const rootNode: DependencyTreeNode = {
        id: "1",
        playlist: dummyPlaylist("1"),
        parent: null,
        children: [],
      };

      const childNode: DependencyTreeNode = {
        id: "2",
        playlist: dummyPlaylist("2"),
        parent: rootNode.id,
        children: [],
      };

      const grandChildNode: DependencyTreeNode = {
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

      const nodes: DependencyTreeNode[] = [];
      const newNodes = NodeHelpers.addRoot(playlist, nodes);

      if (newNodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      expect(newNodes.value).toHaveLength(1);
      expect(newNodes.value[0].playlist).toEqual(playlist);
    });
  });

  describe("NodeHelpers#addChild", () => {
    it("should add a child node to the parent node", () => {
      const parentNodePlaylist = dummyPlaylist("1");
      const childNodePlaylist = dummyPlaylist("2");

      const nodes = NodeHelpers.addRoot(parentNodePlaylist, []);

      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      const newNodes = NodeHelpers.addChild(
        nodes.value[0].id,
        childNodePlaylist,
        nodes.value,
      );

      if (newNodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      expect(newNodes.value).toHaveLength(2);
      expect(newNodes.value[1].playlist).toBe(childNodePlaylist);
      expect(newNodes.value[1].parent).toBe(nodes.value[0].id);
      expect(newNodes.value[0].children).toContain(newNodes.value[1].id);
    });
  });

  describe("NodeHelpers#remove", () => {
    it("should remove a node and its children from the list", () => {
      const rootNodePlaylist = dummyPlaylist("1");
      const childNodePlaylist = dummyPlaylist("2");

      let nodes = NodeHelpers.addRoot(rootNodePlaylist, []);
      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      nodes = NodeHelpers.addChild(
        nodes.value[0].id,
        childNodePlaylist,
        nodes.value,
      )!;

      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      const newNodes = NodeHelpers.remove(nodes.value[1].id, nodes.value);

      if (newNodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      expect(newNodes.value).toHaveLength(1);
      expect(newNodes.value[0].id).not.toBeUndefined();
    });

    it("should make the node's children become root nodes if the node has no parent", () => {
      const rootNodePlaylist = dummyPlaylist("1");
      const childNodePlaylist = dummyPlaylist("2");

      let nodes = NodeHelpers.addRoot(rootNodePlaylist, []);
      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      nodes = NodeHelpers.addChild(
        nodes.value[0].id,
        childNodePlaylist,
        nodes.value,
      )!;

      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      const newNodes = NodeHelpers.remove(nodes.value[0].id, nodes.value);
      if (newNodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }

      expect(newNodes.value).toHaveLength(1);
      expect(newNodes.value[0].playlist).toBe(childNodePlaylist);
      expect(newNodes.value[0].parent).toBeNull();
    });

    it("should make the node's children become children of the parent node if it has a parent", () => {
      const rootNodePlaylist = dummyPlaylist("1");
      const childNodePlaylist = dummyPlaylist("2");
      const grandChildNodePlaylist = dummyPlaylist("3");

      let nodes = NodeHelpers.addRoot(rootNodePlaylist, []);
      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      nodes = NodeHelpers.addChild(
        nodes.value[0].id,
        childNodePlaylist,
        nodes.value,
      );
      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      nodes = NodeHelpers.addChild(
        nodes.value[1].id,
        grandChildNodePlaylist,
        nodes.value,
      );

      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      const newNodes = NodeHelpers.remove(nodes.value[1].id, nodes.value);

      if (newNodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      expect(newNodes.value).toHaveLength(2);
      expect(newNodes.value[0].children).toEqual([newNodes.value[1].id]);
      expect(newNodes.value[1].parent).toBe(newNodes.value[0].id);
    });
  });

  describe("NodeHelpers#toJSON", () => {
    it("should convert the dependency tree to JSON format", () => {
      const rootNodePlaylist = dummyPlaylist("1");
      const childNodePlaylist = dummyPlaylist("2");
      const grandChildNodePlaylist = dummyPlaylist("3");

      let nodes = NodeHelpers.addRoot(rootNodePlaylist, []);
      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      nodes = NodeHelpers.addChild(
        nodes.value[0].id,
        childNodePlaylist,
        nodes.value,
      );
      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }
      nodes = NodeHelpers.addChild(
        nodes.value[1].id,
        grandChildNodePlaylist,
        nodes.value,
      );
      if (nodes.isErr()) {
        return expect(true).toBe(false); // Force fail the test
      }

      const json = NodeHelpers.toJSON(nodes.value, "user-123", Provider.GOOGLE);

      expect(json).toEqual({
        version: 1,
        name: "placeholder",
        provider: Provider.GOOGLE,
        playlists: [
          {
            id: rootNodePlaylist.id,
            dependencies: [
              {
                id: childNodePlaylist.id,
                dependencies: [
                  {
                    id: grandChildNodePlaylist.id,
                    dependencies: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });
});

describe("toNodes", () => {
  function makePlaylist(id: string, title = "title", itemsTotal = 1): Playlist {
    return Playlist.parse({
      id,
      title,
      itemsTotal,
      thumbnailUrl: "https://example.com/thumbnail.jpg",
      url: "https://example.com/playlist",
    });
  }

  it("should convert a single root playlist", () => {
    const definition = {
      version: 1 as const,
      name: "test",
      provider: Provider.GOOGLE as const,
      playlists: [{ id: "a", dependencies: [] }],
    };
    const playlists = [makePlaylist("a")];
    const nodes = NodeHelpers.toNodes(definition, playlists);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].playlist.id).toBe("a");
    expect(nodes[0].parent).toBeNull();
    expect(nodes[0].children).toEqual([]);
  });

  it("should convert a tree with dependencies", () => {
    const definition = {
      version: 1 as const,
      name: "test",
      provider: Provider.GOOGLE as const,
      playlists: [
        {
          id: "a",
          dependencies: [
            { id: "b", dependencies: [] },
            { id: "c", dependencies: [{ id: "d", dependencies: [] }] },
          ],
        },
      ],
    };
    const playlists = ["a", "b", "c", "d"].map((id) => makePlaylist(id));
    const nodes = NodeHelpers.toNodes(definition, playlists);
    expect(nodes).toHaveLength(4);
    const root = nodes.find((n) => n.parent === null);
    expect(root?.playlist.id).toBe("a");
    const bNode = nodes.find((n) => n.playlist.id === "b");
    const cNode = nodes.find((n) => n.playlist.id === "c");
    expect(root?.children).toEqual(
      expect.arrayContaining([bNode?.id, cNode?.id]),
    );
    expect(bNode?.parent).toBe(root?.id);
    expect(cNode?.parent).toBe(root?.id);
    const dNode = nodes.find((n) => n.playlist.id === "d");
    expect(cNode?.children).toEqual([dNode?.id]);
    expect(dNode?.parent).toBe(cNode?.id);
  });
});
