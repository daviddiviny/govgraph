"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge, Card } from "@govgraph/ui";

import type { HomeGraphData, HomeGraphNode } from "../_lib/home-graph";
import { humanizeNodeType } from "../_lib/presenters";

type GovernmentAtlasGraphProps = {
  graph: HomeGraphData;
  query: string | undefined;
};

type GraphFilter = "all" | HomeGraphNode["nodeType"];

type NodePalette = {
  background: string;
  border: string;
  glow: string;
  text: string;
};

type SelectedConnection = {
  edgeType: HomeGraphData["edges"][number]["edgeType"];
  node: HomeGraphNode;
};

const nodePalettes: Record<HomeGraphNode["nodeType"], NodePalette> = {
  ministry: {
    background: "rgba(14, 44, 36, 0.94)",
    border: "rgba(14, 44, 36, 0.96)",
    glow: "rgba(14, 44, 36, 0.22)",
    text: "#f6f1e6",
  },
  person: {
    background: "rgba(185, 74, 55, 0.18)",
    border: "rgba(185, 74, 55, 0.66)",
    glow: "rgba(185, 74, 55, 0.18)",
    text: "#5a221a",
  },
  ministerial_office: {
    background: "rgba(214, 155, 67, 0.18)",
    border: "rgba(194, 129, 31, 0.66)",
    glow: "rgba(214, 155, 67, 0.18)",
    text: "#5f4212",
  },
  department: {
    background: "rgba(32, 96, 79, 0.16)",
    border: "rgba(32, 96, 79, 0.62)",
    glow: "rgba(32, 96, 79, 0.16)",
    text: "#123d32",
  },
  public_entity: {
    background: "rgba(89, 121, 92, 0.18)",
    border: "rgba(78, 108, 82, 0.62)",
    glow: "rgba(89, 121, 92, 0.2)",
    text: "#1f3d24",
  },
  administrative_office: {
    background: "rgba(122, 144, 108, 0.18)",
    border: "rgba(109, 128, 97, 0.66)",
    glow: "rgba(122, 144, 108, 0.22)",
    text: "#314427",
  },
  program_output: {
    background: "rgba(95, 122, 155, 0.16)",
    border: "rgba(76, 98, 128, 0.66)",
    glow: "rgba(95, 122, 155, 0.18)",
    text: "#16344b",
  },
};

function describeEdgeType(edgeType: string): string {
  return edgeType.toLowerCase().replace(/_/g, " ");
}

function createEdgePath(fromNode: HomeGraphNode, toNode: HomeGraphNode): string {
  const midpointX = (fromNode.x + toNode.x) / 2;
  const midpointY = (fromNode.y + toNode.y) / 2;
  const deltaX = toNode.x - fromNode.x;
  const deltaY = toNode.y - fromNode.y;
  const controlX = midpointX + deltaY * 0.12;
  const controlY = midpointY - deltaX * 0.12;

  return `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY} ${toNode.x} ${toNode.y}`;
}

