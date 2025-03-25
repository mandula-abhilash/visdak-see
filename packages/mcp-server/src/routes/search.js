import express from "express";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json({ message: "Search endpoint" });
  } catch (error) {
    next(error);
  }
});

export default router;
