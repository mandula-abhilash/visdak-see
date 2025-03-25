import express from "express";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json({ message: "Business endpoint" });
  } catch (error) {
    next(error);
  }
});

export default router;
