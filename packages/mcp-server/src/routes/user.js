import express from "express";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    res.json({ message: "User endpoint" });
  } catch (error) {
    next(error);
  }
});

export default router;
