import { Router } from "express";
import { shortenUrl, redirectToUrl } from "../services/index.js";
import { InvalidUrlError } from "../types/error.js";

const router: Router = Router();

// router.get("/ping", (req, res) => res.status(200).send("ok"))
router.get("/health", (_req, res) => {
    res.json({ "status": "ok" })
})

router.post("/shorten", async (req, res) => {
    const { url } = req.body

    if (!url || typeof url !== "string") {
        throw new InvalidUrlError("Missing URL")
    }
    const result = await shortenUrl(url)
    return res.status(201).json(result)
})

router.get("/:code", async (req, res) => {
    const { code } = req.params;
    const result = await redirectToUrl(code)
    return res.status(302).redirect(result)
})

export default router;

/** every request should log the method,
path, status code, and latency in JSON **/