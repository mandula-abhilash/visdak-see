import express from "express";
import { processSearchQuery } from "../controllers/search.js";

const router = express.Router();

router.post("/query", processSearchQuery);

router.get("/", async (req, res, next) => {
  try {
    res.json({ message: "Search endpoint" });
  } catch (error) {
    next(error);
  }
});

export default router;
