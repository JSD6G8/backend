import Joi from "joi";

export const requestUser = Joi.object({
    emailAddress: Joi.string().email().required(),
    password: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
})