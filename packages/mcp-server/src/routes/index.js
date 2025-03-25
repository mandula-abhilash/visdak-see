import express from "express";

import searchRoutes from "./search.js";
import businessRoutes from "./business.js";
import userRoutes from "./user.js";

const router = express.Router();

router.use("/search", searchRoutes);
router.use("/business", businessRoutes);
router.use("/user", userRoutes);

export default router;
