import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema,
  SyncDataSchema,
} from "../schema/index.js";

const c = initContract();

export const syncContract = c.router({
  preview: {
    method: "GET",
    path: "/api/v1/data/sync",
    query: z.object({
      application_id: z.string(),
    }),
    responses: {
      200: ApiSuccessResponseSchema(SyncDataSchema),
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
      502: ApiErrorResponseSchema,
    },
    summary: "Fetch sync preview for an integration",
  },
});