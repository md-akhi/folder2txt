import { Router } from "express";
import { getHomePage, getAppPage } from "../controllers/homeController";
import { processPost } from "../controllers/processController";
import { validateFolderPath } from "../middlewares/validation";

const router = Router();

router.get("/", getHomePage);
router.get("/app", getAppPage);
router.post("/process", validateFolderPath, processPost);

export default router;
