import joi from "joi";

export const requestSchema = joi.object({
  userId: joi.string().required(),
  title: joi.string().required(),
  description: joi.string().required(),
  type: joi
    .string()
    .valid("Running", "Cycling", "Swimming", "Walking", "Hiking", "Other")
    .required(),
  startTime: joi
    .string()
    .pattern(new RegExp("^([0-1][0-9]|2[0-3]):[0-5][0-9]$"))
    .required(),
  endTime: joi
    .string()
    .pattern(new RegExp("^([0-1][0-9]|2[0-3]):[0-5][0-9]$"))
    .required(),
  date: joi
    .string()
    .isoDate()
    .required(),
  duration: joi
    .object({
      hour: joi.number().min(0).max(23).required(),
      minute: joi.number().min(0).max(59).required(),
    })
    .required(),
  barometer: joi.string().valid("1", "2", "3", "4", "5").required(),
});
