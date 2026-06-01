import express from "express";
const router = express.Router();

// This is a sample route to check if the server is running
router.get("/status", (_, res) => {
  res.send("OK");
});

export default router;
