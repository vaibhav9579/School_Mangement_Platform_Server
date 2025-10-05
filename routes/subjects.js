import express from "express";
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchParticularClassSubjects,
  updateTeacherId,
  getSubjectDataFromTeacherId,
  getSubjectsByTeacherAndClass
} from "../controllers/subjectController.js";

const router = express.Router();

router.get("/", listSubjects);
router.get("/:class_id",fetchParticularClassSubjects);
router.get("/teacher/:teacher_id", getSubjectDataFromTeacherId);
router.get("/teacher/:teacher_id/class/:class_id", getSubjectsByTeacherAndClass);
router.post("/", createSubject);
router.put("/:id", updateSubject);
// router.put("/updateteacher/:id", updateTeacherId);
router.delete("/:id", deleteSubject);

export default router;
