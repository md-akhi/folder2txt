import { Request, Response } from "express";

export const getHomePage = (req: Request, res: Response) => {
  res.render("index", { title: "خانه" });
};

export const getAppPage = (req: Request, res: Response) => {
  res.render("app", { title: "Folder2Txt - ادغام سریع", layout: false });
};
