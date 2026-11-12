import type * as acp from "@agentclientprotocol/sdk";
import { z } from "zod";

const clientMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("start"),
        projectId: z.string().min(1),
        agentId: z.string().min(1),
    }),
    z.object({ type: z.literal("prompt"), text: z.string() }),
    z.object({ type: z.literal("cancel") }),
    z.object({
        type: z.literal("permission"),
        requestId: z.string().min(1),
        // null = cancel the permission request
        optionId: z.string().nullable(),
    }),
]);

type ClientMessage = z.infer<typeof clientMessageSchema>;

type AuthMethodSummary = {
    id: string;
    name: string;
    description?: string | null;
};

type ServerMessage =
    | { type: "ready"; chatId: string; sessionId: string; agentId: string }
    | { type: "update"; update: acp.SessionUpdate }
    | {
          type: "permission_request";
          requestId: string;
          params: acp.RequestPermissionRequest;
      }
    | { type: "prompt_done"; stopReason: acp.StopReason }
    | {
          type: "error";
          message: string;
          detail?: string;
          authMethods?: AuthMethodSummary[];
      }
    | { type: "closed"; reason?: string };

export {
    clientMessageSchema,
    type AuthMethodSummary,
    type ClientMessage,
    type ServerMessage,
};