export function GovernmentAtlasGraph({
  graph,
  query,
}: GovernmentAtlasGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(
    graph.initialSelectedNodeId,
  );
  const [activeFilter, setActiveFilter] = useState<GraphFilter>("all");

  const nodeById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  );
  const selectedNode =
    (selectedNodeId ? nodeById.get(selectedNodeId) : undefined) ?? graph.nodes[0];
  const selectedConnections = useMemo(() => {
    if (!selectedNode) {
      return [];
    }

    const connections: SelectedConnection[] = [];

    for (const edge of graph.edges) {
      if (edge.fromNodeId !== selectedNode.id && edge.toNodeId !== selectedNode.id) {
        continue;
      }

      const relatedNodeId =
        edge.fromNodeId === selectedNode.id ? edge.toNodeId : edge.fromNodeId;
      const relatedNode = nodeById.get(relatedNodeId);

      if (!relatedNode) {
        continue;
      }

      connections.push({
        edgeType: edge.edgeType,
        node: relatedNode,
      });
    }

    return connections.sort((left, right) => {
      if (right.node.degree !== left.node.degree) {
        return right.node.degree - left.node.degree;
      }

      return left.node.label.localeCompare(right.node.label);
    });
  }, [graph.edges, nodeById, selectedNode]);

  const selectedConnectionIds = useMemo(() => {
    return new Set(selectedConnections.map((connection) => connection.node.id));
  }, [selectedConnections]);

  const availableFilters = useMemo(() => {
    return Array.from(new Set(graph.nodes.map((node) => node.nodeType)));
  }, [graph.nodes]);

  return (
    <div className="rounded-[2.2rem] border border-[var(--gg-color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(245,240,231,0.92))] p-4 shadow-[0_28px_90px_rgba(14,44,36,0.12)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gg-color-semantic-text-secondary)]">
            Live relationship map
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--gg-color-ink)]">
            A readable slice of the current government graph
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[var(--gg-color-semantic-text-secondary)] sm:text-base">
            This view foregrounds the people, offices, departments, entities,
            and outputs that make the structure legible at a glance. Select a
            node to follow the shape of the network.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge>{graph.summary.previewNodes} nodes in focus</Badge>
          <Badge>{graph.summary.previewEdges} live links</Badge>
          {query ? <Badge>Search pinned: {query}</Badge> : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          aria-pressed={activeFilter === "all"}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
            activeFilter === "all"
              ? "border-[var(--gg-color-ink)] bg-[var(--gg-color-ink)] text-[var(--gg-color-paper)]"
              : "border-[var(--gg-color-border)] bg-white/70 text-[var(--gg-color-semantic-text-secondary)] hover:border-[var(--gg-color-ink)] hover:text-[var(--gg-color-ink)]"
          }`}
        >
          All clusters
        </button>
        {availableFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            aria-pressed={activeFilter === filter}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
              activeFilter === filter
                ? "border-[var(--gg-color-ink)] bg-[var(--gg-color-ink)] text-[var(--gg-color-paper)]"
                : "border-[var(--gg-color-border)] bg-white/70 text-[var(--gg-color-semantic-text-secondary)] hover:border-[var(--gg-color-ink)] hover:text-[var(--gg-color-ink)]"
            }`}
          >
            {humanizeNodeType(filter)}
          </button>
        ))}
      </div>

      <div className="relative mt-6 h-[34rem] overflow-hidden rounded-[1.8rem] border border-[rgba(14,44,36,0.1)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(237,241,235,0.72)),linear-gradient(180deg,rgba(255,255,255,0.48),rgba(246,241,230,0.35))] sm:h-[38rem] xl:h-[40rem]">
        <div
          className="absolute left-[10%] top-[6%] h-44 w-44 rounded-full blur-3xl"
          style={{
            background: "rgba(185, 74, 55, 0.18)",
            animation: "govgraph-drift 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[4%] right-[9%] h-52 w-52 rounded-full blur-3xl"
          style={{
            background: "rgba(32, 96, 79, 0.18)",
            animation: "govgraph-drift 22s ease-in-out infinite reverse",
          }}
        />

        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="govgraph-grid"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="rgba(14,44,36,0.05)"
                strokeWidth="0.25"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#govgraph-grid)" />

          {graph.edges.map((edge) => {
            const fromNode = nodeById.get(edge.fromNodeId);
            const toNode = nodeById.get(edge.toNodeId);

            if (!fromNode || !toNode) {
              return null;
            }

            const isSelectedEdge =
              selectedNode !== undefined &&
              (edge.fromNodeId === selectedNode.id || edge.toNodeId === selectedNode.id);
            const matchesFilter =
              activeFilter === "all" ||
              fromNode.nodeType === activeFilter ||
              toNode.nodeType === activeFilter ||
              isSelectedEdge;

            return (
              <path
                key={edge.id}
                d={createEdgePath(fromNode, toNode)}
                fill="none"
                stroke={
                  isSelectedEdge
                    ? "rgba(14, 44, 36, 0.54)"
                    : matchesFilter
                      ? "rgba(14, 44, 36, 0.2)"
                      : "rgba(14, 44, 36, 0.08)"
                }
                strokeWidth={isSelectedEdge ? 0.65 : 0.35}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {graph.nodes.map((node) => {
          const palette = nodePalettes[node.nodeType];
          const isSelected = selectedNode?.id === node.id;
          const isMatched = graph.matchedNodeIds.includes(node.id);
          const isConnectedToSelection = selectedConnectionIds.has(node.id);
          const matchesFilter =
            activeFilter === "all" ||
            node.nodeType === activeFilter ||
            isSelected ||
            isConnectedToSelection;
          const scale = isSelected ? 1.04 : node.degree >= 4 ? 1 : 0.96;
          const opacity = matchesFilter ? 1 : 0.32;
          const widthClass =
            node.nodeType === "program_output"
              ? "max-w-[9.5rem]"
              : node.nodeType === "ministry"
                ? "max-w-[8.5rem]"
                : "max-w-[8.75rem]";

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelectedNodeId(node.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-[1.2rem] border px-3 py-2 text-left shadow-[0_16px_36px_rgba(14,44,36,0.12)] backdrop-blur-sm outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[var(--gg-color-accent)] ${widthClass}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                background: palette.background,
                borderColor: isSelected ? "rgba(14, 44, 36, 0.9)" : palette.border,
                color: palette.text,
                opacity,
                boxShadow: isSelected
                  ? `0 0 0 6px ${palette.glow}, 0 20px 48px rgba(14, 44, 36, 0.18)`
                  : `0 0 0 3px ${palette.glow}, 0 14px 34px rgba(14, 44, 36, 0.12)`,
              }}
              aria-pressed={isSelected}
            >
              <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.18em] opacity-70">
                {humanizeNodeType(node.nodeType)}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-tight text-balance sm:text-[0.95rem]">
                {node.shortLabel}
              </span>
              <span className="mt-2 block text-[0.68rem] uppercase tracking-[0.16em] opacity-70">
                {node.degree} link{node.degree === 1 ? "" : "s"}
              </span>
              {isMatched ? (
                <span
                  className="pointer-events-none absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full"
                  style={{
                    background: "var(--gg-color-accent)",
                    boxShadow: "0 0 0 5px rgba(185,74,55,0.14)",
                    animation: "govgraph-pulse 4.5s ease-in-out infinite",
                  }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          {selectedNode ? (
            <>
              <div className="flex flex-wrap gap-3">
                <Badge>{humanizeNodeType(selectedNode.nodeType)}</Badge>
                <Badge>{selectedConnections.length} visible links</Badge>
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--gg-color-ink)]">
                {selectedNode.label}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--gg-color-semantic-text-secondary)] sm:text-base">
                {selectedNode.description ??
                  "This record is part of the current relationship map even if it does not yet have descriptive copy."}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
                <Link
                  href={selectedNode.href}
                  className="text-[var(--gg-color-accent)] underline-offset-4 hover:underline"
                >
                  Open the full record
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveFilter(selectedNode.nodeType)}
                  className="text-[var(--gg-color-semantic-text-secondary)] underline-offset-4 hover:text-[var(--gg-color-ink)] hover:underline"
                >
                  Focus this cluster
                </button>
              </div>
              {selectedConnections.length > 0 ? (
                <div className="mt-6 grid gap-3">
                  {selectedConnections.slice(0, 4).map((connection) => (
                    <div
                      key={`${selectedNode.id}-${connection.edgeType}-${connection.node.id}`}
                      className="rounded-[1.2rem] border border-[var(--gg-color-border)] bg-[var(--gg-color-paper)]/60 px-4 py-3"
                    >
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--gg-color-semantic-text-secondary)]">
                        {describeEdgeType(connection.edgeType)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--gg-color-ink)]">
                        {connection.node.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </Card>

        <div className="grid gap-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gg-color-semantic-text-secondary)]">
              What you’re seeing
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--gg-color-semantic-text-secondary)]">
              The homepage now opens on the graph itself, but it stays readable
              by focusing on the most connected parts of the live network rather
              than trying to draw every record at once.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-[var(--gg-color-border)] bg-[var(--gg-color-paper)]/60 px-4 py-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--gg-color-semantic-text-secondary)]">
                  Connected records
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--gg-color-ink)]">
                  {graph.summary.connectedNodes}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-[var(--gg-color-border)] bg-[var(--gg-color-paper)]/60 px-4 py-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--gg-color-semantic-text-secondary)]">
                  Total live links
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--gg-color-ink)]">
                  {graph.summary.connectedEdges}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gg-color-semantic-text-secondary)]">
              Searchable but not linked yet
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--gg-color-semantic-text-secondary)]">
              {graph.summary.isolatedDocuments} budget papers and related
              source documents are still searchable on the site, but they sit
              outside the relationship view until explicit links are added into
              the graph.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
